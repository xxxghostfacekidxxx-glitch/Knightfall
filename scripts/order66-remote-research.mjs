// Only predetermined public software research; no Cloudflare credentials or SQL access.
import {assignments,collectAssignment,RESEARCH_SLOT_MS} from "../backend/src/chaos-knowledge-fleet.mjs";
import {verifyGitHubAuditToken} from "../backend/src/developer-audit-oidc.js";
const endpoint="https://api.ash-fall.com/api/internal/order66-research",hour=Math.floor(Date.now()/RESEARCH_SLOT_MS),runId=Number(process.env.GITHUB_RUN_ID),sha=process.env.GITHUB_SHA;
if(process.env.GITHUB_REF!=="refs/heads/main"||!Number.isSafeInteger(runId)||runId<1||! /^[a-f0-9]{40}$/.test(sha||""))throw Error("Invalid CI identity");
const issue=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);issue.searchParams.set("audience",endpoint);
const response=await fetch(issue,{headers:{authorization:"Bearer "+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:"error",signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error("OIDC issue failed: "+response.status);
const token=(await response.json()).value;if(typeof token!=="string"||!token)throw Error("OIDC unavailable");
const claims=JSON.parse(Buffer.from(token.split(".")[1],"base64url").toString("utf8"));const repo=process.env.GITHUB_REPOSITORY;console.log("OIDC expected checks (booleans only): "+JSON.stringify({audience:claims.aud===endpoint,issuer:claims.iss==="https://token.actions.githubusercontent.com",repository:claims.repository===repo,repositoryId:String(claims.repository_id)==="1301740258",workflow:claims.workflow_ref===repo+"/.github/workflows/order66-research-fallback.yml@refs/heads/main",ref:claims.ref==="refs/heads/main",subject:["repo:"+repo+":ref:refs/heads/main","repo:xxxghostfacekidxxx-glitch@252952996/Knightfall@1301740258:ref:refs/heads/main"].includes(claims.sub),event:["push","workflow_dispatch","schedule","workflow_run"].includes(claims.event_name),run:String(claims.run_id)===String(runId),sha:claims.sha===sha,localSignature:await verifyGitHubAuditToken({token,runId,sha,purpose:"order66"})}));
const preflight=await fetch(endpoint+"?"+new URLSearchParams({hour:String(hour),runId:String(runId),sha}),{headers:{authorization:"Bearer "+token},redirect:"error",signal:AbortSignal.timeout(15000)});
if(!preflight.ok)throw Error("Research preflight rejected: HTTP "+preflight.status);
const plan=await preflight.json();if(plan.collect!==true){console.log("No source requests needed: "+String(plan.reason));process.exit(0);}
const results=await Promise.all(assignments(hour*RESEARCH_SLOT_MS).map(async a=>({key:a.key,query:a.query,...await collectAssignment(a)})));
const body=JSON.stringify({hour,runId,sha,results});if(Buffer.byteLength(body)>16384)throw Error("Upload too large");
const upload=await fetch(endpoint,{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body,redirect:"error",signal:AbortSignal.timeout(25000)});
if(upload.status===409){console.log("Research paused or already accepted for this slot.");process.exit(0);}
if(!upload.ok)throw Error("Research upload rejected: HTTP "+upload.status);
const outcome=await upload.json();console.log(JSON.stringify({collected:results.map(x=>({key:x.key,source:x.source,count:x.records.length,error:x.error||null})),outcome}));
if(outcome.failed>0&&outcome.completed===0)process.exitCode=1;
