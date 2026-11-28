// Cross-language peer exercises: compile equivalent authored Python and JavaScript functions.
import {verifyPython} from "./chaos-forge-python.mjs";
import {verifyControlJavaScript} from "./chaos-forge-javascript-control.mjs";
import {runLogic} from "./chaos-forge-logic.mjs";
export const CONTROL_COURSE="order100-control-source-v1";
const key=i=>"mc-"+String(i+1).padStart(2,"0");
export function controlSourcePractice(index,round=0){
 if(!Number.isInteger(index)||index<0||index>=100||!Number.isSafeInteger(round)||round<0)throw Error("Invalid specialist or round");
 const teacher=(index+1+round%99)%100,k=1+Math.floor(teacher/5),kind=teacher%5;
 let py,js,inputs,oracle;
 if(kind===0){py="    total = 0\n    for i in range(n):\n        total += i * "+k+"\n    return total";js="let total=0;for(let i=0;i<n;i++){total+=i*"+k+";}return total;";inputs=[0,1,3,5,7,10,20];oracle=n=>k*n*(n-1)/2;}
 else if(kind===1){py="    total = 0\n    if n >= "+k+":\n        total = n * 2\n    else:\n        total = n - 3\n    return total";js="let total=0;if(n>="+k+"){total=n*2;}else{total=n-3;}return total;";inputs=[-5,-1,0,k,k+1,k+2,100];oracle=n=>n>=k?n*2:n-3;}
 else if(kind===2){py="    total = "+k+"\n    for i in range(n):\n        total += 2\n    return total";js="let total="+k+";for(let i=0;i<n;i++){total+=2;}return total;";inputs=[0,1,2,3,4,8,12];oracle=n=>k+2*n;}
 else if(kind===3){py="    total = 0\n    if n < 0:\n        total = -n * "+k+"\n    else:\n        total = n * "+k+"\n    return total";js="let total=0;if(n<0){total=-n*"+k+";}else{total=n*"+k+";}return total;";inputs=[-5,0,2,-1,1,-10,10];oracle=n=>Math.abs(n)*k;}
 else{py="    total = 0\n    for i in range(n):\n        if i >= "+k+":\n            total += 1\n    return total";js="let total=0;for(let i=0;i<n;i++){if(i>="+k+"){total+=1;}}return total;";inputs=[0,1,2,k+2,k+3,k+5,30];oracle=n=>Math.max(0,n-k);}
 const python="def solve(n):\n"+py,javascript="function solve(n){"+js+"}",fields=["n"],examples=inputs.slice(0,3).map(n=>({values:[n],expected:oracle(n)}));
 const p=verifyPython({source:python,fields,examples}),j=verifyControlJavaScript({source:javascript,fields,examples});
 const passed=inputs.reduce((sum,n)=>sum+Number(runLogic(p.program,[n])===oracle(n))+Number(runLogic(j.program,[n])===oracle(n)),0);
 return {learner:key(index),teacher:key(teacher),lesson:CONTROL_COURSE+"-"+key(teacher),kind:"cross-language numeric source compilation",passed,tests:14,holdout:8,verified:passed===14,python,javascript,fields,externalInference:false};
}
export async function recordControlSourcePractice(env,a){
 const match=/^mc-(0[1-9]|[1-9][0-9]|100)$/.exec(a.key);if(!match||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid assignment");
 const r=controlSourcePractice(Number(match[1])-1,Math.floor(a.hour/20)),row={course:CONTROL_COURSE,slot:a.hour,...r},stamp=new Date().toISOString();
 const w=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(r.learner,CONTROL_COURSE,a.hour,r.teacher,Number(r.verified),JSON.stringify(row),stamp).run();
 if(r.verified)await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(CONTROL_COURSE,r.learner,r.teacher,a.hour,JSON.stringify(row),stamp).run();
 return Number(w.meta?.changes||0);
}
export async function controlSourceCoverage(env){
 const r=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT learner_key) AS learners,count(DISTINCT teacher_key) AS teachers,sum(json_extract(receipt_json,'$.passed')) AS passed FROM chaos_coding_peer_history WHERE course=?").bind(CONTROL_COURSE).first();
 return {course:CONTROL_COURSE,exchanges:Number(r?.exchanges||0),learners:Number(r?.learners||0),teachers:Number(r?.teachers||0),passed:Number(r?.passed||0),method:"Deterministic cross-language compiler practice, not neural training."};
}
