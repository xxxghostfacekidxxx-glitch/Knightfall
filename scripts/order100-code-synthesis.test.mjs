import test from "node:test";
import assert from "node:assert/strict";
import {runProgram,emitProgram,parseProgram,synthesize,emptyPrior,learnPrograms,validateExamples,validateProgram} from "../backend/order100-code-synthesis.mjs";
import {peerRound,practicePeer,exerciseFor,codingBenchmark,COURSE_VERSION} from "../backend/order100-code-curriculum.mjs";
import {codingKnowledge,recordCodingPractice} from "../backend/src/order100-coding-practice.mjs";

async function loadGenerated(program){
 // Only trusted compiler output is executed in this read-only test runner.
 return (await import("data:text/javascript;base64,"+Buffer.from(emitProgram(program)).toString("base64"))).solve;
}
test("compiler emits executable, non-mutating, checked JavaScript",async()=>{
 const p=parseProgram("filter even | square | sum"),input=[-2,3,4,0],fn=await loadGenerated(p);
 assert.equal(fn(input),20);assert.deepEqual(input,[-2,3,4,0]);assert.equal(runProgram(p,input),20);
 assert.throws(()=>fn([NaN]));assert.throws(()=>fn([10001]));assert.throws(()=>fn("wrong"));
 assert.throws(()=>parseProgram("sum | double"));assert.throws(()=>parseProgram("constructor"));assert.throws(()=>parseProgram("even; fetch('https://example.com')"));
 assert.throws(()=>runProgram(["square","square"],[10000]),/overflow/i);
});
test("input examples reject contradictory data and cannot be interpreted as source",()=>{
 assert.throws(()=>validateExamples([{input:[1],output:1},{input:[1],output:2},{input:[2],output:2}]),/conflict/i);
 assert.throws(()=>validateExamples([{input:[1],output:1},{input:[1],output:1},{input:[1],output:1}]),/distinct/i);
 assert.throws(()=>synthesize([{input:["process.exit()"],output:1},{input:[1],output:1},{input:[2],output:2}]),/invalid/i);
 assert.throws(()=>validateProgram(["__proto__"]));
});
test("bounded synthesis reports ambiguity and distinguishing examples without claiming proof",()=>{
 const result=synthesize([{input:[1,2],output:2},{input:[2,4],output:6},{input:[-2,3],output:-2}],{budget:512});
 assert.ok(result.program);assert.ok(result.checked<=512);assert.equal(result.externalInference,false);assert.match(result.note,/cannot prove uniqueness/);
 const ambiguous=synthesize([{input:[2],output:[2]},{input:[4],output:[4]},{input:[6],output:[6]}],{maxSteps:1,budget:512});
 assert.equal(ambiguous.status,"ambiguous");assert.ok(ambiguous.counterexample);
});
test("all 100 learners independently reconstruct peer lessons; emitted source passes distinct test inputs",async()=>{
 const round=peerRound(0);assert.equal(round.accepted,100);assert.equal(round.prior.samples,200);
 assert.equal(new Set(round.receipts.map(r=>r.teacher)).size,100);
 let sourceTests=0;
 for(const lesson of round.lessons){
  assert.equal(lesson.verified,true);const fn=await loadGenerated(lesson.program);
  const exercise=exerciseFor(Number(lesson.agent.slice(3))-1);
  for(const row of exercise.validation){assert.equal(JSON.stringify(fn(row.input)),JSON.stringify(row.output));sourceTests++;}
 }
 for(const receipt of round.receipts){
  assert.notEqual(receipt.learner,receipt.teacher);assert.equal(receipt.verified,true);
  const fn=await loadGenerated(receipt.program);
  for(const row of exerciseFor(Number(receipt.teacher.slice(3))-1).validation){assert.equal(JSON.stringify(fn(row.input)),JSON.stringify(row.output));sourceTests++;}
 }
 assert.equal(sourceTests,1400);
});
test("learned program prior improves bounded development benchmark without claiming general coding ability",()=>{
 const round=peerRound(0),before=codingBenchmark(emptyPrior()),after=codingBenchmark(round.prior),expanded=codingBenchmark(round.prior,{budget:4096});
 assert.equal(before.tasks,6);assert.equal(before.solved,3);assert.equal(after.solved,4);assert.equal(expanded.solved,6);assert.equal(expanded.validationPassed,42);
});
test("database practice stores only current verified course and shared prior excludes bad receipts",async()=>{
 const row={course:COURSE_VERSION,slot:20,...practicePeer(0,1)};
 const data={agent_key:row.learner,teacher_key:row.teacher,slot:20,receipt_json:JSON.stringify(row)};
 const env={DB:{prepare(sql){return {bind(...args){if(sql.startsWith("INSERT")){assert.match(sql,/e.paused=0/);assert.match(sql,/excluded.slot>/);assert.equal(args[0],"mc-01");}return this;},async all(){return{results:[data,{...data,agent_key:"mc-99"}]};},async run(){return{meta:{changes:1}};}};}}};
 assert.equal((await recordCodingPractice(env,{key:"mc-01",hour:20})).recorded,1);
 const knowledge=await codingKnowledge(env);assert.equal(knowledge.verifiedLearners,1);assert.equal(knowledge.prior.samples,2);
});
