import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { deliverPasswordResetEmail, resetEmailConfigured } from "../backend/src/password-reset-email.js";

const backend = readFileSync(new URL("../backend/src/index.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../public/reset-password.html", import.meta.url), "utf8");

test("both password recovery email paths send fragment tokens", () => {
  const issued=(backend.match(/reset-password\.html#token=/g)||[]).length;
  assert.equal(issued,2,"normal and staff recovery links must use URL fragments");
  assert.doesNotMatch(backend,/reset-password\.html\?token=/);
});

test("password reset document blocks referrer leaks before external resources", () => {
  const referrer=page.indexOf('<meta name="referrer" content="no-referrer">');
  const stylesheet=page.indexOf('rel="stylesheet"');
  assert.ok(referrer>0 && referrer<stylesheet,
    "no-referrer policy must be parsed before stylesheet requests");
});

test("password reset client consumes fragment tokens and clears legacy query tokens", () => {
  assert.match(page,/fragment\.get\("token"\)/);
  assert.match(page,/params\.get\("token"\)/,"legacy reset links remain supported");
  assert.match(page,/params\.delete\("token"\)/);
  assert.match(page,/history\.replaceState\(/);
});

test("password reset reports a provider outage without disclosing account existence", () => {
  const start = backend.indexOf('if(url.pathname==="/api/auth/password-reset/request"');
  const end = backend.indexOf('if(url.pathname==="/api/auth/password-reset/complete"', start);
  assert.ok(start >= 0 && end > start);
  const requestHandler = backend.slice(start, end);
  assert.match(requestHandler, /if\(!resetEmailConfigured\(env\)\)return json\(\{error:/);
  assert.match(requestHandler, /temporarily unavailable/);
  assert.match(requestHandler, /,503,origin\)/);
});

test("both recovery paths use the same provider abstraction", () => {
  assert.equal((backend.match(/const sent=await deliverPasswordResetEmail\(env,/g)||[]).length, 2);
});

test("Cloudflare email binding sends recovery mail without a Resend API key", async () => {
  const messages=[];
  const env={
    PASSWORD_RESET_FROM:"Knightfall <accounts@ash-fall.com>",
    EMAIL:{async send(message){messages.push(message);return {messageId:"fixture-id"};}}
  };
  assert.equal(resetEmailConfigured(env),true);
  const result=await deliverPasswordResetEmail(env,{
    to:"member@example.test",subject:"Password reset",text:"Test recovery message",html:"<p>Test recovery message</p>"
  });
  assert.deepEqual(result,{ok:true,status:202});
  assert.equal(messages.length,1);
  assert.deepEqual(messages[0].from,{name:"Knightfall",email:"accounts@ash-fall.com"});
  assert.equal(messages[0].to,"member@example.test");
});

test("recovery provider configuration requires sender and a delivery channel", () => {
  assert.equal(resetEmailConfigured({PASSWORD_RESET_FROM:"accounts@ash-fall.com"}),false);
  assert.equal(resetEmailConfigured({EMAIL:{send(){}}}),false);
  assert.equal(resetEmailConfigured({PASSWORD_RESET_FROM:"accounts@ash-fall.com",RESEND_API_KEY:"fixture"}),true);
});

test("Resend recovery requests have a bounded network timeout", () => {
  const source = readFileSync(new URL("../backend/src/password-reset-email.js", import.meta.url), "utf8");
  assert.match(source, /signal:\s*AbortSignal\.timeout\(10000\)/);
});

test("Signup verification requests have a bounded network timeout", () => {
  const source = readFileSync(new URL("../backend/src/email-signup.js", import.meta.url), "utf8");
  assert.match(source, /signal:\s*AbortSignal\.timeout\(10000\)/);
});

test("Resend recovery sends only to intended recipient and never logs the reset link", async t => {
  const messages=[];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.method, "POST");
    assert.ok(options.signal);
    assert.match(options.headers.authorization, /^Bearer /);
    messages.push(JSON.parse(options.body));
    return new Response(null, { status: 202 });
  });
  const result=await deliverPasswordResetEmail({
    PASSWORD_RESET_FROM:"Knightfall <accounts@ash-fall.com>",
    RESEND_API_KEY:"test-only"
  }, {
    to:"member@example.test",
    subject:"Account recovery",
    text:"Use the recovery link.",
    html:"<p>Use the recovery link.</p>"
  });
  assert.deepEqual(result,{ok:true,status:202});
  assert.equal(messages.length,1);
  assert.deepEqual(messages[0].to,["member@example.test"]);
  assert.equal(messages[0].from,"Knightfall <accounts@ash-fall.com>");
});

test("Resend recovery rejects provider failures without throwing or exposing credentials", async t => {
  t.mock.method(globalThis,"fetch",async () => new Response(null,{status:429}));
  const result=await deliverPasswordResetEmail({
    PASSWORD_RESET_FROM:"accounts@ash-fall.com",
    RESEND_API_KEY:"test-only"
  },{to:"member@example.test",subject:"Recovery",text:"Recovery",html:"<p>Recovery</p>"});
  assert.deepEqual(result,{ok:false,status:429});
});

test("Resend recovery handles network outages without exposing reset contents", async t => {
  t.mock.method(globalThis,"fetch",async () => { throw new Error("simulated network outage"); });
  const result=await deliverPasswordResetEmail({
    PASSWORD_RESET_FROM:"accounts@ash-fall.com",
    RESEND_API_KEY:"test-only"
  },{to:"member@example.test",subject:"Recovery",text:"Sensitive reset URL",html:"<p>Sensitive reset URL</p>"});
  assert.deepEqual(result,{ok:false,status:502});
});
