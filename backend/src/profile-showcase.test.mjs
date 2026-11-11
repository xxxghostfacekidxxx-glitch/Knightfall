import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {profileMilestones,handleProfileShowcase} from "./profile-showcase.js";

function setup(options={}){
 const owner={id:14,username:"creator",profile_visibility:options.visibility||"public",status:"active"};
 const gallery=(options.gallery||[7,9,11]).map(id=>({id}));
 const calls=[],writes=[];
 const db={
  prepare(sql){const q={sql,args:[],bind(...args){this.args=args;return this},
   async first(){
    calls.push({sql,args:this.args});
    if(sql.includes("FROM users WHERE username="))return owner;
    if(sql.includes("FROM user_blocks"))return options.blocked?{id:1}:null;
    if(sql.includes("FROM friend_requests"))return options.friend?{id:1}:null;
    if(sql.includes("COUNT(*)"))return {n:options.count||0};
    return null;
   },
   async all(){
    calls.push({sql,args:this.args});
    if(sql.includes("FROM profile_featured_creations"))return {results:options.featured||[]};
    if(sql.includes("SELECT id FROM profile_photos"))return {results:gallery.filter(x=>this.args.includes(x.id))};
    return {results:[]};
   },
   async run(){writes.push({sql,args:this.args});return {success:true}}};
   return q;
  },
  async batch(statements){for(const stmt of statements)await stmt.run();return statements.map(()=>({success:true}))}
 };
 const helpers={
  requireUser:async r=>r.viewer||null,json:(data,status=200)=>({status,data}),origin:"https://ash-fall.com",
  isModerator:u=>["moderator","admin","god"].includes(u?.role),isAdmin:u=>["admin","god"].includes(u?.role),
  rateLimit:async()=>!options.limited
 };
 const call=(pathname,method="GET",viewer=null,body=null)=>handleProfileShowcase(
  {method,viewer,json:async()=>body},{DB:db},new URL("https://api.ash-fall.com"+pathname),helpers);
 return {call,calls,writes};
}
test("milestones come from verified counts and visitors never see locked progress",()=>{
 const counts={threads:1,replies:10,photos:3,followers:0,reactions:5,comments:0};
 const owner=profileMilestones(counts,true),visitor=profileMilestones(counts,false);
 assert.equal(owner.length,6);
 assert.equal(visitor.length,4);
 assert.equal(owner.find(x=>x.key==="crowd_magnet").earned,false);
 assert.equal(owner.find(x=>x.key==="voice_of_chaos").earned,true);
 assert.equal(owner.find(x=>x.key==="voice_of_chaos").progress,10);
});
test("showcase profile privacy and blocks are checked before retrieving photos",async()=>{
 assert.equal((await setup({visibility:"private"}).call("/api/profile-showcase?username=creator")).status,404);
 assert.equal((await setup({visibility:"friends"}).call("/api/profile-showcase?username=creator")).status,401);
 assert.equal((await setup({visibility:"friends"}).call("/api/profile-showcase?username=creator","GET",{id:80})).status,403);
 assert.equal((await setup({visibility:"friends",friend:true}).call("/api/profile-showcase?username=creator","GET",{id:80})).status,200);
 assert.equal((await setup({blocked:true}).call("/api/profile-showcase?username=creator","GET",{id:80})).status,404);
 assert.equal((await setup({visibility:"private"}).call("/api/profile-showcase?username=creator","GET",{id:14})).status,200);
});
test("featured list joins gallery photos belonging to the actual owner",async()=>{
 const f=setup({featured:[{slot:1,photo_id:7,caption:"Original design"}]});
 const result=await f.call("/api/profile-showcase?username=creator");
 assert.equal(result.status,200);
 assert.deepEqual(result.data.featured.map(x=>x.photo_id),[7]);
 assert.match(result.data.featured[0].url,/\/api\/profile-media\/7$/);
 const query=f.calls.find(x=>x.sql.includes("FROM profile_featured_creations"));
 assert.match(query.sql,/p.user_id=fc.user_id AND p.kind='gallery'/);
 assert.deepEqual(query.args,[14]);
});
test("only authenticated members can select unique owned photos in three slots",async()=>{
 const path="/api/profile-showcase";
 assert.equal((await setup().call(path,"PUT",null,{photo_ids:[7]})).status,401);
 assert.equal((await setup().call(path,"PUT",{id:14},{photo_ids:[7,7]})).status,400);
 assert.equal((await setup().call(path,"PUT",{id:14},{photo_ids:[7,9,11,13]})).status,400);
 assert.equal((await setup().call(path,"PUT",{id:14},{photo_ids:["7"]})).status,400);
 assert.equal((await setup().call(path,"PUT",{id:14},{photo_ids:[999]})).status,403);
 const f=setup();
 const success=await f.call(path,"PUT",{id:14},{photo_ids:[11,7]});
 assert.equal(success.status,200);
 assert.deepEqual(success.data.photo_ids,[11,7]);
 assert.equal(f.writes.length,3);
 assert.match(f.writes[0].sql,/DELETE FROM profile_featured_creations/);
 assert.deepEqual(f.writes[1].args.slice(0,3),[14,11,1]);
 assert.deepEqual(f.writes[2].args.slice(0,3),[14,7,2]);
});
test("showcase can be cleared by its owner but rate limits block writes",async()=>{
 const f=setup(),clear=await f.call("/api/profile-showcase","PUT",{id:14},{photo_ids:[]});
 assert.equal(clear.status,200);
 assert.equal(f.writes.length,1);
 assert.equal((await setup({limited:true}).call("/api/profile-showcase","PUT",{id:14},{photo_ids:[7]})).status,429);
});
test("schema defines ownership, three slots and cascade cleanup",()=>{
 const sql=readFileSync(new URL("../migrations/0127_profile_featured_creations.sql",import.meta.url),"utf8");
 assert.match(sql,/CREATE TABLE IF NOT EXISTS profile_featured_creations/);
 assert.match(sql,/REFERENCES profile_photos\(id\) ON DELETE CASCADE/);
 assert.match(sql,/CHECK\(slot BETWEEN 1 AND 3\)/);
 assert.match(sql,/UNIQUE\(user_id,photo_id\)/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM profile_photos/);
});
