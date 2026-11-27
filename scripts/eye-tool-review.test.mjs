import test from "node:test";
import assert from "node:assert/strict";
import {canReviewTools,handleEyeToolReview} from "../backend/src/eye-tool-review.mjs";
const owner={id:7,role:"god",status:"active"};
function fixture(user=owner,partner={invited_by:7}){
 let saved=null,requests=0,writes=0;
 const env={DB:{prepare(sql){return {bind(...args){this.args=args;return this;},async first(){return sql.includes("ai_handoff_partner")?partner:saved?{value:saved}:null;},async run(){writes++;saved=this.args[1];}};}}};
 const fetcher=async(url,opts)=>{requests++;assert.equal(url,"https://api.github.com/repos/example/project");assert.equal(opts.credentials,"omit");return {ok:true,json:async()=>({full_name:"example/project",private:false,license:{spdx_id:"MIT"}})};};
 const respond=(data,status=200)=>({status,data});
 const call=(suffix="",opts={})=>{const url=new URL("https://api.ash-fall.com/api/god/eye/tools"+suffix);return handleEyeToolReview(new Request(url,opts),env,url,user,respond,{fetcher});};
 const decision=(value,origin="https://ash-fall.com")=>call("/alien-eyes/decision",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify({decision:value})});
 return {call,decision,counts:()=>({requests,writes})};
}
test("verified active owner only, including another GOD identity",async()=>{for(const u of [null,{id:7,role:"admin",status:"active",is_isis:1},{id:8,role:"god",status:"active"},{...owner,status:"suspended"}]){const f=fixture(u);assert.equal((await f.call()).status,403);assert.deepEqual(f.counts(),{requests:0,writes:0});}assert.equal(canReviewTools(owner,null),false);assert.equal(canReviewTools(owner,{invited_by:7}),true);});
test("review defaults private and public approval is only a recorded decision",async()=>{const f=fixture();assert.equal((await f.call()).data.tools[0].decision,"pending");assert.equal((await f.decision("public")).status,200);const t=(await f.call()).data.tools[0];assert.equal(t.decision,"public");assert.equal(t.execution,"owner-only");assert.equal((await f.decision("isis")).status,200);assert.equal((await f.decision("scrapped")).status,200);assert.equal((await f.call("/alien-eyes/inspect?repository=example/project")).status,403);assert.equal(f.counts().requests,0);});
test("reject cross-origin writes, invalid decisions and malformed project inputs",async()=>{const f=fixture();assert.equal((await f.decision("public","https://evil.example")).status,403);assert.equal((await f.decision("unknown")).status,400);assert.equal((await f.call("/alien-eyes/inspect?repository=bad")).status,400);assert.deepEqual(f.counts(),{requests:0,writes:0});const r=await f.call("/alien-eyes/inspect?repository=example/project");assert.equal(r.status,200);assert.equal(r.data.report.license,"MIT");assert.equal(f.counts().requests,1);});
