import test from "node:test";
import assert from "node:assert/strict";
import { handlePrivacyAssistance, PRIVACY_HELP_PREFIX } from "./privacy-assistance.js";

const origin = "https://ash-fall.com";
const endpoint = origin + "/api/privacy/deletion-assistance";
const json = (body, status = 200) => ({ body, status });

function fixture({ role = "member", notify = async () => {}, createdAt = new Date().toISOString() } = {}) {
  const values = new Map();
  const writes = [];
  const env = {
    SESSIONS: {
      async put(key, value, options) { values.set(key, JSON.parse(value)); writes.push({ key, options }); },
      async get(key) { return values.get(key) || null; },
      async list({ prefix, limit }) {
        const keys = [...values.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(name => ({ name }));
        return { keys, list_complete: true, cursor: null };
      }
    },
    DB: { prepare() { return { async all() { return { results: [{ id: 9 }] }; } }; } }
  };
  const deps = {
    getUser: async () => role ? { id: 7, role } : null,
    json,
    rateLimit: async () => true,
    isAdmin: user => ["admin", "god"].includes(user?.role),
    origin,
    createNotification: notify
  };
  return { env, deps, values, writes, createdAt };
}

function publicRequest(payload, { originHeader = origin, contentType = "application/json" } = {}) {
  return new Request(endpoint, {
    method: "POST",
    headers: { Origin: originHeader, "content-type": contentType },
    body: JSON.stringify(payload)
  });
}

test("public deletion assistance rejects cross-origin and non-JSON submissions", async () => {
  const f = fixture();
  const payload = { email: "person@example.com", acknowledged: true };
  assert.equal((await handlePrivacyAssistance(publicRequest(payload, { originHeader: "https://evil.example" }), f.env, new URL(endpoint), f.deps)).status, 403);
  assert.equal((await handlePrivacyAssistance(publicRequest(payload, { contentType: "text/plain" }), f.env, new URL(endpoint), f.deps)).status, 415);
  assert.equal(f.values.size, 0);
});

test("public request creates only an unverified, expiring assistance ticket", async () => {
  let notices = 0;
  const f = fixture({ notify: async () => { notices++; throw Error("notice unavailable"); } });
  const response = await handlePrivacyAssistance(publicRequest({
    email: " Person@Example.com ", username: "Some_Member", acknowledged: true
  }), f.env, new URL(endpoint), f.deps);
  assert.equal(response.status, 202);
  assert.match(response.body.message, /did not delete data|did not delete/i);
  assert.equal(f.values.size, 1);
  const [key, ticket] = [...f.values.entries()][0];
  assert.ok(key.startsWith(PRIVACY_HELP_PREFIX));
  assert.equal(ticket.email, "person@example.com");
  assert.equal(ticket.username_hint, "some_member");
  assert.equal(ticket.status, "pending");
  assert.equal(notices, 1, "staff notification failure is isolated from successful ticket creation");
  assert.ok(f.writes[0].options.expirationTtl > 0);
});

test("anonymous and ordinary members cannot list or edit assistance tickets", async () => {
  for (const role of [null, "member", "moderator"]) {
    const f = fixture({ role });
    const list = await handlePrivacyAssistance(new Request(origin + "/api/admin/privacy-assistance"), f.env, new URL(origin + "/api/admin/privacy-assistance"), f.deps);
    const edit = await handlePrivacyAssistance(new Request(origin + "/api/admin/privacy-assistance/0123456789abcdef0123456789abcdef", { method: "PATCH", body: JSON.stringify({ status: "closed", operator_note: "verified" }) }), f.env, new URL(origin + "/api/admin/privacy-assistance/0123456789abcdef0123456789abcdef"), f.deps);
    assert.equal(list.status, 403, String(role));
    assert.equal(edit.status, 403, String(role));
  }
});

test("staff cannot close an assistance ticket without an auditable note", async () => {
  const f = fixture({ role: "admin" });
  const id = "0123456789abcdef0123456789abcdef";
  const key = PRIVACY_HELP_PREFIX + id;
  f.values.set(key, { request_id: id, email: "person@example.com", status: "awaiting_verification", created_at: new Date().toISOString(), operator_note: "" });
  const response = await handlePrivacyAssistance(new Request(origin + "/api/admin/privacy-assistance/" + id, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "closed" })
  }), f.env, new URL(origin + "/api/admin/privacy-assistance/" + id), f.deps);
  assert.equal(response.status, 400);
  assert.equal(f.values.get(key).status, "awaiting_verification");
});

test("staff status edits preserve the original expiry and never claim deletion", async () => {
  const f = fixture({ role: "god" });
  const id = "0123456789abcdef0123456789abcdef";
  const key = PRIVACY_HELP_PREFIX + id;
  const createdAt = new Date(Date.now() - 60_000).toISOString();
  f.values.set(key, { request_id: id, email: "person@example.com", status: "pending", created_at: createdAt, operator_note: "Identity check started" });
  const response = await handlePrivacyAssistance(new Request(origin + "/api/admin/privacy-assistance/" + id, {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "closed", operator_note: "Contacted account recovery; no erasure performed." })
  }), f.env, new URL(origin + "/api/admin/privacy-assistance/" + id), f.deps);
  assert.equal(response.status, 200);
  assert.equal(f.values.get(key).status, "closed");
  assert.equal(f.writes.at(-1).options.expiration, Math.ceil((Date.parse(createdAt) + 90 * 24 * 60 * 60 * 1000) / 1000));
  assert.match(f.values.get(key).operator_note, /no erasure performed/);
});
