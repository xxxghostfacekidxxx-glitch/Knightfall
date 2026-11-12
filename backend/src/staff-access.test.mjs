import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Wrangler bundles the Worker’s JSON imports as modules.
const hooks = registerHooks({
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".json")) {
      const content = readFileSync(new URL(url), "utf8");
      return { format: "module", shortCircuit: true, source: "export default " + JSON.stringify(JSON.parse(content)) };
    }
    return nextLoad(url, context);
  }
});
const { default: worker } = await import("./index.js");
hooks.deregister();

const godTarget = { id: 2, username: "god-fixture", role: "god", status: "active" };
const ownerTarget = { ...godTarget, username: "knightfall", role: "admin" };

function fixture(role, username = "staff-fixture", target = godTarget) {
  const writes = [];
  const env = {
    RESEND_API_KEY: "unused-fixture",
    PASSWORD_RESET_FROM: "unused-fixture",
    SESSIONS: {
      async get(key) {
        return key === "session:fixture" ? { user_id: 1, expires_at: Date.now() + 60000 } : null;
      }
    },
    DB: {
      prepare(sql) {
        const query = {
          bind: () => query,
          async first() {
            if (sql.includes("member_bot_creator_privileges")) return { id: 1, role, username, status: "active" };
            if (sql.includes("FROM site_settings")) return null;
            if (sql.includes("FROM users WHERE id=?")) return target;
            throw Error("Unexpected SQL: " + sql);
          },
          async all() {
            if (sql.includes("FROM vault_folders")) return { results: [] };
            if (sql.includes("display_name LIKE")) return { results: [target, { id: 3, role: "member", username: "member-fixture" }] };
            throw Error("Unexpected SQL: " + sql);
          },
          async run() {
            writes.push(sql);
            return {};
          }
        };
        return query;
      }
    }
  };
  function request(path, method = "GET", data = {}) {
    return worker.fetch(new Request("https://api.ash-fall.com" + path, {
      method,
      headers: { cookie: "knightfall_session=fixture", "content-type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(data)
    }), env);
  }
  return { request, writes };
}

test("both staff roles can read public Chaos Lab settings and update public personality", async () => {
  for (const role of ["admin", "god", "moderator", "member"]) {
    const { request, writes } = fixture(role);
    const allowed = role === "admin" || role === "god";
    for (const path of ["/api/admin/chaos-personality", "/api/admin/chaos-behavior"]) {
      assert.equal((await request(path)).status, allowed ? 200 : 403, role + " " + path);
    }
    const save = await request("/api/admin/chaos-personality", "PATCH", { chaos_wit: 75 });
    assert.equal(save.status, allowed ? 200 : 403, role);
    assert.equal(writes.some(sql => sql.startsWith("INSERT INTO site_settings")), allowed, role);
    const rollback = await request("/api/admin/chaos-behavior/rollback", "POST", { version_id: "missing" });
    assert.equal(rollback.status, allowed ? 404 : 403, role);
  }
});

test("private lab and vault keep their owner gate", async () => {
  for (const [role, username, expected] of [
    ["admin", "staff-fixture", 403],
    ["admin", "knightfall", 200],
    ["god", "god-fixture", 200],
    ["member", "member-fixture", 403]
  ]) {
    const { request } = fixture(role, username);
    assert.equal((await request("/api/admin/chaos-lab/config")).status, expected, role + " lab");
    assert.equal((await request("/api/vault/folders")).status, expected, role + " vault");
  }
});

test("ordinary admins cannot modify or recover owner and God accounts", async () => {
  for (const target of [godTarget, ownerTarget]) {
    const { request, writes } = fixture("admin", "staff-fixture", target);
    assert.equal((await request("/api/admin/users/2", "PATCH", { role: "member" })).status, 403);
    assert.equal((await request("/api/admin/users/2", "POST")).status, 403);
    assert.equal((await request("/api/admin/users/2/password-reset", "POST")).status, 403);
    assert.equal((await request("/api/moderation/users/2/password-reset", "POST")).status, 403);
    assert.deepEqual(writes, []);
    const result = await request("/api/moderation/users?q=fixture");
    assert.deepEqual((await result.json()).users.map(user => user.id), [3]);
  }
});
