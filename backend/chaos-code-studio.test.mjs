import test from "node:test";
import assert from "node:assert/strict";
import {buildChaosFlow} from "../public/chaos-flow-core.mjs";
import {formatChaosCode} from "./chaos-code-format.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";

test("Prettier formats JavaScript and JSON as actual parser output",async()=>{
 const js=await formatChaosCode({language:"javascript",code:"const x={a:1,b:2}"});
 assert.equal(js.valid,true);
 assert.match(js.formatted,/const x = \{/);
 assert.match(js.formatted,/a: 1/);
 assert.equal(js.changed,true);
 const json=await formatChaosCode({language:"json",code:'{"a":1,"b":2}'});
 assert.equal(json.valid,true);
 assert.match(json.formatted,/"a": 1/);
});
test("Formatting is bounded, read-only and never evaluates code",async()=>{
 globalThis.__chaosSentinel=0;
 const js=await formatChaosCode({code:"globalThis.__chaosSentinel=42;"});
 assert.equal(js.valid,true);
 assert.equal(globalThis.__chaosSentinel,0);
 delete globalThis.__chaosSentinel;
 const bad=await formatChaosCode({code:"const x = ;"});
 assert.equal(bad.valid,false);
 assert.ok(!("formatted" in bad));
 await assert.rejects(formatChaosCode({code:"a".repeat(10001)}),/10,000/);
 await assert.rejects(formatChaosCode({code:"const a=1",language:"python"}),/JavaScript, TypeScript/);
 await assert.rejects(formatChaosCode({code:"const a=1",print_width:5}),/40/);
});
test("Flowchart converts plain steps to deterministic safe Mermaid and graph",()=>{
 const result=buildChaosFlow({steps:"Idea -> Design -> Test -> Release"});
 assert.equal(result.nodes.length,4);
 assert.equal(result.edges.length,3);
 assert.match(result.mermaid,/N1 --> N2/);
 assert.equal(result.layers.N4,3);
 const branch=buildChaosFlow({steps:"Start -> Auth\nAuth -> Home\nAuth -> Login"});
 assert.equal(branch.nodes.length,4);
 assert.equal(branch.edges.length,3);
 assert.equal(branch.layers.N3,2);
 const lines=buildChaosFlow({steps:"Start\nCheck\nFinish"});
 assert.equal(lines.edges.length,2);
});
test("Flowchart parser rejects directives, HTML, cycles and excessive work",()=>{
 for(const steps of ["A -> <script>alert(1)</script>","A -> B\nB -> A",
   "A -> B; click A href https://evil.example",
   "A -> A",Array.from({length:19},(_,i)=>"Step "+i).join("\n")]){
  assert.throws(()=>buildChaosFlow({steps}));
 }
});
test("New tools are real server handlers and remain read-only",async()=>{
 const names=describeChaosTools(null);
 assert.ok(names.includes("dev.code_format"));
 assert.ok(names.includes("dev.diagram_flow"));
 const fmt=await dispatchChaosTool({name:"dev.code_format",input:{code:"const n=1"}});
 assert.equal(fmt.valid,true);
 const diagram=await dispatchChaosTool({name:"dev.diagram_flow",input:{steps:"Start -> Stop"}});
 assert.equal(diagram.edges.length,1);
 await assert.rejects(dispatchChaosTool({name:"god.audit_summary",input:{},principal:{id:22,role:"member"}}),/authorized/);
});
test("Explicit formatting and diagram requests bypass AI planning",async()=>{
 for(const [request,pattern] of [
   ["Format JavaScript code: const n={a:1}",/formatted/],
   ["Create flowchart: Start -> Login -> Home",/mermaid/]
 ]){
  let count=0,last;
  const ai={run:async(_model,args)=>{count++;last=args;return {response:"Done"};}};
  await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:request}]});
  assert.equal(count,1);
  assert.match(last.messages[0].content,pattern);
 }
});
