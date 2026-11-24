import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {staffCapabilities,canAccessCreatorFoundry,canAccessModeration,canAccessEyeOfChaos,canAccessEyeOfHorus,canAccessOwnerMailbox} from "./staff-capabilities.js";
import {botAccessPolicy} from "./bot-creator-access.js";

test("Level 1 has two mutually exclusive job tracks at identical rank",()=>{
 const mod={role:"moderator"};
 const creator={role:"member",public_title:"Digital Creator"};
 const m=staffCapabilities(mod),c=staffCapabilities(creator);
 assert.equal(m.level,1);assert.equal(c.level,1);
 assert.equal(m.track,"moderation");assert.equal(c.track,"creation");
 assert.equal(m.can_moderate,true);assert.equal(m.can_create,false);
 assert.equal(c.can_moderate,false);assert.equal(c.can_create,true);
 assert.equal(canAccessCreatorFoundry(mod),false);
 assert.equal(canAccessModeration(creator),false);
 assert.equal(canAccessEyeOfHorus(mod),false);
 assert.equal(canAccessEyeOfHorus(creator),false);
});
test("Administrator inherits both tracks, God inherits both plus Eye of Horus",()=>{
 const admin=staffCapabilities({role:"admin"});
 const god=staffCapabilities({role:"god"});
 assert.equal(admin.level,2);assert.equal(god.level,4);
 for(const cap of ["can_create","can_moderate","unlimited_bots","advanced_bot_builder"]) {
  assert.equal(admin[cap],true);assert.equal(god[cap],true);
 }
 assert.equal(admin.can_eye_of_chaos,true);
 assert.equal(god.can_eye_of_chaos,true);
 assert.equal(canAccessEyeOfChaos({role:"moderator"}),false);
 assert.equal(canAccessEyeOfChaos({role:"member",public_title:"Digital Creator"}),false);
 assert.equal(canAccessEyeOfChaos({role:"admin"}),true);
 assert.equal(admin.can_eye_of_horus,false);
 assert.equal(god.can_eye_of_horus,true);
 assert.equal(staffCapabilities({role:"member"}).level,0);
});
test("Osiris is owner rank, and Isis is only the DB-verified accepted admin partner",()=>{
 const osiris=staffCapabilities({role:"god",username:"knightfall"});
 const isis=staffCapabilities({role:"admin",is_isis:1,username:"knightfallsamantha"});
 const ordinaryAdmin=staffCapabilities({role:"admin",is_isis:0});
 assert.deepEqual([osiris.level,isis.level,ordinaryAdmin.level],[4,3,2]);
 assert.deepEqual([osiris.rank_name,isis.rank_name,ordinaryAdmin.rank_name],["Osiris","Isis","Administrator"]);
 assert.deepEqual([osiris.rank_code,isis.rank_code,ordinaryAdmin.rank_code],["osiris","isis","admin"]);
 assert.equal(isis.can_eye_of_chaos,true);
 assert.equal(isis.can_eye_of_horus,false);
 assert.equal(isis.can_delegate_approval,true);
 assert.equal(osiris.can_eye_of_horus,true);
 assert.equal(ordinaryAdmin.can_delegate_approval,false);
 for(const fake of [{role:"member",is_isis:1},{role:"moderator",is_isis:1},{role:"admin",public_title:"Isis"}]){
   assert.notEqual(staffCapabilities(fake).rank_name,"Isis");
   assert.equal(staffCapabilities(fake).can_eye_of_horus,false);
 }
});
test("a stray creator title must never elevate a moderator into Creator Foundry",()=>{
 const fake={role:"moderator",public_title:"Digital Creator"};
 assert.equal(staffCapabilities(fake).can_create,false);
 assert.equal(botAccessPolicy(fake,0,{title:"Digital Creator",unlimited_slots:1,advanced_builder:1}).advanced_builder,false);
 assert.equal(botAccessPolicy(fake).unlimited,true);
 assert.equal(botAccessPolicy({role:"member",public_title:"Digital Creator"}).advanced_builder,true);
});


test("Admin User Command lists Creator as a separately selectable member track",()=>{
 const dashboard=readFileSync(new URL("../../public/admin.html",import.meta.url),"utf8");
 const api=readFileSync(new URL("./index.js",import.meta.url),"utf8");
 assert.match(dashboard,/<option value="creator"/);
 assert.match(dashboard,/x\.role==="member"&&x\.public_title==="Digital Creator"/);
 assert.match(dashboard,/const change=e\.dataset\.role\?\{role:e\.value\}:\{status:e\.value\}/);
 assert.match(api,/const roles=\["member","creator","moderator","admin","god"\]/);
 assert.match(api,/const databaseRole=body\.role==="creator"\?"member":body\.role\?\?null/);
 assert.match(api,/INSERT INTO member_bot_creator_privileges \(user_id,title,unlimited_slots,advanced_builder\)/);
 assert.match(api,/ON CONFLICT\(user_id\) DO UPDATE SET title='Digital Creator',unlimited_slots=1,advanced_builder=1/);
 assert.match(api,/DELETE FROM member_bot_creator_privileges WHERE user_id=\? AND title='Digital Creator'/);
 assert.match(api,/await env\.DB\.batch\(updates\)/);
 assert.ok(api.includes("AS public_title,EXISTS(SELECT 1 FROM ai_handoff_partner"));
 assert.equal(staffCapabilities({role:"member",public_title:"Digital Creator"}).track,"creation");
 assert.equal(staffCapabilities({role:"member",public_title:"Digital Creator"}).can_moderate,false);
 assert.equal(staffCapabilities({role:"member"}).can_create,false);
});

test("Private mailbox capability is restricted to an active GOD account",()=>{
 const roles=[
  [{role:"god",status:"active"},true],
  [{role:"god",status:"suspended"},false],
  [{role:"admin",status:"active",is_isis:1},false],
  [{role:"admin",status:"active"},false],
  [{role:"moderator",status:"active"},false],
  [{role:"member",status:"active",public_title:"Digital Creator"},false],
  [null,false]
 ];
 for(const [user,allowed] of roles)assert.equal(canAccessOwnerMailbox(user),allowed,JSON.stringify(user));
});

test("suspended and deleted identities lose every capability even if their old role remains",()=>{
 for(const status of ["suspended","deleted","pending"]){
  for(const user of [
   {role:"god",status},{role:"admin",is_isis:1,status},
   {role:"moderator",status},{role:"member",public_title:"Digital Creator",status}
  ]){
   const caps=staffCapabilities(user);
   assert.equal(caps.level,0,JSON.stringify(user));
   assert.equal(caps.can_moderate,false,JSON.stringify(user));
   assert.equal(caps.can_create,false,JSON.stringify(user));
   assert.equal(caps.can_eye_of_chaos,false,JSON.stringify(user));
   assert.equal(caps.can_delegate_approval,false,JSON.stringify(user));
  }
 }
});
