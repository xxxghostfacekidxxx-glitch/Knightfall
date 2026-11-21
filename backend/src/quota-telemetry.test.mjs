import test from "node:test";
import assert from "node:assert/strict";
import { readWorkerTraffic } from "./quota-telemetry.js";

test("unconfigured analytics never calls provider", async () => {
 const r = await readWorkerTraffic({}, Date.now(), () => { throw Error("unexpected request"); });
 assert.equal(r.available, false);
});
test("configured analytics uses server token, account scope, and UTC day", async () => {
 let request;
 const env = { CLOUDFLARE_ANALYTICS_TOKEN: "private-test-token", CLOUDFLARE_ACCOUNT_ID: "account-test" };
 const r = await readWorkerTraffic(env, Date.UTC(2026,10,21,20,0,0), async (url,options) => {
  request={url,options};
  return { ok:true, async json(){return {data:{viewer:{accounts:[{workersInvocationsAdaptive:[{sum:{requests:42,errors:2,subrequests:9}}]}]}}};} };
 });
 assert.equal(r.available,true);
 assert.equal(r.requests,42);
 assert.equal(r.errors,2);
 assert.equal(r.period_start,"2026-11-21T00:00:00.000Z");
 assert.equal(request.url,"https://api.cloudflare.com/client/v4/graphql");
 assert.equal(request.options.headers.Authorization,"Bearer private-test-token");
 assert.equal(JSON.parse(request.options.body).variables.script,"knightfall-api");
 assert.doesNotMatch(JSON.stringify(r),/private-test-token|account-test/);
});
