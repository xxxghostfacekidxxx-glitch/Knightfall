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
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type, authorization",
      "cache-control": "no-store",
    },
  });
}

const validText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;

export default {
  async fetch(request, env) {
    const origin = getOrigin(request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": origin,
        "access-control-allow-methods": "GET,OPTIONS",
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
        const { results } = await env.DB.prepare("SELECT id, name, slug, description, sort_order FROM categories ORDER BY sort_order ASC, name ASC").all();
        return json({ categories: results }, 200, origin);
      }

      if (url.pathname === "/api/threads" && request.method === "GET") {
        const categoryId = Number(url.searchParams.get("category_id"));
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 50);
        const base = `SELECT t.id, t.title, t.slug, t.category_id, c.name AS category_name, t.user_id, u.display_name AS author_name, t.pinned, t.locked, t.views, t.created_at, t.updated_at, COUNT(p.id) AS reply_count FROM threads t JOIN categories c ON c.id = t.category_id JOIN users u ON u.id = t.user_id LEFT JOIN posts p ON p.thread_id = t.id`;
        const query = Number.isInteger(categoryId) && categoryId > 0
          ? env.DB.prepare(`${base} WHERE t.category_id = ? GROUP BY t.id ORDER BY t.pinned DESC, t.updated_at DESC LIMIT ?`).bind(categoryId, limit)
          : env.DB.prepare(`${base} GROUP BY t.id ORDER BY t.pinned DESC, t.updated_at DESC LIMIT ?`).bind(limit);
        const { results } = await query.all();
        return json({ threads: results }, 200, origin);
      }

      if (url.pathname === "/api/threads" && request.method === "POST") {
        return json({ error: "Authentication is not implemented yet. Sign-in will be required before posting." }, 401, origin);
      }

      const match = url.pathname.match(/^\/api\/threads\/(\d+)$/);
      if (match && request.method === "GET") {
        const threadId = Number(match[1]);
        const thread = await env.DB.prepare("SELECT t.id, t.title, t.slug, t.category_id, c.name AS category_name, t.user_id, u.display_name AS author_name, t.body, t.pinned, t.locked, t.views, t.created_at, t.updated_at FROM threads t JOIN categories c ON c.id = t.category_id JOIN users u ON u.id = t.user_id WHERE t.id = ?").bind(threadId).first();
        if (!thread) return json({ error: "Thread not found." }, 404, origin);
        await env.DB.prepare("UPDATE threads SET views = views + 1 WHERE id = ?").bind(threadId).run();
        const { results: posts } = await env.DB.prepare("SELECT p.id, p.thread_id, p.user_id, u.display_name AS author_name, p.body, p.created_at, p.updated_at FROM posts p JOIN users u ON u.id = p.user_id WHERE p.thread_id = ? ORDER BY p.created_at ASC").bind(threadId).all();
        return json({ thread: { ...thread, views: Number(thread.views || 0) + 1 }, posts }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error" }, 500, origin);
    }
  },
};
