import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {staffCapabilities} from "../backend/src/staff-capabilities.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const nav=read("public/nav.js"),admin=read("public/admin.html");
const allowed=new Function("user","key",nav.slice(nav.indexOf("  const accessAllowed="),nav.indexOf("  const applyAccess="))+";return accessAllowed(user,key)");
const matrix=[
 ["member",{role:"member"},[]],
 ["creator",{role:"member",public_title:"Digital Creator"},["can_create"]],
 ["moderator",{role:"moderator"},["can_moderate"]],
 ["administrator",{role:"admin"},["can_create","can_moderate","can_admin","can_theme_forge","can_eye_of_chaos"]],
 ["Isis",{role:"admin",is_isis:1},["can_create","can_moderate","can_admin","can_theme_forge","can_eye_of_chaos","can_publish_theme","can_handoff","can_read_handoff","can_delegate_approval"]],
 ["Osiris",{role:"god"},["can_create","can_moderate","can_admin","can_theme_forge","can_eye_of_chaos","can_publish_theme","can_handoff","can_read_handoff","can_delegate_approval","can_eye_of_horus","can_private_vault","can_owner_mailbox"]],
 ["pending invite",{role:"member",handoff_invited:1},["can_handoff"]],
 ["accepted member",{role:"member",is_isis:1},["can_handoff","can_read_handoff"]],
 ["revoked partner",{role:"member",username:"knightfallsamantha"},[]],
 ["owner-lookalike",{role:"admin",username:"knightfall"},["can_create","can_moderate","can_admin","can_theme_forge","can_eye_of_chaos"]]
];
const keys=[...new Set(matrix.flatMap(row=>row[2]))];
for(const [name,attrs,permissions] of matrix)test(name+" visibility agrees with the Worker",()=>{
 const user={status:"active",...attrs};user.staff_access=staffCapabilities(user);
 for(const key of keys)assert.equal(allowed(user,key),permissions.includes(key),key);
 assert.equal(allowed(user,"member"),true);
});
test("unknown or expired sessions and role-only payloads cannot reveal privileged links",()=>{
 for(const key of keys){assert.equal(allowed(null,key),false);assert.equal(allowed({status:"active",role:"god"},key),false);assert.equal(allowed({status:"suspended",staff_access:{[key]:true}},key),false);}
 assert.equal(allowed({status:"active",staff_access:{can_create:"true"}},"can_create"),false);
});
test("admin search and direct tab requests cannot reactivate owner-only tabs",()=>{
 const fn=admin.match(/function allowedAdminTab\(tab\)\{[^\n]+\}/)[0];
 for(const owner of [false,true]){
  const gate=new Function("canManageOwner",fn+";return allowedAdminTab")(owner);
  assert.equal(gate({hasAttribute:k=>k==="data-god-vault-tab"}),owner);
  assert.equal(gate({hasAttribute:()=>false}),true);assert.equal(gate(null),false);
 }
 assert.match(admin,/if\(!allowedAdminTab\(tab\)\)return false/);
 assert.match(admin,/if \(!allowedAdminTab\(tab\)\) return/);
 assert.match(admin,/canManageOwner\?\[deletedVault\(\)\]:\[\]/);
});
test("restricted cards and links start hidden, including dynamically generated artwork links",()=>{
 for(const p of ["public/index.html","public/chatbots.html"])assert.match(read(p),/data-kf-access="can_create" hidden/);
 assert.match(read("public/knightfall-art-theme-showcase.js"),/a\.dataset\.kfAccess="can_create";a\.hidden=true/);
 assert.match(read("public/devil-tools.html"),/rights\.can_create!==true/);
 assert.match(read("public/theme.css"),/\[data-kf-access\]\[hidden\]/);
 assert.doesNotMatch(nav,/username[^\n]*=== "knightfallsamantha"/);
});
