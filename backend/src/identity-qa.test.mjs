import test from "node:test";
import assert from "node:assert/strict";
import {readIdentityQA,IDENTITY_QA_WORKERS} from "./identity-qa.js";
test("fixture success cannot conceal skipped live authentication",async()=>{
 let calls=0;
 const data=await readIdentityQA(async()=>({ok:true,json:async()=>++calls===1?{workflow_runs:[{id:123,status:"completed",conclusion:"success",head_sha:"a".repeat(40)}]}:{jobs:[{id:4,name:IDENTITY_QA_WORKERS[0].job,status:"completed",conclusion:"success"},{id:5,name:IDENTITY_QA_WORKERS[2].job,status:"completed",conclusion:"skipped"},{id:6,name:"Unrelated",status:"completed",conclusion:"success"}]}}));
 assert.equal(data.jobs.length,3);assert.equal(data.jobs[0].conclusion,"success");assert.equal(data.jobs[1].status,"not_reported");assert.equal(data.jobs[2].conclusion,"skipped");
});
test("missing runs and network errors stay unverified",async()=>{
 for(const f of [async()=>{throw Error("offline")},async()=>({ok:false,status:403}),async()=>({ok:true,json:async()=>({workflow_runs:[]})})])assert.equal((await readIdentityQA(f)).verified,false);
});
test("run success does not fabricate missing job evidence",async()=>{
 let calls=0;const data=await readIdentityQA(async()=>++calls===1?{ok:true,json:async()=>({workflow_runs:[{id:1,status:"completed",conclusion:"success"}]})}:{ok:false,status:403});
 assert.equal(data.verified,true);assert.equal(data.jobs_verified,false);assert.deepEqual(data.jobs,[]);
});
