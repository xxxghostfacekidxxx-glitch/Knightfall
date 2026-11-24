import test from "node:test";
import assert from "node:assert/strict";
import { handleQuotaGuardian, quotaStatus, FREE_TIER_BUDGETS } from "./quota-guardian.js";

const url = new URL("https://api.ash-fall.com/api/admin/quota-guardian");
const db = { prepare(sql) {
  assert.match(sql, /request_rate_limits/);
  return { bind() { return { async first() { return { total: 3, expired: 1 }; } }; } };
}};
const env = { DB: db, SESSIONS: {}, AI: {} };
const json = (body, status) => ({ body, status });
const request = { method: "GET" };
const deps = role => ({ requireUser: async () => role ? { role } : null, json, origin: "https://ash-fall.com" });

test("GOD sees read-only diagnostics, not fabricated account usage", async () => {
  const result = await handleQuotaGuardian(request, env, url, deps("god"));
  assert.equal(result.status, 200);
  assert.equal(result.body.local_diagnostics.rate_limit_counter_rows, 3);
  assert.equal(result.body.local_diagnostics.expired_rate_limit_counter_rows, 1);
  assert.equal(result.body.provider_usage_available, false);
  assert.equal(result.body.free_tier_reference.kv_writes_daily, 1000);
});
test("ISIS, admins and anonymous users cannot access quota diagnostics", async () => {
  for (const role of ["admin", "moderator", "member", null]) {
    const result = await handleQuotaGuardian(request, env, url, deps(role));
    assert.equal(result.status, 403);
  }
});
test("route ignores other endpoints and rejects mutation", async () => {
  assert.equal(await handleQuotaGuardian(request, env, new URL("https://api.ash-fall.com/api/other"), deps("god")), null);
  assert.equal((await handleQuotaGuardian({ method: "POST" }, env, url, deps("god"))).status, 405);
});
test("quota status reports threshold correctly", () => {
  assert.equal(quotaStatus(49, 100), "healthy");
  assert.equal(quotaStatus(50, 100), "warning");
  assert.equal(quotaStatus(75, 100), "elevated");
  assert.equal(quotaStatus(90, 100), "critical");
  assert.equal(quotaStatus(100, 100), "exhausted");
  assert.equal(quotaStatus(null, FREE_TIER_BUDGETS.kv_writes_daily), "unknown");
});

test("dashboard exposes threshold bands without treating unavailable usage as zero", async () => {
  const result = await handleQuotaGuardian(request, env, url, deps("god"));
  assert.deepEqual(result.body.worker_request_budget, { status: "unknown", thresholds_percent: [50, 75, 90] });
});
