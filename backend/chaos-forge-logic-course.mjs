// Structured programming course: 100 roles exchange compiled programs and reconstruct source.
// The learner decompiles the teacher's bytecode, then recompiles and checks a separate authored oracle.
import {compileLogic,decompileLogic,runLogic} from "./chaos-forge-logic.mjs";
export const LOGIC_COURSE="order100-logic-v1";
const key=i=>"mc-"+String(i+1).padStart(2,"0");
const assign=(name,expr)=>({op:"set",name,expr});
const repeat=(count,body)=>({op:"repeat",count,body});
const condition=(compare,left,right,then,otherwise=[])=>({op:"if",compare,left,right,then,else:otherwise});
function task(i){
 const k=1+Math.floor(i/5),kind=i%5;
 if(kind===0)return {fields:["n"],locals:["i","total"],body:[repeat("n",[assign("i","i+1"),assign("total","total+i*"+k)])],result:"total",oracle:n=>k*n*(n+1)/2};
 if(kind===1)return {fields:["n"],locals:["total"],body:[condition("ge","n",String(k),[assign("total","n-"+k)],[assign("total","0")])],result:"total",oracle:n=>Math.max(0,n-k)};
 if(kind===2)return {fields:["n"],locals:["i","total"],body:[repeat("n",[assign("i","i+1"),condition("eq","i%2","0",[assign("total","total+"+k)])])],result:"total",oracle:n=>Math.floor(n/2)*k};
 if(kind===3)return {fields:["n"],locals:["i","total"],body:[repeat("n",[assign("i","i+1"),assign("total","total+i*i*"+k)])],result:"total",oracle:n=>k*n*(n+1)*(2*n+1)/6};
 return {fields:["n"],locals:["total"],body:[assign("total","1"),repeat("n",[assign("total","total+"+k)])],result:"total",oracle:n=>1+n*k};
}
export function logicPractice(index,round=0){
 if(!Number.isInteger(index)||index<0||index>=100||!Number.isSafeInteger(round)||round<0)throw Error("Invalid specialist or round");
 const teacher=(index+1+round%99)%100,t=task(teacher),p=compileLogic(t);
 const decoded=decompileLogic(p),reconstructed=compileLogic(decoded.source);
 const inputs=[0,1,2,5,11,23,37],tests=inputs.map(n=>({input:n,expected:t.oracle(n),actual:runLogic(reconstructed,[n])}));
 const passed=tests.filter(x=>x.actual===x.expected).length;
 return {learner:key(index),teacher:key(teacher),lesson:LOGIC_COURSE+"-"+key(teacher),kind:"compiled-program reconstruction",passed,tests:tests.length,verified:passed===tests.length,source:decoded.source,externalInference:false};
}
export async function recordLogicPractice(env,a){
 const match=/^mc-(0[1-9]|[1-9][0-9]|100)$/.exec(a.key);if(!match||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid assignment");
 const r=logicPractice(Number(match[1])-1,Math.floor(a.hour/20)),row={course:LOGIC_COURSE,slot:a.hour,...r},stamp=new Date().toISOString();
 const w=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(r.learner,LOGIC_COURSE,a.hour,r.teacher,Number(r.verified),JSON.stringify(row),stamp).run();
 if(r.verified)await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(LOGIC_COURSE,r.learner,r.teacher,a.hour,JSON.stringify(row),stamp).run();
 return Number(w.meta?.changes||0);
}
export async function logicCoverage(env){
 const row=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT learner_key) AS learners,count(DISTINCT teacher_key) AS teachers,sum(json_extract(receipt_json,'$.passed')) AS passed FROM chaos_coding_peer_history WHERE course=?").bind(LOGIC_COURSE).first();
 return {course:LOGIC_COURSE,exchanges:Number(row?.exchanges||0),learners:Number(row?.learners||0),teachers:Number(row?.teachers||0),passed:Number(row?.passed||0),method:"decompile, reconstruct and test structured programs; not neural training"};
}
