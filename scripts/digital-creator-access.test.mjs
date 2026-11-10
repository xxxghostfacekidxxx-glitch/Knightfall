// Require server-owned Digital Creator grants rather than hard-coded account IDs.
// This does not give ordinary creators administrator access to release assets.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = readFileSync(new URL("../public/devil-tools.html", import.meta.url), "utf8");
const backend = readFileSync(new URL("../backend/src/index.js", import.meta.url), "utf8");

test("workshop access follows authenticated server title, not one account ID", () => {
  assert.match(tools, /String\(user\.public_title\s*\|\|\s*''\)\.trim\(\)\s*===\s*'Digital Creator'/);
  assert.doesNotMatch(tools, /const digitalCreator\s*=\s*Number\(user\.id\)/);
  assert.match(backend, /AS public_title FROM users WHERE id = \?/);
  assert.match(tools, /const administrator = isGod \|\|/);
});
test("asset publication remains administrator-only and creator handoff stays available", () => {
  assert.match(backend, /Administrator access required to publish game assets\./);
  assert.match(tools, /id="creator-handoff"/);
  assert.match(tools, /if \(!administrator && !digitalCreator\)/);
});
