import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { beginEmailSignup, canSendVerification, finishEmailSignup, verificationDigest } from "./email-signup.js";

const signup = {
  username: "new-member",
  email: "fixture@example.test",
  displayName: "Fixture",
  passwordHash: "fixture-hash",
  returnTo: "/thread.html?id=7#reply-form"
};

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8"));
  sqlite.exec(readFileSync(new URL("../migrations/0129_pending_email_signups.sql", import.meta.url), "utf8"));
  return {
    sqlite,
    DB: {
      prepare(sql) {
        const bind = (...params) => ({
          first: () => sqlite.prepare(sql).get(...params),
          run: () => ({ meta: { changes: sqlite.prepare(sql).run(...params).changes } }),
          all: () => ({ results: sqlite.prepare(sql).all(...params) })
        });
        return { bind: (...params) => ({ ...bind(...params), sql }) };
      },
      async batch(queries) {
        sqlite.exec("BEGIN");
        try {
          const results = queries.map(query => query.sql.includes("RETURNING") ? query.all() : query.run());
          sqlite.exec("COMMIT");
          return results;
        } catch (error) {
          sqlite.exec("ROLLBACK");
          throw error;
        }
      }
    }
  };
}

test("verification requires both sender settings", () => {
  assert.equal(canSendVerification({}), false);
  assert.equal(canSendVerification({ RESEND_API_KEY: "fixture" }), false);
  assert.equal(canSendVerification({ RESEND_API_KEY: "fixture", PASSWORD_RESET_FROM: "accounts@example.test" }), true);
});

test("registration stores a token digest and consumes the proof exactly once", async t => {
  const { sqlite, DB } = database();
  const env = { DB, RESEND_API_KEY: "fixture", PASSWORD_RESET_FROM: "accounts@example.test" };
  let token;
  t.mock.method(globalThis, "fetch", async (url, request) => {
    assert.equal(url, "https://api.resend.com/emails");
    const email = JSON.parse(request.body);
    assert.deepEqual(email.to, [signup.email]);
    token = email.text.match(/\/verify-email\.html#token=([a-f0-9]{64})/)[1];
    return new Response(null, { status: 200 });
  });
  assert.equal(await beginEmailSignup(env, signup), true);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM users").get().count, 0);
  assert.equal(sqlite.prepare("SELECT token_hash FROM pending_email_signups").get().token_hash, await verificationDigest(token));

  const verifyPassword = (password, hash) => password === "chosen-password" && hash === "fixture-hash";
  assert.deepEqual(await finishEmailSignup(env, token, "wrong-password", verifyPassword), { status: "invalid" });
  const results = await Promise.all([
    finishEmailSignup(env, token, "chosen-password", verifyPassword),
    finishEmailSignup(env, token, "chosen-password", verifyPassword)
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), ["invalid", "verified"]);
  assert.equal(results.find(result => result.id).returnTo, signup.returnTo);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM users").get().count, 1);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM pending_email_signups").get().count, 0);
});

test("send failure clears the pending signup and expired links cannot create accounts", async t => {
  const { sqlite, DB } = database();
  const env = { DB };
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  assert.equal(await beginEmailSignup(env, signup), false);
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM pending_email_signups").get().count, 0);
  let token;
  fetch.mock.mockImplementation(async (_url, request) => {
    token = JSON.parse(request.body).text.match(/#token=([a-f0-9]{64})/)[1];
    return new Response(null, { status: 200 });
  });
  assert.equal(await beginEmailSignup(env, signup), true);
  sqlite.exec("UPDATE pending_email_signups SET expires_at=0");
  assert.deepEqual(await finishEmailSignup(env, token, "chosen-password", () => true), { status: "invalid" });
  assert.equal(sqlite.prepare("SELECT count(*) AS count FROM users").get().count, 0);
});
