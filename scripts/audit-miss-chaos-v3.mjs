import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
import {forward,encode} from "../public/miss-chaos-native-v3.mjs";
function evaluate(m,rows){let loss=0,count=0;for(const [p,t,s] of rows){const seq=[...Array(m.C).fill(0),...encode(s),1];for(let i=m.C;i<seq.length;i++){const {probs}=forward(m,seq.slice(i-m.C,i),p,t);loss-=Math.log(Math.max(1e-12,probs[seq[i]]));count++;}}return {tokens:count,loss:count?loss/count:null};}
export function auditModel(m,rows){
 const held=rows.filter((_,i)=>i%6===5),training=rows.filter((_,i)=>i%6!==5);
 const canonical=s=>s.toLowerCase().replace(/\s+/g," ").trim();
 const trainSet=new Set(training.map(r=>canonical(r[2])));
 const overlap=held.filter(r=>trainSet.has(canonical(r[2]))).length;
 const baseline=evaluate(m,held),noPersona=evaluate({...m,persona:m.persona.map(()=>0)},held),noTopic=evaluate({...m,topic:m.topic.map(()=>0)},held),neither=evaluate({...m,persona:m.persona.map(()=>0),topic:m.topic.map(()=>0)},held);
 return {trainingRows:training.length,heldoutRows:held.length,exactDuplicateLeakage:overlap,baseline,noPersona,noTopic,neither,byPersona:Array.from({length:m.P},(_,id)=>({id,rows:held.filter(r=>r[0]===id).length,...evaluate(m,held.filter(r=>r[0]===id))}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {model}=JSON.parse(readFileSync(new URL("../public/assets/knightfall/miss-chaos/native-model-v3.json",import.meta.url),"utf8"));const rows=JSON.parse(readFileSync(new URL("../training/miss-chaos-original-v3.json",import.meta.url),"utf8"));console.log(JSON.stringify(auditModel(model,rows),null,2));}
