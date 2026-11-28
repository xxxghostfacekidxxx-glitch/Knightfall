// Only predetermined public software research; no Cloudflare credentials or SQL access.
import {assignments,collectAssignment} from "../backend/src/chaos-knowledge-fleet.mjs";
const endpoint="https://api.ash-fall.com/api/internal/order66-research",hour=Math.floor(Date.now()/3600000),runId=Number(process.env.GITHUB_RUN_ID),sha=process.env.GITHUB_SHA;
if(process.env.GITHUB_REF!=="refs/heads/main"||!Number.isSafeInteger(runId)||runId<1||! /^[a-f0-9]{40}$/.test(sha||""))throw Error("Invalid CI identity");
const results=await Promise.all(assignments(hour*3600000).map(async a=>({key:a.key,...await collectAssignment(a)})));
const body=JSON.stringify({hour,runId,sha,results});if(Buffer.byteLength(body)>16384)throw Error("Upload too large");
const issue=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);issue.searchParams.set("audience",endpoint);
const response=await fetch(issue,{headers:{authorization:"Bearer "+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:"error",signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error("OIDC issue failed: "+response.status);
const token=(await response.json()).value;if(typeof token!=="string"||!token)throw Error("OIDC unavailable");
const upload=await fetch(endpoint,{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body,redirect:"error",signal:AbortSignal.timeout(25000)});
if(upload.status===409){console.log("Research paused or already accepted for this slot.");process.exit(0);}
if(!upload.ok)throw Error("Research upload rejected: HTTP "+upload.status);
const outcome=await upload.json();console.log(JSON.stringify({collected:results.map(x=>({key:x.key,source:x.source,count:x.records.length,error:x.error||null})),outcome}));
if(outcome.failed>0&&outcome.completed===0)process.exitCode=1;
