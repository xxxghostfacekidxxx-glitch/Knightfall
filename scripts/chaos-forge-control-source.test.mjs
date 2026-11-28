import {controlSourcePractice} from "../backend/chaos-forge-control-source-course.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {verifyPython,translatePython} from "../backend/chaos-forge-python.mjs";
import {verifyControlJavaScript,translateControlJavaScript} from "../backend/chaos-forge-javascript-control.mjs";
import {runLogic} from "../backend/chaos-forge-logic.mjs";
import {buildProject} from "../backend/chaos-forge-project.mjs";
import {buildWebProject} from "../backend/chaos-forge-web-project.mjs";
import {readProjectZip} from "../backend/chaos-forge-zip.mjs";
const examples=[{values:[0],expected:0},{values:[3],expected:3},{values:[5],expected:10}];
const python={source:"def solve(n):\n    total = 0\n    for i in range(n):\n        total += i\n    return total",fields:["n"],examples};
const js={source:"function solve(n){let total=0;for(let i=0;i<n;i++){total+=i;}return total;}",fields:["n"],examples};
test("Python and JS compile counted loops and independently match triangular oracle",async()=>{
 for(const [verify,spec] of [[verifyPython,python],[verifyControlJavaScript,js]]){
  const r=verify(spec),m=await import("data:text/javascript;base64,"+Buffer.from(r.module).toString("base64"));
  for(let i=0;i<100;i++){assert.equal(runLogic(r.program,[i]),i*(i-1)/2);assert.equal(m.solve(i),i*(i-1)/2);}
  for(const n of [-1,1.5,1001])assert.throws(()=>m.solve(n));
 }
});
test("numeric conditional branches and precedence are compiled correctly",()=>{
 const p={source:"def solve(n):\n    total = 0\n    if n >= 0:\n        total = n ** 2\n    else:\n        total = -n ** 2\n    return total",fields:["n"],examples:[{values:[-3],expected:-9},{values:[0],expected:0},{values:[4],expected:16}]};
 const j={source:"function solve(n){let total=0;if(n>=0){total=n**2;}else{total=-(n**2);}return total;}",fields:["n"],examples:p.examples};
 for(const r of [verifyPython(p),verifyControlJavaScript(j)])for(let n=-50;n<=50;n++)assert.equal(runLogic(r.program,[n]),n<0?-(n*n):n*n);
});
test("unsupported execution, mutable parameters, counters and unbounded loops rejected",()=>{
 for(const source of ["def solve(n):\n    import os\n    return n","def solve(n):\n    n = 2\n    return n","def solve(n):\n    while n:\n        n -= 1\n    return n","def solve(n):\n    for i in range(n):\n        i += 1\n    return n","def solve(n):\n    return n // 2","def solve(n):\n    return unknown(n)"])assert.throws(()=>translatePython({source,fields:["n"]}));
 for(const source of ["function solve(n){while(n){}return n;}","function solve(n){n=2;return n;}","function solve(n){let total=0;for(let i=0;i<n;i++){i+=1;}return total;}","function solve(n){return fetch(n);}","function solve(n){return globalThis.n;}"])assert.throws(()=>translateControlJavaScript({source,fields:["n"]}));
});
test("both languages produce runnable Node and web project modules",async()=>{
 for(const [kind,spec] of [["python",python],["javascript-control",js]])for(const builder of [buildProject,buildWebProject]){
  const a=builder({name:"triangle",kind,spec}),files=new Map(readProjectZip(a.bytes).map(f=>[f.path,f.content])),m=await import("data:text/javascript;base64,"+Buffer.from(files.get("src/program.mjs")).toString("base64"));assert.equal(m.solve(10),45);
 }
});

test("100 rotating peers compile both languages and pass independent oracle and holdout checks",()=>{const rows=Array.from({length:100},(_,i)=>controlSourcePractice(i,0));assert.equal(new Set(rows.map(r=>r.learner)).size,100);assert.equal(new Set(rows.map(r=>r.teacher)).size,100);assert.ok(rows.every(r=>r.learner!==r.teacher&&r.verified));assert.equal(rows.reduce((n,r)=>n+r.passed,0),1400);assert.equal(rows.reduce((n,r)=>n+r.holdout,0),800);});
