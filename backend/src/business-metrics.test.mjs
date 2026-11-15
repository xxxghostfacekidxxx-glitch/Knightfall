import test from "node:test";
import assert from "node:assert/strict";
import {handleBusinessMetrics} from "./business-metrics.js";

function mock(user, options={}) {
  const reads=[];
  const samples=[
    {accounts:12,active_accounts:10,registrations_30d:9,seen_30d:8},
    {threads:97,authors:4,threads_30d:96},
    {messages:140,senders:6},
    {score_records:40,players:3,recorded_games:32,score_reported_runs:67},
    {shops:0,shop_products:0,shop_order_records:0,active_premium_entitlements:0,creator_subscription_records:0}
  ];
  const env={DB:{prepare(sql){reads.push(sql);return {first:async()=>options.fail?null:samples[reads.length-1]}}}};
  const deps={requireUser:async()=>user,json:(data,status=200)=>new Response(JSON.stringify(data),{status}),origin:"https://ash-fall.com"};
  const call=(method="GET",path="/api/admin/business-metrics")=>
    handleBusinessMetrics(new Request("https://api.ash-fall.com"+path,{method}),env,new URL("https://api.ash-fall.com"+path),deps);
  return {call,reads};
}
test("business metrics do not expose data to anonymous or member accounts",async()=>{
  const anon=mock(null);
  assert.equal((await anon.call()).status,401);
  assert.equal(anon.reads.length,0);
  const member=mock({role:"member"});
  assert.equal((await member.call()).status,403);
  assert.equal(member.reads.length,0);
  const mod=mock({role:"moderator"});
  assert.equal((await mod.call()).status,403);
  assert.equal(mod.reads.length,0);
});
test("admin GET returns aggregate-only records with explicit data limitations",async()=>{
  const x=mock({role:"admin"});
  const res=await x.call();
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.metrics.members.accounts,12);
  assert.equal(data.metrics.messaging.senders,6);
  assert.equal(data.metrics.commerce.shop_order_records,0);
  assert.match(data.limitations,/test activity/);
  assert.equal(x.reads.length,5);
  assert.equal(JSON.stringify(data).includes("email"),false);
});
test("non-GET and unknown paths cannot query metrics",async()=>{
  const x=mock({role:"god"});
  assert.equal((await x.call("POST")).status,405);
  assert.equal(x.reads.length,0);
  assert.equal(await x.call("GET","/api/admin/business-metrics-extra"),null);
});
test("database errors fail closed rather than publishing guessed zeroes",async()=>{
  const x=mock({role:"god"},{fail:true});
  const r=await x.call();
  assert.equal(r.status,503);
  assert.deepEqual(Object.keys(await r.json()),["error"]);
});
