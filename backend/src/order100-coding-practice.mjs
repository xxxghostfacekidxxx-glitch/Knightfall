import {practicePeer,COURSE_VERSION} from "../order100-code-curriculum.mjs";
import {learnPrograms,validateProgram,emptyPrior} from "../order100-code-synthesis.mjs";
export async function recordCodingPractice(env,a){
 const key=String(a.key||"");if(!/^mc-(?:0[1-9]|[1-9][0-9]|100)$/.test(key)||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid practice assignment");
 // A course round rotates each specialist through 99 peers; no dependency on source collection.
 const result=practicePeer(Number(key.slice(3))-1,Math.floor(a.hour/20));
 const row={course:COURSE_VERSION,slot:a.hour,...result},stamp=new Date().toISOString();
 const r=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(key,COURSE_VERSION,a.hour,result.teacher,Number(result.verified),JSON.stringify(row),stamp).run();
 let taught=0;
 if(result.verified){const h=await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(COURSE_VERSION,key,result.teacher,a.hour,JSON.stringify(row),stamp).run();taught=Number(h.meta?.changes||0);}
 return {recorded:Number(r.meta?.changes||0),verified:result.verified,taught};
}
function validReceipt(row){
 try{const r=JSON.parse(row.receipt_json);if(r.course!==COURSE_VERSION||r.learner!==row.agent_key||r.teacher!==row.teacher_key||r.teacher===r.learner||r.slot!==row.slot||!r.verified||!r.ownVerified||r.tests!==7||r.passed!==r.tests)return null;
 return {...r,program:validateProgram(r.program),ownProgram:validateProgram(r.ownProgram)};}catch{return null;}
}
export async function codingKnowledge(env){
 const rows=(await env.DB.prepare("SELECT agent_key,teacher_key,slot,receipt_json FROM chaos_coding_practice WHERE course=? AND verified=1 ORDER BY agent_key LIMIT 100").bind(COURSE_VERSION).all()).results||[];
 const receipts=rows.map(validReceipt).filter(Boolean);
 const history=await env.DB.prepare("SELECT learner_key AS agent_key,teacher_key,first_slot AS slot,receipt_json FROM chaos_coding_peer_history WHERE course=? GROUP BY learner_key,json_extract(receipt_json,'$.program') ORDER BY learner_key,first_slot LIMIT 9900").bind(COURSE_VERSION).all();
 const past=(history.results||[]).map(validReceipt).filter(Boolean),distinct=new Map();
 for(const r of [...receipts,...past]){const key=r.learner+"|"+r.program.join("|");distinct.set(key,r.program);}
 // Cap the learned model to 1000 distinct contributions; no repeat-slot weighting.
 const samples=[...receipts.map(r=>r.ownProgram),...distinct.values()].slice(0,1000),prior=learnPrograms(samples,emptyPrior());
 const counts=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT teacher_key) AS teachers FROM chaos_coding_peer_history WHERE course=?").bind(COURSE_VERSION).first();
 return {course:COURSE_VERSION,verifiedLearners:receipts.length,distinctTeachers:Number(counts?.teachers||0),verifiedExchanges:Number(counts?.exchanges||0),distinctLearnerPrograms:distinct.size,prior,externalInference:false};
}
export async function readCodingPractice(env,key){
 if(!/^mc-(?:0[1-9]|[1-9][0-9]|100)$/.test(key))throw Error("Unknown specialist");
 const row=await env.DB.prepare("SELECT receipt_json,updated_at FROM chaos_coding_practice WHERE agent_key=? AND course=?").bind(key,COURSE_VERSION).first();
 return row?{...JSON.parse(row.receipt_json),updatedAt:row.updated_at}:null;
}
