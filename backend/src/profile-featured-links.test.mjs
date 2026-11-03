import test from "node:test";
import assert from "node:assert/strict";
import {normalizeProfileLinks,handleProfileFeaturedLinks} from "./profile-featured-links.js";
const viewer={id:7,username:"neon_tester",profile_visibility:"public"};
function mockDB(reply){
 const statements=[],batches=[];
 const env={DB:{
  prepare(sql){return {bind(...args){const item={sql,args};statements.push(item);return {
   ...item,first:async()=>reply?.(sql,args,"first")??null,
   all:async()=>reply?.(sql,args,"all")??{results:[]}
  };}}},
  batch:async list=>{batches.push(list);return list.map(()=>({success:true}))}
 }};
 return {env,statements,batches};
}
async function run({path="/api/profile/links",method="GET",body=null,who=viewer,database,moderator=false,limited=false}={}){
 const url=new URL("https://api.ash-fall.com"+path);
 return handleProfileFeaturedLinks({method,json:async()=>body},database,url,{
  getUser:async()=>who,isModerator:()=>moderator,rateLimit:async()=>!limited,
  json:(data,status=200)=>({data,status}),origin:"https://ash-fall.com"
 });
}
test("featured links allow only six valid unique HTTPS addresses",()=>{
 const bads=[
  [{label:"bad",url:"javascript:alert(1)",category:"social"}],
  [{label:"bad",url:"data:text/html,foo",category:"music"}],
  [{label:"bad",url:"http://example.com",category:"music"}],
  [{label:"bad",url:"https://user:pw@example.com",category:"music"}],
  [{label:"bad",url:"https://example.com",category:"danger"}],
  [{label:"",url:"https://example.com",category:"website"}],
  Array.from({length:7},(_,i)=>({label:"L"+i,url:"https://site"+i+".com",category:"website"})),
  [{label:"same",url:"https://example.com",category:"website"},{label:"again",url:"https://example.com/",category:"website"}]
 ];
 for(const set of bads)assert.ok(normalizeProfileLinks(set).error,JSON.stringify(set));
 const result=normalizeProfileLinks([{label:"My Music",url:"https://example.com/a",category:"music"}]);
 assert.deepEqual(result,{links:[{label:"My Music",url:"https://example.com/a",category:"music"}]});
});
test("anonymous visitors cannot write and cannot enumerate private profiles",async()=>{
 const db=mockDB(sql=>sql.includes("FROM users")?{id:21,username:"secret",profile_visibility:"private"}:null);
 assert.equal((await run({method:"PUT",who:null,database:db.env})).status,401);
 const denied=await run({path:"/api/profile/links?username=secret",who:null,database:db.env});
 assert.equal(denied.status,404);
 assert.ok(!db.statements.some(x=>x.sql.includes("FROM profile_featured_links")));
});
test("friends-only profiles require accepted friendship",async()=>{
 const db=mockDB(sql=>sql.includes("FROM users")?{id:24,username:"friendonly",profile_visibility:"friends"}:null);
 const denied=await run({path:"/api/profile/links?username=friendonly",database:db.env});
 assert.equal(denied.status,403);
 assert.match(db.statements[1].sql,/friend_requests/);
 assert.equal(db.statements[1].args[0],viewer.id);
});
test("moderators can inspect links when account is restricted",async()=>{
 const db=mockDB(sql=>{
  if(sql.includes("FROM users"))return {id:24,username:"friendonly",profile_visibility:"private"};
  if(sql.includes("FROM profile_featured_links"))return {results:[{label:"My work",url:"https://example.org/",category:"art"}]};
 });
 const result=await run({path:"/api/profile/links?username=friendonly",database:db.env,moderator:true});
 assert.equal(result.status,200);assert.equal(result.data.links.length,1);
});
test("save updates only caller records in one atomic D1 batch",async()=>{
 const db=mockDB();
 const result=await run({method:"PUT",body:{links:[{label:"Music",url:"https://music.example/",category:"music"},{label:"Art",url:"https://art.example/",category:"art"}]},database:db.env});
 assert.equal(result.status,200);assert.equal(db.batches.length,1);assert.equal(db.batches[0].length,3);
 assert.match(db.batches[0][0].sql,/DELETE FROM profile_featured_links WHERE user_id=\?/);
 assert.deepEqual(db.batches[0][0].args,[viewer.id]);
 for(const statement of db.batches[0].slice(1)){assert.match(statement.sql,/INSERT INTO profile_featured_links/);assert.equal(statement.args[0],viewer.id)}
});
test("invalid writes are rejected before changing saved links",async()=>{
 const db=mockDB();
 const r=await run({method:"PUT",body:{links:[{label:"Unsafe",url:"http://example.com",category:"website"}]},database:db.env});
 assert.equal(r.status,400);assert.equal(db.batches.length,0);
 assert.equal((await run({method:"PUT",limited:true,body:{links:[]},database:db.env})).status,429);
 assert.equal((await run({method:"POST",body:{links:[]},database:db.env})).status,405);
});
test("owner may see their own links regardless of privacy",async()=>{
 const user={...viewer,profile_visibility:"private"};
 const db=mockDB(sql=>sql.includes("FROM profile_featured_links")?{results:[{label:"Personal",url:"https://example.com/",category:"other"}]}:null);
 const res=await run({database:db.env,who:user});
 assert.equal(res.status,200);
 assert.deepEqual(db.statements[0].args,[user.id]);
 assert.equal(res.data.links[0].label,"Personal");
});
