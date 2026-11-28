// The server owns capability grants; the workshop only consumes them.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {staffCapabilities} from "../backend/src/staff-capabilities.js";
const tools=readFileSync(new URL("../public/devil-tools.html",import.meta.url),"utf8");
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
test("workshop access follows server-owned capabilities, not one account ID",()=>{
 assert.ok(tools.includes("const rights=user.staff_access||{}"));
 assert.ok(tools.includes("rights.can_create!==true"));
 assert.ok(tools.includes("const administrator=rights.can_admin===true"));
 assert.ok(backend.includes("AS public_title,EXISTS(SELECT 1 FROM ai_handoff_partner"));
 assert.ok(backend.includes("staff_access:access"));
 for(const [role,title,status,expected] of [["member","Digital Creator","active",true],["member","","active",false],["member","Digital Creator","suspended",false],["admin","","active",true],["god","","active",true],["moderator","","active",false]]){
  assert.equal(staffCapabilities({role,public_title:title,status}).can_create,expected);
 }
});
test("asset publication remains administrator-only and creator handoff stays available",()=>{
 assert.ok(backend.includes("Administrator approval required to publish game assets."));
 assert.ok(tools.includes('id="creator-handoff"'));
 assert.ok(tools.includes("if(user.status!=='active'||rights.can_create!==true)throw Error('Workshop access required.')"));
 assert.ok(tools.includes("$('#release-simulator')?.remove()"));
 assert.equal(staffCapabilities({role:"member",public_title:"Digital Creator",status:"active"}).can_admin,false);
});
