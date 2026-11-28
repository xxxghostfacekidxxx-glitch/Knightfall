import {assignments,normalizeCandidates,toolCandidates,runKnowledgeResearch} from "./chaos-knowledge-fleet.mjs";
import {verifyGitHubAuditToken} from "./developer-audit-oidc.js";
const failure=/^(?:http_[45][0-9]{2}|timeout|fetch_or_runtime_type_error|response_limit|invalid_source|request_or_storage_error)$/;
function failureValue(x){if(x==null)return null;if(typeof x!=="string"||!failure.test(x))throw Error("Invalid diagnostic");return x;}
export function normalizeResearchUpload(payload,now=Date.now()){
 if(!payload||!Number.isSafeInteger(payload.runId)||payload.runId<1||!/^\d{1,12}$/.test(String(payload.hour))||!Number.isSafeInteger(payload.hour)||! /^[a-f0-9]{40}$/.test(payload.sha||""))throw Error("Invalid provenance");
 const current=Math.floor(now/3600000);if(payload.hour!==current&&!(payload.hour===current-1&&now-current*3600000<600000))throw Error("Stale slot");
 const expected=assignments(payload.hour*3600000);if(!Array.isArray(payload.results)||payload.results.length!==expected.length)throw Error("Invalid assignments");
 const results=new Map();for(const a of expected){const x=payload.results.find(x=>x?.key===a.key);if(!x||!Array.isArray(x.records)||x.records.length>3||!(x.source===a.source||(a.source==="wikidata"&&x.source==="npm")))throw Error("Invalid source");
 if(x.query!==undefined&&x.query!==a.query)throw Error("Assignment query mismatch");
 const primaryFailure=failureValue(x.primaryFailure),error=failureValue(x.error);let records=[];
 if(x.source==="wikidata")records=normalizeCandidates({search:x.records.map(y=>({id:y?.id,label:y?.title,description:y?.description}))});
 else if(x.source==="github")records=toolCandidates("github",{items:x.records.map(y=>({full_name:y?.title,private:false,license:{spdx_id:y?.license},default_branch:y?.version}))});
 else if(x.source==="gitlab")records=toolCandidates("gitlab",x.records.map(y=>({id:Number(String(y?.id||"").replace(/^gitlab:/,"")),visibility:"public",path_with_namespace:y?.title,license:{key:y?.license},default_branch:y?.version})));
 else records=toolCandidates("npm",{objects:x.records.map(y=>({package:{name:y?.title,license:y?.license,version:y?.version}}))});
 if(error&&records.length)throw Error("Failed source cannot contain records");
 results.set(a.key,{source:x.source,primaryFailure,error,records});}
 return {runId:payload.runId,sha:payload.sha,hour:payload.hour,results};
}
export async function ingestResearch({env,body,token,now=Date.now(),verify=verifyGitHubAuditToken}){
 let payload;try{payload=normalizeResearchUpload(JSON.parse(body),now);}catch{return {status:400};}
 if(!await verify({token,runId:payload.runId,sha:payload.sha,now,purpose:"order66"}))return {status:401};
 const key="order66_ingest:"+payload.hour,stamp=new Date(now).toISOString();
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO site_settings(key,value,updated_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(key,JSON.stringify({runId:payload.runId,sha:payload.sha}),stamp).run();
 if(claim.meta?.changes!==1)return {status:409};
 const result=await runKnowledgeResearch(env,payload.hour*3600000,{retryFailed:true,collector:async a=>payload.results.get(a.key)});
 return {status:200,result};
}
