import test from "node:test";
import assert from "node:assert/strict";
import {handleEyeOfHorus,eyeBrowseQuery,EYE_DATASETS} from "./eye-of-horus.js";

function setup(role="god"){
 const user=role==="guest"?null:{id:14,role,status:"active"};
 const reads=[],writes=[];
 const env={DB:{prepare(sql){
   reads.push(sql);
   let bindings=[];
   return {
    bind(...args){bindings=args;return this;},
    async all(){return {results:[{id:5,user_id:23,body:"Stored deleted message",deleted_at:"2026-11-14"}]};},
    async first(){if(sql.includes("profile_photos WHERE id="))return {object_key:"photo/example",content_type:"image/png",size_bytes:4};return null;},
    async run(){writes.push({sql,bindings});return {meta:{changes:1}}}
   }
 }},PROFILE_MEDIA:{async get(){return {body:new Uint8Array([137,80,78,71]),size:4}}}};
 const deps={requireUser:async()=>user,json:(data,status=200,origin,headers={})=>new Response(JSON.stringify(data),{status,headers}),origin:"https://ash-fall.com"};
 function call(path,method="GET"){const req=new Request("https://api.ash-fall.com"+path,{method});return handleEyeOfHorus(req,env,new URL(req.url),deps)}
 return {call,reads,writes};
}
test("GOD alone can access private records, without second password or review reason",async()=>{
 for(const role of ["guest","member","moderator","admin"]){
  const f=setup(role);
  const r=await f.call("/api/god/eye/browse?category=direct_messages");
  assert.equal(r.status,role==="guest"?401:403,role);
  assert.equal(f.reads.length,0);
 }
 const god=setup();
 const r=await god.call("/api/god/eye/browse?category=direct_messages");
 assert.equal(r.status,200);
 const d=await r.json();assert.equal(d.items[0].body,"Stored deleted message");
 assert.equal(god.writes.length,0,"private reads must not write application audit logs");
 assert.match(r.headers.get("cache-control"),/no-store/);
});
test("GOD can enumerate datasets and view private photo without approval form",async()=>{
 const f=setup(),status=await f.call("/api/god/eye/status");
 assert.equal((await status.json()).god,true);
 assert.equal((await f.call("/api/god/eye/media/profile_photos/5")).status,200);
 assert.equal(f.writes.length,0);
 assert.equal((await f.call("/api/god/eye/media/profile_photos/whatever")).status,404);
});
test("browse query includes deleted records and has bound filters",()=>{
 const q=eyeBrowseQuery("direct_messages",25,10,23);
 assert.match(q.sql,/EXISTS\(SELECT 1 FROM conversation_members/);
 assert.doesNotMatch(q.sql,/m.deleted_at IS NULL/);
 assert.deepEqual(q.params,[23,25,10]);
 const m=eyeBrowseQuery("memo_mail",10,5,7);
 assert.deepEqual(m.params,[7,7,10,5]);
 for(const category of Object.keys(EYE_DATASETS)){
  assert.match(eyeBrowseQuery(category).sql,/LIMIT \? OFFSET \?$/);
 }
 assert.throws(()=>eyeBrowseQuery("users;DROP TABLE users"));
});
test("private browser rejects writes, arbitrary collections and malformed pagination",async()=>{
 const f=setup();
 assert.equal((await f.call("/api/god/eye/browse?category=bad")).status,400);
 assert.equal((await f.call("/api/god/eye/browse?category=direct_messages&limit=999")).status,400);
 assert.equal((await f.call("/api/god/eye/browse?category=direct_messages","POST")).status,405);
 assert.equal(f.writes.length,0);
});
