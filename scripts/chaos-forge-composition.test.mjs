import test from "node:test";
import assert from "node:assert/strict";
import {compileData,runData} from "../backend/chaos-forge-data.mjs";
import {verifyLibrary,compileLibrary} from "../backend/chaos-forge-library.mjs";
import {synthesizeData} from "../backend/chaos-forge-data-synthesis.mjs";
import {synthesisBenchmark} from "../backend/chaos-forge-synthesis-benchmark.mjs";
const ref=ref=>({ref});
const library={functions:[{name:"normalize",fields:[{name:"value",type:"text"}],steps:[{name:"clean",op:"trim",args:[ref("value")]},{name:"out",op:"lower",args:[ref("clean")]}],result:"out"},{name:"profile",fields:[{name:"row",type:"record"}],steps:[{name:"raw",op:"getText",args:[ref("row"),"name"]},{name:"clean",call:"normalize",args:[ref("raw")]},{name:"out",op:"setText",args:[ref("row"),"name",ref("clean")]}],result:"out"}],entry:"profile",examples:[{values:[{name:" ALICE ",id:1}],expected:{id:1,name:"alice"}},{values:[{name:"BOB",id:2}],expected:{name:"bob",id:2}},{values:[{name:"  C "}],expected:{name:"c"}}]};
test("composed functions export standalone modules and immutably transform records",async()=>{
 const r=verifyLibrary(library);assert.equal(r.functions,2);assert.equal(r.expandedOperations,4);
 const mod=await import("data:text/javascript;base64,"+Buffer.from(r.module).toString("base64"));
 for(let i=0;i<100;i++){const input={name:" X"+i+" ",id:i};assert.deepEqual(mod.solve(input),{name:"x"+i,id:i});assert.equal(input.name," X"+i+" ");}
 for(const input of [JSON.parse('{"name":"x","__proto__":1}'),{name:4},{name:"x",nested:{a:1}}])assert.throws(()=>mod.solve(input));
});
test("composition rejects recursion, forward calls and mismatched argument types",()=>{
 const forward=structuredClone(library);forward.functions.reverse();assert.throws(()=>compileLibrary(forward),/earlier function/);
 const wrong=structuredClone(library);wrong.functions[1].steps[1].args=[ref("row")];assert.throws(()=>compileLibrary(wrong),/type mismatch/);
 const recursive=structuredClone(library);recursive.functions[0].steps[0]={name:"clean",call:"normalize",args:[ref("value")]};assert.throws(()=>compileLibrary(recursive),/earlier function/);
});
test("synthesis reports ambiguous behavior with a concrete counterexample",()=>{
 const r=synthesizeData({inputType:"text",outputType:"text",examples:[{values:["a"],expected:"a"},{values:["b"],expected:"b"},{values:["c"],expected:"c"}]});
 assert.equal(r.status,"ambiguous");assert.ok(r.counterexample);assert.notDeepEqual(r.counterexample.candidate,r.counterexample.alternative);
 assert.throws(()=>synthesizeData({inputType:"text",outputType:"number",examples:[{values:["a"],expected:"a"},{values:["b"],expected:"b"},{values:["c"],expected:"c"}]}),/Invalid input/);
});
test("100 parameterized synthesis tasks pass independent hidden cases without automatic approval",()=>{
 const r=synthesisBenchmark();assert.equal(r.tasks,100);assert.equal(r.solved,100);assert.equal(r.passed,400);assert.equal(r.ambiguous,100);
});
