// A recorded advisory review for every successful research assignment and its rotating peer.
// No new network requests, external inference, auto-approval or permission changes.
const words=s=>new Set((String(s||"").toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(w=>!["the","and","for","with","from","this"].includes(w)));
const eligible=new Set(["MIT","Apache-2.0","BSD-2-Clause","BSD-3-Clause","ISC","0BSD","MPL-2.0","CC0-1.0","Unlicense"]);
const keyPattern=/^mc-(?:0[1-9]|[1-9][0-9]|100)$/;
export function peerForAssignment(roster,a){
 const index=roster.findIndex(r=>r.key===a.key);if(index<0||roster.length!==100||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid peer assignment");
 return roster[(index+1+(Math.floor(a.hour/(roster.length/5))%99))%roster.length].key;
}
export function evaluateAssignment(roster,a,data){
 const peer=peerForAssignment(roster,a),q=words(a.query),source=data.source;
 const assessments=(Array.isArray(data.records)?data.records:[]).slice(0,3).map(r=>{
  const id=String(r.id||"").slice(0,210),title=String(r.title||"").slice(0,200),license=String(r.license||"unknown").slice(0,100);
  const relevance=[...words(title+" "+(r.description||""))].filter(w=>q.has(w)).length;
  const sourceValid=source==="wikidata"?/^Q[1-9][0-9]{0,14}$/.test(id)&&license==="CC0-1.0":source==="github"?/^github:[-\w.]+\/[-\w.]+$/.test(id)&&id==="github:"+title:source==="gitlab"?/^gitlab:[1-9][0-9]*$/.test(id):source==="npm"?id==="npm:"+title&&/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(title):false;
  const versionReported=source==="wikidata"?null:Boolean(r.version&&r.version!=="unknown");
  const ownDecision=!sourceValid?"reject-reference":!relevance?"investigate-relevance":"request-peer-review";
  const peerDecision=!sourceValid?"reject-reference":!eligible.has(license)||versionReported===false?"request-license-or-version-evidence":!relevance?"request-topic-evidence":"candidate-for-human-review";
  return {id,title,source,license,sourceValid,relevance,versionReported,ownDecision,peerDecision,disclaimer:"Metadata only; not independent corroboration or code validation."};
 });
 return {agent:a.key,peer,slot:a.hour,query:a.query,source,assessments,method:"deterministic metadata evaluation by two assigned roles",externalInference:false};
}
export async function recordPeerAssessment(env,roster,a,data,now){
 const report=evaluateAssignment(roster,a,data);
 if(!keyPattern.test(report.agent)||!keyPattern.test(report.peer)||report.agent===report.peer)throw Error("Invalid peer identity");
 const r=await env.DB.prepare("INSERT INTO chaos_knowledge_peer_assessments(agent_key,slot,peer_key,assessment_json,updated_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key) DO UPDATE SET slot=excluded.slot,peer_key=excluded.peer_key,assessment_json=excluded.assessment_json,updated_at=excluded.updated_at WHERE excluded.slot>=chaos_knowledge_peer_assessments.slot").bind(report.agent,report.slot,report.peer,JSON.stringify(report),now).run();return Number(r.meta?.changes||0);
}
export async function readPeerAssessment(env,key){if(!keyPattern.test(key))throw Error("Unknown specialist");const r=await env.DB.prepare("SELECT assessment_json,updated_at FROM chaos_knowledge_peer_assessments WHERE agent_key=?").bind(key).first();if(!r)return null;return {...JSON.parse(r.assessment_json),updatedAt:r.updated_at};}
