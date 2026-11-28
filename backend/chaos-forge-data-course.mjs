// Typed data course: each specialist receives a peer program, reconstructs it, and tests an independent oracle.
import {compileData,decompileData,runData} from "./chaos-forge-data.mjs";
export const DATA_COURSE="order100-data-v1";
const key=i=>"mc-"+String(i+1).padStart(2,"0"),ref=ref=>({ref});
function task(i){
 const k=1+Math.floor(i/5),kind=i%5;
 if(kind===0)return {fields:[{name:"value",type:"text"}],steps:[{name:"clean",op:"trim",args:[ref("value")]},{name:"lowered",op:"lower",args:[ref("clean")]},{name:"result",op:"concat",args:[ref("lowered"),":"+k]}],result:"result",inputs:[""," A ","Hello HELLO","  z","123","A B","xyz"],oracle:a=>a.trim().toLowerCase()+":"+k};
 if(kind===1)return {fields:[{name:"value",type:"numbers"}],steps:[{name:"pos",op:"filterPositive",args:[ref("value")]},{name:"unique",op:"uniqueNumbers",args:[ref("pos")]},{name:"total",op:"sum",args:[ref("unique")]},{name:"result",op:"mul",args:[ref("total"),k]}],result:"result",inputs:[[],[1,2,2,-1],[0],[-2,-1],[4,5],[1,1,1],[10,-10,20]],oracle:a=>[...new Set(a.filter(x=>x>0))].reduce((s,x)=>s+x,0)*k};
 if(kind===2)return {fields:[{name:"value",type:"text"}],steps:[{name:"items",op:"words",args:[ref("value")]},{name:"reversed",op:"reverseTexts",args:[ref("items")]},{name:"result",op:"join",args:[ref("reversed"),"|"+k+"|"]}],result:"result",inputs:["","one","a b"," a  b c ","one two one","123 456","a\tb"],oracle:a=>a.trim()?a.trim().split(/\s+/).reverse().join("|"+k+"|"):""};
 if(kind===3)return {fields:[{name:"value",type:"number"}],steps:[{name:"eligible",op:"gt",args:[ref("value"),k]},{name:"result",op:"ifText",args:[ref("eligible"),"above","at or below"]}],result:"result",inputs:[-1,0,k-1,k,k+1,k+2,100],oracle:a=>a>k?"above":"at or below"};
 return {fields:[{name:"value",type:"texts"}],steps:[{name:"unique",op:"uniqueTexts",args:[ref("value")]},{name:"result",op:"join",args:[ref("unique"),":"+k+":"]}],result:"result",inputs:[[],["a"],["b","a","b"],["a","A"],["",""],["x","y"],["one","two","one"]],oracle:a=>[...new Set(a)].join(":"+k+":")};
}
export function dataPractice(index,round=0){
 if(!Number.isInteger(index)||index<0||index>=100||!Number.isSafeInteger(round)||round<0)throw Error("Invalid specialist or round");
 const teacher=(index+1+round%99)%100,t=task(teacher),program=compileData(t),decoded=decompileData(program),p=compileData(decoded.source);
 const tests=t.inputs.map(a=>({expected:t.oracle(a),actual:runData(p,[a])})),passed=tests.filter(x=>JSON.stringify(x.actual)===JSON.stringify(x.expected)).length;
 return {learner:key(index),teacher:key(teacher),lesson:DATA_COURSE+"-"+key(teacher),kind:"typed data bytecode reconstruction",passed,tests:tests.length,verified:passed===tests.length,source:decoded.source,externalInference:false};
}
export async function recordDataPractice(env,a){
 const match=/^mc-(0[1-9]|[1-9][0-9]|100)$/.exec(a.key);if(!match||!Number.isSafeInteger(a.hour)||a.hour<0)throw Error("Invalid assignment");
 const r=dataPractice(Number(match[1])-1,Math.floor(a.hour/20)),row={course:DATA_COURSE,slot:a.hour,...r},stamp=new Date().toISOString();
 const w=await env.DB.prepare("INSERT INTO chaos_coding_practice(agent_key,course,slot,teacher_key,verified,receipt_json,updated_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0) ON CONFLICT(agent_key,course) DO UPDATE SET slot=excluded.slot,teacher_key=excluded.teacher_key,verified=excluded.verified,receipt_json=excluded.receipt_json,updated_at=excluded.updated_at WHERE excluded.slot>chaos_coding_practice.slot").bind(r.learner,DATA_COURSE,a.hour,r.teacher,Number(r.verified),JSON.stringify(row),stamp).run();
 if(r.verified)await env.DB.prepare("INSERT OR IGNORE INTO chaos_coding_peer_history(course,learner_key,teacher_key,first_slot,receipt_json,learned_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1 AND k.enabled=1 AND e.paused=0)").bind(DATA_COURSE,r.learner,r.teacher,a.hour,JSON.stringify(row),stamp).run();
 return Number(w.meta?.changes||0);
}
export async function dataCoverage(env){
 const r=await env.DB.prepare("SELECT count(*) AS exchanges,count(DISTINCT learner_key) AS learners,count(DISTINCT teacher_key) AS teachers,sum(json_extract(receipt_json,'$.passed')) AS passed FROM chaos_coding_peer_history WHERE course=?").bind(DATA_COURSE).first();
 return {course:DATA_COURSE,exchanges:Number(r?.exchanges||0),learners:Number(r?.learners||0),teachers:Number(r?.teachers||0),passed:Number(r?.passed||0),method:"typed bytecode reconstruction and oracle checks; not neural training"};
}

export async function findDataLessons(env,query){
 const terms=String(query||"").trim().split(/[ ,]+/).filter(Boolean);
 if(!terms.length||terms.length>6||terms.some(s=>!/^[A-Za-z][A-Za-z0-9]{0,30}$/.test(s)))throw Error("Enter one to six operation names, e.g. trim lower.");
 const rows=(await env.DB.prepare("SELECT agent_key,teacher_key,receipt_json FROM chaos_coding_practice WHERE course=? AND verified=1 ORDER BY agent_key LIMIT 100").bind(DATA_COURSE).all()).results||[];
 const unique=new Map();
 for(const row of rows){try{
  const r=JSON.parse(row.receipt_json);if(r.course!==DATA_COURSE||!r.verified||r.passed!==7||r.tests!==7||r.learner!==row.agent_key||r.teacher!==row.teacher_key)continue;
  const program=compileData(r.source),source=decompileData(program).source,ops=new Set(source.steps.map(s=>s.op.toLowerCase()));
  const score=terms.filter(t=>ops.has(t.toLowerCase())).length;if(!score)continue;
  const id=JSON.stringify(source);if(!unique.has(id))unique.set(id,{teacher:r.teacher,lesson:r.lesson,source,verifiedCases:r.passed,score});
 }catch{}}
 return {query:terms,matches:[...unique.values()].sort((a,b)=>b.score-a.score||a.lesson.localeCompare(b.lesson)).slice(0,5),examined:rows.length,externalInference:false,notice:"Verified curriculum examples, not proof of correctness for new requirements."};
}
