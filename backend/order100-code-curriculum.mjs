// Original curriculum: 100 distinct seeded exercises and independent example oracles.
// Deliberately disjoint held-out operation sequences measure transfer, not memorization.
import {runProgram,learnPrograms,emptyPrior,synthesize,verifyProgram,emitProgram} from "./order100-code-synthesis.mjs";
const FAMILIES=[
 {program:["even","sum"],oracle:a=>a.filter(x=>x%2===0).reduce((s,x)=>s+x,0)},
 {program:["odd","square"],oracle:a=>a.filter(x=>x%2!==0).map(x=>x*x)},
 {program:["positive","double"],oracle:a=>a.filter(x=>x>0).map(x=>x+x)},
 {program:["negative","abs"],oracle:a=>a.filter(x=>x<0).map(x=>-x)},
 {program:["nonzero","count"],oracle:a=>a.filter(Boolean).length},
 {program:["abs","ascending"],oracle:a=>a.map(x=>x<0?-x:x).sort((x,y)=>x-y)},
 {program:["unique","descending"],oracle:a=>Array.from(new Set(a)).sort((x,y)=>y-x)},
 {program:["increment","max"],oracle:a=>a.length?Math.max(...a)+1:null},
 {program:["negate","reverse"],oracle:a=>a.slice().reverse().map(x=>-x)},
 {program:["square","sum"],oracle:a=>a.reduce((s,x)=>s+x*x,0)}
];
const HOLDOUT=[
 {program:["even","square","sum"],oracle:a=>a.reduce((s,x)=>s+(x%2===0?x*x:0),0)},
 {program:["positive","unique","count"],oracle:a=>new Set(a.filter(x=>x>0)).size},
 {program:["negative","abs","ascending"],oracle:a=>a.filter(x=>x<0).map(x=>-x).sort((x,y)=>x-y)},
 {program:["odd","negate","min"],oracle:a=>{const b=a.filter(x=>x%2!==0);return b.length?-Math.max(...b):null;}},
 {program:["nonzero","double","max"],oracle:a=>{const b=a.filter(Boolean);return b.length?2*Math.max(...b):null;}},
 {program:["unique","square","descending"],oracle:a=>[...new Set(a)].map(x=>x*x).sort((x,y)=>y-x)}
];
export const COURSE_VERSION="order100-code-v1";
function examples(f,seed,heldout=false){
 let n=(seed+1)*7919;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n%23-11;};
 const inputs=heldout?[[-11,0,9,-7,4,4],[],[0,0],[6,-6,-6,0,3],[1,3,5],[-8,-2],Array.from({length:9},rand)]:[[],[0,0],[-3,2,0,2,5,-4],[1,3,-5,1],[-2,-2,4,6],Array.from({length:7},rand),Array.from({length:8},rand)];
 return inputs.map(input=>({input,output:f.oracle(input)}));
}
const agentKey=i=>"mc-"+String(i+1).padStart(2,"0");
export function exerciseFor(index){
 if(!Number.isInteger(index)||index<0||index>=100)throw Error("Unknown specialist");
 const f=FAMILIES[index%FAMILIES.length];
 return {agent:agentKey(index),id:COURSE_VERSION+"-"+agentKey(index),program:f.program.slice(),training:examples(f,index),validation:examples(f,index+1000,true)};
}
export function verifiedLesson(index){
 const e=exerciseFor(index),results=verifyProgram(e.program,[...e.training.slice(0,4),...e.validation.slice(0,4)]);
 const verified=results.every(r=>r.passed);
 return {agent:e.agent,id:e.id,program:e.program,source:emitProgram(e.program),tests:results.length,passed:results.filter(r=>r.passed).length,verified,externalInference:false};
}
export function practicePeer(index,round=0){
 if(!Number.isSafeInteger(round)||round<0)throw Error("Invalid round");
 const own=verifiedLesson(index),t=(index+1+round%99)%100,teacher=verifiedLesson(t),exercise=exerciseFor(t);
 // The learner receives examples rather than the teacher's code. Its own verified lesson initializes its search prior.
 const localPrior=learnPrograms(own.verified?[own.program]:[],emptyPrior());
 const found=synthesize(exercise.training,{maxSteps:2,budget:256,prior:localPrior});
 const checks=found.program?verifyProgram(found.program,exercise.validation):[];
 return {learner:own.agent,teacher:teacher.agent,lesson:teacher.id,ownProgram:own.program,ownVerified:own.verified,program:found.program,passed:checks.filter(c=>c.passed).length,tests:exercise.validation.length,verified:own.verified&&teacher.verified&&checks.length===exercise.validation.length&&checks.every(c=>c.passed),checked:found.checked,externalInference:false};
}
export function peerRound(round=0){
 const lessons=Array.from({length:100},(_,i)=>verifiedLesson(i));
 const receipts=lessons.map((_,i)=>practicePeer(i,round)),accepted=receipts.filter(r=>r.verified);
 // Teach Miss Chaos using verified teacher solutions and independently re-synthesized learner programs.
 const prior=learnPrograms([...lessons.filter(l=>l.verified).map(l=>l.program),...accepted.map(r=>r.program)],emptyPrior());
 return {course:COURSE_VERSION,round,lessons,receipts,prior,accepted:accepted.length,externalInference:false,method:"local program synthesis with independently authored oracle checks; not general neural model training"};
}
export function codingBenchmark(prior,{budget=512}={}){
 const rows=HOLDOUT.map((f,i)=>{
  const training=examples(f,600+i),validation=examples(f,900+i,true);
  const found=synthesize(training,{maxSteps:3,budget,prior});
  const checks=found.program?verifyProgram(found.program,validation):[];
  return {task:i+1,expected:f.program,selected:found.program,status:found.status,checked:found.checked,searchSpace:found.total,validationPassed:checks.filter(x=>x.passed).length,validationTests:validation.length,solved:checks.length===validation.length&&checks.every(x=>x.passed)};
 });
 return {budget,tasks:rows.length,solved:rows.filter(r=>r.solved).length,validationPassed:rows.reduce((n,r)=>n+r.validationPassed,0),validationTests:rows.reduce((n,r)=>n+r.validationTests,0),rows,externalInference:false};
}
