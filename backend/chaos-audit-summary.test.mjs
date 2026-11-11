import test from "node:test";
import assert from "node:assert/strict";
import {createChaosAuditSummaryHandler,normalizeChaosAuditSummary} from "./chaos-audit-summary.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
const fixture = {
  schemaVersion: 1, tool: "knightfall-developer-arsenal",
  semgrep: {findings:2,severity:{ERROR:1,WARNING:1,INFO:0,UNKNOWN:0},scannerErrors:0},
  biome:{hasOutput:true,reportedErrors:2,reportedWarnings:3},
  leak: "DO_NOT_LEAK", path:"secrets/config.js"
};
const principal = {id:"owner",role:"god"};
test("summary strips extraneous data",()=>{
  const clean=normalizeChaosAuditSummary(fixture);
  assert.equal(clean.semgrep.findings,2);
  assert.doesNotMatch(JSON.stringify(clean),/DO_NOT_LEAK|secrets\/config/);
});
test("rejects invalid counts and inconsistent aggregates",()=>{
  assert.throws(()=>normalizeChaosAuditSummary({...fixture,semgrep:{...fixture.semgrep,findings:5}}),/Inconsistent/);
  assert.throws(()=>normalizeChaosAuditSummary({...fixture,semgrep:{...fixture.semgrep,scannerErrors:-1}}),/Invalid/);
});
test("God capability requires a trusted handler and verified principal",async()=>{
  const handler=createChaosAuditSummaryHandler({loadReport:async()=>fixture});
  const handlers={"god.audit_summary":handler};
  assert.ok(describeChaosTools(principal).includes("god.audit_summary"));
  assert.ok(!describeChaosTools({id:"member",role:"user"}).includes("god.audit_summary"));
  await assert.rejects(dispatchChaosTool({name:"god.audit_summary",input:{},principal:{id:"member",role:"user"},handlers}),/Not authorized/);
  await assert.rejects(dispatchChaosTool({name:"god.audit_summary",input:{},principal,handlers:{}}),/not configured/);
  const result=await dispatchChaosTool({name:"god.audit_summary",input:{},principal,handlers});
  assert.equal(result.semgrep.severity.ERROR,1);
  assert.doesNotMatch(JSON.stringify(result),/DO_NOT_LEAK/);
});
test("loader not provided is rejected",()=>{
  assert.throws(()=>createChaosAuditSummaryHandler({}),/Trusted audit report loader/);
});
