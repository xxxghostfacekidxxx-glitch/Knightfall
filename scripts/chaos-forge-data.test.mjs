import {parseDataSource,verifyDataSource} from "../backend/chaos-forge-data-source.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {compileData,runData,verifyData,decompileData,emitDataModule} from "../backend/chaos-forge-data.mjs";
import {buildApplet} from "../backend/chaos-forge-applets.mjs";
const ref=ref=>({ref});
const words={fields:[{name:"text",type:"text"}],steps:[{name:"clean",op:"lower",args:[ref("text")]},{name:"words",op:"words",args:[ref("clean")]},{name:"unique",op:"uniqueTexts",args:[ref("words")]},{name:"output",op:"join",args:[ref("unique"),", "]}],result:"output",examples:[{values:["Hello hello World"],expected:"hello, world"},{values:[" A B a "],expected:"a, b"},{values:[""],expected:""}]};
const numbers={fields:[{name:"data",type:"numbers"}],steps:[{name:"positive",op:"filterPositive",args:[ref("data")]},{name:"unique",op:"uniqueNumbers",args:[ref("positive")]},{name:"total",op:"sum",args:[ref("unique")]}],result:"total",examples:[{values:[[1,2,2,-1]],expected:3},{values:[[]],expected:0},{values:[[4,4,1]],expected:5}]};
test("typed compiler verifies source, bytecode reconstruction and standalone module imports",async()=>{
 for(const p of [words,numbers]){
  const report=verifyData(p),reconstructed=decompileData(report.program);
  const m=await import("data:text/javascript;base64,"+Buffer.from(emitDataModule(report.program)).toString("base64"));
  for(const e of p.examples){assert.deepEqual(m.solve(...e.values),e.expected);assert.deepEqual(runData(reconstructed.program,e.values),e.expected);}
 }
 for(let n=0;n<100;n++){
  const a=Array.from({length:n%21},(_,i)=>(i*7+n)%13-6);
  assert.equal(runData(compileData(numbers),[a]),[...new Set(a.filter(x=>x>0))].reduce((s,x)=>s+x,0));
  const s=Array.from({length:n%19},(_,i)=>String.fromCharCode(65+(i+n)%7)).join(" ");
  assert.equal(runData(compileData(words),[s]),[...new Set(s.toLowerCase().split(" ").filter(Boolean))].join(", "));
 }
});
test("type mismatches, host calls, invalid references and wrong expected results fail closed",()=>{
 assert.throws(()=>compileData({...words,steps:[{name:"x",op:"fetch",args:[]}]}));
 assert.throws(()=>compileData({...words,steps:[{name:"x",op:"sum",args:[ref("text")]}]}));
 assert.throws(()=>compileData({...words,steps:[{name:"x",op:"trim",args:[ref("future")]}]}));
 assert.throws(()=>verifyData({...words,examples:[{values:["a"],expected:"wrong"},{values:["b"],expected:"b"},{values:["c"],expected:"c"}]}));
 assert.throws(()=>runData(compileData(numbers),[[Infinity]]));
});
test("offline applet renders script-like text as data without breaking out of script",async()=>{
 const p={title:"Text cleanup",fields:[{name:"text",type:"text"}],steps:[{name:"clean",op:"trim",args:[ref("text")]},{name:"result",op:"replace",args:[ref("clean"),"x","</script><script>bad()</script>"]}],result:"result",examples:[{values:["a"],expected:"a"},{values:[" x "],expected:"</script><script>bad()</script>"},{values:[""],expected:""}]};
 const a=await buildApplet("data: "+JSON.stringify(p)),scripts=[...a.content.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);assert.equal(a.report.scriptHash,createHash("sha256").update(scripts[0][1]).digest("base64"));
 const dom={"field-0":{value:" x "},output:{textContent:""},run:{}};new Function("document",scripts[0][1])({getElementById:id=>dom[id]});
 dom.run.onclick();assert.equal(dom.output.textContent,p.examples[1].expected);
});

test("readable source compiles and decompiles with exact string punctuation handling",()=>{
 const source='input text: text; let result = concat(")", text); return result;';
 const examples=[{values:["a"],expected:")a"},{values:[""],expected:")"},{values:["z"],expected:")z"}];
 const report=verifyDataSource({source,examples});assert.equal(report.tests.length,3);
 assert.deepEqual(parseDataSource(report.reconstructed),parseDataSource(source));
 assert.throws(()=>parseDataSource("input x: text; let a = fetch(x); return a;"));
 assert.throws(()=>parseDataSource("input x: number; let a = lower(x); return a;"));
 assert.throws(()=>parseDataSource("input x: text; return x; garbage"));
});
