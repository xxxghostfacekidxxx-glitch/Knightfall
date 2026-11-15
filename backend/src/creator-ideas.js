import { canAccessCreatorFoundry } from "./staff-capabilities.js";

const route = "/api/devil-tools/ideas";
const prefix = "foundry-ideas/";
const projects = new Set(["Knightfall", "Cinderwild", "Cards Against Chaos"]);
const kinds = new Set(["Feature", "General idea", "Prompt card", "Answer card"]);
const decisions = new Set(["accepted", "declined"]);

export async function handleCreatorIdeas(request, env, url, deps) {
  if (url.pathname !== route && !url.pathname.startsWith(route + "/")) return null;
  const { requireUser, isAdmin, rateLimit, randomToken, json, audit, origin } = deps;
  const reply = (data, status = 200) => json(data, status, origin);
  const user = await requireUser(request, env);
  if (!user) return reply({ error: "Sign in to use Foundry submissions." }, 401);
  if (!canAccessCreatorFoundry(user)) return reply({ error: "Creator Foundry access required." }, 403);
  const storage = env.CREATOR_MEDIA;
  if (!storage) return reply({ error: "Submission storage is unavailable." }, 503);
  const admin = isAdmin(user);

  async function write(key, idea, onlyIf) {
    return storage.put(key, JSON.stringify(idea), {
      onlyIf,
      httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" }
    });
  }

  if (url.pathname === route && request.method === "GET") {
    const cursor = url.searchParams.get("cursor") || undefined;
    if (cursor?.length > 2048) return reply({ error: "Invalid page cursor." }, 400);
    const page = await storage.list({ prefix: admin ? prefix : prefix + user.id + "/", cursor, limit: 20 });
    const objects = await Promise.all(page.objects.map(item => storage.get(item.key)));
    const ideas = await Promise.all(objects.filter(Boolean).map(item => item.json()));
    return reply({ ideas, can_review: admin, cursor: page.truncated ? page.cursor : null });
  }

  if (!["POST", "PATCH"].includes(request.method)) return reply({ error: "Method not allowed." }, 405);
  if (Number(request.headers.get("Content-Length")) > 12_000) return reply({ error: "Submission is too long." }, 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return reply({ error: "Submission is too long." }, 413);
    body = JSON.parse(raw);
  } catch {
    return reply({ error: "Invalid submission JSON." }, 400);
  }

  if (url.pathname === route && request.method === "POST") {
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
    const project = body?.project, kind = body?.kind;
    if (!projects.has(project) || !kinds.has(kind) || !title || title.length > 100 ||
        !detail || detail.length > 1500 || (kind.endsWith(" card") && project !== "Cards Against Chaos")) {
      return reply({ error: "Choose a project and type, then enter a title (up to 100 characters) and details (up to 1,500)." }, 400);
    }
    if (!await rateLimit(env, request, "creator-idea-submit", 10, 3600, user.id)) {
      return reply({ error: "Submission limit reached. Try again later." }, 429);
    }
    const now = new Date();
    const id = String(9_999_999_999_999 - now.getTime()) + "-" + randomToken(16);
    const idea = { id, author_id: user.id, author: user.username, project, kind, title, detail,
      status: "pending", created_at: now.toISOString() };
    const result = await write(prefix + user.id + "/" + id, idea, { etagDoesNotMatch: "*" });
    if (!result) return reply({ error: "Could not save the submission. Try again." }, 409);
    return reply({ idea }, 201);
  }

  const match = url.pathname.slice(route.length).match(/^\/(\d+)\/(\d{13}-[a-f0-9]{32})$/);
  if (!match || request.method !== "PATCH") return reply({ error: "Submission route not found." }, 404);
  if (!admin) return reply({ error: "Administrator review required." }, 403);
  if (!decisions.has(body?.status)) return reply({ error: "Choose Accept or Decline." }, 400);
  if (!await rateLimit(env, request, "creator-idea-review", 30, 60, user.id)) {
    return reply({ error: "Review limit reached. Try again later." }, 429);
  }

  const key = prefix + match[1] + "/" + match[2];
  const object = await storage.get(key);
  if (!object) return reply({ error: "Submission not found." }, 404);
  const idea = await object.json();
  if (idea.status !== "pending") return reply({ error: "This submission has already been reviewed." }, 409);
  idea.status = body.status;
  idea.reviewed_at = new Date().toISOString();
  const result = await write(key, idea, { etagMatches: object.etag });
  if (!result) return reply({ error: "This submission changed. Refresh the queue and try again." }, 409);
  await audit(env, user, "creator_idea.review", "creator_idea", null, { id: idea.id, status: idea.status });
  return reply({ idea });
}
