import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync("public/business-metrics-report.js","utf8");
const context={window:{}};
runInNewContext(source,context);
const toCsv=context.window.KnightfallBusinessReport.toCsv;
const good={
 generated_at:"2026-11-15T16:00:00Z",
 metrics:{
  members:{accounts:12,active_accounts:11,registrations_30d:9,seen_30d:8,member_role_accounts:8,active_member_role_accounts:7,member_role_seen_30d:5,member_role_registrations_30d:6,staff_role_accounts:4},
  forum:{threads:97,authors:4,member_role_authors:2,threads_30d:96},
  messaging:{messages:140,senders:6,member_role_senders:3},
  arcade:{score_records:40,players:3,member_role_players:1,recorded_games:32,score_reported_runs:67},
  commerce:{shops:0,shop_products:0,shop_order_records:0,active_premium_entitlements:0,creator_subscription_records:0}
 }
};
test("CSV reports only aggregate values with provenance and limitations",()=>{
 const csv=toCsv(good);
 assert.match(csv,/snapshot_utc/);
 assert.match(csv,/member_role_seen_30d/);
 assert.match(csv,/2026-11-15T16:00:00.000Z/);
 assert.match(csv,/test accounts/);
 assert.match(csv,/,"arcade","member_role_players","1","records",/);
 assert.match(csv,/,"commerce","shop_order_records","0","records",/);
 assert.doesNotMatch(csv,/username|email|password|private messages/i);
});
test("missing data and invalid values stop export rather than inventing zeroes",()=>{
 assert.throws(()=>toCsv(null),/verified/);
 assert.throws(()=>toCsv({...good,generated_at:"no"}),/timestamp/);
 assert.throws(()=>toCsv({...good,metrics:{...good.metrics,arcade:{players:3}}}),/score_records/);
 assert.throws(()=>toCsv({...good,metrics:{...good.metrics,commerce:{...good.metrics.commerce,shops:-1}}}),/shops/);
 assert.throws(()=>toCsv({...good,metrics:{...good.metrics,members:{...good.metrics.members,accounts:"12"}}}),/accounts/);
});
test("serialization module never calls a network API or writes storage",()=>{
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon/);
});
