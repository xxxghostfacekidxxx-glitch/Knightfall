import test from "node:test";
import assert from "node:assert/strict";
import {verifySourceLibrary,translateSourceLibrary} from "../backend/chaos-forge-source-library.mjs";
import {verifyLogicLibrary,compileLogicLibrary,decompileLogicLibrary} from "../backend/chaos-forge-logic-library.mjs";
import {runLogic} from "../backend/chaos-forge-logic.mjs";
import {buildProject} from "../backend/chaos-forge-project.mjs";
import {buildWebProject} from "../backend/chaos-forge-web-project.mjs";
import {readProjectZip} from "../backend/chaos-forge-zip.mjs";
const examples=[{values:[0],expected:0},{values:[3],expected:5},{values:[5],expected:30}];
const specs=[{language:"python",entry:"solve",source:"def square(x):\n    return x*x\ndef solve(n):\n    total = 0\n    value = 0\n    i = 0\n    while i < n:\n        value = square(i)\n        total += value\n        i += 1\n    return total",examples},{language:"javascript",entry:"solve",source:"function square(x){return x*x;} export function solve(n){let total=0,value=0,i=0;while(i<n){value=square(i);total+=value;i+=1;}return total;}",examples}];
test("multi-function source compiles isolated frames, while loops and preserves call boundaries",async()=>{
 for(const spec of specs){
  const r=verifySourceLibrary(spec),m=await import("data:text/javascript;base64,"+Buffer.from(r.module).toString("base64"));
  assert.equal(r.program.functions.length,2);assert.equal(r.reconstructed.functions[1].body[3].body[0].call,"square");
  for(let n=0;n<100;n++){const oracle=n===0?0:(n-1)*n*(2*n-1)/6;assert.equal(runLogic(r.program,[n]),oracle);assert.equal(m.solve(n),oracle);}
  for(const builder of [buildProject,buildWebProject]){const a=builder({name:"square-sum",kind:"source-library",spec}),files=new Map(readProjectZip(a.bytes).map(f=>[f.path,f.content]));const gen=await import("data:text/javascript;base64,"+Buffer.from(files.get("src/program.mjs")).toString("base64"));assert.equal(gen.solve(10),285);}
  assert.throws(()=>m.solve(1001),/limit|budget/);
 }
});
test("recursion, forward calls and wrong arity rejected; shared fuel protects nested call chains",()=>{
 const sources=["function solve(n){let x=solve(n);return x;}","function solve(n){let x=helper(n);return x;}function helper(n){return n;}","function helper(n){return n;}function solve(n){let x=helper(n,n);return x;}"];
 for(const source of sources)assert.throws(()=>translateSourceLibrary({language:"javascript",entry:"solve",source}));
 const spec={functions:[{name:"helper",fields:["n"],locals:["x"],body:[{op:"repeat",count:"n",body:[{op:"set",name:"x",expr:"x+1"}]}],result:"x"},{name:"main",fields:["n"],locals:["x"],body:[{op:"repeat",count:"n",body:[{op:"call",name:"x",call:"helper",args:["n"]}]}],result:"x"}],entry:"main"};
 const program=compileLogicLibrary(spec);assert.equal(runLogic(program,[3]),3);assert.throws(()=>runLogic(program,[100]),/budget/);
 const tampered=structuredClone(program);tampered.functions[1].program.body[0][2][0][2]=1;assert.throws(()=>decompileLogicLibrary(tampered));assert.throws(()=>runLogic(tampered,[1]));
});
