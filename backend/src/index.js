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

      if (url.pathname === "/api/threads" && request.method === "POST") {
        if ((await getSetting(env, "forum_enabled")) === "false") return json({ error: "The forum is currently in maintenance mode." }, 503, origin);
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const title = String(body.title || "").trim();
        const threadBody = String(body.body || "").trim();
        const categoryId = Number(body.category_id);
        if (!validText(title, 160) || !validText(threadBody, 10000) || !Number.isInteger(categoryId)) return json({ error: "Title, body, and category are required." }, 400, origin);
        const category = await env.DB.prepare("SELECT id FROM categories WHERE id=?").bind(categoryId).first();
        if (!category) return json({ error: "Category not found." }, 404, origin);
        const slug = await uniqueSlug(title, env);
        const now = new Date().toISOString();
        const result = await env.DB.prepare("INSERT INTO threads (category_id,user_id,title,slug,body,created_at,updated_at) VALUES (?,?,?,?,?,?,?) RETURNING id").bind(categoryId,user.id,title,slug,threadBody,now,now).first();
        await notifyMentions(env,title+" "+threadBody,user,"thread",result.id,"/thread.html?id="+result.id);
        return json({ id: result.id, slug }, 201, origin);
      }

      const threadMatch = url.pathname.match(/^\/api\/threads\/(\d+)$/);
      if (threadMatch && request.method === "GET") {
        const thread = await env.DB.prepare("SELECT t.id,t.title,t.slug,t.category_id,t.user_id,t.body,t.created_at,t.updated_at,t.pinned,t.locked,t.views,u.username,u.display_name,u.avatar_url,c.name AS category_name FROM threads t JOIN users u ON u.id=t.user_id JOIN categories c ON c.id=t.category_id WHERE t.id=? AND t.deleted_at IS NULL").bind(threadMatch[1]).first();
        if (!thread) return json({ error: "Thread not found." }, 404, origin);
        await env.DB.prepare("UPDATE threads SET views=views+1 WHERE id=?").bind(thread.id).run();
        const { results: posts } = await env.DB.prepare("SELECT p.id,p.thread_id,p.user_id,p.body,p.created_at,p.updated_at,u.username,u.display_name,u.avatar_url FROM posts p JOIN users u ON u.id=p.user_id WHERE p.thread_id=? AND p.deleted_at IS NULL ORDER BY p.created_at ASC").bind(thread.id).all();
        return json({ thread: { ...thread, views: thread.views + 1 }, posts }, 200, origin);
      }

      if (threadMatch && request.method === "POST") {
        if ((await getSetting(env, "forum_enabled")) === "false") return json({ error: "The forum is currently in maintenance mode." }, 503, origin);
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const thread = await env.DB.prepare("SELECT id,locked,deleted_at FROM threads WHERE id=?").bind(threadMatch[1]).first();
        if (!thread || thread.deleted_at) return json({ error: "Thread not found." }, 404, origin);
        if (thread.locked) return json({ error: "Thread is locked." }, 423, origin);
        if (!validText(body.body, 10000)) return json({ error: "Reply body is required." }, 400, origin);
        const now = new Date().toISOString();
        const result = await env.DB.prepare("INSERT INTO posts (thread_id,user_id,body,created_at,updated_at) VALUES (?,?,?,?,?) RETURNING id").bind(thread.id,user.id,String(body.body).trim(),now,now).first();
        await env.DB.prepare("UPDATE threads SET updated_at=? WHERE id=?").bind(now,thread.id).run();
        const owner=await env.DB.prepare("SELECT user_id,title FROM threads WHERE id=?").bind(thread.id).first();
        if(owner && owner.user_id!==user.id) await createNotification(env,{userId:owner.user_id,actorId:user.id,kind:"reply",targetType:"thread",targetId:thread.id,title:"New reply",body:"@"+user.username+" replied to your thread.",url:"/thread.html?id="+thread.id});
        await notifyMentions(env,String(body.body),user,"thread",thread.id,"/thread.html?id="+thread.id);
        return json({ id: result.id }, 201, origin);
      }

      if (threadMatch && request.method === "PATCH") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const thread = await env.DB.prepare("SELECT id,user_id,locked,deleted_at FROM threads WHERE id=?").bind(threadMatch[1]).first();
        if (!thread || thread.deleted_at) return json({ error: "Thread not found." }, 404, origin);
        if (body.locked !== undefined || body.pinned !== undefined || body.deleted !== undefined) {
          if (!isModerator(user)) return json({ error: "Moderator access required." }, 403, origin);
          const deletedAt = body.deleted === true ? new Date().toISOString() : body.deleted === false ? null : undefined;
          if (deletedAt !== undefined) await env.DB.prepare("UPDATE threads SET locked=COALESCE(?,locked),pinned=COALESCE(?,pinned),deleted_at=? WHERE id=?").bind(body.locked ?? null,body.pinned ?? null,deletedAt,thread.id).run();
          else await env.DB.prepare("UPDATE threads SET locked=COALESCE(?,locked),pinned=COALESCE(?,pinned) WHERE id=?").bind(body.locked ?? null,body.pinned ?? null,thread.id).run();
          return json({ ok: true }, 200, origin);
        }
        if (thread.user_id !== user.id) return json({ error: "You can only edit your own thread." }, 403, origin);
        const title = String(body.title || "").trim();
        if (!validText(title, 160)) return json({ error: "Title is required." }, 400, origin);
        await env.DB.prepare("UPDATE threads SET title=?,updated_at=? WHERE id=?").bind(title,new Date().toISOString(),thread.id).run();
        return json({ ok: true }, 200, origin);
      }

      if (threadMatch && request.method === "DELETE") {
        const user = await requireUser(request, env);
        if (!isModerator(user)) return json({ error: "Moderator access required." }, 403, origin);
        await env.DB.prepare("UPDATE threads SET deleted_at=? WHERE id=?").bind(new Date().toISOString(),threadMatch[1]).run();
        return json({ ok: true }, 200, origin);
      }

      const postMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/);
      if (postMatch && (request.method === "PATCH" || request.method === "DELETE")) {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const post = await env.DB.prepare("SELECT id,user_id,deleted_at FROM posts WHERE id=?").bind(postMatch[1]).first();
        if (!post || post.deleted_at) return json({ error: "Post not found." }, 404, origin);
        if (request.method === "PATCH") {
          if (post.user_id !== user.id && !isModerator(user)) return json({ error: "You can only edit your own post." }, 403, origin);
          let body;
          try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
          if (!validText(body.body, 10000)) return json({ error: "Post body is required." }, 400, origin);
          await env.DB.prepare("UPDATE posts SET body=?,updated_at=? WHERE id=?").bind(String(body.body).trim(),new Date().toISOString(),post.id).run();
          return json({ ok: true }, 200, origin);
        }
        if (post.user_id !== user.id && !isModerator(user)) return json({ error: "You cannot delete this post." }, 403, origin);
        await env.DB.prepare("UPDATE posts SET deleted_at=? WHERE id=?").bind(new Date().toISOString(),post.id).run();
        return json({ ok: true }, 200, origin);
      }

      if (url.pathname === "/api/reports" && request.method === "POST") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const targetType = body.target_type;
        const targetId = Number(body.target_id);
        const reason = String(body.reason || "").trim();
        if (!['thread','post'].includes(targetType) || !Number.isInteger(targetId) || targetId < 1 || !validText(reason, 1000)) return json({ error: "Valid target and reason are required." }, 400, origin);
        if (targetType === "thread") {
          const target = await env.DB.prepare("SELECT id FROM threads WHERE id=? AND deleted_at IS NULL").bind(targetId).first();
          if (!target) return json({ error: "Thread not found." }, 404, origin);
          await env.DB.prepare("INSERT INTO reports (reporter_id,thread_id,reason,status,created_at) VALUES (?,?,?,?,?)").bind(user.id,targetId,reason,"open",new Date().toISOString()).run();
        } else {
          const target = await env.DB.prepare("SELECT id FROM posts WHERE id=? AND deleted_at IS NULL").bind(targetId).first();
          if (!target) return json({ error: "Post not found." }, 404, origin);
          await env.DB.prepare("INSERT INTO reports (reporter_id,post_id,reason,status,created_at) VALUES (?,?,?,?,?)").bind(user.id,targetId,reason,"open",new Date().toISOString()).run();
        }
        return json({ ok: true }, 201, origin);
      }

      if (url.pathname === "/api/moderation/reports" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isModerator(user)) return json({ error: "Moderator access required." }, 403, origin);
        const status = ["open","resolved","dismissed"].includes(url.searchParams.get("status")) ? url.searchParams.get("status") : "open";
        const { results } = await env.DB.prepare("SELECT r.id,r.reason,r.status,r.created_at,r.resolved_at,r.moderator_note,r.reporter_id,r.thread_id,r.post_id,ru.username AS reporter_username,CASE WHEN r.thread_id IS NOT NULL THEN 'thread' ELSE 'post' END AS target_type,COALESCE(r.thread_id,r.post_id) AS target_id FROM reports r LEFT JOIN users ru ON ru.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at ASC LIMIT 100").bind(status).all();
        return json({ reports: results }, 200, origin);
      }

      const reportMatch = url.pathname.match(/^\/api\/moderation\/reports\/(\d+)$/);
      if (reportMatch && request.method === "PATCH") {
        const user = await requireUser(request, env);
        if (!isModerator(user)) return json({ error: "Moderator access required." }, 403, origin);
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        if (!['open','resolved','dismissed'].includes(body.status)) return json({ error: "Invalid report status." }, 400, origin);
        await env.DB.prepare("UPDATE reports SET status=?,moderator_id=?,moderator_note=?,resolved_at=? WHERE id=?").bind(body.status,user.id,String(body.moderator_notes || body.moderator_note || "").slice(0,4000),body.status === "open" ? null : new Date().toISOString(),reportMatch[1]).run();
        await audit(env,user,"report."+body.status,"report",Number(reportMatch[1]),{});
        return json({ ok: true }, 200, origin);
      }



      // Community notifications, presence, follows, blocks, and discovery
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
      const notificationMatch=url.pathname.match(/^\/api\/notifications\/(\d+)$/);
      if(notificationMatch && request.method==="PATCH"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        await env.DB.prepare("UPDATE notifications SET read_at=? WHERE id=? AND user_id=?").bind(new Date().toISOString(),Number(notificationMatch[1]),user.id).run();
        return json({ok:true},200,origin);
      }
      if(url.pathname==="/api/notifications/read-all" && request.method==="POST"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        await env.DB.prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").bind(new Date().toISOString(),user.id).run();
        return json({ok:true},200,origin);
      }
      const followMatch=url.pathname.match(/^\/api\/users\/([^/]+)\/follow$/);
      if(followMatch && request.method==="POST"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        const target=await env.DB.prepare("SELECT id,username,status FROM users WHERE username=?").bind(followMatch[1].toLowerCase()).first();
        if(!target || target.status!=="active")return json({error:"User not found."},404,origin);
        if(target.id===user.id)return json({error:"You cannot follow yourself."},400,origin);
        const blocked=await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(user.id,target.id,target.id,user.id).first();
        if(blocked)return json({error:"Following is unavailable between these accounts."},403,origin);
        const exists=await env.DB.prepare("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?").bind(user.id,target.id).first();
        if(!exists){await env.DB.prepare("INSERT INTO follows (follower_id,following_id,created_at) VALUES (?,?,?)").bind(user.id,target.id,new Date().toISOString()).run();await createNotification(env,{userId:target.id,actorId:user.id,kind:"follow",targetType:"user",targetId:user.id,title:"New follower",body:"@"+user.username+" started following you.",url:"/profile.html?username="+encodeURIComponent(user.username)});}
        return json({following:true},200,origin);
      }
      if(followMatch && request.method==="DELETE"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        const target=await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(followMatch[1].toLowerCase()).first();
        if(target)await env.DB.prepare("DELETE FROM follows WHERE follower_id=? AND following_id=?").bind(user.id,target.id).run();
        return json({following:false},200,origin);
      }
      if(followMatch && request.method==="GET"){
        const user=await requireUser(request,env);
        const target=await env.DB.prepare("SELECT id,username FROM users WHERE username=?").bind(followMatch[1].toLowerCase()).first();
        if(!target)return json({error:"User not found."},404,origin);
        const me=user?await env.DB.prepare("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?").bind(user.id,target.id).first():null;
        const followers=await env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE following_id=?").bind(target.id).first();
        const following=await env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE follower_id=?").bind(target.id).first();
        return json({following:!!me,followers:Number(followers?.count||0),following_count:Number(following?.count||0)},200,origin);
      }
      const blockMatch=url.pathname.match(/^\/api\/users\/([^/]+)\/block$/);
      if(blockMatch && request.method==="POST"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        const target=await env.DB.prepare("SELECT id,username,status FROM users WHERE username=?").bind(blockMatch[1].toLowerCase()).first();
        if(!target || target.status!=="active")return json({error:"User not found."},404,origin);
        if(target.id===user.id)return json({error:"You cannot block yourself."},400,origin);
        const now=new Date().toISOString();
        await env.DB.batch([env.DB.prepare("INSERT OR IGNORE INTO user_blocks (blocker_id,blocked_id,created_at) VALUES (?,?,?)").bind(user.id,target.id,now),env.DB.prepare("DELETE FROM follows WHERE (follower_id=? AND following_id=?) OR (follower_id=? AND following_id=?)").bind(user.id,target.id,target.id,user.id)]);
        return json({blocked:true},200,origin);
      }
      if(blockMatch && request.method==="DELETE"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        const target=await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(blockMatch[1].toLowerCase()).first();
        if(target)await env.DB.prepare("DELETE FROM user_blocks WHERE blocker_id=? AND blocked_id=?").bind(user.id,target.id).run();
        return json({blocked:false},200,origin);
      }
      if(blockMatch && request.method==="GET"){
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        const target=await env.DB.prepare("SELECT id FROM users WHERE username=?").bind(blockMatch[1].toLowerCase()).first();
        if(!target)return json({error:"User not found."},404,origin);
        const row=await env.DB.prepare("SELECT 1 FROM user_blocks WHERE blocker_id=? AND blocked_id=?").bind(user.id,target.id).first();
        return json({blocked:!!row},200,origin);
      }
      if(url.pathname==="/api/discover" && request.method==="GET"){
        const user=await requireUser(request,env);
        const q=String(url.searchParams.get("q")||"").trim().slice(0,80);
        const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||24),1),50);
        const like="%"+q.replace(/[%_]/g,"\\      // Direct messaging")+"%";
        const params=user?[user.id,like,like,like,like,limit]:[like,like,like,like,limit];
        const sql="SELECT u.id,u.username,u.display_name,u.role,u.bio,u.avatar_url,u.location,u.pronouns,u.created_at,u.last_seen_at,(SELECT COUNT(*) FROM follows f WHERE f.following_id=u.id) AS followers FROM users u "+(user?"LEFT JOIN user_blocks b ON b.blocker_id=? AND b.blocked_id=u.id WHERE b.blocked_id IS NULL AND ":"WHERE ")+"u.status='active' AND (u.username LIKE ? ESCAPE '\\\\' OR u.display_name LIKE ? ESCAPE '\\\\' OR COALESCE(u.bio,'') LIKE ? ESCAPE '\\\\' OR COALESCE(u.location,'') LIKE ? ESCAPE '\\\\') ORDER BY u.created_at DESC LIMIT ?";
        const {results}=await env.DB.prepare(sql).bind(...params).all();
        return json({users:results},200,origin);
      }

      // Direct messaging

      if (url.pathname === "/api/messages/conversations" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const { results } = await env.DB.prepare(
          "SELECT c.id,c.kind,c.created_at,c.updated_at,other.id AS other_user_id,other.username AS other_username,other.display_name AS other_display_name,other.avatar_url AS other_avatar_url,om.last_read_at AS other_last_read_at,cm.muted_until,lm.body AS last_body,lm.created_at AS last_message_at,(SELECT COUNT(*) FROM messages um WHERE um.conversation_id=c.id AND um.sender_id<>? AND um.deleted_at IS NULL AND (cm.last_read_at IS NULL OR um.created_at>cm.last_read_at)) AS unread_count FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id AND cm.user_id=? JOIN conversation_members om ON om.conversation_id=c.id AND om.user_id<>? JOIN users other ON other.id=om.user_id LEFT JOIN messages lm ON lm.id=(SELECT m2.id FROM messages m2 WHERE m2.conversation_id=c.id ORDER BY m2.id DESC LIMIT 1) WHERE c.kind='direct' ORDER BY COALESCE(lm.created_at,c.updated_at) DESC LIMIT 100"
        ).bind(user.id,user.id,user.id).all();
        return json({ conversations: results }, 200, origin);
      }

      if (url.pathname === "/api/messages/conversations" && request.method === "POST") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const username = String(body.username || "").trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(username)) return json({ error: "Enter a valid username." }, 400, origin);
        const other = await env.DB.prepare("SELECT id,username,display_name,avatar_url,status FROM users WHERE username=?").bind(username).first();
        if (!other || other.status !== "active") return json({ error: "User not found." }, 404, origin);
        if (other.id === user.id) return json({ error: "You cannot message yourself." }, 400, origin);
        const existing = await env.DB.prepare(
          "SELECT c.id FROM conversations c JOIN conversation_members a ON a.conversation_id=c.id AND a.user_id=? JOIN conversation_members b ON b.conversation_id=c.id AND b.user_id=? WHERE c.kind='direct' LIMIT 1"
        ).bind(user.id,other.id).first();
        if (existing) return json({ id: existing.id }, 200, origin);
        const now = new Date().toISOString();
        const conv = await env.DB.prepare("INSERT INTO conversations (kind,created_at,updated_at) VALUES ('direct',?,?) RETURNING id").bind(now,now).first();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO conversation_members (conversation_id,user_id,joined_at,last_read_at) VALUES (?,?,?,?)").bind(conv.id,user.id,now,now),
          env.DB.prepare("INSERT INTO conversation_members (conversation_id,user_id,joined_at,last_read_at) VALUES (?,?,?,NULL)").bind(conv.id,other.id,now)
        ]);
        return json({ id: conv.id }, 201, origin);
      }

      const conversationMatch = url.pathname.match(/^\/api\/messages\/conversations\/(\d+)$/);
      if (conversationMatch && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const conversationId = Number(conversationMatch[1]);
        const membership = await env.DB.prepare("SELECT conversation_id FROM conversation_members WHERE conversation_id=? AND user_id=?").bind(conversationId,user.id).first();
        if (!membership && !isAdmin(user)) return json({ error: "Conversation not found." }, 404, origin);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100),1),250);
        const selectBody = isAdmin(user) && !membership ? "m.body" : "CASE WHEN m.deleted_at IS NOT NULL THEN '[Message deleted]' ELSE m.body END";
        const before=Number(url.searchParams.get("before")||0);
        let messageRows;
        if(before){
          const q=await env.DB.prepare("SELECT m.id,m.conversation_id,m.sender_id,"+selectBody+" AS body,m.created_at,m.edited_at,m.deleted_at,u.username,u.display_name,u.avatar_url FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=? AND m.id<? ORDER BY m.id DESC LIMIT ?").bind(conversationId,before,limit).all();
          messageRows=(q.results||[]).reverse();
        } else {
          const q=await env.DB.prepare("SELECT m.id,m.conversation_id,m.sender_id,"+selectBody+" AS body,m.created_at,m.edited_at,m.deleted_at,u.username,u.display_name,u.avatar_url FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.conversation_id=? ORDER BY m.id ASC LIMIT ?").bind(conversationId,limit).all();
          messageRows=q.results||[];
        }
        const results=messageRows;
        if (membership && !before) await env.DB.prepare("UPDATE conversation_members SET last_read_at=? WHERE conversation_id=? AND user_id=?").bind(new Date().toISOString(),conversationId,user.id).run();
        if (!membership && isAdmin(user)) await audit(env,user,"message.archive.view","conversation",conversationId,{});
        return json({ messages: results, admin_view: !membership && isAdmin(user) }, 200, origin);
      }

      if (conversationMatch && request.method === "POST") {
        if (!(await rateLimit(env,request,"message",60,60))) return json({error:"Message rate limit reached. Slow down."},429,origin);
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const conversationId = Number(conversationMatch[1]);
        const membership = await env.DB.prepare("SELECT conversation_id FROM conversation_members WHERE conversation_id=? AND user_id=?").bind(conversationId,user.id).first();
        if (!membership) return json({ error: "Conversation not found." }, 404, origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const message = String(body.body || "").trim();
        if (!validText(message,4000)) return json({ error: "Message must be 1-4000 characters." },400,origin);
        const now = new Date().toISOString();
        const other=await env.DB.prepare("SELECT cm.user_id,u.username FROM conversation_members cm JOIN users u ON u.id=cm.user_id WHERE cm.conversation_id=? AND cm.user_id<>? LIMIT 1").bind(conversationId,user.id).first();
        if(other){const blocked=await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(user.id,other.user_id,other.user_id,user.id).first();if(blocked)return json({error:"Messaging is unavailable between these accounts."},403,origin);}
        const row = await env.DB.prepare("INSERT INTO messages (conversation_id,sender_id,body,created_at) VALUES (?,?,?,?) RETURNING id").bind(conversationId,user.id,message,now).first();
        await env.DB.prepare("UPDATE conversations SET updated_at=? WHERE id=?").bind(now,conversationId).run();
        if(other) await createNotification(env,{userId:other.user_id,actorId:user.id,kind:"message",targetType:"conversation",targetId:conversationId,title:"New message",body:"@"+user.username+" sent you a message.",url:"/messages.html?conversation="+conversationId});
        await notifyMentions(env,message,user,"conversation",conversationId,"/messages.html?conversation="+conversationId);
        return json({ id: row.id },201,origin);
      }

      const messageMatch = url.pathname.match(/^\/api\/messages\/(\d+)$/);
      if (messageMatch && request.method === "PATCH") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." }, 401, origin);
        const id = Number(messageMatch[1]);
        const row = await env.DB.prepare("SELECT id,sender_id,deleted_at FROM messages WHERE id=?").bind(id).first();
        if (!row || row.deleted_at || row.sender_id !== user.id) return json({ error: "Message not found." },404,origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." },400,origin); }
        const message = String(body.body || "").trim();
        if (!validText(message,4000)) return json({ error:"Message must be 1-4000 characters." },400,origin);
        await env.DB.prepare("UPDATE messages SET body=?,edited_at=? WHERE id=?").bind(message,new Date().toISOString(),id).run();
        return json({ok:true},200,origin);
      }

      if (messageMatch && request.method === "DELETE") {
        const user = await requireUser(request, env);
        if (!user) return json({ error: "Authentication required." },401,origin);
        const id=Number(messageMatch[1]);
        const row=await env.DB.prepare("SELECT id,sender_id,deleted_at FROM messages WHERE id=?").bind(id).first();
        if (!row || row.deleted_at || row.sender_id !== user.id) return json({error:"Message not found."},404,origin);
        await env.DB.prepare("UPDATE messages SET deleted_at=? WHERE id=?").bind(new Date().toISOString(),id).run();
        return json({ok:true},200,origin);
      }


      if (messageMatch && request.method === "POST") {
        if (!(await rateLimit(env,request,"message-report",10,600))) return json({error:"Report rate limit reached. Slow down."},429,origin);
        const user = await requireUser(request, env);
        if (!user) return json({error:"Authentication required."},401,origin);
        const id=Number(messageMatch[1]);
        let body; try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        const reason=String(body.reason||"").trim();
        if(!validText(reason,1000))return json({error:"A report reason is required."},400,origin);
        const row=await env.DB.prepare("SELECT id,conversation_id,deleted_at FROM messages WHERE id=?").bind(id).first();
        if(!row || row.deleted_at)return json({error:"Message not found."},404,origin);
        const member=await env.DB.prepare("SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?").bind(row.conversation_id,user.id).first();
        if(!member && !isAdmin(user))return json({error:"Message not found."},404,origin);
        await env.DB.prepare("INSERT INTO message_reports (message_id,reporter_id,reason,created_at) VALUES (?,?,?,?)").bind(id,user.id,reason,new Date().toISOString()).run();
        return json({ok:true},201,origin);
      }
      if (url.pathname === "/api/messages/conversations/mute" && request.method === "POST") {
        const user=await requireUser(request,env); if(!user)return json({error:"Authentication required."},401,origin);
        let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        const id=Number(body.conversation_id); const minutes=Math.min(Math.max(Number(body.minutes||0),0),43200);
        const until=minutes?new Date(Date.now()+minutes*60000).toISOString():null;
        await env.DB.prepare("UPDATE conversation_members SET muted_until=? WHERE conversation_id=? AND user_id=?").bind(until,id,user.id).run();
        return json({ok:true,muted_until:until},200,origin);
      }
      if (url.pathname === "/api/moderation/message-reports" && request.method === "GET") {
        const user=await requireUser(request,env); if(!isModerator(user))return json({error:"Moderator access required."},403,origin);
        const status=["open","resolved","dismissed"].includes(url.searchParams.get("status"))?url.searchParams.get("status"):"open";
        const {results}=await env.DB.prepare("SELECT r.id,r.message_id,r.reason,r.status,r.created_at,r.resolved_at,r.reporter_id,ru.username AS reporter_username,m.sender_id,su.username AS sender_username,su.display_name AS sender_display_name,m.body,m.conversation_id FROM message_reports r JOIN messages m ON m.id=r.message_id JOIN users su ON su.id=m.sender_id JOIN users ru ON ru.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at ASC LIMIT 250").bind(status).all();
        return json({reports:results},200,origin);
      }
      const messageReportMatch=url.pathname.match(/^\/api\/moderation\/message-reports\/(\d+)$/);
      if(messageReportMatch && request.method==="PATCH"){
        const user=await requireUser(request,env); if(!isModerator(user))return json({error:"Moderator access required."},403,origin);
        let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        if(!["open","resolved","dismissed"].includes(body.status))return json({error:"Invalid report status."},400,origin);
        await env.DB.prepare("UPDATE message_reports SET status=?,resolved_at=?,resolved_by=? WHERE id=?").bind(body.status,body.status==="open"?null:new Date().toISOString(),body.status==="open"?null:user.id,Number(messageReportMatch[1])).run();
        await audit(env,user,"message_report."+body.status,"message_report",Number(messageReportMatch[1]),{});
        return json({ok:true},200,origin);
      }

      if (url.pathname === "/api/admin/message-reports" && request.method === "GET") {
        const user=await requireUser(request,env); if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const status=["open","resolved","dismissed"].includes(url.searchParams.get("status"))?url.searchParams.get("status"):"open";
        const {results}=await env.DB.prepare("SELECT r.id,r.message_id,r.reason,r.status,r.created_at,r.resolved_at,r.reporter_id,ru.username AS reporter_username,m.sender_id,su.username AS sender_username,su.display_name AS sender_display_name,m.body,m.conversation_id FROM message_reports r JOIN messages m ON m.id=r.message_id JOIN users su ON su.id=m.sender_id JOIN users ru ON ru.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at ASC LIMIT 250").bind(status).all();
        return json({reports:results},200,origin);
      }
      const adminMessageAction=url.pathname.match(/^\/api\/admin\/messages\/(\d+)$/);
      if(adminMessageAction && request.method==="PATCH"){
        const user=await requireUser(request,env);if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const id=Number(adminMessageAction[1]);let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        const action=body.action; const row=await env.DB.prepare("SELECT id FROM messages WHERE id=?").bind(id).first(); if(!row)return json({error:"Message not found."},404,origin);
        if(action==="delete")await env.DB.prepare("UPDATE messages SET deleted_at=COALESCE(deleted_at,?) WHERE id=?").bind(new Date().toISOString(),id).run();
        else if(action==="restore")await env.DB.prepare("UPDATE messages SET deleted_at=NULL WHERE id=?").bind(id).run();
        else if(action==="purge"){await env.DB.prepare("DELETE FROM message_reports WHERE message_id=?").bind(id).run();await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id).run();}
        else return json({error:"Invalid action."},400,origin);
        await audit(env,user,"message."+action,"message",id,{});
        return json({ok:true},200,origin);
      }

      // Administrator message archive. Admins can inspect all conversations and message bodies,
      // including soft-deleted messages, but authentication secrets are never exposed.
      if (url.pathname === "/api/admin/messages" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({error:"Administrator access required."},403,origin);
        const q=String(url.searchParams.get("q")||"").trim();
        const conversationId=Number(url.searchParams.get("conversation_id")||0);
        const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||250),1),500);
        const like="%"+q.replace(/[%_]/g,"\\$&")+"%";
        let sql="SELECT m.id,m.conversation_id,m.sender_id,m.body,m.created_at,m.edited_at,m.deleted_at,s.username AS sender_username,s.display_name AS sender_display_name,group_concat(cm.user_id) AS member_ids FROM messages m JOIN users s ON s.id=m.sender_id JOIN conversation_members cm ON cm.conversation_id=m.conversation_id WHERE 1=1";
        const params=[];
        if(conversationId){sql+=" AND m.conversation_id=?";params.push(conversationId);}
        if(q){sql+=" AND (m.body LIKE ? ESCAPE '\\' OR s.username LIKE ? ESCAPE '\\' OR s.display_name LIKE ? ESCAPE '\\')";params.push(like,like,like);}
        sql+=" GROUP BY m.id ORDER BY m.created_at DESC LIMIT ?";
        params.push(limit);
        const {results}=await env.DB.prepare(sql).bind(...params).all();
        await audit(env,user,"message.archive.search","messages",conversationId||null,{query:q,limit});
        return json({messages:results},200,origin);
      }

      if (url.pathname === "/api/admin/conversations" && request.method === "GET") {
        const user=await requireUser(request,env);
        if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const {results}=await env.DB.prepare(
          "SELECT c.id,c.kind,c.created_at,c.updated_at,group_concat(u.username, ', ') AS participants,(SELECT COUNT(*) FROM messages m WHERE m.conversation_id=c.id) AS message_count FROM conversations c JOIN conversation_members cm ON cm.conversation_id=c.id JOIN users u ON u.id=cm.user_id GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 500"
        ).all();
        return json({conversations:results},200,origin);
      }

      if (url.pathname === "/api/admin/overview" && request.method === "GET") {
        const maintenance = await getSetting(env, "maintenance_mode");
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const [users, threads, posts, reports, categories, messages, notifications, message_reports] = await Promise.all([
          env.DB.prepare("SELECT COUNT(*) AS count FROM users").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM threads WHERE deleted_at IS NULL").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM posts WHERE deleted_at IS NULL").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM reports WHERE status='open'").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM categories").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM messages WHERE deleted_at IS NULL").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM notifications").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM message_reports WHERE status='open'").first(),
        ]);
        return json({ stats: { users: users?.count || 0, threads: threads?.count || 0, posts: posts?.count || 0, open_reports: reports?.count || 0, categories: categories?.count || 0, messages: messages?.count || 0, notifications: notifications?.count || 0, open_message_reports: message_reports?.count || 0, maintenance_mode: maintenance === "true" ? 1 : 0 } }, 200, origin);
      }

      if (url.pathname === "/api/admin/users" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const { results } = await env.DB.prepare("SELECT id,username,email,display_name,role,status,created_at,updated_at FROM users ORDER BY id ASC LIMIT 250").all();
        return json({ users: results }, 200, origin);
      }

      const adminDetailMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/detail$/);
      if(adminDetailMatch && request.method==="GET"){
        const user=await requireUser(request,env); if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const id=Number(adminDetailMatch[1]);
        const target=await env.DB.prepare("SELECT id,username,email,display_name,role,status,bio,avatar_url,website_url,location,pronouns,created_at,updated_at,last_seen_at FROM users WHERE id=?").bind(id).first();
        if(!target)return json({error:"User not found."},404,origin);
        const [threads,posts,reports,followers,following]=await Promise.all([
          env.DB.prepare("SELECT t.id,t.title,t.slug,t.body,t.created_at,t.updated_at,t.deleted_at,c.name AS category_name FROM threads t JOIN categories c ON c.id=t.category_id WHERE t.user_id=? ORDER BY t.created_at DESC LIMIT 250").bind(id).all(),
          env.DB.prepare("SELECT p.id,p.thread_id,p.body,p.created_at,p.updated_at,p.deleted_at,t.title AS thread_title FROM posts p JOIN threads t ON t.id=p.thread_id WHERE p.user_id=? ORDER BY p.created_at DESC LIMIT 500").bind(id).all(),
          env.DB.prepare("SELECT id,reason,status,created_at,resolved_at,thread_id,post_id FROM reports WHERE reporter_id=? ORDER BY created_at DESC LIMIT 250").bind(id).all(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE following_id=?").bind(id).first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM follows WHERE follower_id=?").bind(id).first()
        ]);
        await audit(env,user,"user.inspect","user",id,{});
        return json({user:{...target,followers:Number(followers?.count||0),following_count:Number(following?.count||0),is_online:target.last_seen_at?Date.now()-new Date(target.last_seen_at).getTime()<300000:false},threads:threads.results||[],posts:posts.results||[],reports:reports.results||[]},200,origin);
      }

      const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUserMatch && request.method === "PATCH") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const targetId = Number(adminUserMatch[1]);
        const target = await env.DB.prepare("SELECT id,username,role,status FROM users WHERE id=?").bind(targetId).first();
        if (!target) return json({ error: "User not found." }, 404, origin);
        if (target.id === user.id && (body.role !== undefined && body.role !== "admin" || body.status !== undefined && body.status !== "active")) return json({ error: "You cannot remove or suspend your own administrator access." }, 400, origin);
        const roles = ["member","moderator","admin"];
        const statuses = ["active","suspended","banned"];
        if (body.role !== undefined && !roles.includes(body.role)) return json({ error: "Invalid role." }, 400, origin);
        if (body.status !== undefined && !statuses.includes(body.status)) return json({ error: "Invalid account status." }, 400, origin);
        await env.DB.prepare("UPDATE users SET role=COALESCE(?,role),status=COALESCE(?,status),updated_at=? WHERE id=?").bind(body.role ?? null, body.status ?? null, new Date().toISOString(), targetId).run();
        await audit(env,user,"user.update","user",targetId,{role:body.role,status:body.status});
        if (body.status && body.status !== "active") {
          const list = await env.SESSIONS.list({ prefix: "session:" });
          for (const key of list.keys || []) {
            const session = await env.SESSIONS.get(key.name, "json");
            if (session?.user_id === targetId) await env.SESSIONS.delete(key.name);
          }
        }
        return json({ ok: true, user: await env.DB.prepare("SELECT id,username,email,display_name,role,status,created_at,updated_at FROM users WHERE id=?").bind(targetId).first() }, 200, origin);
      }

      if (adminUserMatch && request.method === "POST") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const targetId = Number(adminUserMatch[1]);
        const target = await env.DB.prepare("SELECT id,username FROM users WHERE id=?").bind(targetId).first();
        if (!target) return json({ error: "User not found." }, 404, origin);
        const list = await env.SESSIONS.list({ prefix: "session:" });
        let revoked = 0;
        for (const key of list.keys || []) {
          const session = await env.SESSIONS.get(key.name, "json");
          if (session?.user_id === targetId) { await env.SESSIONS.delete(key.name); revoked++; }
        }
        return json({ ok: true, revoked }, 200, origin);
      }

      if (url.pathname === "/api/admin/reports" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const status = ["open","resolved","dismissed"].includes(url.searchParams.get("status")) ? url.searchParams.get("status") : "open";
        const { results } = await env.DB.prepare("SELECT r.id,r.reason,r.status,r.created_at,r.resolved_at,r.moderator_note,r.reporter_id,r.thread_id,r.post_id,ru.username AS reporter_username,CASE WHEN r.thread_id IS NOT NULL THEN 'thread' ELSE 'post' END AS target_type,COALESCE(r.thread_id,r.post_id) AS target_id FROM reports r LEFT JOIN users ru ON ru.id=r.reporter_id WHERE r.status=? ORDER BY r.created_at ASC LIMIT 250").bind(status).all();
        return json({ reports: results }, 200, origin);
      }

      if (url.pathname === "/api/admin/settings" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const { results } = await env.DB.prepare("SELECT key,value,updated_at FROM site_settings ORDER BY key ASC").all();
        return json({ settings: results }, 200, origin);
      }

      if (url.pathname === "/api/admin/settings" && request.method === "PATCH") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const allowed = Object.keys(SETTING_DEFAULTS);
        const entries = Object.entries(body || {});
        if (!entries.length || entries.some(([key,value]) => !allowed.includes(key) || typeof value !== "string" || value.length > 10000)) return json({ error: "Invalid setting payload." }, 400, origin);
        const now = new Date().toISOString();
        for (const [key,value] of entries) {
          await env.DB.prepare("INSERT INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=excluded.updated_at").bind(key,value,user.id,now).run();
          await audit(env,user,"settings.update","setting",null,{key,value});
        }
        return json({ ok: true }, 200, origin);
      }

      if (url.pathname === "/api/admin/categories" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const { results } = await env.DB.prepare("SELECT id,name,slug,description,sort_order,created_at FROM categories ORDER BY sort_order ASC,name ASC").all();
        return json({ categories: results }, 200, origin);
      }

      if (url.pathname === "/api/admin/categories" && request.method === "POST") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        let body; try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400, origin); }
        const name=String(body.name||"").trim(), description=String(body.description||"").trim(), sortOrder=Number(body.sort_order||0);
        if (!validText(name,80) || description.length>500 || !Number.isInteger(sortOrder)) return json({ error: "Invalid category." },400,origin);
        const slug=slugify(name);
        const exists=await env.DB.prepare("SELECT id FROM categories WHERE slug=? OR name=?").bind(slug,name).first();
        if(exists) return json({ error:"Category already exists." },409,origin);
        const row=await env.DB.prepare("INSERT INTO categories (name,slug,description,sort_order,created_at) VALUES (?,?,?,?,?) RETURNING id").bind(name,slug,description,sortOrder,new Date().toISOString()).first();
        await audit(env,user,"category.create","category",row.id,{name,slug});
        return json({ id:row.id },201,origin);
      }

      const adminCategoryMatch=url.pathname.match(/^\/api\/admin\/categories\/(\d+)$/);
      if(adminCategoryMatch && request.method==="PATCH"){
        const user=await requireUser(request,env);
        if(!isAdmin(user)) return json({error:"Administrator access required."},403,origin);
        let body; try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        const id=Number(adminCategoryMatch[1]);
        const current=await env.DB.prepare("SELECT * FROM categories WHERE id=?").bind(id).first();
        if(!current)return json({error:"Category not found."},404,origin);
        const name=body.name===undefined?current.name:String(body.name).trim();
        const description=body.description===undefined?(current.description||""):String(body.description).trim();
        const sortOrder=body.sort_order===undefined?current.sort_order:Number(body.sort_order);
        if(!validText(name,80)||description.length>500||!Number.isInteger(sortOrder))return json({error:"Invalid category."},400,origin);
        const slug=slugify(name);
        const conflict=await env.DB.prepare("SELECT id FROM categories WHERE (slug=? OR name=?) AND id<>?").bind(slug,name,id).first();
        if(conflict)return json({error:"Another category already uses that name."},409,origin);
        await env.DB.prepare("UPDATE categories SET name=?,slug=?,description=?,sort_order=? WHERE id=?").bind(name,slug,description,sortOrder,id).run();
        await audit(env,user,"category.update","category",id,{name,slug,sortOrder});
        return json({ok:true},200,origin);
      }

      if(adminCategoryMatch && request.method==="DELETE"){
        const user=await requireUser(request,env);
        if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const id=Number(adminCategoryMatch[1]);
        const current=await env.DB.prepare("SELECT id,name FROM categories WHERE id=?").bind(id).first();
        if(!current)return json({error:"Category not found."},404,origin);
        const threads=await env.DB.prepare("SELECT COUNT(*) AS count FROM threads WHERE category_id=? AND deleted_at IS NULL").bind(id).first();
        if(Number(threads?.count||0)>0)return json({error:"Category still contains active threads. Move or remove them first."},409,origin);
        await env.DB.prepare("DELETE FROM categories WHERE id=?").bind(id).run();
        await audit(env,user,"category.delete","category",id,{name:current.name});
        return json({ok:true},200,origin);
      }

      if (url.pathname === "/api/admin/audit" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const limit=Math.min(Math.max(Number(url.searchParams.get("limit")||100),1),250);
        const { results } = await env.DB.prepare("SELECT a.id,a.action,a.target_type,a.target_id,a.details,a.created_at,u.username AS actor_username FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT ?").bind(limit).all();
        return json({ logs: results }, 200, origin);
      }

      if (url.pathname === "/api/admin/content" && request.method === "GET") {
        const user = await requireUser(request, env);
        if (!isAdmin(user)) return json({ error: "Administrator access required." }, 403, origin);
        const type=url.searchParams.get("type")==="posts"?"posts":"threads";
        const includeDeleted=url.searchParams.get("include_deleted")==="1";
        const q=String(url.searchParams.get("q")||"").trim();
        const like="%"+q.replace(/[%_]/g,"\\$&")+"%";
        let results;
        if(type==="threads"){
          const sql="SELECT t.id,t.title,t.slug,t.deleted_at,t.locked,t.pinned,t.created_at,u.username,c.name AS category_name FROM threads t JOIN users u ON u.id=t.user_id JOIN categories c ON c.id=t.category_id WHERE "+(includeDeleted?"1=1":"t.deleted_at IS NULL")+(q?" AND (t.title LIKE ? ESCAPE '\\' OR t.body LIKE ? ESCAPE '\\')":"")+" ORDER BY t.created_at DESC LIMIT 250";
          const r=q?await env.DB.prepare(sql).bind(like,like).all():await env.DB.prepare(sql).all(); results=r.results;
        }else{
          const sql="SELECT p.id,p.thread_id,p.body,p.deleted_at,p.created_at,u.username,t.title AS thread_title FROM posts p JOIN users u ON u.id=p.user_id JOIN threads t ON t.id=p.thread_id WHERE "+(includeDeleted?"1=1":"p.deleted_at IS NULL")+(q?" AND p.body LIKE ? ESCAPE '\\'":"")+" ORDER BY p.created_at DESC LIMIT 250";
          const r=q?await env.DB.prepare(sql).bind(like).all():await env.DB.prepare(sql).all(); results=r.results;
        }
        return json({ type, content: results },200,origin);
      }

      const adminContentMatch=url.pathname.match(/^\/api\/admin\/content\/(threads|posts)\/(\d+)$/);
      if(adminContentMatch && request.method==="PATCH"){
        const user=await requireUser(request,env);
        if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,origin);}
        const type=adminContentMatch[1],id=Number(adminContentMatch[2]),action=body.action;
        if(!["delete","restore","purge"].includes(action))return json({error:"Invalid content action."},400,origin);
        const table=type==="threads"?"threads":"posts";
        const row=await env.DB.prepare(`SELECT id,deleted_at FROM ${table} WHERE id=?`).bind(id).first();
        if(!row)return json({error:"Content not found."},404,origin);
        if(action==="restore"){
          await env.DB.prepare(`UPDATE ${table} SET deleted_at=NULL WHERE id=?`).bind(id).run();
        }else if(action==="delete"){
          await env.DB.prepare(`UPDATE ${table} SET deleted_at=? WHERE id=?`).bind(new Date().toISOString(),id).run();
        }else{
          if(!row.deleted_at)return json({error:"Purge requires content to be soft-deleted first."},409,origin);
          if(type==="posts"){
            await env.DB.batch([
              env.DB.prepare("DELETE FROM reports WHERE post_id=?").bind(id),
              env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id)
            ]);
          }else{
            await env.DB.batch([
              env.DB.prepare("DELETE FROM reports WHERE thread_id=? OR post_id IN (SELECT id FROM posts WHERE thread_id=?)").bind(id,id),
              env.DB.prepare("DELETE FROM posts WHERE thread_id=?").bind(id),
              env.DB.prepare("DELETE FROM threads WHERE id=?").bind(id)
            ]);
          }
        }
        await audit(env,user,`content.${action}`,type,id,{});
        return json({ok:true},200,origin);
      }

      if (url.pathname === "/api/admin/health" && request.method === "GET") {
        const user=await requireUser(request,env);
        if(!isAdmin(user))return json({error:"Administrator access required."},403,origin);
        const started=Date.now();
        const db=await env.DB.prepare("SELECT 1 AS ok").first();
        const kv=await env.SESSIONS.list({limit:1});
        const open=await env.DB.prepare("SELECT COUNT(*) AS count FROM reports WHERE status='open'").first();
        return json({ok:db?.ok===1,latency_ms:Date.now()-started,kv:true,open_reports:Number(open?.count||0),now:new Date().toISOString()},200,origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
