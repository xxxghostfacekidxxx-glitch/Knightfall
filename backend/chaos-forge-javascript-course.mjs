// Each specialist compiles a peer's JavaScript lesson and checks an independently defined oracle.
import {verifyJavaScript} from "./chaos-forge-javascript.mjs";
import {runData} from "./chaos-forge-data.mjs";
export const JS_COURSE="order100-javascript-v1";
const key=i=>"mc-"+String(i+1).padStart(2,"0");
export function javascriptPractice(index,round=0){
 if(!Number.isInteger(index)||index<0||index>=100||!Number.isSafeInteger(round)||round<0)throw Error("Invalid specialist or round.");
 const teacher=(index+1+round%99)%100,k=1+Math.floor(teacher/5),kind=teacher%5;
 let source,type,inputs,oracle;
 if(kind===0){source="function solve(value){return value*"+k+"+3;}";type="number";inputs=[-9,-1,0,1,2,7,100];oracle=x=>x*k+3;}
 else if(kind===1){source='function solve(value){return value.trim().toLowerCase()+":'+k+'";}';type="text";inputs=[""," A ","HELLO","  Z","123","A B","xyz"];oracle=x=>x.trim().toLowerCase()+":"+k;}
 else if(kind===2){source="function solve(value){const positive=value.filter(x=>x>0);return positive.reduce((a,b)=>a+b,0)*"+k+";}";type="numbers";inputs=[[],[1,2,-1],[0],[-2,-1],[4,5],[1,1,1],[10,-10,20]];oracle=x=>x.filter(v=>v>0).reduce((a,b)=>a+b,0)*k;}
 else if(kind===3){source="function solve(value){return value>="+k+";}";type="number";inputs=[-1,0,k-1,k,k+1,k+2,100];oracle=x=>x>=k;}
 else{source='function solve(value){return value.toReversed().join(":'+k+':");}';type="texts";inputs=[[],["a"],["b","a","b"],["a","A"],["",""],["x","y"],["one","two","one"]];oracle=x=>x.slice().reverse().join(":"+k+":");}
 const fields=[{name:"value",type}],examples=inputs.slice(0,3).map(x=>({values:[x],expected:oracle(x)})),r=verifyJavaScript({source,fields,examples});
 const tests=inputs.map(x=>({actual:runData(r.program,[x]),expected:oracle(x)})),passed=tests.filter(t=>JSON.stringify(t.actual)===JSON.stringify(t.expected)).length;
 return {learner:key(index),teacher:key(teacher),lesson:JS_COURSE+"-"+key(teacher),kind:"JavaScript source compilation",passed,tests:tests.length,holdout:4,verified:passed===tests.length,source,fields,translated:r.translated,externalInference:false};
}
export async function recordJavaScriptPractice(env,a){
 const match=/^mc-(0[1-9]|[1-9][0-9]|100)$/.exec(a.key);if(!match||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid assignment");
 const r=javascriptPractice(Number(match[1])-1,Math.floor(a.hour/20)),row={course:JS_COURSE,slot:a.hour,...r},stamp=new Date().toISOString();
 const w=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(r.learner,JS_COURSE,a.hour,r.teacher,Number(r.verified),JSON.stringify(row),stamp).run();
 if(r.verified)await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(JS_COURSE,r.learner,r.teacher,a.hour,JSON.stringify(row),stamp).run();
 return Number(w.meta?.changes||0);
}
export async function javascriptCoverage(env){
 const r=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT learner_key) AS learners,count(DISTINCT teacher_key) AS teachers,sum(json_extract(receipt_json,'$.passed')) AS passed FROM chaos_coding_peer_history WHERE course=?").bind(JS_COURSE).first();
 return {course:JS_COURSE,exchanges:Number(r?.exchanges||0),learners:Number(r?.learners||0),teachers:Number(r?.teachers||0),passed:Number(r?.passed||0),method:"Deterministic peer compilation and oracle exercises, not neural weight updates."};
}
