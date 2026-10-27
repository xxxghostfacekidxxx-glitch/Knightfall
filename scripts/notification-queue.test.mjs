import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../backend/src/index.js", import.meta.url), "utf8");
const config = JSON.parse(readFileSync(new URL("../backend/wrangler.jsonc", import.meta.url), "utf8"));

test("notification queue is opt-in with direct fallback", () => {
  assert.match(source, /if \(env\.NOTIFICATION_QUEUE\)/);
  assert.match(source, /env\.NOTIFICATION_QUEUE\.send\(/);
  assert.match(source, /await deliverPushToUser\(env,userId,notification\)/);
});

test("queue consumer is exported", () => {
  assert.match(source, /export default \{ async queue\(batch, env\)/);
  assert.match(source, /message\.retry\(\)/);
});

test("production Wrangler does not activate an unprovisioned queue", () => {
  assert.equal(config.queues, undefined);
});
