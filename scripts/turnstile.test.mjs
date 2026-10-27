import test from "node:test";
import assert from "node:assert/strict";
import { checkTurnstile } from "../backend/src/turnstile.js";

const request = new Request("https://api.ash-fall.com/api/auth/register");
const enabled = { TURNSTILE_SECRET_KEY: "test-secret", TURNSTILE_SITE_KEY: "test-site" };

test("challenge is optional until both configuration values exist", async () => {
  assert.equal(await checkTurnstile({}, request, ""), true);
});

test("configured challenge rejects missing tokens without network access", async () => {
  assert.equal(await checkTurnstile(enabled, request, ""), false);
});

test("configured challenge fails closed when verification is unavailable", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("unavailable"); };
  try {
    assert.equal(await checkTurnstile(enabled, request, "fake-token"), false);
  } finally {
    globalThis.fetch = original;
  }
});

test("configured challenge accepts only successful approved-host verification", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, hostname: "ash-fall.com" }), { status: 200 });
  try {
    assert.equal(await checkTurnstile(enabled, request, "test-token"), true);
  } finally {
    globalThis.fetch = original;
  }
});
