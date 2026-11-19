import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {GUIDE_AREAS,GUIDE_DEMOS,guideViewer,guideAreaCount,guideDemoInput} from "../public/miss-chaos-guide-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const viewer=(modes,capabilities,permissions={})=>guideViewer({
 modes:[{id:"standard",full_chat:"/miss-chaos.html"},...modes],
 permissions
},{capabilities});
test("all seven public guide areas have real Knightfall destinations and safe concrete examples",()=>{
 assert.equal(GUIDE_AREAS.length,7);
 const ids=new Set(),routes=new Set();
 for(const area of GUIDE_AREAS){
  assert.ok(!ids.has(area.id));ids.add(area.id);
  assert.ok(!routes.has(area.route));routes.add(area.route);
  assert.match(area.route,/^\/[a-z0-9-]+\.html$/);
  assert.equal(existsSync(new URL("../public"+area.route,import.meta.url)),true,"Missing guide page: "+area.route);
  assert.ok(area.detail.length>50);
  assert.ok(area.prompt.length>30&&area.prompt.length<4000);
  assert.ok(Array.isArray(area.capabilities)&&area.capabilities.length>0);
  assert.equal(guideAreaCount(area,[]),0);
  assert.equal(guideAreaCount(area,area.capabilities),area.capabilities.length);
 }
});
test("anonymous and malformed capability responses do not reveal private controls",()=>{
 for(const [modes,tools] of [[{},{}],[{modes:[]},{}],[{modes:[{id:"owner"}]},{capabilities:[]}]]){
  const result=guideViewer(modes,tools);
  assert.equal(result.verified,false);
  assert.equal(result.role,"visitor");
  assert.equal(result.mode,null);
 }
});
test("server-verified owner session has Osiris controls and safe owner chat URL",()=>{
 const r=viewer([{id:"owner",label:"Osiris · Private Chaos",full_chat:"/miss-chaos.html?companion=owner"}],
   ["god.github_health","staff.repo_file","user.notes","utility.calculate"],
   {can_eye_of_horus:true,can_master_control:true});
 assert.equal(r.verified,true);
 assert.equal(r.role,"osiris");
 assert.equal(r.mode.full_chat,"/miss-chaos.html?companion=owner");
 assert.ok(r.capabilities.includes("god.github_health"));
 assert.equal(r.permissions.can_master_control,true);
});
test("server-verified partner has her own workspace and never receives owner privileges by implication",()=>{
 const r=viewer([{id:"partner",label:"Isis · Private Chaos",full_chat:"/samantha-chaos.html"}],
   ["user.handoff","user.bot_fleet","staff.repo_file"],
   {can_admin:true,can_eye_of_chaos:true,can_approve_drafts:true,can_theme_publish:true,can_eye_of_horus:false});
 assert.equal(r.role,"partner");
 assert.equal(r.mode.full_chat,"/samantha-chaos.html");
 assert.equal(r.permissions.can_eye_of_horus,false);
 assert.ok(!r.capabilities.includes("god.github_health"));
});
test("hostile client-imagined roles and fake links cannot unlock private guide panels",()=>{
 const spoofed=viewer([{id:"owner",label:"Osiris",full_chat:"https://evil.example/steal"}],
   ["user.notes"],{can_master_control:true});
 assert.equal(spoofed.role,"member");
 assert.equal(spoofed.mode,null);
 const pretendPartner=viewer([{id:"partner",label:"Isis",full_chat:"/miss-chaos.html?companion=owner"}],[]);
 assert.equal(pretendPartner.role,"member");
 const noMode=viewer([],[ "site.games","utility.calculate","site.games","nasty^cap" ]);
 assert.deepEqual(noMode.capabilities,["site.games","utility.calculate"]);
 assert.equal(noMode.role,"member");
});
test("live read-only demos accept only bounded inputs and do not execute arbitrary commands",()=>{
 assert.deepEqual(guideDemoInput("calc","(12 * 4) + 7"),
   {name:"utility.calculate",input:{expression:"(12 * 4) + 7"}});
 assert.deepEqual(guideDemoInput("words","  Hello gremlin  "),
   {name:"utility.word_count",input:{text:"Hello gremlin"}});
 for(const input of ["alert(1)","Math.random()","1; process.exit()","","x".repeat(101)])
   assert.throws(()=>guideDemoInput("calc",input));
 for(const input of ["","x".repeat(3001)])
   assert.throws(()=>guideDemoInput("words",input));
 assert.throws(()=>guideDemoInput("unknown","1"));
 assert.deepEqual(Object.keys(GUIDE_DEMOS),["calc","words"]);
});
test("public page never renders private panels before signed-in mode verification",()=>{
 const html=read("public/miss-chaos-guide.html");
 const ui=read("public/miss-chaos-guide.mjs");
 const field=read("public/miss-chaos-field-kit.mjs");
 assert.match(html,/id="mc-guide-private"[^>]+hidden/);
 assert.match(ui,/if\(!view\.verified\|\|!view\.mode\)return/);
 assert.match(ui,/permissions\.can_eye_of_horus===true/);
 assert.match(ui,/permissions\.can_master_control===true/);
 assert.match(ui,/permissions\.can_eye_of_chaos===true/);
 assert.match(ui,/Promise\.all\(\[request\("\/api\/chaos\/modes"\),request\("\/api\/chaos\/tools"\)\]\)/);
 assert.match(ui,/credentials:"include"/);
 assert.match(ui,/fetch\("https:\/\/api\.ash-fall\.com\/api\/chaos\/tools\/execute"/);
 assert.match(ui,/if\(!demo\|\|!view\.verified/);
 assert.match(ui,/result\.name!==demo\.capability/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
 assert.match(read("public/miss-chaos.html"),/\/miss-chaos-guide\.html/);
 assert.match(field,/miss-chaos-guide\.html/);
});
