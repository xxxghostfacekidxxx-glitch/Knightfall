import test from "node:test";
import assert from "node:assert/strict";
import {handleMessageSummary} from "./message-conversation-summary.js";

const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{"content-type":"application/json"}});
function harness({user={id:17,role:"member"},member=true,kind="direct",blocked=false,other=true}={}){
 const calls=[];
 const env={DB:{prepare(sql){
  const record={sql,params:[]};calls.push(record);
  return{bind(...params){
   record.params=params;
   return{async first(){
    if(sql.includes("SELECT muted_until FROM conversation_members"))
      return member?{muted_until:null}:null;
    if(sql.includes("FROM conversations WHERE id="))
      return{id:712,kind,name:kind==="group"?"The Misfits":null,created_at:"2026-10-10",updated_at:"2026-11-13"};
    if(sql.includes("COUNT(*) AS n"))return{n:4};
    if(sql.includes("FROM user_blocks"))return blocked?{blocked:1}:null;
    if(sql.includes("FROM conversation_members cm JOIN users u"))
      return other?{id:22,username:"crew22",display_name:"Crew Member",avatar_url:null,last_seen_at:null,other_is_online:0}:null;
    throw Error("Unexpected SQL: "+sql);
   }};
  }};
 }}};
 async function request(path="/api/messages/conversations/712/summary",method="GET"){
  const req=new Request("https://api.ash-fall.com"+path,{method});
  const res=await handleMessageSummary(req,env,new URL(req.url),{getUser:async()=>user,json,origin:"https://ash-fall.com"});
  return{status:res.status,data:await res.json()};
 }
 return{request,calls};
}
test("summary is unavailable without authentication",async()=>{
 const h=harness({user:null});
 assert.equal((await h.request()).status,401);
 assert.equal(h.calls.length,0);
});
test("unauthorized member cannot use older-conversation lookup",async()=>{
 const h=harness({member:false,user:{id:1,role:"god"}});
 const r=await h.request();
 assert.equal(r.status,404);
 assert.equal(h.calls.length,1,"membership checked before reading conversation metadata");
 assert.deepEqual(h.calls[0].params,[712,1]);
});
test("direct message lookup includes other member identity without message bodies",async()=>{
 const h=harness();
 const r=await h.request();
 assert.equal(r.status,200);
 assert.equal(r.data.conversation.id,712);
 assert.equal(r.data.conversation.other_username,"crew22");
 assert.equal(r.data.conversation.messaging_blocked,0);
 assert.equal(Object.hasOwn(r.data.conversation,"body"),false);
 const checked=h.calls.find(c=>c.sql.includes("FROM user_blocks"));
 assert.deepEqual(checked.params,[17,22,22,17]);
});
test("blocked direct conversation stays viewable but marked restricted",async()=>{
 const h=harness({blocked:true});
 const r=await h.request();
 assert.equal(r.data.conversation.messaging_blocked,1);
});
test("group lookup returns group metadata without listing members",async()=>{
 const h=harness({kind:"group"});
 const r=await h.request();
 assert.equal(r.status,200);
 assert.equal(r.data.conversation.group_name,"The Misfits");
 assert.equal(r.data.conversation.participant_count,4);
 assert.equal(r.data.conversation.other_username,null);
});
test("missing peer, unsafe conversation ids and unsupported methods fail closed",async()=>{
 assert.equal((await harness({other:false}).request()).status,404);
 assert.equal((await harness().request("/api/messages/conversations/999999999999999999999/summary")).status,400);
 assert.equal((await harness().request("/api/messages/conversations/712/summary","POST")).status,405);
});
test("other API routes are left to their existing handlers",async()=>{
 const req=new Request("https://api.ash-fall.com/api/messages/conversations");
 assert.equal(await handleMessageSummary(req,{},new URL(req.url),{}),null);
});
