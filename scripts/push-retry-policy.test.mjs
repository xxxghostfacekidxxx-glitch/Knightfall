import test from "node:test";
import assert from "node:assert/strict";
import { isTransientPushStatus, shouldRetryPushDelivery } from "../backend/src/push-retry-policy.js";

test("retry transient failures when no device accepted the push", () => {
  assert.equal(shouldRetryPushDelivery({attempted:2,accepted:0,failed:2,transient:2}),true);
});
test("never retry a partially accepted notification", () => {
  assert.equal(shouldRetryPushDelivery({attempted:2,accepted:1,failed:1,transient:1}),false);
});
test("do not retry permanent provider rejections", () => {
  assert.equal(shouldRetryPushDelivery({attempted:1,accepted:0,failed:1,transient:0}),false);
});
test("do not retry absent or expired subscriptions", () => {
  assert.equal(shouldRetryPushDelivery({attempted:0,accepted:0,failed:0,transient:0}),false);
  assert.equal(shouldRetryPushDelivery({attempted:1,accepted:0,expired:1,transient:0}),false);
});
test("unexpected missing delivery result is retryable", () => {
  assert.equal(shouldRetryPushDelivery(undefined),true);
});
test("retryable HTTP statuses are rate limits, timeouts, and server errors", () => {
  for (const status of [408,425,429,500,502,503,504]) assert.equal(isTransientPushStatus(status),true);
  for (const status of [400,401,403,404,410,422]) assert.equal(isTransientPushStatus(status),false);
});
