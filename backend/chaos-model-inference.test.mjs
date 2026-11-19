import test from "node:test";
import assert from "node:assert/strict";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";
test("no tool call returns initial model response",async()=>{
  const ai={run:async()=>({response:"ready"})};
  const result=await inferWithChaosTools({ai,model:"test",messages:[{role:"user",content:"hi"}],principal:{id:"test"}});
  assert.equal(result.response,"ready");
});
test("unsupported tool schema falls back to ordinary chat",async()=>{
  const ai={run:async (_model,opts)=>{if(opts.tools)throw Error("unsupported tool schema");return {response:"fallback"};}};
  const result=await inferWithChaosTools({ai,model:"test",messages:[{role:"user",content:"research obscure jargon"}],principal:{id:"test"}});
  assert.equal(result.response,"fallback");
});

test("ordinary conversation avoids planner model",async()=>{
 const models=[];
 const ai={run:async model=>{models.push(model);return {response:"hello"};}};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"hello there"}],principal:{id:"test"}});
 assert.deepEqual(models,["fast"]);
});

test("simple arithmetic executes without paying for a planner model",async()=>{
 const calls=[];
 const ai={run:async (model,options)=>{
  calls.push({model,options});
  if(options.tools)return {tool_calls:[{name:"utility.calculate",arguments:{expression:"2+3*4"}}]};
  return {response:"14"};
 }};
 const result=await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"calculate 2+3*4"}],principal:{id:"test"}});
 assert.equal(result.response,"14");
 assert.equal(calls.length,1);
 assert.equal(calls[0].model,"fast");
 assert.ok(calls[0].options.messages[0].content.includes('"result":14'));
});

test("planner returns ordinary reply when no tool selected",async()=>{
 const calls=[];
 const ai={run:async (model,options)=>{calls.push(model);return {response:"plain"};}};
 const result=await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"recommend something fun"}],principal:{id:"test"}});
 assert.equal(result.response,"plain");
 assert.equal(calls.length,2);
});

test("tool selection refuses unknown names",async()=>{
 const {runChaosModelCalls}=await import("./chaos-model-tools.mjs");
 await assert.rejects(runChaosModelCalls([{name:"unlisted.action",arguments:{}}],{id:"test"}));
});

test("explicit conversions use measured results even without planner model",async()=>{
 const calls=[];
 const ai={run:async (_model,options)=>{calls.push(options);return {response:"12 inches equals 30.48 cm"};}};
 const result=await inferWithChaosTools({ai,model:"fast",
  messages:[{role:"system",content:"Only report proven values"},{role:"user",content:"Convert 12 inches to cm"}],
  principal:{id:1,role:"member"}});
 assert.equal(result.response,"12 inches equals 30.48 cm");
 assert.equal(calls.length,1,"deterministic conversion must not spend another model call on planning");
 assert.match(calls[0].messages[0].content,/"result":30.48/);
 assert.match(calls[0].messages[0].content,/utility.convert/);
});

test("direct free-resource requests cite results without relying on planner availability",async()=>{
 const seen=[];
 const ai={run:async(_model,opts)=>{seen.push(opts);return {response:"verified source links"};}};
 const handlers={
  "resource.polyhaven":async({input})=>({source:"Poly Haven",results:[{title:"Leather",url:"https://polyhaven.com/a/leather_01",type:input.type}]}),
  "resource.met":async()=>({source:"The Met",results:[{url:"https://www.metmuseum.org/art/collection/search/123"}]}),
  "resource.wikidata":async()=>({source:"Wikidata",results:[{url:"https://www.wikidata.org/wiki/Q42"}]}),
  "research.wikipedia":async()=>({source:"Wikipedia",results:[{url:"https://en.wikipedia.org/wiki/Dragonfly"}]})
 };
 for(const [prompt,source] of [
  ["Find CC0 leather textures on Poly Haven","Poly Haven"],
  ["Find historical costumes at The Met","The Met"],
  ["Research Wikipedia and Wikidata for dragonflies","Wikidata"]
 ]){
   seen.length=0;
   await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:prompt}],principal:{id:7},handlers});
   assert.equal(seen.length,1,"explicit named source should skip the expensive planner: "+prompt);
   assert.match(seen[0].messages[0].content,new RegExp(source));
 }
 assert.match(seen[0].messages[0].content,/Wikipedia/,"pairwise lookup should include the second source");
});
test("one failed source preserves other verified results in a two-library lookup",async()=>{
 const seen=[];
 const ai={run:async(_model,opts)=>{seen.push(opts);return {response:"one source available"};}};
 const handlers={
  "resource.wikidata":async()=>{throw Error("upstream timeout: sensitive secret should not leak");},
  "research.wikipedia":async()=>({source:"Wikipedia",results:[{title:"Dragonflies",url:"https://en.wikipedia.org/wiki/Dragonfly"}]})
 };
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"Research Wikipedia and Wikidata for dragonflies"}],handlers});
 assert.equal(seen.length,1);
 const evidence=seen[0].messages[0].content;
 assert.match(evidence,/"name":"research.wikipedia","result":/);
 assert.match(evidence,/Dragonfly/);
 assert.match(evidence,/"name":"resource.wikidata","available":false/);
 assert.doesNotMatch(evidence,/sensitive secret/);
});
test("bad selected tools cannot suppress valid public tool evidence",async()=>{
 const seen=[];
 const ai={run:async (_model,opts)=>{
  seen.push(opts);
  if(opts.tools)return {tool_calls:[
   {name:"site.search",arguments:{query:"arcade"}},
   {name:"shell.exec",arguments:{command:"whoami"}}
  ]};
  return {response:"see arcade link"};
 }};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"research arcade and debug options"}]});
 assert.equal(seen.length,2);
 const evidence=seen[1].messages[0].content;
 assert.match(evidence,/chaos-cartridge.html/);
 assert.match(evidence,/"name":"unsupported_tool","available":false/);
 assert.doesNotMatch(evidence,/whoami/);
});
test("instant public utilities do not require a planner or member account",async()=>{
 const calls=[];
 const ai={run:async(_model,opts)=>{calls.push(opts);return{response:"verified"};}};
 const handlers={"radar.moon":async()=>({phase:"waxing crescent"}),
   "utility.now":async({input})=>({timezone:input.timezone,local:"verified clock"})};
 for(const prompt of ["Calculate 3*7","Count words: little chaos goblins","What is the moon phase today?","What time in America/Chicago?","Where is the arcade?"]){
  calls.length=0;
  await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:prompt}],principal:null,handlers});
  assert.equal(calls.length,1,prompt);
  assert.match(calls[0].messages[0].content,/available":true/,prompt);
 }
});
test("planner outage explicitly says no research was retrieved",async()=>{
 const seen=[];
 const ai={run:async(_model,opts)=>{
  if(opts.tools)throw Error("plan temporarily unavailable");
  seen.push(opts);
  return {response:"I cannot verify that right now."};
 }};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"research unverified breaking science"}]});
 assert.match(seen[0].messages[0].content,/NO live lookup/);
});
