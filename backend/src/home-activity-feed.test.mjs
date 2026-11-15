import test from "node:test";
import assert from "node:assert/strict";
import {canPublishHomeActivity,handleHomeActivityFeed} from "./home-activity-feed.js";
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
function fixture(user) {
  const writes=[],posts=[{id:3,user_id:12,title:"Launch",body:"News",category:"update",username:"staff",role:"admin",created_at:"2026-11-14 20:00:00"}];
  const env={DB:{prepare(sql){let bound=[];return {bind(...values){bound=values;return this;},async all(){return {results:posts};},async first(){return {user_id:12};},async run(){writes.push({sql,bound});return {meta:{last_row_id:4}};}}}}};
  const deps={requireUser:async()=>user,json:response,origin:"https://ash-fall.com",
    rateLimit:async()=>true,audit:async()=>{}};
  const call=(path,method="GET",body)=>handleHomeActivityFeed(
    new Request("https://api.ash-fall.com"+path,{method,body:body?JSON.stringify(body):undefined}),
    env,new URL("https://api.ash-fall.com"+path),deps);
  return {call,writes};
}
test("only staff and Digital Creators may publish",async()=>{
  assert.equal(canPublishHomeActivity({role:"member"}),false);
  for(const role of ["god","admin","moderator"])assert.equal(canPublishHomeActivity({role}),true);
  assert.equal(canPublishHomeActivity({role:"member",public_title:"Digital Creator"}),true);
  assert.equal(canPublishHomeActivity({role:"member",public_title:"Bot Creator"}),false);
  const member=fixture({id:1,role:"member"});
  assert.equal((await member.call("/api/home/activity","POST",{title:"No",body:"Denied"})).status,403);
  assert.equal(member.writes.length,0);
  const creator=fixture({id:2,role:"member",public_title:"Digital Creator"});
  assert.equal((await creator.call("/api/home/activity","POST",{title:"  Update ",body:" hello ",category:"event"})).status,201);
  assert.equal(creator.writes.length,1);
});
test("public can read feed but cannot post",async()=>{
  const anon=fixture(null);
  const read=await anon.call("/api/home/activity");
  assert.equal(read.status,200);
  const data=await read.json();
  assert.equal(data.posts.length,1);
  assert.equal(data.can_post,false);
  assert.equal((await anon.call("/api/home/activity","POST",{title:"hi",body:"x"})).status,401);
});
test("enforces post validation and deletion scope",async()=>{
  const creator=fixture({id:2,role:"member",public_title:"Digital Creator"});
  assert.equal((await creator.call("/api/home/activity","POST",{title:"",body:"x"})).status,400);
  assert.equal((await creator.call("/api/home/activity/3","DELETE")).status,403);
  const moderator=fixture({id:5,role:"moderator"});
  assert.equal((await moderator.call("/api/home/activity/3","DELETE")).status,200);
  assert.equal(moderator.writes.length,1);
});
