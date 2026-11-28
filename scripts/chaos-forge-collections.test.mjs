import test from "node:test";
import assert from "node:assert/strict";
import {verifySourceLibrary,translateSourceLibrary} from "../backend/chaos-forge-source-library.mjs";
import {runLogic} from "../backend/chaos-forge-logic.mjs";
import {verifyData,runData,compileData,emitDataModule,dataOperationCatalog} from "../backend/chaos-forge-data.mjs";
import {buildWebProject} from "../backend/chaos-forge-web-project.mjs";
import {readProjectZip} from "../backend/chaos-forge-zip.mjs";
const ref=ref=>({ref});
test("nested helper expressions and comparison calls compile in both source languages",async()=>{
 const examples=[{values:[0],expected:1},{values:[2],expected:13},{values:[5],expected:61}];
 for(const [language,source] of [
 ["python","def square(x):\n    return x*x\ndef add(a,b):\n    return a+b\ndef solve(n):\n    return add(square(n), square(n+1))"],
 ["javascript","function square(x){return x*x;}function add(a,b){return a+b;}function solve(n){return add(square(n),square(n+1));}"]]){
  const r=verifySourceLibrary({language,source,entry:"solve",examples});
  assert.match(r.reconstructed.functions[2].result,/add\(square/);
  const m=await import("data:text/javascript;base64,"+Buffer.from(r.module).toString("base64"));
  for(let n=-50;n<=50;n++){const expected=n*n+(n+1)*(n+1);assert.equal(runLogic(r.program,[n]),expected);assert.equal(m.solve(n),expected);}
 }
 const s={language:"python",entry:"solve",source:"def square(x):\n    return x*x\ndef solve(n):\n    total = 0\n    if square(n) > 4:\n        total = square(n) + square(n+1)\n    return total",examples:[{values:[0],expected:0},{values:[3],expected:25},{values:[4],expected:41}]};
 assert.equal(runLogic(verifySourceLibrary(s).program,[5]),61);
 assert.throws(()=>translateSourceLibrary({language:"javascript",entry:"solve",source:"function square(n){return n*n;}function solve(square){return square(1);}"}));
});
test("record table filters, columns, sorting and row copies work without mutation",async()=>{
 const fields=[{name:"rows",type:"records"},{name:"threshold",type:"number"}],steps=[{name:"selected",op:"filterRecordAbove",args:[ref("rows"),"price",ref("threshold")]},{name:"prices",op:"columnNumbers",args:[ref("selected"),"price"]},{name:"total",op:"sum",args:[ref("prices")]}],spec={fields,steps,result:"total",examples:[{values:[[{price:8},{price:2},{price:5}],3],expected:13},{values:[[{price:1}],3],expected:0},{values:[[{price:4},{price:6}],5],expected:6}]};
 const r=verifyData(spec),m=await import("data:text/javascript;base64,"+Buffer.from(emitDataModule(r.program)).toString("base64"));
 for(let n=0;n<100;n++){const rows=[{price:n},{price:10},{price:0}],expected=rows.filter(x=>x.price>5).reduce((a,x)=>a+x.price,0);assert.equal(m.solve(rows,5),expected);assert.equal(runData(r.program,[rows,5]),expected);}
 const ordered=compileData({fields:[{name:"rows",type:"records"}],steps:[{name:"sorted",op:"sortRecordsNumber",args:[ref("rows"),"price"]},{name:"first",op:"recordAt",args:[ref("sorted"),0]}],result:"first"});const rows=[{price:3,name:"a"},{name:"b",price:1}];assert.deepEqual(runData(ordered,[rows]),{name:"b",price:1});assert.equal(rows[0].price,3);
 const a=buildWebProject({name:"record-analytics",kind:"data",spec}),files=readProjectZip(a.bytes);assert.equal(files.length,9);assert.match(files.find(f=>f.path==="index.html").content,/records/);
 assert.throws(()=>m.solve([{price:"5"}],0));assert.throws(()=>m.solve([{price:1},{}],0));assert.throws(()=>m.solve(new Array(129).fill({price:1}),0));
});
test("standalone typed VM rejects malformed operands and forged result types",()=>{
 const program=compileData({fields:[{name:"x",type:"number"}],steps:[{name:"out",op:"add",args:[ref("x"),1]}],result:"out"});
 for(const mutate of [p=>p.steps[0].args.pop(),p=>p.steps[0].args[1]=["literal","1"],p=>p.steps[0].type="text"]){const p=structuredClone(program);mutate(p);assert.throws(()=>runData(p,[2]));}
 assert.ok(dataOperationCatalog().every(x=>typeof x.description==="string"&&x.description.length));
});
