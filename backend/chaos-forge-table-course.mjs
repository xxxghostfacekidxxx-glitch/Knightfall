// Rotating peer practice for typed record-table programs, with independent data oracles.
import {verifyData,runData} from "./chaos-forge-data.mjs";
export const TABLE_COURSE="order100-record-tables-v1";
const key=i=>"mc-"+String(i+1).padStart(2,"0"),ref=ref=>({ref});
export function tablePractice(index,round=0){
 if(!Number.isInteger(index)||index<0||index>=100||!Number.isSafeInteger(round)||round<0)throw Error("Invalid specialist or round.");
 const teacher=(index+1+round%99)%100,k=1+Math.floor(teacher/5),kind=teacher%5;
 const fields=[{name:"rows",type:"records"}],datasets=[[],[{price:k-1,tag:"a"}],[{price:k+1,tag:"b"}],[{price:k+2,tag:"a"},{price:k-2,tag:"b"}],[{price:k,tag:"a"},{price:k+3,tag:"a"}],[{price:-1,tag:"b"},{price:k+4,tag:"b"}],[{price:10,tag:"a"},{price:10,tag:"b"},{price:0,tag:"a"}]];
 let steps,oracle;
 if(kind===0){steps=[{name:"selected",op:"filterRecordAbove",args:[ref("rows"),"price",k]},{name:"column",op:"columnNumbers",args:[ref("selected"),"price"]},{name:"result",op:"sum",args:[ref("column")]}];oracle=a=>a.filter(r=>r.price>k).reduce((s,r)=>s+r.price,0);}
 else if(kind===1){steps=[{name:"selected",op:"filterRecordText",args:[ref("rows"),"tag","a"]},{name:"result",op:"countRecords",args:[ref("selected")]}];oracle=a=>a.filter(r=>r.tag==="a").length;}
 else if(kind===2){steps=[{name:"sorted",op:"sortRecordsNumber",args:[ref("rows"),"price"]},{name:"result",op:"columnNumbers",args:[ref("sorted"),"price"]}];oracle=a=>a.map(r=>r.price).sort((x,y)=>x-y);}
 else if(kind===3){steps=[{name:"column",op:"columnTexts",args:[ref("rows"),"tag"]},{name:"unique",op:"uniqueTexts",args:[ref("column")]},{name:"result",op:"join",args:[ref("unique"),":"+k+":"]}];oracle=a=>[...new Set(a.map(r=>r.tag))].join(":"+k+":");}
 else{steps=[{name:"selected",op:"filterRecordAbove",args:[ref("rows"),"price",k]},{name:"result",op:"countRecords",args:[ref("selected")]}];oracle=a=>a.filter(r=>r.price>k).length;}
 const source={fields,steps,result:"result"},examples=datasets.slice(0,3).map(a=>({values:[a],expected:oracle(a)})),r=verifyData({...source,examples});
 const passed=datasets.filter(a=>JSON.stringify(runData(r.program,[a]))===JSON.stringify(oracle(a))).length;
 return {learner:key(index),teacher:key(teacher),lesson:TABLE_COURSE+"-"+key(teacher),kind:"typed record table analytics",passed,tests:7,holdout:4,verified:passed===7,source,externalInference:false};
}
export async function recordTablePractice(env,a){
 const match=/^mc-(0[1-9]|[1-9][0-9]|100)$/.exec(a.key);if(!match||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid assignment");
 const r=tablePractice(Number(match[1])-1,Math.floor(a.hour/20)),row={course:TABLE_COURSE,slot:a.hour,...r},stamp=new Date().toISOString();
 const w=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(r.learner,TABLE_COURSE,a.hour,r.teacher,Number(r.verified),JSON.stringify(row),stamp).run();
 if(r.verified)await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(TABLE_COURSE,r.learner,r.teacher,a.hour,JSON.stringify(row),stamp).run();
 return Number(w.meta?.changes||0);
}
export async function tableCoverage(env){
 const r=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT learner_key) AS learners,count(DISTINCT teacher_key) AS teachers,sum(json_extract(receipt_json,'$.passed')) AS passed FROM chaos_coding_peer_history WHERE course=?").bind(TABLE_COURSE).first();
 return {course:TABLE_COURSE,exchanges:Number(r?.exchanges||0),learners:Number(r?.learners||0),teachers:Number(r?.teachers||0),passed:Number(r?.passed||0),method:"Deterministic peer table program validation; not neural training."};
}
