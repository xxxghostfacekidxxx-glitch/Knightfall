import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleEyeOfHorus,eyeReviewQuery} from "./eye-of-horus.js";

const reason="Investigating a documented account security incident.";
const json=(payload,status=200,origin,extra={})=>new Response(JSON.stringify(payload),{status,headers:{"content-type":"application/json",...extra}});
function fixture(role="god"){
 const sessions=new Map(),writes=[],queries=[];
 const user=role==="guest"?null:{id:7,role,status:"active",public_title:role==="member"?"Digital Creator":null};
 let failLedger=false;
 const env={
  SESSIONS:{
   async get(key){return sessions.get(key)||null},
   async put(key,value){sessions.set(key,JSON.parse(value))},
   async delete(key){sessions.delete(key)}
  },
  DB:{prepare(sql){
   queries.push(sql);
   let params=[];
   return {
    bind(...values){params=values;return this;},
    async first(){
     if(sql.startsWith("SELECT password_hash"))return {password_hash:"stored"};
     if(sql.startsWith("SELECT object_key,content_type,size_bytes FROM profile_photos"))return {object_key:"pictures/example",content_type:"image/png",size_bytes:4};
     return null;
    },
    async all(){
     if(sql.includes("FROM profile_photos p"))return {results:[{id:5,user_id:12,username:"fixture",kind:"gallery",content_type:"image/png",created_at:"2026-11-14T00:00:00Z"}]};
     if(sql.includes("FROM messages m JOIN users u"))return {results:[{id:11,conversation_id:2,sender_id:12,sender:"fixture",body:"Stored test message",created_at:"2026-11-14T00:00:00Z"}]};
     return {results:[]};
    },
    async run(){
     if(failLedger&&sql.includes("eye_of_horus_access_log"))throw Error("Audit storage failed");
     writes.push({sql,params});return {success:true};
    }
   };
  }},
  PROFILE_MEDIA:{async get(key){assert.equal(key,"pictures/example");return {body:new Uint8Array([137,80,78,71]),size:4}}}
 };
 const deps={requireUser:async()=>user,json,origin:"https://ash-fall.com",
  getCookie:()=> "fixture",verifyPassword:async(value)=>value==="good-password",
  rateLimit:async()=>true,audit:async()=>{}};
 function call(path,method="GET",body,siteOrigin="https://ash-fall.com"){
  const request=new Request("https://api.ash-fall.com"+path,{method,
   headers:{"cookie":"knightfall_session=fixture","origin":siteOrigin,"content-type":"application/json"},
   body:method==="GET"?undefined:JSON.stringify(body||{})});
  return handleEyeOfHorus(request,env,new URL(request.url),deps);
 }
 return {call,queries,writes,sessions,setLedgerFailure:v=>{failLedger=v}};
}
test("eye privilege is God-only, even for Admin or Digital Creator",async()=>{
 for(const role of ["guest","member","admin","moderator"]){
  const f=fixture(role),r=await f.call("/api/god/eye/status");
  assert.equal(r.status,role==="guest"?401:403,role);
  assert.equal(f.queries.length,0);
 }
 const f=fixture("god"),r=await f.call("/api/god/eye/status");
 assert.deepEqual(await r.json(),{god:true,unlocked:false,expires_at:null});
});
test("unlock requires same-origin password re-verification and locks after request",async()=>{
 const f=fixture();
 assert.equal((await f.call("/api/god/eye/unlock","POST",{password:"good-password"},"https://evil.example")).status,403);
 assert.equal((await f.call("/api/god/eye/unlock","POST",{password:"incorrect"})).status,403);
 assert.equal((await f.call("/api/god/eye/review","POST",{category:"direct_messages",reason})).status,403);
 assert.equal((await f.call("/api/god/eye/unlock","POST",{password:"good-password"})).status,200);
 assert.equal((await (await f.call("/api/god/eye/status")).json()).unlocked,true);
 assert.equal((await f.call("/api/god/eye/lock","POST")).status,200);
 assert.equal((await f.call("/api/god/eye/review","POST",{category:"direct_messages",reason})).status,403);
});
test("reading private messages requires documented reason and persists the reason to audit",async()=>{
 const f=fixture();
 await f.call("/api/god/eye/unlock","POST",{password:"good-password"});
 assert.equal((await f.call("/api/god/eye/review","POST",{category:"direct_messages",reason:"too short"})).status,400);
 assert.equal((await f.call("/api/god/eye/review","POST",{category:"unknown",reason})).status,400);
 const resp=await f.call("/api/god/eye/review","POST",{category:"direct_messages",reason,user_id:12});
 assert.equal(resp.status,200);const data=await resp.json();
 assert.equal(data.items.length,1);assert.equal(data.items[0].body,"Stored test message");
 const row=f.writes.find(x=>x.sql.includes("eye_of_horus_access_log"));
 assert.ok(row);assert.equal(row.params[3],reason);assert.equal(row.params[4],12);
 assert.ok(f.queries.some(sql=>sql.includes("m.deleted_at IS NULL")));
});
test("only previously reviewed media IDs can be previewed; previews are audited",async()=>{
 const f=fixture();
 await f.call("/api/god/eye/unlock","POST",{password:"good-password"});
 assert.equal((await f.call("/api/god/eye/media/profile_photos/5")).status,403);
 await f.call("/api/god/eye/review","POST",{category:"profile_photos",reason});
 assert.equal((await f.call("/api/god/eye/media/profile_photos/999")).status,403);
 const pic=await f.call("/api/god/eye/media/profile_photos/5");
 assert.equal(pic.status,200);
 assert.match(pic.headers.get("cache-control"),/no-store/);
 assert.equal(pic.headers.get("content-type"),"image/png");
 assert.ok(f.writes.find(x=>x.params[1]==="media_preview"&&x.params[5]==="5"));
});
test("a failed access-ledger write never returns private content",async()=>{
 const f=fixture();
 await f.call("/api/god/eye/unlock","POST",{password:"good-password"});
 f.setLedgerFailure(true);
 await assert.rejects(f.call("/api/god/eye/review","POST",{category:"direct_messages",reason}),/Audit storage failed/);
 assert.equal(f.sessions.has("eye:purpose:fixture"),false);
});
test("all review datasets use bounded pagination and correctly qualified SQL columns",()=>{
 for(const category of ["direct_messages","miss_chaos","personal_bot_chats","profile_photos","message_attachments","bot_definitions"]){
  const {sql,parameters}=eyeReviewQuery(category,25,30,12);
  assert.match(sql,/LIMIT \? OFFSET \?$/);assert.equal(parameters.length,3);
  assert.deepEqual(parameters,[12,25,30]);
  assert.match(sql,/ORDER BY [bmap]\.created_at DESC, [bmap]\.id DESC/);
 }
 const source=readFileSync(new URL("./index.js",import.meta.url),"utf8");
 assert.match(source,/const eyeResponse=await handleEyeOfHorus/);
 assert.match(source,/const oldPrivateRead=/);
 assert.match(source,/if\(!membership\)return json\(\{error:"Conversation not found\."\}/);
});
