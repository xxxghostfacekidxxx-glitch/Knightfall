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
