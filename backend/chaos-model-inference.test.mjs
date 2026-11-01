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
  const result=await inferWithChaosTools({ai,model:"test",messages:[],principal:{id:"test"}});
  assert.equal(result.response,"fallback");
});
