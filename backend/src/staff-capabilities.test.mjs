import test from "node:test";
import assert from "node:assert/strict";
import {staffCapabilities,canAccessCreatorFoundry,canAccessModeration,canAccessEyeOfHorus} from "./staff-capabilities.js";
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
 assert.equal(admin.level,2);assert.equal(god.level,3);
 for(const cap of ["can_create","can_moderate","unlimited_bots","advanced_bot_builder"]) {
  assert.equal(admin[cap],true);assert.equal(god[cap],true);
 }
 assert.equal(admin.can_eye_of_horus,false);
 assert.equal(god.can_eye_of_horus,true);
 assert.equal(staffCapabilities({role:"member"}).level,0);
});
test("a stray creator title must never elevate a moderator into Creator Foundry",()=>{
 const fake={role:"moderator",public_title:"Digital Creator"};
 assert.equal(staffCapabilities(fake).can_create,false);
 assert.equal(botAccessPolicy(fake,0,{title:"Digital Creator",unlimited_slots:1,advanced_builder:1}).advanced_builder,false);
 assert.equal(botAccessPolicy(fake).unlimited,true);
 assert.equal(botAccessPolicy({role:"member",public_title:"Digital Creator"}).advanced_builder,true);
});
