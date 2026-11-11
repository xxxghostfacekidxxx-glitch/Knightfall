import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { storeAuditUpload, readGodAuditSummary, verifyAuditUpload, AUDIT_REPORT_KEY } from "./developer-audit-ingest.js";
const secret = "test-secret-not-for-production-use-123456789012345";
const summary = {
  schemaVersion:1,tool:"knightfall-developer-arsenal",
  semgrep:{findings:2,severity:{ERROR:1,WARNING:1,INFO:0,UNKNOWN:0},scannerErrors:0},
  biome:{hasOutput:true,reportedErrors:3,reportedWarnings:4},
  excluded:"secret-material"
};
function fakeStorage(){
  const records=new Map();
  return {records, get:async(k,type)=>type==="json"?JSON.parse(records.get(k)||"null"):records.get(k)||null,
    put:async(k,v)=>{records.set(k,v)}};
}
function signed(payload,time=Date.now()){
  const body=JSON.stringify(payload), timestamp=String(time);
  const signature=createHmac("sha256",secret).update(timestamp+"."+body).digest("hex");
  return {body,timestamp,signature,now:time};
}
test("signed current report is stored once and sanitized for god",async()=>{
  const storage=fakeStorage(),env={SESSIONS:storage,DIAGNOSTICS_INGEST_KEY:secret};
  const signedData=signed({runId:12,sha:"a".repeat(40),summary});
  assert.equal((await storeAuditUpload({env,...signedData})).status,204);
  assert.ok(storage.records.has(AUDIT_REPORT_KEY));
  assert.equal((await storeAuditUpload({env,...signedData})).status,409);
  await assert.rejects(readGodAuditSummary({env,principal:{id:2,role:"admin"}}),/Not authorized/);
  const report=await readGodAuditSummary({env,principal:{id:1,role:"god"}});
  assert.equal(report.semgrep.findings,2);
  assert.doesNotMatch(JSON.stringify(report),/secret-material/);
});
test("bad signatures and expired requests fail closed",async()=>{
 const data=signed({runId:13,sha:"b".repeat(40),summary});
 assert.equal(await verifyAuditUpload({secret,...data}),true);
 assert.equal(await verifyAuditUpload({...data,secret,signature:"0".repeat(64)}),false);
 assert.equal(await verifyAuditUpload({...data,secret,now:data.now+360000}),false);
 const env={SESSIONS:fakeStorage(),DIAGNOSTICS_INGEST_KEY:secret};
 assert.equal((await storeAuditUpload({env,...data,signature:"0".repeat(64)})).status,401);
});
test("reject older runs and forged fields",async()=>{
 const env={SESSIONS:fakeStorage(),DIAGNOSTICS_INGEST_KEY:secret};
 assert.equal((await storeAuditUpload({env,...signed({runId:20,sha:"b".repeat(40),summary})})).status,204);
 assert.equal((await storeAuditUpload({env,...signed({runId:19,sha:"a".repeat(40),summary})})).status,409);
 assert.equal((await storeAuditUpload({env,...signed({runId:22,sha:"a".repeat(40),summary:{...summary,semgrep:{...summary.semgrep,findings:22}}})})).status,400);
});
