import test from "node:test";
import assert from "node:assert/strict";
import {verifyJavaScript,translateJavaScript} from "../backend/chaos-forge-javascript.mjs";
import {runData} from "../backend/chaos-forge-data.mjs";
import {buildProject} from "../backend/chaos-forge-project.mjs";
import {buildWebProject} from "../backend/chaos-forge-web-project.mjs";
import {readProjectZip} from "../backend/chaos-forge-zip.mjs";
const fields=(...pairs)=>pairs.map(([name,type])=>({name,type}));
const cases=[
 {source:"export function solve(price, quantity) { const total = price * quantity; return total + 5; }",fields:fields(["price","number"],["quantity","number"]),examples:[{values:[10,3],expected:35},{values:[0,1],expected:5},{values:[2.5,4],expected:15}]},
 {source:"function solve(text) { const clean = text.trim(); return clean.toLowerCase(); }",fields:fields(["text","text"]),examples:[{values:[" A "],expected:"a"},{values:["HELLO"],expected:"hello"},{values:[""],expected:""}]},
 {source:"function solve(values) { const positive = values.filter(x => x > 0); return positive.reduce((a,b) => a+b,0); }",fields:fields(["values","numbers"]),examples:[{values:[[1,-2,3]],expected:4},{values:[[-1,-2]],expected:0},{values:[[]],expected:0}]},
 {source:"function solve(values) { return values.toSorted((a,b)=>a-b); }",fields:fields(["values","numbers"]),examples:[{values:[[3,1,2]],expected:[1,2,3]},{values:[[-1,-2]],expected:[-2,-1]},{values:[[]],expected:[]}]},
 {source:"function solve(a,b) { return a !== b; }",fields:fields(["a","number"],["b","number"]),examples:[{values:[1,2],expected:true},{values:[2,2],expected:false},{values:[-3,3],expected:true}]},
 {source:"function solve(flag) { return !flag; }",fields:fields(["flag","boolean"]),examples:[{values:[true],expected:false},{values:[false],expected:true},{values:[true],expected:false}]},
 {source:"function solve(text) { return text.split(',').length; }",fields:fields(["text","text"]),examples:[{values:["a,b"],expected:2},{values:[""],expected:1},{values:["a,b,c"],expected:3}]}
];
// Boolean-only functions have only two possible distinct inputs; use an extra declared input.
cases[5]={source:"function solve(flag,other) { return !flag; }",fields:fields(["flag","boolean"],["other","boolean"]),examples:[{values:[true,true],expected:false},{values:[false,false],expected:true},{values:[true,false],expected:false}]};
test("actual JavaScript compiles and generated modules agree with trusted test fixtures",async()=>{
 for(const spec of cases){
  const r=verifyJavaScript(spec);
  const generated=await import("data:text/javascript;base64,"+Buffer.from(r.module).toString("base64"));
  // These are fixed, repository-authored fixtures only, never submitted code.
  const reference=new Function(spec.source.replace(/^export /,"")+";return solve;")();
  for(const e of spec.examples){assert.deepEqual(runData(r.program,e.values),e.expected);assert.deepEqual(generated.solve(...e.values),reference(...e.values));}
 }
 for(let i=0;i<100;i++){const r=verifyJavaScript(cases[0]);assert.equal(runData(r.program,[i/2,3]),i*1.5+5);}
});
test("compiler rejects arbitrary code, coercion and unsupported syntax",()=>{
 const f=fields(["x","number"]);
 for(const source of ["function solve(x){return fetch('https://example.com');}","function solve(x){return x+'1';}","function solve(x){let a=x;return a;}","function solve(x){while(x){}return x;}","function solve(x){return globalThis.x;}","function solve(x){return x.constructor();}","function solve(x){return x[0];}","function solve(x){return x ? 1 : 2;}","async function solve(x){return x;}","function solve(x){return x;} const extra=1;"]){assert.throws(()=>translateJavaScript({source,fields:f}));}
});
test("JavaScript source builds Node and offline browser projects",()=>{
 for(const builder of [buildProject,buildWebProject]){const a=builder({name:"js-normalizer",kind:"javascript",spec:cases[1]});const files=new Map(readProjectZip(a.bytes).map(f=>[f.path,f.content]));assert.ok(files.has("src/program.mjs"));assert.ok(files.has("test/program.test.mjs"));assert.equal(a.report.examples,3);}
});
