const ALLOWED_ORIGINS = new Set(["https://ash-fall.com", "https://www.ash-fall.com"]);
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const PBKDF2_ITERATIONS = 100000;
const SESSION_COOKIE = "knightfall_session";

function getOrigin(request) {
  const origin = request.headers.get("Origin");
  return ALLOWED_ORIGINS.has(origin) ? origin : "https://ash-fall.com";
}

function json(data, status = 200, origin = "https://ash-fall.com", extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-allow-credentials": "true",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(),microphone=(),geolocation=()",
      ...extra,
    },
  });
}

function validText(value, max, allowEmpty = false) {
  if (typeof value !== "string") return false;
  if (allowEmpty && value.trim() === "") return true;
  return value.trim().length > 0 && value.trim().length <= max;
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  return randomToken(16);
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function hashPassword(password, saltHex = randomSalt()) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: hexToBytes(saltHex), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
  return `${PBKDF2_ITERATIONS}:${saltHex}:${[...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function verifyPassword(password, stored) {
  const [iterations, salt, expected] = String(stored || "").split(":");
  if (!iterations || !salt || !expected || Number(iterations) !== PBKDF2_ITERATIONS) return false;
  const actual = (await hashPassword(password, salt)).split(":")[2];
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function rateLimit(env, request, bucket, limit, windowSeconds) {
  const ip=request.headers.get("CF-Connecting-IP") || "unknown";
  const key="rate:"+bucket+":"+ip;
  const now=Date.now();
  const current=await env.SESSIONS.get(key,"json");
  if(!current || current.reset_at<=now){await env.SESSIONS.put(key,JSON.stringify({count:1,reset_at:now+windowSeconds*1000}),{expirationTtl:windowSeconds});return true;}
  if(current.count>=limit)return false;
  await env.SESSIONS.put(key,JSON.stringify({count:current.count+1,reset_at:current.reset_at}),{expirationTtl:Math.max(1,Math.ceil((current.reset_at-now)/1000))});
  return true;
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

async function createSession(userId, env) {
  const token = randomToken(32);
  await env.SESSIONS.put(`session:${token}`, JSON.stringify({ user_id: userId, expires_at: Date.now() + SESSION_TTL_SECONDS * 1000 }), { expirationTtl: SESSION_TTL_SECONDS });
  return token;
}

async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const session = await env.SESSIONS.get(`session:${token}`, "json");
  if (!session) return null;
  if (session.expires_at <= Date.now()) {
    await env.SESSIONS.delete(`session:${token}`);
    return null;
  }
  return session;
}

async function getUser(request, env) {
  const session = await getSession(request, env);
  if (!session) return null;
  const user = await env.DB.prepare("SELECT id, username, email, display_name, role, status, bio, avatar_url, website_url, location, pronouns, created_at FROM users WHERE id = ?").bind(session.user_id).first();
  return user && user.status === "active" ? user : null;
}

async function requireUser(request, env) {
  return getUser(request, env);
}

function isAdmin(user) {
  return !!user && user.role === "admin";
}

function isModerator(user) {
  return !!user && (user.role === "moderator" || user.role === "admin");
}

async function audit(env, user, action, targetType = null, targetId = null, details = {}) {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_logs (actor_id,action,target_type,target_id,details,created_at) VALUES (?,?,?,?,?,?)"
    ).bind(
      user?.id ?? null,
      String(action).slice(0,120),
      targetType ? String(targetType).slice(0,40) : null,
      targetId != null ? Number(targetId) : null,
      JSON.stringify(details).slice(0,4000),
      new Date().toISOString()
    ).run();
  } catch (error) {
    console.error("audit_log_failed", error);
  }
}

async function createNotification(env, {userId, actorId=null, kind, targetType=null, targetId=null, title, body, url=null}) {
  if (!userId || !kind || !title || !body) return;
  try {
    await env.DB.prepare("INSERT INTO notifications (user_id,actor_id,kind,target_type,target_id,title,body,url,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(userId, actorId, String(kind).slice(0,60), targetType, targetId != null ? Number(targetId) : null, String(title).slice(0,160), String(body).slice(0,1000), url ? String(url).slice(0,500) : null, new Date().toISOString()).run();
  } catch (error) { console.error("notification_failed", error); }
}

async function notifyMentions(env, textValue, actor, targetType, targetId, targetUrl) {
  const names=[...String(textValue||"").matchAll(/@([a-z0-9_]{3,24})/gi)].map(x=>x[1].toLowerCase()).filter((v,i,a)=>a.indexOf(v)===i);
  for(const name of names){
    const target=await env.DB.prepare("SELECT id,username FROM users WHERE username=? AND status='active'").bind(name).first();
    if(target && target.id!==actor.id) await createNotification(env,{userId:target.id,actorId:actor.id,kind:"mention",targetType,targetId,title:"You were mentioned",body:"@"+actor.username+" mentioned you.",url:targetUrl});
  }
}

const SETTING_DEFAULTS = {
  site_name: "Knightfall",
  maintenance_mode: "false",
  registration_enabled: "true",
  forum_enabled: "true",
  announcements_enabled: "false",
  announcement_title: "",
  announcement_body: "",
  feature_miss_chaos: "true",
  feature_profiles: "true"
};

function settingValue(row) {
  if (!row) return null;
  return row.value;
}

async function getSetting(env, key) {
  const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(key).first();
  return settingValue(row) ?? SETTING_DEFAULTS[key] ?? null;
}

function slugify(value) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return base || "thread";
}

async function uniqueSlug(title, env) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const exists = await env.DB.prepare("SELECT id FROM threads WHERE slug = ?").bind(slug).first();
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${randomToken(4)}`;
}

