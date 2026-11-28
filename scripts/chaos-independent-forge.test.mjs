import {compileFunction,decompileFunction} from "../backend/chaos-forge-functions.mjs";
import {compileFormula,evaluateFormula,decompileFormula} from "../backend/chaos-forge-formula.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {createHash,webcrypto} from "node:crypto";
import {compileArtifact,inspectWasm,decompileStack,hexBytes,bytesHex} from "../backend/chaos-forge-binary.mjs";
import {buildApplet} from "../backend/chaos-forge-applets.mjs";
import {reverseSource} from "../backend/chaos-forge-reverse.mjs";
import {compileExpression,runExpression} from "../public/order66-code-lab.mjs";
import {forgeCommand,forgeDownload,listForgeArtifacts,deleteForgeArtifact} from "../backend/chaos-independent-forge.mjs";
test("native compilation and static reconstruction agree",()=>{for(const expression of ["2+3*4","sqrt(81)+abs(-5)","max(1,2)-min(3,4)","-2.5/2","floor(3.9)+ceil(2.1)"]){const a=compileArtifact(expression,"wasm",{nativeTest:true}),r=inspectWasm(a.bytes);assert.equal(r.validated,true);assert.equal(r.executed,false);assert.equal(a.report.compilerOutputExecuted,true);assert.equal(runExpression(compileExpression(r.expression)),a.report.result);assert.deepEqual(hexBytes(bytesHex(a.bytes)),a.bytes);assert.equal(runExpression(compileExpression(compileArtifact(expression,"stack").report.reconstruction)),a.report.result);}});
test("malformed bytecode and unknown native instructions never execute",()=>{assert.throws(()=>hexBytes("abc"));assert.throws(()=>inspectWasm(hexBytes("0061736d0100000001ff")));assert.throws(()=>decompileStack([["add"]]));assert.throws(()=>decompileStack([["const",1],["fetch"]]));const wasm=compileArtifact("1+2").bytes.slice();wasm[wasm.length-2]=0x00;const report=inspectWasm(wasm);assert.equal(report.expression,null);assert.equal(report.executed,false);});
test("offline applets contain CSP matching their scripts and escape titles",async()=>{for(const name of ["timer","checklist","converter","notes","pipeline: even | square | sum","timer named <script>alert(1)</script>"]){const a=await buildApplet(name),script=a.content.match(/<script>([\s\S]*?)<\/script>/)[1];assert.equal(a.report.scriptHash,createHash("sha256").update(script).digest("base64"));assert.ok(a.content.includes("connect-src 'none'"));assert.ok(!a.content.includes("<h1><script>"));assert.ok(a.filename.endsWith(".html"));assert.doesNotThrow(()=>new Function(script));}await assert.rejects(buildApplet("unknown arbitrary app"))});
test("reverse engineering reports source edges without running submitted code",()=>{const r=reverseSource('import {join} from "./tools.js"; export function sum(x){ return join(x); }');assert.equal(r.syntax_valid,true);assert.equal(r.executed,false);assert.ok(r.callGraph.includes("sum → join"));assert.equal(r.modules[0].specifier,"./tools.js");const bad=reverseSource("const a = ;");assert.equal(bad.syntax_valid,false);});
test("artifact storage is scoped, integrity checked and downloads are attachments",async()=>{const rows=new Map();const env={DB:{prepare(sql){let p=[];return {bind(...args){p=args;return this;},async run(){if(sql.startsWith("INSERT")){rows.set(p[0],{id:p[0],owner_id:p[1],filename:p[2],data_base64:p[3],sha256:p[4],byte_count:p[5],created_at:p[6],expires_at:p[7]});return {meta:{changes:1}};}if(sql.includes("WHERE id=? AND owner_id=?")){const found=rows.get(p[0]);if(found?.owner_id===p[1]){rows.delete(p[0]);return {meta:{changes:1}};}}return {meta:{changes:0}};},async first(){const r=rows.get(p[0]);return r?.owner_id===p[1]?r:null;},async all(){return {results:[...rows.values()].filter(r=>r.owner_id===p[0])};}}}}};const r=await forgeCommand(env,12,"Applet: checklist");assert.equal(r.externalInference,false);assert.equal(await forgeDownload(env,13,r.artifact.id),null);const d=await forgeDownload(env,12,r.artifact.id);assert.match(d.headers.get("content-disposition"),/^attachment/);assert.match(await d.text(),/<!doctype html>/);assert.equal((await listForgeArtifacts(env,12)).length,1);assert.equal(await deleteForgeArtifact(env,13,r.artifact.id),false);assert.equal(await deleteForgeArtifact(env,12,r.artifact.id),true);assert.equal(await forgeDownload(env,12,r.artifact.id),null);});

test("named-input formulas compile and decompile; custom applet executes compiled inputs",async()=>{for(const [expression,fields,values,expected] of [["hours*rate+supplies",["hours","rate","supplies"],[2,100,15],215],["sqrt(x^2+y^2)",["x","y"],[3,4],5],["-x^2",["x"],[3],-9],["2^-x",["x"],[3],0.125]]){const p=compileFormula(expression,fields);assert.equal(evaluateFormula(p,values),expected);assert.equal(evaluateFormula(compileFormula(decompileFormula(p).expression,fields),values),expected);}assert.throws(()=>compileFormula("fetch(x)",["x"]));assert.throws(()=>evaluateFormula(compileFormula("1/x",["x"]),[0]));const a=await buildApplet('formula: {"title":"Quote","fields":[{"name":"hours","label":"Hours","default":2},{"name":"rate","label":"Rate","default":100}],"expression":"hours*rate"}');const script=a.content.match(/<script>([\s\S]*?)<\/script>/)[1];assert.equal(a.report.scriptHash,createHash("sha256").update(script).digest("base64"));const dom={"field-0":{value:"3"},"field-1":{value:"120"},output:{textContent:""},run:{}};new Function("document",script)({getElementById:id=>dom[id]});dom.run.onclick();assert.equal(dom.output.textContent,"360");});

test("reusable functions run natively outside Worker and reconstruct equivalent expressions",()=>{
 for(const expression of ["x*y+2","sqrt(abs(x))+y","min(x,y)-max(x,y)","-x+y","floor(x)*ceil(y)"]){
  const input={expression,fields:["x","y"],examples:[[2,3],[-4,2],[0,0],[1.5,-2.5]]};
  const safe=compileFunction(input),native=compileFunction(input,{nativeTest:true});
  assert.equal(safe.report.nativeExecuted,false);assert.equal(native.report.nativeExecuted,true);assert.deepEqual(safe.bytes,native.bytes);
  const d=decompileFunction(safe.bytes);
  assert.equal(d.executed,false);for(const t of native.report.tests)assert.equal(evaluateFormula(d.program,t.values),t.expected);
 }
 assert.throws(()=>compileFunction({expression:"x^2",fields:["x"],examples:[[1],[2],[3]]}),/Unsupported native/);
 assert.throws(()=>decompileFunction(Uint8Array.from([0,97,115,109,1,0,0,0])));
});
test("server emits binary without invoking dynamic native compiler",()=>{
 const input={expression:"x+1",fields:["x"],examples:[[1],[2],[3]]};
 const prior=globalThis.WebAssembly;
 try{globalThis.WebAssembly=undefined;const a=compileFunction(input);assert.equal(a.report.nativeExecuted,false);assert.equal(decompileFunction(a.bytes).expression,"(arg0 + 1)");const b=compileArtifact("3*4");assert.equal(b.report.compilerOutputExecuted,false);assert.equal(b.report.result,12);}finally{globalThis.WebAssembly=prior;}
});
