import test from "node:test";
import assert from "node:assert/strict";
import { shouldRetryPushDelivery } from "../backend/src/push-retry-policy.js";

test("retry if every attempted push failed", () => {
  assert.equal(shouldRetryPushDelivery({attempted:2,accepted:0,failed:2,expired:0}),true);
});
test("do not retry if any push was accepted", () => {
  assert.equal(shouldRetryPushDelivery({attempted:2,accepted:1,failed:1,expired:0}),false);
});
test("do not retry when there are no subscriptions", () => {
  assert.equal(shouldRetryPushDelivery({attempted:0,accepted:0,failed:0,expired:0}),false);
});
test("do not retry expired-only subscriptions", () => {
  assert.equal(shouldRetryPushDelivery({attempted:1,accepted:0,failed:0,expired:1}),false);
});
test("retry unexpected missing delivery result", () => {
  assert.equal(shouldRetryPushDelivery(undefined),true);
});
