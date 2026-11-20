import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {join,dirname} from "node:path";
import {tmpdir} from "node:os";
import {decodeSandboxCandidate,validateSandboxRequest,runSandboxChecks,SANDBOX_TEST_RECIPES} from "./chaos-review-sandbox.mjs";
const ROOT=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,ROOT),"utf8");
const sha="a".repeat(40);
const encode=text=>Buffer.from(text,"utf8").toString("base64");
const hash=text=>createHash("sha256").update(Buffer.from(text,"utf8")).digest("hex");
function fixture(path="public/example.mjs",original="export const value = 1;\n"){
 const root=mkdtempSync(join(tmpdir(),"kf-candidate-test-"));
 const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,original);
 const cleanup=()=>rmSync(root,{recursive:true,force:true});
 const candidate="export const value = 2;\n";
 const input={base_sha:sha,path,candidate_base64:encode(candidate),candidate_sha256:hash(candidate),run_targeted_tests:false};
 return {root,path,target,input,original,candidate,cleanup};
}
test("canonical Base64 permits UTF-8 and rejects malformed, oversize or invalid byte payloads",()=>{
 const utf8="export const tiny = '🖤💚';\n";
 assert.equal(decodeSandboxCandidate(encode(utf8)).text,utf8);
 assert.equal(decodeSandboxCandidate(encode(utf8)).sha256,hash(utf8));
 for(const bad of ["", "AAAA\n", "a===", "??==", "AAAA==", "x".repeat(9000)]){
  assert.throws(()=>decodeSandboxCandidate(bad));
 }
 assert.throws(()=>decodeSandboxCandidate(Buffer.from([0xff,0xfe]).toString("base64")),/UTF-8/);
 assert.throws(()=>decodeSandboxCandidate(encode("A".repeat(5001))),/5 KB/);
 assert.throws(()=>decodeSandboxCandidate(encode("a\n".repeat(81))),/80/);
 assert.throws(()=>decodeSandboxCandidate(encode("a".repeat(301))),/300/);
});
test("standalone static check uses a pinned checkout, parses but never executes candidate",()=>{
 const x=fixture("public/example.js");
 try{
  const validated=validateSandboxRequest(x.input,{checkoutSha:sha,root:x.root});
  assert.equal(validated.original_sha256,hash(x.original));
  assert.equal(validated.candidate_sha256,hash(x.candidate));
  const result=runSandboxChecks(x.input,{checkoutSha:sha,root:x.root});
  assert.equal(result.status,"passed",result.error);
  assert.match(result.static_check,/Node --check/);
  assert.equal(result.targeted_tests,"skipped_by_explicit_choice");
  assert.equal(result.approval_status,"not_verified_by_this_workflow");
  assert.equal(result.integrated,false);
  assert.equal(result.deployed,false);
  assert.equal(readFileSync(x.target,"utf8"),x.original);
 }finally{x.cleanup();}
});
test("static check rejects invalid JavaScript rather than returning a fake test pass",()=>{
 const x=fixture();
 try{
  const candidate="export const broken = ;\n";
  x.input.candidate_base64=encode(candidate);x.input.candidate_sha256=hash(candidate);
  const result=runSandboxChecks(x.input,{checkoutSha:sha,root:x.root});
  assert.equal(result.status,"failed");
  assert.match(result.error,/syntax check failed/);
  assert.equal(readFileSync(x.target,"utf8"),x.original);
 }finally{x.cleanup();}
});
test("tampered digest, stale source SHA, traversal and unsupported opt-in tests fail closed",()=>{
 const x=fixture("public/example.mjs");
 try{
  const check=(override,checkoutSha=sha)=>runSandboxChecks({...x.input,...override},{checkoutSha,root:x.root});
  assert.match(check({candidate_sha256:"b".repeat(64)}).error,/mismatch/);
  assert.match(check({base_sha:"b".repeat(40)}).error,/exact checked-out/);
  assert.match(check({}, "b".repeat(40)).error,/exact checked-out/);
  assert.match(check({path:"public/../backend/secret.js"}).error,/allowlisted/);
  assert.match(check({path:"backend/credentials.js"}).error,/allowlisted/);
  assert.match(check({path:".github/workflows/deploy-api.yml"}).error,/allowlisted/);
  assert.match(check({run_targeted_tests:"true"}).error,/explicit true\/false/);
  assert.match(check({run_targeted_tests:true}).error,/No approved isolated test recipe/);
  assert.equal(readFileSync(x.target,"utf8"),x.original);
 }finally{x.cleanup();}
});
test("explicit allowlisted candidate test recipes execute only on temporary file overlay, then restore",()=>{
 const x=fixture("public/miss-chaos-guide-core.mjs");
 let sawOverlay=false,calls=0;
 try{
  x.input.run_targeted_tests=true;
  const pass=runSandboxChecks(x.input,{checkoutSha:sha,root:x.root,
    runTargeted:(tests,root)=>{
      calls++;
      assert.deepEqual(tests,["scripts/miss-chaos-guide.test.mjs"]);
      sawOverlay=readFileSync(join(root,x.path),"utf8")===x.candidate;
      return {status:0,stdout:"1..3\n# pass 3\n"};
    }});
  assert.equal(sawOverlay,true);
  assert.equal(pass.status,"passed",pass.error);
  assert.equal(pass.targeted_tests,"passed");
  assert.equal(pass.source_restored,true);
  assert.equal(readFileSync(x.target,"utf8"),x.original);
  const fail=runSandboxChecks(x.input,{checkoutSha:sha,root:x.root,
    runTargeted:()=>({status:1,stderr:"A real targeted regression failed."})});
  assert.equal(fail.status,"failed");
  assert.equal(fail.targeted_tests,"failed");
  assert.equal(fail.source_restored,true);
  assert.match(fail.error,/targeted test failed/);
  assert.equal(readFileSync(x.target,"utf8"),x.original);
  assert.equal(calls,1);
 }finally{x.cleanup();}
});
test("fixed recipes refer to existing tests; no arbitrary test path or command input",()=>{
 assert.ok(Object.keys(SANDBOX_TEST_RECIPES).length>=5);
 for(const [path,tests] of Object.entries(SANDBOX_TEST_RECIPES)){
  assert.match(path,/^(?:public|backend)\//);
  assert.ok(tests.length>0);
  for(const target of tests){
   assert.match(target,/^scripts\/[a-z0-9-]+\.test\.mjs$/);
   assert.ok(read(target).includes("node:test"));
  }
 }
});
test("Actions workflow never runs on push and cannot write repo or deploy",()=>{
 const workflow=read(".github/workflows/miss-chaos-candidate-check.yml");
 const runner=read("scripts/chaos-review-sandbox.mjs");
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\n\s+(?:push|pull_request|schedule):/);
 assert.match(workflow,/permissions:\n\s+contents: read/);
 assert.match(workflow,/persist-credentials: false/);
 assert.match(workflow,/if: github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/run_targeted_tests:[\s\S]*?default: false/);
 assert.match(workflow,/npm install --prefix backend --ignore-scripts/);
 assert.match(workflow,/node scripts\/chaos-review-sandbox\.mjs/);
 assert.doesNotMatch(workflow,/secrets\.|wrangler\s+deploy|git\s+push|workflow_dispatch.*curl/);
 assert.match(runner,/candidate_sha256/);
 assert.match(runner,/source_restored=true/);
 assert.match(runner,/const env=\{PATH:/);
 assert.match(runner,/integrated:false,deployed:false/);
});
