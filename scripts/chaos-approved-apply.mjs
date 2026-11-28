// Trusted integration job only: never execute candidate code in the write-capable job.
import {writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {validateSandboxRequest} from "./chaos-review-sandbox.mjs";
export function prepareApprovedApply(input,{root,checkoutSha,actor,owner,confirmation}={}){
 if(!actor||actor!==owner||confirmation!=="APPLY TO MAIN")throw Error("Explicit repository-owner authorization required.");
 const checked=validateSandboxRequest({...input,run_targeted_tests:true},{root,checkoutSha});
 // Validate all inputs before writing. The allowlisted test recipe is mandatory.
 if(!checked.tests.length)throw Error("No integration test recipe.");
 return checked;
}
function main(){
 const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
 const checkoutSha=execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();
 const input={base_sha:process.env.KF_REVIEW_BASE_SHA,path:process.env.KF_REVIEW_PATH,candidate_base64:process.env.KF_REVIEW_CANDIDATE_BASE64,candidate_sha256:process.env.KF_REVIEW_CANDIDATE_SHA256};
 const checked=prepareApprovedApply(input,{root,checkoutSha,actor:process.env.GITHUB_ACTOR,owner:process.env.GITHUB_REPOSITORY_OWNER,confirmation:process.env.KF_APPLY_CONFIRMATION});
 const clean=execFileSync("git",["status","--porcelain"],{cwd:root,encoding:"utf8"});if(clean.trim())throw Error("Integration checkout must be clean.");
 writeFileSync(resolve(root,checked.path),checked.candidate);
 execFileSync("git",["diff","--check","--",checked.path],{cwd:root,stdio:"inherit"});
 execFileSync("git",["add","--",checked.path],{cwd:root,stdio:"inherit"});
 execFileSync("git",["-c","core.hooksPath=/dev/null","-c","user.name=Knightfall approved integration","-c","user.email=41898282+github-actions[bot]@users.noreply.github.com","commit","-m","Apply owner-approved Miss Chaos candidate "+checked.candidate_sha256.slice(0,12),"--",checked.path],{cwd:root,stdio:"inherit"});
 // Non-force push fails if main advanced. No unreviewed merge/rebase.
 execFileSync("git",["push","origin","HEAD:refs/heads/main"],{cwd:root,stdio:"inherit"});
 console.log("Committed exact tested candidate to main. Deployment is a separate verification.");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
