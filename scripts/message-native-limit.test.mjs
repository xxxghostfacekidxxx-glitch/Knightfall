import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const config=JSON.parse(readFileSync(new URL("../backend/wrangler.jsonc",import.meta.url),"utf8"));
const start=source.indexOf("async function rateLimit(");
const end=source.indexOf("\nfunction getCookie(",start);
assert.ok(start!==-1&&end>start,"central rate limit implementation must be present");
const context={console:{warn(){}},Date,Math};
vm.runInNewContext(source.slice(start,end)+"\nthis.rateLimit=rateLimit;",context);
const rateLimit=context.rateLimit;
const request=new Request("https://api.ash-fall.com/api/messages/conversations/7",{method:"POST"});

test("the Worker declares a per-member 60-per-minute message limiter",()=>{
  const binding=config.ratelimits?.find(x=>x.name==="MESSAGE_RATE_LIMITER");
  assert.ok(binding);
  assert.equal(binding.simple.limit,60);
  assert.equal(binding.simple.period,60);
  assert.equal(config.observability.redact_query_string,true);
});

test("message sends use native per-member limits and reject exceeded attempts",async()=>{
  const keys=[],kv=[];
  const env={
    MESSAGE_RATE_LIMITER:{async limit({key}){keys.push(key);return{success:false};}},
    SESSIONS:{async get(){kv.push("get");throw Error("KV should not be queried");}}
  };
  assert.equal(await rateLimit(env,request,"message",60,60,77),false);
  assert.deepEqual(keys,["member:77"]);
  assert.deepEqual(kv,[]);
});

test("allowed native message sends are accepted without a KV write",async()=>{
  const env={
    MESSAGE_RATE_LIMITER:{async limit(){return{success:true};}},
    SESSIONS:{async get(){throw Error("KV should not be queried");}}
  };
  assert.equal(await rateLimit(env,request,"message",60,60,77),true);
});

test("non-message buckets preserve their existing KV limits",async()=>{
  let calls=0;
  const env={
    MESSAGE_RATE_LIMITER:{async limit(){throw Error("wrong limiter");}},
    SESSIONS:{
      async get(){calls++;return null;},
      async put(){calls++;}
    }
  };
  assert.equal(await rateLimit(env,request,"login",12,900,null),true);
  assert.equal(calls,2);
});

test("message rate limiting retains a KV fallback if the binding fails",async()=>{
  let reads=0;
  const env={
    MESSAGE_RATE_LIMITER:{async limit(){throw Error("limiter unavailable");}},
    SESSIONS:{
      async get(){reads++;return null;},
      async put(){}
    }
  };
  assert.equal(await rateLimit(env,request,"message",60,60,77),true);
  assert.equal(reads,1);
});
