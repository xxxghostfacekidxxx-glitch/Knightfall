import {verifyGitHubAuditToken} from "./developer-audit-oidc.js";
import {validIntegrationPath} from "./chaos-integration-dispatch.mjs";
const PREFIX="chaos_integration:";
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[a-f0-9-]{36}$/;
const stamp=()=>new Date().toISOString();
export async function claimIntegration(env,{runId,sha}){
 // Only a previously approved, owner-queued row at the runner's exact main revision.
 const rows=(await env.DB.prepare("SELECT s.key,s.value,r.id,r.path,r.source_sha,r.candidate FROM site_settings s JOIN chaos_dev_reviews r ON s.key='chaos_integration:'||r.id WHERE s.key LIKE 'chaos_integration:%' AND json_valid(s.value) AND json_extract(s.value,'$.status')='queued' AND r.status='approved' ORDER BY s.updated_at LIMIT 10").all()).results||[];
 for(const row of rows){
  if(!ID.test(row.id)||!validIntegrationPath(row.path)||!SHA.test(row.source_sha)||typeof row.candidate!=="string")continue;
  const prior=JSON.parse(row.value);
  const bytes=new TextEncoder().encode(row.candidate);
  if(!bytes.length||bytes.length>16000)continue;
  const next={...prior,status:row.source_sha===sha?"claimed":"stale_base",run_id:runId,claimed_at:stamp()};
  const changed=await env.DB.prepare("UPDATE site_settings SET value=?,updated_at=? WHERE key=? AND value=?").bind(JSON.stringify(next),stamp(),PREFIX+row.id,row.value).run();
  if(changed.meta?.changes!==1||next.status!=="claimed")continue;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
  return {id:row.id,base_sha:sha,path:row.path,candidate_base64:btoa(Array.from(bytes,x=>String.fromCharCode(x)).join("")),candidate_sha256:hash};
 }
 return null;
}
export async function reportIntegration(env,{id,runId,sha,outcome,commit}){
 if(!ID.test(id)||!["passed","failed"].includes(outcome)||(outcome==="passed"&&!SHA.test(commit||"")))return false;
 const key=PREFIX+id;
 const row=await env.DB.prepare("SELECT s.value,r.source_sha FROM site_settings s JOIN chaos_dev_reviews r ON s.key='chaos_integration:'||r.id WHERE s.key=?").bind(key).first();
 if(!row||row.source_sha!==sha)return false;
 const prior=JSON.parse(row.value);
 if(prior.status!=="claimed"||prior.run_id!==runId)return false;
 const next={...prior,status:outcome==="passed"?"runner_reported_committed":"runner_failed",commit_sha:outcome==="passed"?commit:null,finished_at:stamp()};
 const result=await env.DB.prepare("UPDATE site_settings SET value=?,updated_at=? WHERE key=? AND value=?").bind(JSON.stringify(next),stamp(),key,row.value).run();
 return result.meta?.changes===1;
}
export async function handleIntegrationQueue(request,env,{json,origin,verify=verifyGitHubAuditToken}){
 const reply=(body,status=200)=>json(body,status,origin,{"cache-control":"no-store"});
 if(request.method!=="POST"||request.headers.get("origin"))return reply({error:"CI POST only"},403);
 const token=request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9._-]+)$/)?.[1];
 if(!token)return reply({error:"CI identity required"},401);
 let data;try{const raw=await request.text();if(raw.length>2000)throw Error();data=JSON.parse(raw);}catch{return reply({error:"Invalid input"},400);}
 if(!Number.isSafeInteger(data.runId)||data.runId<1||!SHA.test(data.sha||"")||!await verify({token,runId:data.runId,sha:data.sha,purpose:"integration"}))return reply({error:"CI identity rejected"},401);
 try{if(data.action==="claim")return reply({candidate:await claimIntegration(env,data)});
 if(data.action==="report")return reply({ok:await reportIntegration(env,data)});
 return reply({error:"Invalid action"},400);}catch{return reply({error:"Integration storage unavailable"},503);}
}
