import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {
 validateDevReviewInput,inspectDevReviewCandidate,handleChaosDevReviews
} from "./chaos-dev-reviews.js";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const sha="a".repeat(40);
const original="export const status = 'pending';";
const candidate="export const status = 'ready';";
const sample=()=>({source_sha:sha,path:"public/test-review.mjs",original,candidate,
 summary:"Change the static state from pending to ready."});
function source(p=sample(),opts={}){
 return async()=>({available:true,branch:"main",path:p.path,commit_sha:opts.sha||p.source_sha,
   start_line:1,total_lines:p.original.split("\n").length,source_url:"https://raw.githubusercontent.com/example/sha/file",
   lines:p.original.split("\n").map((text,i)=>({number:i+1,text})),long_lines_omitted:false});
}
function fixture({role="god",delegated=false,policy=[],ready=true,readSource=source()}={}){
 const rows=new Map(),events=[],queries=[];
 const db={prepare(sql){
   const command={sql,args:[],bind(...args){this.args=args;return this;},
     async first(){
       queries.push({sql,args:this.args});
       if(sql.includes("SELECT value FROM site_settings"))return {value:JSON.stringify(policy)};
       if(sql.includes("sqlite_master"))return {ready:ready?2:0};
       if(sql.includes("FROM ai_handoff_partner"))
         return delegated?{user_id:22,invited_by:1,status:"accepted"}:null;
       if(sql.includes("SELECT * FROM chaos_dev_reviews WHERE id="))return rows.get(this.args[0])||null;
       return null;
     },
     async all(){
       queries.push({sql,args:this.args});
       if(sql.includes("FROM chaos_dev_reviews")){
         const list=[...rows.values()];
         return {results:sql.includes("WHERE status=?")?list.filter(r=>r.status===this.args[0]):list};
       }
       if(sql.includes("FROM chaos_dev_review_events"))
         return {results:events.filter(e=>e.proposal_id===this.args[0])};
       return {results:[]};
     },
     async run(){
       queries.push({sql,args:this.args});
       const a=this.args;
       if(sql.startsWith("INSERT INTO chaos_dev_reviews(")){
         rows.set(a[0],{id:a[0],author_id:a[1],source_sha:a[2],path:a[3],
           original:a[4],candidate:a[5],change_summary:a[6],syntax_status:a[7],
           status:"pending",revision:1,reviewer_id:null,review_note:null,reviewed_at:null,
           created_at:"2026-11-19T22:00:00Z",updated_at:"2026-11-19T22:00:00Z"});
         return {meta:{changes:1}};
       }
       if(sql.startsWith("UPDATE chaos_dev_reviews SET status=?")){
         const row=rows.get(a[3]);
         if(!row||row.revision!==a[4]||row.status!=="pending")return {meta:{changes:0}};
         Object.assign(row,{status:a[0],reviewer_id:a[1],review_note:a[2],reviewed_at:"2026-11-19T22:10:00Z",updated_at:"2026-11-19T22:10:00Z"});
         return {meta:{changes:1}};
       }
       if(sql.startsWith("INSERT INTO chaos_dev_review_events")){
         if(sql.includes("SELECT id,")){
           const row=rows.get(a[2]);
           if(!row||row.revision!==a[3]||row.status!==a[4])return {meta:{changes:0}};
           events.push({proposal_id:row.id,actor_id:a[0],action:a[1],source_sha:row.source_sha,occurred_at:"2026-11-19T22:10:00Z"});
         }else{
           events.push({proposal_id:a[0],actor_id:a[1],action:a[2],source_sha:a[3],occurred_at:"2026-11-19T22:00:00Z"});
         }
         return {meta:{changes:1}};
       }
       return {meta:{changes:0}};
     }};
   return command;
  },
  async batch(statements){const results=[];for(const item of statements)results.push(await item.run());return results;}
 };
 const env={DB:db};
 const deps={requireUser:async()=>role==="guest"?null:{id:role==="god"?1:22,role,status:"active"},
   rateLimit:async()=>true,
   json:(body,status=200,origin,extra={})=>new Response(JSON.stringify(body),
     {status,headers:{"content-type":"application/json",...extra}}),
   origin:"https://ash-fall.com",readSource};
 const call=async(path="/api/chaos/dev-reviews",method="GET",data={},origin="https://ash-fall.com")=>{
   const req=new Request("https://api.ash-fall.com"+path,
     {method,headers:{...(method!=="GET"?{"content-type":"application/json"}:{}),origin},
       ...(method!=="GET"?{body:JSON.stringify(data)}:{})});
   const response=await handleChaosDevReviews(req,env,new URL(req.url),deps);
   return {status:response.status,data:await response.json()};
 };
 return {call,rows,events,queries};
}
test("strict full-file input validation blocks traversal, bloated text and no-ops",()=>{
 assert.deepEqual(validateDevReviewInput(sample()),sample());
 assert.throws(()=>validateDevReviewInput({...sample(),path:"../.env"}),/Choose a public/);
 assert.throws(()=>validateDevReviewInput({...sample(),source_sha:"main"}),/40-character/);
 assert.throws(()=>validateDevReviewInput({...sample(),candidate:original}),/No actual change/);
 assert.throws(()=>validateDevReviewInput({...sample(),original:"a".repeat(5001)}),/5,000/);
 assert.throws(()=>validateDevReviewInput({...sample(),candidate:"a\n".repeat(81)}),/80 lines/);
 assert.throws(()=>validateDevReviewInput({...sample(),candidate:"a".repeat(301)}),/300-character/);
 assert.throws(()=>validateDevReviewInput({...sample(),summary:"Too short"}),/12–360/);
});
test("source HEAD and exact original text must match GitHub before storing anything",async()=>{
 const changed=await source(sample(),{sha:"b".repeat(40)})();
 await assert.rejects(()=>inspectDevReviewCandidate(sample(),{readSource:source(sample(),{sha:"b".repeat(40)})}),/stale/);
 await assert.rejects(()=>inspectDevReviewCandidate(sample(),{readSource:async()=>({...changed,commit_sha:sha,lines:[{number:1,text:"export const status = 'tampered';"}]})}),/differs/);
 await assert.rejects(()=>inspectDevReviewCandidate(sample(),{readSource:async()=>({
   ...await source()(),long_lines_omitted:true
 })}),/incomplete/);
 const valid=await inspectDevReviewCandidate(sample(),{readSource:source()});
 assert.equal(valid.verified,true);
 assert.equal(valid.syntax_status,"passed");
 assert.match(valid.diff.unified_diff,/ready/);
 assert.equal(valid.diff.added_lines>0,true);
 await assert.rejects(()=>inspectDevReviewCandidate({...sample(),candidate:"export const x = ;"},{readSource:source()}),/syntax failed/);
});
test("anonymous/member/ordinary admin cannot access reviewer decisions",async()=>{
 const guest=fixture({role:"guest"});
 assert.equal((await guest.call()).status,401);
 const member=fixture({role:"member"});
 assert.equal((await member.call()).status,403);
 const admin=fixture({role:"admin"});
 assert.equal((await admin.call("/api/chaos/dev-reviews/11111111-1111-4111-8111-111111111111/approve","POST",{revision:1,note:"Checked this exact diff."})).status,403);
 assert.equal(admin.queries.some(q=>q.sql.includes("INSERT INTO chaos_dev_reviews")),false);
});
test("wrong origin, missing schema and stale source deny review writes without a commit",async()=>{
 const f=fixture();
 assert.equal((await f.call("/api/chaos/dev-reviews","POST",sample(),"https://evil.example")).status,403);
 const missing=fixture({ready:false});
 const response=await missing.call("/api/chaos/dev-reviews","POST",sample());
 assert.equal(response.status,503);
 assert.equal(response.data.schema_ready,false);
 const stale=fixture({readSource:source(sample(),{sha:"b".repeat(40)})});
 const submit=await stale.call("/api/chaos/dev-reviews","POST",sample());
 assert.equal(submit.status,409);
 assert.equal(stale.rows.size,0);
});
test("staff submit immutable proposal, version review and audited GOD approval without integration",async()=>{
 const f=fixture();
 const created=await f.call("/api/chaos/dev-reviews","POST",sample());
 assert.equal(created.status,201);
 assert.equal(created.data.status,"pending");
 assert.equal(created.data.integration_status,"not_integrated");
 assert.equal(f.rows.size,1);
 assert.equal(f.events[0].action,"submitted");
 const id=created.data.id;
 assert.match(id,/^[0-9a-f-]{36}$/);
 const item=await f.call("/api/chaos/dev-reviews/"+id);
 assert.equal(item.status,200);
 assert.equal(item.data.original,original);
 assert.equal(item.data.candidate,candidate);
 assert.match(item.data.diff,/ready/);
 const list=await f.call();
 assert.equal(list.data.reviews.length,1);
 assert.equal(list.data.reviews[0].integration_status,"not_integrated");
 const approved=await f.call("/api/chaos/dev-reviews/"+id+"/approve","POST",
   {revision:1,note:"Reviewed actual static change, separate tests and deployment still required."});
 assert.equal(approved.status,200);
 assert.equal(approved.data.status,"approved");
 assert.equal(approved.data.deployment_status,"not_deployed");
 assert.equal(f.rows.get(id).reviewer_id,1);
 assert.deepEqual(f.events.map(e=>e.action),["submitted","approved"]);
 assert.equal((await f.call("/api/chaos/dev-reviews/"+id+"/approve","POST",
   {revision:1,note:"Trying duplicate approval after first decision."})).status,409);
 assert.deepEqual(f.events.map(e=>e.action),["submitted","approved"]);
});
test("accepted admin Isis can sign; ordinary admin cannot, and GOD-only control stays separate",async()=>{
 const f=fixture({role:"admin",delegated:true,policy:["isis"]});
 const {data}=await f.call("/api/chaos/dev-reviews","POST",sample());
 assert.equal(data.status,"pending");
 const approve=await f.call("/api/chaos/dev-reviews/"+data.id+"/reject","POST",
   {revision:1,note:"Reject until candidate unit tests are designed and run."});
 assert.equal(approve.status,200);
 assert.equal(approve.data.status,"rejected");
 assert.equal(f.rows.get(data.id).reviewer_id,22);
});
test("stale HEAD between submission and approval leaves exact proposal pending",async()=>{
 let current=sha;
 const reader=async()=>({...await source()(),commit_sha:current});
 const f=fixture({readSource:reader});
 const submitted=await f.call("/api/chaos/dev-reviews","POST",sample());
 assert.equal(submitted.status,201);
 current="b".repeat(40);
 const blocked=await f.call("/api/chaos/dev-reviews/"+submitted.data.id+"/approve","POST",
   {revision:1,note:"This is meant to fail when the immutable source changed."});
 assert.equal(blocked.status,409);
 assert.equal(f.rows.get(submitted.data.id).status,"pending");
 assert.deepEqual(f.events.map(e=>e.action),["submitted"]);
});
test("UI only exposes approval to verified backend and never calls GitHub write",()=>{
 const html=readFileSync(new URL("../../public/eye-of-chaos.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../../public/chaos-dev-review-ui.mjs",import.meta.url),"utf8");
 const studio=readFileSync(new URL("../../public/chaos-code-studio.js",import.meta.url),"utf8");
 const studioHTML=readFileSync(new URL("../../public/chaos-code-studio.html",import.meta.url),"utf8");
 for(const id of ["studio-dev-review-summary","studio-dev-review-submit","studio-dev-review-status"])
   assert.match(studioHTML,new RegExp('id="'+id+'"'));
 for(const id of ["chaos-dev-review-panel","chaos-dev-review-list","chaos-dev-review-refresh"])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(ui,/response\.can_approve===true/);
 assert.match(ui,/window\.confirm\(/);
 assert.match(ui,/NO source will be applied/);
 assert.match(studio,/reviewSubmission=fullFile/);
 assert.match(studio,/devSubmit\.addEventListener\("click"/);
 assert.match(studio,/code\.value!==proposal\.candidate/);
 assert.match(studio,/\/api\/chaos\/dev-reviews/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=|eval\s*\(|github\.com\/repos\/.*\/contents/);
 assert.doesNotMatch(studio,/fetch\(.*github\.com\/repos\/.*method:"PUT"/);
});

test("accepted Isis and ordinary admin have no developer docket access by default",async()=>{for(const delegated of [true,false])assert.equal((await fixture({role:"admin",delegated}).call()).status,403);assert.equal((await fixture({role:"god"}).call("/api/chaos/dev-reviews/policy")).status,200);});