export default {
  async fetch(request, env) {
    const origin = getOrigin(request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-allow-credentials": "true",
        "access-control-max-age": "86400",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "camera=(),microphone=(),geolocation=()",
      }});
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        const check = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({ ok: check?.ok === 1, service: "knightfall-api", database: true }, 200, origin);
      }

      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        if (!(await rateLimit(env,request,"register",5,900))) return json({error:"Too many registration attempts. Try again later."},429,origin);
        if ((await getSetting(env, "registration_enabled")) === "false") return json({ error: "Registration is currently closed." }, 403, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const username = String(body.username || "").trim().toLowerCase();
        const email = String(body.email || "").trim().toLowerCase();
        const displayName = String(body.display_name || "").trim();
        const password = typeof body.password === "string" ? body.password : "";
        if (!/^[a-z0-9_]{3,24}$/.test(username)) return json({ error: "Username must be 3-24 characters using letters, numbers, or underscores." }, 400, origin);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "Enter a valid email address." }, 400, origin);
        if (!validText(displayName, 80)) return json({ error: "Display name is required." }, 400, origin);
        if (password.length < 12 || password.length > 128) return json({ error: "Password must be 12-128 characters." }, 400, origin);
        const duplicate = await env.DB.prepare("SELECT id FROM users WHERE username = ? OR email = ?").bind(username, email).first();
        if (duplicate) return json({ error: "Username or email is already registered." }, 409, origin);
        const passwordHash = await hashPassword(password);
        const now = new Date().toISOString();
        const result = await env.DB.prepare("INSERT INTO users (username,email,password_hash,display_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?) RETURNING id").bind(username, email, passwordHash, displayName, "member", now, now).first();
        const token = await createSession(result.id, env);
        const user = await env.DB.prepare("SELECT id, username, email, display_name, role, bio, avatar_url, website_url, location, pronouns, created_at FROM users WHERE id = ?").bind(result.id).first();
        return json({ user }, 201, origin, { "set-cookie": sessionCookie(token) });
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        if (!(await rateLimit(env,request,"login",12,900))) return json({error:"Too many login attempts. Try again later."},429,origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const identifier = String(body.identifier || "").trim().toLowerCase();
        const password = typeof body.password === "string" ? body.password : "";
        if (!identifier || !password) return json({ error: "Username/email and password are required." }, 400, origin);
        const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? OR email = ?").bind(identifier, identifier).first();
        if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash))) return json({ error: "Invalid username/email or password." }, 401, origin);
        const token = await createSession(user.id, env);
        const safeUser = await env.DB.prepare("SELECT id, username, email, display_name, role, bio, avatar_url, website_url, location, pronouns, created_at FROM users WHERE id = ?").bind(user.id).first();
        return json({ user: safeUser }, 200, origin, { "set-cookie": sessionCookie(token) });
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") return json({ user: await getUser(request, env) }, 200, origin);

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        const token = getCookie(request, SESSION_COOKIE);
        if (token) await env.SESSIONS.delete(`session:${token}`);
        return json({ ok: true }, 200, origin, { "set-cookie": sessionCookie("", 0) });
      }

      if (url.pathname === "/api/site-settings" && request.method === "GET") {
        const keys = ["site_name","maintenance_mode","registration_enabled","forum_enabled","announcements_enabled","announcement_title","announcement_body","feature_miss_chaos","feature_profiles"];
        const settings = {};
        for (const key of keys) settings[key] = await getSetting(env,key);
        return json({ settings }, 200, origin);
      }

      if (url.pathname.startsWith("/api/") &&
          !url.pathname.startsWith("/api/auth/") &&
          !url.pathname.startsWith("/api/admin/") &&
          url.pathname !== "/api/site-settings") {
        if ((await getSetting(env, "maintenance_mode")) === "true") {
          const user = await requireUser(request, env);
          if (!isAdmin(user)) return json({ error: "Knightfall is temporarily offline for maintenance." }, 503, origin);
        }
      }

      if (url.pathname === "/api/categories" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT id,name,slug,description,sort_order,created_at FROM categories ORDER BY sort_order ASC, name ASC").all();
        return json({ categories: results }, 200, origin);
      }

      if (url.pathname === "/api/members" && request.method === "GET") {
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 100);
        const { results } = await env.DB.prepare(`SELECT id,username,display_name,role,avatar_url,created_at FROM users ORDER BY created_at DESC LIMIT ${limit}`).all();
        return json({ users: results }, 200, origin);
      }

      const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
      if (userMatch && request.method === "GET") {
        const user = await env.DB.prepare("SELECT id,username,display_name,role,bio,avatar_url,website_url,location,pronouns,created_at,last_seen_at,status FROM users WHERE username = ?").bind(userMatch[1].toLowerCase()).first();
        if (!user || user.status !== "active") return json({ error: "Profile not found." }, 404, origin);
        const [threadCount,postCount,followers,following,threads,posts] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS count FROM threads WHERE user_id=? AND deleted_at IS NULL").bind(user.id).first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM posts WHERE user_id=? AND deleted_at IS NULL").bind(user.id).first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE following_id=?").bind(user.id).first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE follower_id=?").bind(user.id).first(),
          env.DB.prepare("SELECT t.id,t.title,t.slug,t.created_at,c.name AS category_name FROM threads t JOIN categories c ON c.id=t.category_id WHERE t.user_id=? AND t.deleted_at IS NULL ORDER BY t.created_at DESC LIMIT 8").bind(user.id).all(),
          env.DB.prepare("SELECT p.id,p.thread_id,p.body,p.created_at,t.title AS thread_title FROM posts p JOIN threads t ON t.id=p.thread_id WHERE p.user_id=? AND p.deleted_at IS NULL AND t.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 8").bind(user.id).all()
        ]);
        const me=await requireUser(request,env);
        const isFollowing=me?!!(await env.DB.prepare("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?").bind(me.id,user.id).first()):false;
        const isBlocked=me?!!(await env.DB.prepare("SELECT 1 FROM user_blocks WHERE blocker_id=? AND blocked_id=?").bind(me.id,user.id).first()):false;
        return json({ user:{...user,thread_count:Number(threadCount?.count||0),post_count:Number(postCount?.count||0),followers:Number(followers?.count||0),following_count:Number(following?.count||0),is_following:isFollowing,is_blocked:isBlocked,is_online:user.last_seen_at?Date.now()-new Date(user.last_seen_at).getTime()<5*60*1000:false},threads:threads.results||[],posts:posts.results||[] },200,origin);
      }

      if (url.pathname === "/api/profile" && request.method === "PUT") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const fields = {
          display_name: [body.display_name, 80], bio: [body.bio, 2000], avatar_url: [body.avatar_url, 500],
          website_url: [body.website_url, 500], location: [body.location, 120], pronouns: [body.pronouns, 80],
        };
        for (const [name, [value, max]] of Object.entries(fields)) if (value !== undefined && typeof value !== "string" || value !== undefined && value.length > max) return json({ error: `Invalid ${name}.` }, 400, origin);
        if (body.website_url !== undefined && body.website_url !== "" && !/^https?:\/\//i.test(body.website_url)) return json({ error: "Website must use http or https." }, 400, origin);
        if (body.avatar_url !== undefined && body.avatar_url !== "" && !/^https?:\/\//i.test(body.avatar_url)) return json({ error: "Avatar URL must use http or https." }, 400, origin);
        await env.DB.prepare("UPDATE users SET display_name=COALESCE(?,display_name),bio=COALESCE(?,bio),avatar_url=COALESCE(?,avatar_url),website_url=COALESCE(?,website_url),location=COALESCE(?,location),pronouns=COALESCE(?,pronouns),updated_profile_at=? WHERE id=?").bind(body.display_name ?? null, body.bio ?? null, body.avatar_url ?? null, body.website_url ?? null, body.location ?? null, body.pronouns ?? null, new Date().toISOString(), user.id).run();
        return json({ user: await requireUser(request, env) }, 200, origin);
      }

      if (url.pathname === "/api/threads" && request.method === "GET") {
        const categoryId = url.searchParams.get("category_id");
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 50);
        const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
        const sql = categoryId
          ? `SELECT t.id,t.title,t.slug,t.category_id,t.user_id,t.pinned,t.locked,t.views,t.created_at,t.updated_at,c.name AS category_name,u.username,u.display_name,u.avatar_url,COUNT(p.id) AS reply_count FROM threads t JOIN categories c ON c.id=t.category_id JOIN users u ON u.id=t.user_id LEFT JOIN posts p ON p.thread_id=t.id AND p.deleted_at IS NULL WHERE t.deleted_at IS NULL AND t.category_id=? GROUP BY t.id ORDER BY t.pinned DESC,t.updated_at DESC LIMIT ? OFFSET ?`
          : `SELECT t.id,t.title,t.slug,t.category_id,t.user_id,t.pinned,t.locked,t.views,t.created_at,t.updated_at,c.name AS category_name,u.username,u.display_name,u.avatar_url,COUNT(p.id) AS reply_count FROM threads t JOIN categories c ON c.id=t.category_id JOIN users u ON u.id=t.user_id LEFT JOIN posts p ON p.thread_id=t.id AND p.deleted_at IS NULL WHERE t.deleted_at IS NULL GROUP BY t.id ORDER BY t.pinned DESC,t.updated_at DESC LIMIT ? OFFSET ?`;
        const query = categoryId ? env.DB.prepare(sql).bind(categoryId, limit, offset) : env.DB.prepare(sql).bind(limit, offset);
        const { results } = await query.all();
        return json({ threads: results, limit, offset }, 200, origin);
      }

      if (url.pathname === "/api/activity/ping" && request.method === "POST") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const now = new Date().toISOString();
        await env.DB.prepare("UPDATE users SET last_seen_at=? WHERE id=?").bind(now,user.id).run();
        return json({ ok:true, last_seen_at:now },200,origin);
      }

      if (url.pathname === "/api/notifications" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!user) return json({ error:"Authentication required." },401,origin);
        const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||50),1),100);
        const unreadOnly=url.searchParams.get("unread")==="true";
        const sql="SELECT n.id,n.kind,n.target_type,n.target_id,n.title,n.body,n.url,n.read_at,n.created_at,a.username AS actor_username,a.display_name AS actor_display_name,a.avatar_url AS actor_avatar FROM notifications n LEFT JOIN users a ON a.id=n.actor_id WHERE n.user_id=?"+(unreadOnly?" AND n.read_at IS NULL":"")+" ORDER BY n.created_at DESC LIMIT ?";
        const {results}=await env.DB.prepare(sql).bind(user.id,limit).all();
        const unread=await env.DB.prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id=? AND read_at IS NULL").bind(user.id).first();
        return json({notifications:results,unread_count:Number(unread?.count||0)},200,origin);
      }

      if (url.pathname === "/api/discover" && request.method === "GET") {
        const user=await requireUser(request,env);
        const q=String(url.searchParams.get("q")||"").trim().slice(0,80);
        const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||24),1),50);
        const like="%"+q.replace(/[%_]/g,"\\$&")+"%";
        const params=user?[user.id,like,like,like,like,limit]:[like,like,like,like,limit];
        const sql="SELECT u.id,u.username,u.display_name,u.role,u.bio,u.avatar_url,u.location,u.pronouns,u.created_at,u.last_seen_at,(SELECT COUNT(*) FROM follows f WHERE f.following_id=u.id) AS followers FROM users u "+(user?"LEFT JOIN user_blocks b ON b.blocker_id=? AND b.blocked_id=u.id WHERE b.blocked_id IS NULL AND ":"WHERE ")+"u.status='active' AND (u.username LIKE ? ESCAPE '\\\\' OR u.display_name LIKE ? ESCAPE '\\\\' OR COALESCE(u.bio,'') LIKE ? ESCAPE '\\\\' OR COALESCE(u.location,'') LIKE ? ESCAPE '\\\\') ORDER BY u.created_at DESC LIMIT ?";
        const {results}=await env.DB.prepare(sql).bind(...params).all();
        return json({users:results},200,origin);
      }

      if (url.pathname === "/api/messages/conversations" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const { results } = await env.DB.prepare("SELECT c.id,c.kind,c.created_at,c.updated_at,other.id AS other_user_id,other.username AS other_username,other.display_name AS other_display_name,other.avatar_url AS other_avatar_url,om.last_read_at AS other_last_read_at,cm.muted_until,lm.body AS last_body,lm.created_at AS last_message_at,(SELECT COUNT(*) FROM messages um WHERE um.conversation_id=c.id AND um.sender_id<>? AND um.deleted_at IS NULL AND (cm.last_read_at IS NULL OR um.created_at>cm.last_read_at)) AS unread_count FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=? JOIN conversation_members om ON om.conversation_id=c.id AND om.user_id<>? JOIN users other ON other.id=om.user_id LEFT JOIN messages lm ON lm.id=(SELECT m2.id FROM messages m2 WHERE m2.conversation_id=c.id ORDER BY m2.id DESC LIMIT 1) WHERE c.kind='direct' ORDER BY COALESCE(lm.created_at,c.updated_at) DESC LIMIT 100").bind(user.id,user.id,user.id).all();
        return json({ conversations: results }, 200, origin);
      }

      return json({ error: "Not found." }, 404, origin);
    } catch (error) {
      console.error("request_failed", error);
      return json({ error: "Internal server error." }, 500, origin);
    }
  },
};