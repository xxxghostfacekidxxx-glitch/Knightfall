import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

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
