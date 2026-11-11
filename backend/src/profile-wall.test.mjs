import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {handleProfileWall} from "./profile-wall.js";

function fixture(options={}){
 const owner={id:11,username:"artist",display_name:"Artist",status:"active",profile_visibility:options.privacy||"public"};
 const post={...owner,id:23,user_id:11,body:"An original drawing",visibility:options.postVisibility||"public",
  created_at:"2026-11-10T12:00:00Z",updated_at:"2026-11-10T12:00:00Z"};
 const state={owner,post,writes:[],requests:[],audits:[]};
 const db={prepare(sql){
   const statement={sql,params:[],bind(...args){this.params=args;return this},
    async first(){
     state.requests.push({sql,params:this.params,kind:"first"});
     if(sql.includes("FROM users WHERE username="))return owner;
     if(sql.includes("FROM social_activity a JOIN users u"))return post;
     if(sql.includes("FROM user_blocks"))return options.blocked?{id:1}:null;
     if(sql.includes("FROM friend_requests"))return options.friends?{id:1}:null;
     if(sql.includes("FROM follows"))return options.following?{id:1}:null;
     if(sql.includes("FROM profile_wall_comments c JOIN social_activity"))return {id:77,user_id:22,profile_owner_id:11};
     return null;
    },
    async all(){
     state.requests.push({sql,params:this.params,kind:"all"});
     if(sql.includes("FROM profile_wall_comments c JOIN users"))return {results:[{id:77,user_id:22,body:"Love it",username:"fan",display_name:"Fan",created_at:"2026-11-10T13:00:00Z"}]};
     return {results:[{...post,comment_count:1,fire_count:1,heart_count:0,skull_count:0,my_reaction:null}]};
    },
    async run(){
     state.writes.push({sql,params:this.params});
     return {meta:{last_row_id:78,changes:1}};
    }};
   return statement;
 }};
 const env={DB:db};
 const helpers={
  origin:"https://ash-fall.com",
  requireUser:async request=>request.viewer||null,
  json:(data,status=200)=>({status,data}),
  isModerator:user=>["moderator","admin","god"].includes(user?.role),
  isAdmin:user=>["admin","god"].includes(user?.role),
  rateLimit:async()=>!options.rateLimited,
  audit:async (_env,user,action,type,id)=>{state.audits.push({user,action,type,id})}
 };
 const call=(path,method="GET",viewer=null,body)=>handleProfileWall(
  {method,viewer,json:async()=>body},env,new URL("https://api.ash-fall.com"+path),helpers);
 return {call,state};
}
test("public wall serves only permitted visibility and stable pagination",async()=>{
 const f=fixture();
 const r=await f.call("/api/profile-wall?username=artist");
 assert.equal(r.status,200);
 assert.equal(r.data.posts.length,1);
 assert.equal(r.data.can_post,false);
 assert.equal(r.data.viewer_id,null);
 const query=f.state.requests.find(q=>q.kind==="all");
 assert.ok(query.sql.includes("a.visibility IN (?)"));
 assert.ok(query.params.includes("public"));
 assert.ok(!query.params.includes("private"));
});
test("profile privacy, friend access and blocks are server side",async()=>{
 assert.equal((await fixture({privacy:"private"}).call("/api/profile-wall?username=artist")).status,404);
 assert.equal((await fixture({privacy:"friends"}).call("/api/profile-wall?username=artist")).status,401);
 assert.equal((await fixture({privacy:"friends"}).call("/api/profile-wall?username=artist","GET",{id:22})).status,403);
 assert.equal((await fixture({privacy:"friends",friends:true}).call("/api/profile-wall?username=artist","GET",{id:22})).status,200);
 assert.equal((await fixture({blocked:true}).call("/api/profile-wall?username=artist","GET",{id:22})).status,404);
 const owner=await fixture({privacy:"private",postVisibility:"private"}).call("/api/profile-wall?username=artist","GET",{id:11});
 assert.equal(owner.status,200);
 assert.equal(owner.data.can_post,true);
});
test("followers-only update is not available without follow relationship",async()=>{
 const path="/api/profile-wall/posts/23/comments";
 assert.equal((await fixture({postVisibility:"followers"}).call(path,"GET",{id:24})).status,404);
 assert.equal((await fixture({postVisibility:"followers",following:true}).call(path,"GET",{id:24})).status,200);
});
test("a post's author, not its post number, controls relationship checks",async()=>{
 const f=fixture({postVisibility:"followers",following:true});
 const result=await f.call("/api/profile-wall/posts/23/comments","GET",{id:22});
 assert.equal(result.status,200);
 const followLookup=f.state.requests.find(item=>item.sql.includes("FROM follows"));
 assert.ok(followLookup);
 assert.deepEqual(followLookup.params,[22,11]);
 assert.ok(!followLookup.params.includes(23));
 const own=fixture({privacy:"private",postVisibility:"private"});
 const ownResult=await own.call("/api/profile-wall/posts/23/comments","GET",{id:11});
 assert.equal(ownResult.status,200);
});
test("reactions require an account and accept only supported choices",async()=>{
 const path="/api/profile-wall/posts/23/reactions";
 assert.equal((await fixture().call(path,"POST",null,{reaction:"fire"})).status,401);
 assert.equal((await fixture().call(path,"POST",{id:22},{reaction:"custom"})).status,400);
 const f=fixture();
 const r=await f.call(path,"POST",{id:22},{reaction:"skull"});
 assert.equal(r.status,200);
 assert.equal(r.data.reaction,"skull");
 assert.equal(f.state.writes.length,1);
 assert.match(f.state.writes[0].sql,/ON CONFLICT\(activity_id,user_id\)/);
 assert.deepEqual(f.state.writes[0].params.slice(0,3),[23,22,"skull"]);
 assert.equal((await f.call(path,"DELETE",{id:22})).status,200);
 assert.match(f.state.writes[1].sql,/DELETE FROM profile_wall_reactions/);
});
test("only the author can edit or delete a status",async()=>{
 const path="/api/profile-wall/posts/23";
 assert.equal((await fixture().call(path,"PATCH",{id:22},{body:"changed",visibility:"public"})).status,403);
 assert.equal((await fixture().call(path,"PATCH",{id:11},{body:"",visibility:"public"})).status,400);
 const f=fixture();
 const edit=await f.call(path,"PATCH",{id:11},{body:"Updated",visibility:"followers"});
 assert.equal(edit.status,200);
 assert.deepEqual(f.state.writes[0].params.slice(0,2),["Updated","followers"]);
 const remove=await f.call(path,"DELETE",{id:11});
 assert.equal(remove.status,200);
 assert.match(f.state.writes[1].sql,/SET deleted_at=/);
});
test("comments have bounded length and owner/moderator removal rights",async()=>{
 const path="/api/profile-wall/posts/23/comments";
 assert.equal((await fixture().call(path,"POST",null,{body:"Hello"})).status,401);
 assert.equal((await fixture().call(path,"POST",{id:22},{body:"a".repeat(1001)})).status,400);
 const f=fixture(),created=await f.call(path,"POST",{id:22},{body:"This rules"});
 assert.equal(created.status,201);
 assert.match(f.state.writes[0].sql,/INSERT INTO profile_wall_comments/);
 assert.equal((await f.call(path,"GET",{id:22})).status,200);
 assert.equal((await fixture().call("/api/profile-wall/comments/77","DELETE",{id:99})).status,403);
 assert.equal((await f.call("/api/profile-wall/comments/77","DELETE",{id:11})).status,200);
 assert.match(f.state.writes[1].sql,/SET deleted_at=/);
});
test("bookmarks are owner-only and reuse the existing private saved-post table",async()=>{
 const path="/api/profile-wall/posts/23/bookmark";
 assert.equal((await fixture().call("/api/profile-wall/saved")).status,401);
 assert.equal((await fixture().call(path,"POST")).status,401);
 const f=fixture();
 const created=await f.call(path,"POST",{id:22});
 assert.equal(created.status,200);
 assert.equal(created.data.saved,true);
 assert.match(f.state.writes[0].sql,/INSERT OR IGNORE INTO social_bookmarks/);
 assert.deepEqual(f.state.writes[0].params.slice(0,2),[22,"23"]);
 const removed=await f.call(path,"DELETE",{id:22});
 assert.equal(removed.status,200);
 assert.equal(removed.data.saved,false);
 assert.match(f.state.writes[1].sql,/DELETE FROM social_bookmarks/);
});
test("saved updates do not bypass private profiles, followers or blocked authors",async()=>{
 const f=fixture();
 const r=await f.call("/api/profile-wall/saved","GET",{id:22});
 assert.equal(r.status,200);
 const query=f.state.requests.find(item=>item.kind==="all");
 assert.ok(query);
 assert.match(query.sql,/u.profile_visibility='friends'/);
 assert.match(query.sql,/u.profile_visibility='public'/);
 assert.match(query.sql,/a.visibility='followers'/);
 assert.match(query.sql,/NOT EXISTS \(SELECT 1 FROM user_blocks/);
 assert.equal((query.sql.match(/\?/g)||[]).length,query.params.length);
});
test("rate limit blocks writes before database changes",async()=>{
 const f=fixture({rateLimited:true});
 const r=await f.call("/api/profile-wall/posts/23/reactions","POST",{id:22},{reaction:"fire"});
 assert.equal(r.status,429);
 assert.equal(f.state.writes.length,0);
});
test("migration is additive and indexes active comments",()=>{
 const sql=readFileSync(new URL("../migrations/0126_profile_wall_interactions.sql",import.meta.url),"utf8");
 for(const table of ["profile_wall_comments","profile_wall_reactions"])
   assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS "+table));
 assert.match(sql,/PRIMARY KEY\(activity_id, user_id\)/);
 assert.match(sql,/WHERE deleted_at IS NULL/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM social_activity|ALTER TABLE users/i);
});
