/**
 * Hibernating per-member message events. Message bodies stay in D1 and are
 * fetched through the existing membership-checked inbox API.
 *
 * Durable Objects are addressable only from the Worker binding, never directly
 * from public HTTP. Browser connections must pass Worker session + Origin checks.
 */
const EVENTS = new Set(["message", "typing", "reaction", "membership", "read"]);
const ACTIONS = new Set(["created", "edited", "deleted", "changed", "started", "stopped"]);

function safeEvent(value) {
  const kind = String(value?.kind || "");
  const action = String(value?.action || "changed");
  const conversationId = Number(value?.conversationId);
  const messageId = Number(value?.messageId || 0);
  if (!EVENTS.has(kind) || !ACTIONS.has(action) ||
    !Number.isSafeInteger(conversationId) || conversationId < 1 ||
    !Number.isSafeInteger(messageId) || messageId < 0) return null;
  return {type:"message-event",kind,action,conversationId,messageId};
}

export class MessageLiveRoom {
  constructor(ctx) {
    this.ctx = ctx;
  }
  async fetch(request) {
    const route = new URL(request.url).pathname;
    if (route === "/connect" && request.method === "GET") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
        return new Response("WebSocket upgrade required.", {status:426});
      // Bound concurrent tabs/devices per account without keeping a JS timer alive.
      if (this.ctx.getWebSockets().length >= 12)
        return new Response("Too many live sessions.", {status:429});
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      return new Response(null, {status:101, webSocket:pair[0]});
    }
    if (route === "/publish" && request.method === "POST") {
      let payload;
      try { payload = safeEvent(await request.json()); } catch { payload = null; }
      if (!payload) return new Response("Invalid event.", {status:400});
      const data = JSON.stringify(payload);
      for (const socket of this.ctx.getWebSockets()) {
        try { socket.send(data); } catch { try { socket.close(1011, "Unavailable"); } catch {} }
      }
      return new Response(null, {status:204});
    }
    return new Response("Not found.", {status:404});
  }
  webSocketMessage(socket, message) {
    // A member may ping their own connection. They cannot publish to anyone.
    if (message === "ping") try { socket.send("pong"); } catch {}
  }
  webSocketClose(socket, code, reason) {
    try { socket.close(code, reason); } catch {}
  }
  webSocketError(socket) {
    try { socket.close(1011, "Connection interrupted"); } catch {}
  }
}

export async function handleMessageLive(request, env, url, {getUser, json, origin, allowedOrigins, rateLimit}) {
  if (url.pathname !== "/api/messages/live") return null;
  if (request.method !== "GET") return json({error:"Method not allowed."},405,origin);
  if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
    return json({error:"WebSocket upgrade required."},426,origin);
  // WebSocket requests are GETs, so the usual mutating-request CORS guard is
  // insufficient to prevent cross-site WebSocket hijacking.
  if (!allowedOrigins.has(request.headers.get("Origin")))
    return json({error:"Origin not allowed."},403,origin);
  const user = await getUser(request,env);
  if (!user) return json({error:"Sign in to use live messages."},401,origin);
  if (!env.MESSAGE_LIVE) return json({error:"Live messaging is unavailable."},503,origin);
  if (!await rateLimit(env,request,"message-live-connect",30,60,user.id))
    return json({error:"Too many live connections."},429,origin);
  // Do not pass the user's Cookie to the private Durable Object request.
  const stub = env.MESSAGE_LIVE.getByName("member:"+user.id);
  return stub.fetch(new Request("https://message-live.internal/connect",{
    method:"GET",headers:{"Upgrade":"websocket"}
  }));
}

export function publishMessageLive(ctx, env, userIds, rawEvent) {
  if (!env.MESSAGE_LIVE) return;
  const payload = safeEvent(rawEvent);
  if (!payload) return;
  const ids = [...new Set(userIds.map(Number).filter(id=>Number.isSafeInteger(id)&&id>0))].slice(0,100);
  if (!ids.length) return;
  const work = Promise.allSettled(ids.map(async userId=>{
    const stub = env.MESSAGE_LIVE.getByName("member:"+userId);
    const result = await stub.fetch("https://message-live.internal/publish",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
    });
    if (!result.ok) throw Error("Message live publish returned "+result.status);
  })).then(results=>{
    const failures=results.filter(item=>item.status==="rejected");
    if (failures.length) console.warn("message_live_publish_failed",failures.length);
  });
  // Delivery is best effort. D1 is the source of truth; HTTP polling is fallback.
  if (typeof ctx?.waitUntil==="function") ctx.waitUntil(work);
  else return work;
}

export function notifyConversationLive(ctx,env,conversationId,kind,messageId=0,action="changed") {
  if (!env.MESSAGE_LIVE) return;
  const task=(async()=>{
    const {results}=await env.DB.prepare(
      "SELECT user_id FROM conversation_members WHERE conversation_id=?"
    ).bind(conversationId).all();
    await publishMessageLive(null,env,(results||[]).map(r=>r.user_id),
      {kind,action,conversationId,messageId});
  })().catch(error=>console.warn("message_live_membership_publish_failed",String(error)));
  if(typeof ctx?.waitUntil==="function")ctx.waitUntil(task);
  else return task;
}
