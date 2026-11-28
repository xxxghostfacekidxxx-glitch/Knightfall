import {appendFileSync} from "node:fs";
const endpoint="https://api.ash-fall.com/api/internal/chaos-integration";
const action=process.argv[2],runId=Number(process.env.GITHUB_RUN_ID),sha=process.env.GITHUB_SHA;
if(!["claim","report"].includes(action)||process.env.GITHUB_REF!=="refs/heads/main"||!Number.isSafeInteger(runId)||!/^[a-f0-9]{40}$/.test(sha||""))throw Error("Invalid runner identity");
const issue=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);issue.searchParams.set("audience",endpoint);
const auth=await fetch(issue,{headers:{authorization:"Bearer "+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:"error",signal:AbortSignal.timeout(10000)});
if(!auth.ok)throw Error("OIDC issuance unavailable");
const token=(await auth.json()).value;
const input={action,runId,sha,...(action==="report"?{id:process.env.KF_JOB_ID,outcome:process.env.KF_JOB_RESULT,commit:process.env.KF_JOB_COMMIT}: {})};
const res=await fetch(endpoint,{method:"POST",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify(input),redirect:"error",signal:AbortSignal.timeout(15000)});
if(!res.ok)throw Error("Queue API rejected: "+res.status);
const result=await res.json();
if(action==="report"){if(!result.ok)throw Error("Queue receipt not confirmed");console.log("Queue outcome recorded");}
else if(result.candidate){const c=result.candidate;
 if(!/^[a-f0-9-]{36}$/.test(c.id)||c.base_sha!==sha||!/^[a-zA-Z0-9_./-]+$/.test(c.path)||!/^[a-f0-9]{64}$/.test(c.candidate_sha256)||!/^[A-Za-z0-9+/=]+$/.test(c.candidate_base64))throw Error("Invalid queue candidate");
 for(const key of ["id","base_sha","path","candidate_base64","candidate_sha256"])appendFileSync(process.env.GITHUB_OUTPUT,key+"="+c[key]+"\n");
}else console.log("No eligible queued candidate");
