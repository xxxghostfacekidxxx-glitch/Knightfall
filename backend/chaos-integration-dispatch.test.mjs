import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {dispatchApprovedCandidate,INTEGRATION_PATHS} from "./src/chaos-integration-dispatch.mjs";
import {SANDBOX_TEST_RECIPES} from "../scripts/chaos-review-sandbox.mjs";
const candidate="export const value=2;\n";
const row={status:"approved",path:INTEGRATION_PATHS[0],source_sha:"a".repeat(40),candidate};
test("dispatch supports exactly the tested integration paths",()=>{assert.deepEqual([...INTEGRATION_PATHS].sort(),Object.keys(SANDBOX_TEST_RECIPES).sort());});
test("dispatch requires credential and approved exact candidate; sends no browser secret",async()=>{
 const env={CHAOS_INTEGRATION_TOKEN:"fixture-only"};
 const denied=async()=>{throw Error("Must not call GitHub");};
 await assert.rejects(dispatchApprovedCandidate({},row,{fetcher:denied}),/not configured/);
 await assert.rejects(dispatchApprovedCandidate(env,{...row,status:"pending"},{fetcher:denied}),/Approved candidate/);
 await assert.rejects(dispatchApprovedCandidate(env,{...row,path:".github/workflows/deploy.yml"},{fetcher:denied}),/Approved candidate/);
 const result=await dispatchApprovedCandidate(env,row,{fetcher:async(url,opts)=>{
  assert.equal(url,"https://api.github.com/repos/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-approved-integration.yml/dispatches");
  assert.equal(opts.method,"POST");assert.equal(opts.redirect,"error");
  assert.equal(opts.headers.authorization,"Bearer fixture-only");
  const {ref,inputs}=JSON.parse(opts.body);assert.equal(ref,"main");
  assert.equal(inputs.base_sha,row.source_sha);assert.equal(inputs.path,row.path);
  assert.equal(Buffer.from(inputs.candidate_base64,"base64").toString(),candidate);
  assert.equal(inputs.candidate_sha256,createHash("sha256").update(candidate).digest("hex"));
  assert.equal(inputs.confirmation,"APPLY TO MAIN");return new Response(null,{status:204});
 }});
 assert.equal(result.status,"dispatch_accepted");assert.doesNotMatch(JSON.stringify(result),/fixture-only/);
 await assert.rejects(dispatchApprovedCandidate(env,row,{fetcher:async()=>new Response(null,{status:403})}),/HTTP 403/);
});
