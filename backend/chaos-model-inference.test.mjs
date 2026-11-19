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
  const result=await inferWithChaosTools({ai,model:"test",messages:[{role:"user",content:"calculate 1+1"}],principal:{id:"test"}});
  assert.equal(result.response,"fallback");
});

test("ordinary conversation avoids planner model",async()=>{
 const models=[];
 const ai={run:async model=>{models.push(model);return {response:"hello"};}};
 await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"hello there"}],principal:{id:"test"}});
 assert.deepEqual(models,["fast"]);
});

test("tool planning executes calculator and returns final answer",async()=>{
 const calls=[];
 const ai={run:async (model,options)=>{
  calls.push({model,options});
  if(options.tools)return {tool_calls:[{name:"utility.calculate",arguments:{expression:"2+3*4"}}]};
  return {response:"14"};
 }};
 const result=await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"calculate 2+3*4"}],principal:{id:"test"}});
 assert.equal(result.response,"14");
 assert.equal(calls.length,2);
 assert.equal(calls[1].model,"fast");
 assert.ok(calls[1].options.messages[0].content.includes('"result":14'));
});

test("planner returns ordinary reply when no tool selected",async()=>{
 const calls=[];
 const ai={run:async (model,options)=>{calls.push(model);return {response:"plain"};}};
 const result=await inferWithChaosTools({ai,model:"fast",messages:[{role:"user",content:"where are the games"}],principal:{id:"test"}});
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
