import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {CHAOS_CANDIDATE_WORKFLOW,CHAOS_CANDIDATE_KIT_SCHEMA,makeChaosCandidateTestKit} from "../public/chaos-review-test-kit.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source_sha="a".repeat(40);
const example=()=>({path:"public/tiny-project.mjs",source_sha,
 candidate:"export const creature = '💚👹';\n"});
const digest=async(_,bytes)=>Uint8Array.from(createHash("sha256").update(bytes).digest()).buffer;
test("portable candidate kit roundtrips UTF-8 bytes with a real SHA-256 fingerprint",async()=>{
 const source=example();
 const kit=await makeChaosCandidateTestKit(source,{digest});
 assert.equal(kit.schema,CHAOS_CANDIDATE_KIT_SCHEMA);
 assert.equal(kit.workflow,CHAOS_CANDIDATE_WORKFLOW);
 assert.equal(kit.inputs.base_sha,source_sha);
 assert.equal(kit.inputs.path,source.path);
 assert.equal(Buffer.from(kit.inputs.candidate_base64,"base64").toString("utf8"),source.candidate);
 assert.equal(kit.inputs.candidate_sha256,
   createHash("sha256").update(source.candidate).digest("hex"));
 assert.equal(kit.inputs.run_targeted_tests,false);
 assert.match(kit.warning,/NOT an approval/);
 assert.match(kit.verification.result,/not an approved or deployed status/);
 assert.equal(Object.keys(kit.inputs).length,5);
 assert.ok(JSON.stringify(kit).length<12000);
});
test("reject malicious paths, stale-looking source IDs, oversized data and missing secure hash",async()=>{
 const fail=async(partial)=>assert.rejects(()=>makeChaosCandidateTestKit({...example(),...partial},{digest}));
 await fail({source_sha:"main"});
 await fail({source_sha:"f".repeat(39)});
 await fail({path:"backend/../public/fake.mjs"});
 await fail({path:"backend/credentials.js"});
 await fail({path:".github/workflows/deploy-api.yml"});
 await fail({path:"public//bad.js"});
 await fail({candidate:""});
 await fail({candidate:"\0"});
 await fail({candidate:"a".repeat(5001)});
 await fail({candidate:"a".repeat(301)});
 await fail({candidate:"a\n".repeat(81)});
 await fail({candidate:"bad\r\nline"});
 await assert.rejects(()=>makeChaosCandidateTestKit(example(),{digest:async()=>new Uint8Array(3).buffer}),/SHA-256/);
});
test("Code Studio prepares candidate test inputs ONLY after staging verified full-file source",()=>{
 const html=read("public/chaos-code-studio.html");
 const app=read("public/chaos-code-studio.js");
 const css=read("public/chaos-code-studio.css");
 const eye=read("public/chaos-dev-review-ui.mjs");
 for(const id of ["studio-candidate-build","studio-candidate-download","studio-candidate-copy",
                   "studio-candidate-field","studio-candidate-value","studio-candidate-status"]){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/id="studio-candidate-build" disabled/);
 assert.match(html,/id="studio-candidate-copy" disabled/);
 assert.match(html,/id="studio-candidate-download" disabled/);
 assert.match(html,/miss-chaos-candidate-check\.yml/);
 assert.match(app,/makeChaosCandidateTestKit\(proposal\)/);
 assert.match(app,/reviewSubmission=fullFile/);
 assert.match(app,/candidateBuild\.disabled=!reviewSubmission/);
 assert.match(app,/if\(code\.value!==reviewSubmission\.candidate\)/);
 assert.match(app,/candidateDownload\.addEventListener/);
 assert.match(app,/candidateField\.addEventListener\("change"/);
 assert.match(app,/candidateCopy\.addEventListener/);
 assert.match(app,/code\.addEventListener\("input"/);
 assert.match(app,/JSON\.stringify\(candidateKit,null,2\)/);
 assert.match(css,/\.studio-candidate-check/);
 assert.match(eye,/makeChaosCandidateTestKit\(\{/);
 assert.match(eye,/detail\.status==="pending"\|\|detail\.status==="approved"/);
 assert.match(eye,/prepareManualTests/);
 assert.match(eye,/Open manual candidate-check workflow/);
 assert.match(eye,/navigator\.clipboard/);
 assert.doesNotMatch(app,/fetch\([^\n]*miss-chaos-candidate-check/);
 assert.doesNotMatch(app,/localStorage|sessionStorage/);
});
