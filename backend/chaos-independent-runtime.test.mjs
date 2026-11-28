import test from "node:test";
import assert from "node:assert/strict";
import {ENGINES,chooseChaosEngine,createChaosInference} from "./chaos-independent-runtime.mjs";
test("economy is default and untrusted model names cannot select engines",()=>{
 assert.equal(chooseChaosEngine({message:"write code in Python"}),"fast");
 assert.equal(chooseChaosEngine({message:"write code in Python",mode:"https://evil.invalid"}),"fast");
 assert.equal(chooseChaosEngine({message:"hello",mode:"adaptive"}),"fast");
});
test("adaptive routes creative, code and deeper tasks separately",()=>{
 for(const [message,route] of [["write a story","creative"],["debug this JavaScript function","code"],["explain in depth","depth"]])assert.equal(chooseChaosEngine({message,mode:"adaptive"}),route);
});
test("model failover is bounded, preserves messages and never retries quota or authorization",async()=>{
 const calls=[];const options={messages:[{role:"system",content:"identity"},{role:"user",content:"write a story"}]};
 const r=createChaosInference({ai:{run:async(model,opts)=>{calls.push([model,opts]);if(model===ENGINES.creative)throw Object.assign(new Error("temporarily unavailable"),{status:503});return {response:"answer"};}},mode:"adaptive",message:"write a story"});
 assert.equal((await r.ai.run(r.model,options)).response,"answer");
 assert.deepEqual(calls.map(c=>c[0]),[ENGINES.creative,ENGINES.fast]);assert.equal(calls[0][1],options);assert.equal(calls[1][1],options);assert.equal(r.metadata().fallback,true);assert.equal(r.metadata().engine,"fast");
 await assert.rejects(r.ai.run(r.model,options),/limit/);
 for(const status of [401,403,429,402]){let count=0;const v=createChaosInference({ai:{run:async()=>{count++;throw Object.assign(new Error("denied"),{status});}},mode:"adaptive",message:"write a story"});await assert.rejects(v.ai.run(v.model,options));assert.equal(count,1);}
});
test("planner does not consume final answer budget or change model route",async()=>{
 const calls=[];const r=createChaosInference({ai:{run:async(model,opts)=>{calls.push(model);return opts.tools?{tool_calls:[]}:{response:"ok"};}},mode:"adaptive",message:"debug my code"});
 await r.ai.run(ENGINES.depth,{tools:[]});await r.ai.run(r.model,{messages:[]});assert.deepEqual(calls,[ENGINES.depth,ENGINES.code]);assert.equal(r.metadata().engine,"code");
});
test("stream returned unchanged; no replay after reader handed to caller",async()=>{
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array([65]));c.close();}});
 const r=createChaosInference({ai:{run:async()=>stream},mode:"adaptive",message:"write a story"});
 assert.equal(await r.ai.run(r.model,{stream:true}),stream);assert.equal(r.metadata().engine,"creative");
});

test("hosted inference metadata does not claim original weights",async()=>{const r=createChaosInference({ai:{run:async()=>({response:"ok"})}});await r.ai.run(r.model,{messages:[]});assert.equal(r.metadata().runtimeTitle,"Miss Chaos Core");assert.equal(r.metadata().inferenceOrigin,"hosted-provider");assert.equal(r.metadata().originalWeights,false);assert.equal(r.metadata().model,ENGINES.fast);});
