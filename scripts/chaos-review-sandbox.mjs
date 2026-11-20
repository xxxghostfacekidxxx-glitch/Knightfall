/**
 * Knightfall / Miss Chaos: deliberately manual candidate-test runner.
 *
 * Runs ONLY in a manually dispatched, credential-minimized GitHub Actions job.
 * No Worker/D1 access, no GitHub write, no PR/branch, no production secrets.
 * Dynamic tests are opt-in AND available only for these pinned test recipes.
 *
 * A successful check is candidate evidence, NOT approval, merging or deployment.
 */
import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname,extname} from "node:path";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
const SHA40=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;
const VALID_PATH=/^(?:public|backend)\/[A-Za-z0-9_./-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json)$/;
const UNSAFE_PART=/(?:^|\/)(?:\.{1,2}|node_modules|dist|coverage|secrets?|private-keys|credentials)(?:\/|$)|(?:^|[-_.\/])(?:passwords?|credentials?|api[-_]?keys?|access[-_]?tokens?)(?:[-_.\/]|$)/i;
const MAX_CODE_BYTES=5000,MAX_CODE_LINES=80,MAX_LINE_LENGTH=300;
const hex=buffer=>createHash("sha256").update(buffer).digest("hex");
export const SANDBOX_TEST_RECIPES=Object.freeze({
 "public/miss-chaos-guide-core.mjs":Object.freeze(["scripts/miss-chaos-guide.test.mjs"]),
 "public/chaos-visual-effects.mjs":Object.freeze(["scripts/chaos-visual-effects.test.mjs"]),
 "public/chaos-review-test-kit.mjs":Object.freeze(["scripts/chaos-review-test-kit.test.mjs"]),
 "backend/chaos-public-tools.mjs":Object.freeze(["scripts/miss-chaos-site-index.test.mjs"]),
 "public/chaos-crucible-core.mjs":Object.freeze(["scripts/chaos-crucible.test.mjs","scripts/chaos-crucible-progress.test.mjs"]),
 "public/chaos-crucible-progress.mjs":Object.freeze(["scripts/chaos-crucible-progress.test.mjs"]),
 "public/chaos-crucible-shelf.mjs":Object.freeze(["scripts/chaos-crucible-shelf.test.mjs"])
});
export function decodeSandboxCandidate(base64){
 if(typeof base64!=="string"||base64.length<4||base64.length>7000||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))
   throw Error("Provide canonical Base64 candidate text, no whitespace, at most 5 KB decoded.");
 const data=Buffer.from(base64,"base64");
 if(data.toString("base64")!==base64||data.length<1||data.length>MAX_CODE_BYTES)
   throw Error("Candidate is malformed or larger than 5 KB.");
 let text;
 try{text=new TextDecoder("utf-8",{fatal:true}).decode(data);}
 catch{throw Error("Candidate must be valid UTF-8 source text.");}
 if(!text.trim()||text.includes("\r")||text.includes("\0")||
    text.split("\n").length>MAX_CODE_LINES||
    text.split("\n").some(line=>line.length>MAX_LINE_LENGTH))
   throw Error("Candidate must have 1–80 LF-only text lines, none longer than 300 characters.");
 return {bytes:data,text,sha256:hex(data)};
}
export function validateSandboxRequest(input,{checkoutSha,root}={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Missing test request.");
 const base=String(input.base_sha||""),path=String(input.path||"");
 if(!SHA40.test(base)||!SHA40.test(checkoutSha||"")||base!==checkoutSha)
   throw Error("Source base SHA must equal the exact checked-out main commit. Dispatch again from current main.");
 if(path.length<5||path.length>190||!VALID_PATH.test(path)||UNSAFE_PART.test(path)||
    path.includes("..")||path.includes("//")||path.includes("\\"))
   throw Error("Only allowlisted public/ or backend/ source paths are accepted.");
 if(!SHA256.test(input.candidate_sha256||""))throw Error("A 64-character candidate SHA-256 is required.");
 const decoded=decodeSandboxCandidate(input.candidate_base64);
 if(decoded.sha256!==input.candidate_sha256)
   throw Error("Candidate SHA-256 mismatch. Do not run an altered review file.");
 if(input.run_targeted_tests!==true&&input.run_targeted_tests!==false)
   throw Error("Choose an explicit true/false test execution mode.");
 const original=readFileSync(resolve(root,path));
 if(original.length<1||original.length>MAX_CODE_BYTES)
   throw Error("Original complete source must be 1–5 KB for the supervised review path.");
 const originalText=new TextDecoder("utf-8",{fatal:true}).decode(original);
 if(!originalText.trim()||originalText.includes("\r")||
    originalText.split("\n").length>MAX_CODE_LINES||
    originalText.split("\n").some(line=>line.length>MAX_LINE_LENGTH))
   throw Error("Original file does not meet the complete-source review constraints.");
 if(original.equals(decoded.bytes))throw Error("No changes to test.");
 const tests=SANDBOX_TEST_RECIPES[path]||[];
 if(input.run_targeted_tests&&tests.length===0)
   throw Error("No approved isolated test recipe exists for this path. Use static validation only.");
 return {base_sha:base,path,original,original_sha256:hex(original),
   candidate:decoded.bytes,candidate_sha256:decoded.sha256,run_targeted_tests:input.run_targeted_tests,
   tests};
}
function parserCheck(candidate,path,root){
 const extension=extname(path).toLowerCase();
 if(extension===".json"){JSON.parse(candidate.toString("utf8"));return {method:"JSON.parse",valid:true};}
 if([".ts",".tsx",".jsx"].includes(extension)){
   const requireBackend=createRequire(resolve(root,"backend/package.json"));
   const parser=requireBackend("@babel/parser");
   parser.parse(candidate.toString("utf8"),{sourceType:"module",
     plugins:extension===".tsx"?["typescript","jsx"]:extension===".ts"?["typescript"]:["jsx"]});
   return {method:"Babel parser (non-executing)",valid:true};
 }
 if([".js",".mjs",".cjs"].includes(extension)){
   const dir=mkdtempSync(join(tmpdir(),"kf-chaos-syntax-"));
   try{
     // The temporary folder is outside backend/package.json (type: module).
     // Treat regular .js as ESM for syntax-only validation; .cjs stays CommonJS.
     const target=join(dir,"candidate"+(extension===".js"?".mjs":extension));
     writeFileSync(target,candidate,{flag:"wx",mode:0o600});
     const result=spawnSync(process.execPath,["--check",target],{
       encoding:"utf8",timeout:20000,
       env:{PATH:process.env.PATH||"/usr/bin",HOME:dir,TMPDIR:dir}
     });
     if(result.error||result.status!==0)
       throw Error("Node syntax check failed: "+String(result.stderr||result.error||"unknown").slice(0,700));
     return {method:"Node --check (non-executing)",valid:true};
   }finally{rmSync(dir,{recursive:true,force:true});}
 }
 throw Error("No supported static syntax checker for this extension.");
}
export function runSandboxChecks(input,{checkoutSha,root,runTargeted}={}){
 const report={
   schema:"knightfall.miss-chaos.candidate-tests.v1",
   approval_status:"not_verified_by_this_workflow",
   integrated:false,deployed:false,ci_for_main_not_proven:true,
   checked_at:new Date().toISOString(),mode:"manual_opt_in",
   source_sha:String(input?.base_sha||""),path:String(input?.path||""),
   static_check:"not_run",targeted_tests:"not_run",status:"failed"
 };
 try{
   const approved=validateSandboxRequest(input,{checkoutSha,root});
   report.source_sha=approved.base_sha;
   report.path=approved.path;
   report.original_sha256=approved.original_sha256;
   report.candidate_sha256=approved.candidate_sha256;
   report.test_recipe=approved.tests;
   const checked=parserCheck(approved.candidate,approved.path,root);
   report.static_check=checked.method+" PASS";
   report.targeted_tests=approved.run_targeted_tests?"pending":"skipped_by_explicit_choice";
   if(approved.run_targeted_tests){
     const originalPath=resolve(root,approved.path);
     let succeeded=false;
     try{
       // Only this disposable checkout is edited; never a GitHub branch, Worker, or D1.
       writeFileSync(originalPath,approved.candidate);
       const result=(runTargeted||defaultTargetedRunner)(approved.tests,root);
       const outcome=typeof result==="object"&&result!==null?result:{status:1,stderr:"Invalid runner response"};
       report.targeted_tests=outcome.status===0?"passed":"failed";
       report.test_exit_status=outcome.status;
       report.test_output=String(outcome.stdout||"").slice(-3200);
       report.test_error=String(outcome.stderr||outcome.error||"").slice(-1800);
       if(outcome.status!==0)throw Error("At least one targeted test failed. Candidate was NOT integrated.");
       succeeded=true;
     }finally{
       writeFileSync(originalPath,approved.original);
       report.source_restored=true;
     }
     if(!succeeded)throw Error("Targeted test execution did not complete.");
   }
   report.status="passed";
   report.notice=approved.run_targeted_tests
     ?"Selected pinned tests passed on a disposable candidate overlay. Review approval and deployment remain UNVERIFIED."
     :"Static parsing passed only. No candidate behavior tests, approval, integration or deployment.";
 }catch(error){
   report.status="failed";
   report.error=String(error?.message||error||"Candidate check failed.").slice(0,800);
 }
 return report;
}
function defaultTargetedRunner(tests,root){
 // No GITHUB_TOKEN, cloud credentials, action runtime tokens or reviewer data
 // passed into the child Node test process. Repo scripts are predetermined.
 const env={PATH:process.env.PATH||"/usr/bin",HOME:tmpdir(),
   TMPDIR:tmpdir(),LANG:"C.UTF-8",NODE_ENV:"test",CI:"true"};
 return spawnSync(process.execPath,["--test",...tests],{
   cwd:root,env,encoding:"utf8",timeout:85000,maxBuffer:3*1024*1024
 });
}
async function main(){
 const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
 const input={
   base_sha:process.env.KF_REVIEW_BASE_SHA,
   path:process.env.KF_REVIEW_PATH,
   candidate_base64:process.env.KF_REVIEW_CANDIDATE_BASE64,
   candidate_sha256:process.env.KF_REVIEW_CANDIDATE_SHA256,
   run_targeted_tests:process.env.KF_REVIEW_RUN_TESTS==="true"
 };
 const report=runSandboxChecks(input,{checkoutSha:process.env.GITHUB_SHA,root});
 const artifact=resolve(root,"artifacts/chaos-review-sandbox.json");
 mkdirSync(dirname(artifact),{recursive:true});
 writeFileSync(artifact,JSON.stringify(report,null,2)+"\n",{mode:0o600});
 process.stdout.write("Miss Chaos candidate sandbox "+report.status.toUpperCase()+"\n"+
   JSON.stringify({path:report.path,source_sha:report.source_sha,
     candidate_sha256:report.candidate_sha256,static_check:report.static_check,
     targeted_tests:report.targeted_tests,integrated:report.integrated,
     deployed:report.deployed,error:report.error||null},null,2)+"\n");
 if(report.status!=="passed")process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))void main();
