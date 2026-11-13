import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 MessageLiveRoom,handleMessageLive,publishMessageLive,notifyConversationLive
} from "./messaging-live.js";

const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
const origins=new Set(["https://ash-fall.com","https://www.ash-fall.com"]);
function liveSetup({auth=true,origin="https://ash-fall.com",binding=true}={}){
 const calls=[];
 const env={MESSAGE_LIVE:binding?{
  getByName(name){calls.push({name});return {
   async fetch(request,options){
    calls.push({url:typeof request==="string"?request:request.url,
      headers:typeof request!=="string"?Object.fromEntries(request.headers):options?.headers,
      payload:options?.body});
    return typeof request==="string"?new Response(null,{status:204}):{status:101,webSocket:{}};
   }
  }}
 }:undefined};
 async function connect(){
  const request=new Request("https://api.ash-fall.com/api/messages/live",{
   headers:{Upgrade:"websocket",Origin:origin,Cookie:"knightfall_session=secret"}
  });
  const result=await handleMessageLive(request,env,new URL(request.url),{
   json,origin,allowedOrigins:origins,rateLimit:async()=>true,
   getUser:async()=>auth?{id:42}:null
  });
  return result;
 }
 return {connect,env,calls};
}
test("WebSocket handshake checks origin and session before touching Durable Objects",async()=>{
 const bad=liveSetup({origin:"https://attacker.example"});
 assert.equal((await bad.connect()).status,403);assert.equal(bad.calls.length,0);
 const anon=liveSetup({auth:false});
 assert.equal((await anon.connect()).status,401);assert.equal(anon.calls.length,0);
 const absent=liveSetup({binding:false});
 assert.equal((await absent.connect()).status,503);
});
test("authenticated WebSocket is bound to that member and does not forward cookies",async()=>{
 const h=liveSetup();
 const result=await h.connect();
 assert.equal(result.status,101);
 assert.equal(h.calls[0].name,"member:42");
 assert.equal(h.calls[1].url,"https://message-live.internal/connect");
 assert.equal(h.calls[1].headers.cookie,undefined);
 assert.equal(h.calls[1].headers.upgrade,"websocket");
});
test("publication fans out only event identifiers, dedupes members, and never a message body",async()=>{
 const h=liveSetup();const pending=[];
 publishMessageLive({waitUntil:p=>pending.push(p)},h.env,[42,42,56],
  {kind:"message",action:"created",conversationId:10,messageId:999,body:"private payload"});
 await Promise.all(pending);
 assert.equal(h.calls.filter(x=>x.name).length,2);
 const posts=h.calls.filter(x=>x.payload);
 assert.equal(posts.length,2);
 for(const post of posts){
  const payload=JSON.parse(post.payload);
  assert.deepEqual(payload,{type:"message-event",kind:"message",action:"created",conversationId:10,messageId:999});
  assert.equal(JSON.stringify(payload).includes("private payload"),false);
 }
});
test("invalid events are dropped before entering the realtime fanout",()=>{
 const h=liveSetup();
 publishMessageLive({waitUntil:()=>{throw Error("should not happen");}},h.env,[42],
  {kind:"message",action:"created",conversationId:-7,messageId:1});
 assert.equal(h.calls.length,0);
});
test("Durable Object relays internal events but ignores untrusted client broadcasts",async()=>{
 const output=[];
 const clients=[{send:data=>output.push(data)},{send:data=>output.push(data)}];
 const object=new MessageLiveRoom({getWebSockets:()=>clients});
 const publish=new Request("https://message-live.internal/publish",{
  method:"POST",body:JSON.stringify({kind:"message",action:"edited",conversationId:7,messageId:14})
 });
 const response=await object.fetch(publish);
 assert.equal(response.status,204);
 assert.equal(output.length,2);
 assert.equal(JSON.parse(output[0]).kind,"message");
 object.webSocketMessage(clients[0],JSON.stringify({type:"message-event",body:"spoof"}));
 assert.equal(output.length,2);
 assert.equal((await object.fetch(new Request("https://message-live.internal/missing"))).status,404);
});
test("conversation-wide live events obtain recipient IDs from authenticated D1 membership",async()=>{
 const events=[],pend=[];
 const env={
  DB:{prepare(sql){assert.match(sql,/SELECT user_id FROM conversation_members WHERE conversation_id=\?/);return{
   bind(id){assert.equal(id,77);return {async all(){return{results:[{user_id:1},{user_id:2}]}}}}
  }}},
  MESSAGE_LIVE:{getByName(name){return {async fetch(_url,opts){events.push({name,data:JSON.parse(opts.body)});return new Response(null,{status:204});}}}}
 };
 notifyConversationLive({waitUntil:p=>pend.push(p)},env,77,"reaction",18,"changed");
 await Promise.all(pend);
 assert.equal(events.length,2);
 assert.equal(events[0].data.conversationId,77);
});
test("Worker config contains a SQLite-backed hibernating Durable Object class",()=>{
 const config=JSON.parse(readFileSync(new URL("../wrangler.jsonc",import.meta.url),"utf8"));
 assert.deepEqual(config.durable_objects.bindings[0],
   {name:"MESSAGE_LIVE",class_name:"MessageLiveRoom"});
 assert.ok(config.migrations.some(m=>m.new_sqlite_classes?.includes("MessageLiveRoom")));
 const code=readFileSync(new URL("./index.js",import.meta.url),"utf8");
 assert.match(code,/export \{ MessageLiveRoom \} from "\.\/messaging-live\.js"/);
 assert.match(code,/publishMessageLive\(ctx,env/);
 assert.match(code,/notifyConversationLive\(ctx,env/);
});

test("read receipts publish only when a member advances their read cursor",()=>{
 const worker=readFileSync(new URL("./index.js",import.meta.url),"utf8");
 assert.match(worker,/SELECT conversation_id,last_read_at FROM conversation_members WHERE conversation_id=\? AND user_id=\?/);
 assert.match(worker,/if\(!membership\.last_read_at\|\|String\(membership\.last_read_at\)<String\(readThrough\)\)/);
 assert.match(worker,/notifyConversationLive\(ctx,env,conversationId,"read",readMessageId,"changed"\)/);
});
