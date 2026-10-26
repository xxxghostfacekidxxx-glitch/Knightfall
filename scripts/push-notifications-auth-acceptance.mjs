#!/usr/bin/env node
/**
 * Authenticated Web Push ownership acceptance test.
 *
 * Run only against a staging deployment with two disposable test accounts:
 *   PUSH_TEST_BASE_URL=https://staging.example
 *   PUSH_TEST_USER_A_COOKIE='knightfall_session=...'
 *   PUSH_TEST_USER_B_COOKIE='knightfall_session=...'
 *   PUSH_TEST_SUBSCRIPTION_JSON='{"endpoint":"https://...","keys":{"p256dh":"...","auth":"..."}}'
 *
 * The supplied subscription must belong to test user A. This script registers it,
 * proves anonymous access is rejected and user B cannot remove it, then cleans it
 * up as user A. It never prints cookies or subscription key material.
 */
import assert from "node:assert/strict";

const base = String(process.env.PUSH_TEST_BASE_URL || "").replace(/\/$/, "");
const cookieA = process.env.PUSH_TEST_USER_A_COOKIE;
const cookieB = process.env.PUSH_TEST_USER_B_COOKIE;
const rawSubscription = process.env.PUSH_TEST_SUBSCRIPTION_JSON;

if (!base || !cookieA || !cookieB || !rawSubscription) {
  console.error("Missing PUSH_TEST_BASE_URL, PUSH_TEST_USER_A_COOKIE, PUSH_TEST_USER_B_COOKIE, or PUSH_TEST_SUBSCRIPTION_JSON.");
  process.exit(2);
}
if (cookieA === cookieB) {
  console.error("User A and User B must be different authenticated sessions.");
  process.exit(2);
}

const subscription = JSON.parse(rawSubscription);
assert.equal(typeof subscription.endpoint, "string", "subscription endpoint is required");
assert.equal(typeof subscription.keys?.p256dh, "string", "subscription p256dh key is required");
assert.equal(typeof subscription.keys?.auth, "string", "subscription auth key is required");

async function request(path, { cookie, method = "GET", body } = {}) {
  const headers = { accept: "application/json" };
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error"
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* retain status for useful failure */ }
  return { status: response.status, data, text };
}
function pass(label) { console.log("PASS " + label); }
function assertUnauthorized(result, label) {
  assert.ok([401, 403].includes(result.status), label + ": expected 401/403, received " + result.status);
  pass(label);
}

let registered = false;
try {
  assertUnauthorized(await request("/api/push/subscriptions"), "anonymous subscription listing is rejected");
  assertUnauthorized(await request("/api/notification-preferences"), "anonymous preference access is rejected");
  assertUnauthorized(await request("/api/push/subscriptions", {
    method: "POST",
    body: { subscription }
  }), "anonymous subscription registration is rejected");

  const add = await request("/api/push/subscriptions", {
    cookie: cookieA,
    method: "POST",
    body: { subscription }
  });
  assert.ok([200, 201, 204].includes(add.status), "user A subscription registration failed with " + add.status);
  registered = true;
  pass("authenticated user A can register their subscription");

  const before = await request("/api/push/subscriptions", { cookie: cookieA });
  assert.equal(before.status, 200, "user A cannot list their own subscriptions");
  assert.ok(JSON.stringify(before.data).includes(subscription.endpoint), "user A subscription list did not include the registered endpoint");
  pass("user A can inspect their own registered subscription");

  const foreignDelete = await request("/api/push/subscriptions", {
    cookie: cookieB,
    method: "DELETE",
    body: { endpoint: subscription.endpoint }
  });
  assert.ok([200, 204, 400, 403, 404].includes(foreignDelete.status), "unexpected cross-account delete response " + foreignDelete.status);
  const after = await request("/api/push/subscriptions", { cookie: cookieA });
  assert.equal(after.status, 200, "user A subscription list failed after user B's attempt");
  assert.ok(JSON.stringify(after.data).includes(subscription.endpoint), "SECURITY FAILURE: user B's request removed or exposed user A's subscription");
  pass("user B cannot remove user A's subscription");

  const prefA = await request("/api/notification-preferences", { cookie: cookieA });
  const prefB = await request("/api/notification-preferences", { cookie: cookieB });
  assert.equal(prefA.status, 200, "user A preferences endpoint failed");
  assert.equal(prefB.status, 200, "user B preferences endpoint failed");
  assert.notEqual(JSON.stringify(prefA.data), JSON.stringify(null), "user A preferences response is empty");
  pass("authenticated accounts can access their own preference endpoint");
} finally {
  if (registered) {
    const cleanup = await request("/api/push/subscriptions", {
      cookie: cookieA,
      method: "DELETE",
      body: { endpoint: subscription.endpoint }
    });
    assert.ok([200, 204, 404].includes(cleanup.status), "cleanup failed with " + cleanup.status);
    pass("test subscription cleaned up by its owner");
  }
}

console.log("\nAuthenticated Web Push ownership acceptance checks passed.");
console.log("Note: this verifies API authorization, not actual device delivery. Confirm delivery separately with a real device while the site is backgrounded/closed.");
