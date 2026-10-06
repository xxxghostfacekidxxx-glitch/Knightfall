const ALLOWED_ORIGINS = new Set(["https://ash-fall.com", "https://www.ash-fall.com"]);

function getOrigin(request) {
  const origin = request.headers.get("Origin");
  return ALLOWED_ORIGINS.has(origin) ? origin : "https://ash-fall.com";
}

function json(data, status = 200, origin = "https://ash-fall.com") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
      "cache-control": "no-store",
    },
  });
}

const validText = (value, max) => typeof value === "string" && value.trim() && value.trim().length <= max;
const makeId = () => crypto.randomUUID();

export default {
  async fetch(request, env) {
    const origin = getOrigin(request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type, authorization",
        "access-control-max-age": "86400",
      }});
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        const check = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({ ok: check?.ok === 1, service: "knightfall-api", database: true }, 200, origin);
      }

      if (url.pathname === "/api/categories" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT id, name, description, created_at FROM categories ORDER BY name ASC").all();
        return json({ categories: results }, 200, origin);
      }

      if (url.pathname === "/api/threads" && request.method === "GET") {
        const categoryId = url.searchParams.get("category_id");
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 50);
        const base = `SELECT t.id, t.title, t.category_id, c.name AS category_name, t.author_id, t.created_at, t.updated_at, COUNT(p.id) AS reply_count FROM threads t JOIN categories c ON c.id = t.category_id LEFT JOIN posts p ON p.thread_id = t.id`;
        const query = categoryId
          ? env.DB.prepare(`${base} WHERE t.category_id = ? GROUP BY t.id ORDER BY t.updated_at DESC LIMIT ?`).bind(categoryId, limit)
          : env.DB.prepare(`${base} GROUP BY t.id ORDER BY t.updated_at DESC LIMIT ?`).bind(limit);
        const { results } = await query.all();
        return json({ threads: results }, 200, origin);
      }

      if (url.pathname === "/api/threads" && request.method === "POST") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400, origin); }
        if (!validText(body.title, 160) || !validText(body.content, 10000) || !validText(body.author_id, 128) || !validText(body.category_id, 128)) {
          return json({ error: "title, content, author_id, and category_id are required." }, 400, origin);
        }
        const category = await env.DB.prepare("SELECT id FROM categories WHERE id = ?").bind(body.category_id.trim()).first();
        if (!category) return json({ error: "Category not found." }, 404, origin);
        const threadId = makeId();
        const postId = makeId();
        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO threads (id, title, category_id, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(threadId, body.title.trim(), body.category_id.trim(), body.author_id.trim(), now, now),
          env.DB.prepare("INSERT INTO posts (id, thread_id, author_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(postId, threadId, body.author_id.trim(), body.content.trim(), now, now),
        ]);
        return json({ id: threadId, title: body.title.trim(), category_id: body.category_id.trim() }, 201, origin);
      }

      const match = url.pathname.match(/^\/api\/threads\/([^/]+)$/);
      if (match && request.method === "GET") {
        const thread = await env.DB.prepare("SELECT t.id, t.title, t.category_id, c.name AS category_name, t.author_id, t.created_at, t.updated_at FROM threads t JOIN categories c ON c.id = t.category_id WHERE t.id = ?").bind(match[1]).first();
        if (!thread) return json({ error: "Thread not found." }, 404, origin);
        const { results: posts } = await env.DB.prepare("SELECT id, thread_id, author_id, content, created_at, updated_at FROM posts WHERE thread_id = ? ORDER BY created_at ASC").bind(match[1]).all();
        return json({ thread, posts }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
