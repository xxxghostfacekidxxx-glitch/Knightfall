import test from "node:test";
import assert from "node:assert/strict";
import {handleThemeCrew,normalizeThemeState,normalizeGlobalControls,themePlan,THEME_CREW_PRESETS,THEME_CREW_BOTS,THEME_GLOBAL_OPTIONS} from "./theme-crew.js";
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json"}});
function fixture(user={id:1,role:"god"},delegated=false){
 const saved=new Map(),logged=[];
 const env={DB:{prepare(sql){
  return {async first(){if(sql.includes("FROM ai_handoff_partner"))return delegated?{user_id:user.id,invited_by:1,status:"accepted"}:null;return null;},bind(...params){return {
   async first(){if(sql.includes("FROM ai_handoff_partner"))return delegated?{user_id:user.id,invited_by:1,status:"accepted"}:null;if(sql.startsWith("SELECT value"))return saved.has(params[0])?{value:saved.get(params[0])}:null;return null},
   async all(){return {results:logged.map(e=>({created_at:e.created_at,actor_id:e.actor_id,details:JSON.stringify(e.details)}))}},
   async run(){
    if(sql.startsWith("INSERT OR IGNORE")){if(!saved.has(params[0]))saved.set(params[0],params[1]);return {meta:{changes:1}}}
    if(sql.startsWith("UPDATE site_settings")){
     if(saved.get(params[3])!==params[4])return {meta:{changes:0}};
     saved.set(params[3],params[0]);return {meta:{changes:1}};
    }
    throw Error("Unexpected SQL "+sql);
   }
  }}};
 }}};
 const deps={requireUser:async()=>user,json,origin:"https://ash-fall.com",audit:async(_env,actor,_action,_target,_id,details)=>{
  logged.unshift({created_at:new Date().toISOString(),actor_id:actor.id,details});
 }};
 const req=(path,method="GET",data,origin="https://ash-fall.com")=>
  new Request("https://api.ash-fall.com"+path,{
   method,headers:{origin, ...(method!=="GET"?{"content-type":"application/json"}:{})},
   ...(method!=="GET"?{body:JSON.stringify(data)}:{})
  });
 async function call(path,method="GET",data,origin){
  const request=req(path,method,data,origin);
  const response=await handleThemeCrew(request,env,new URL(request.url),deps);
  return {status:response.status,body:await response.json()};
 }
 return {call,read:()=>saved.get("theme_crew_current")??null,readRealm:realm=>saved.get("theme_crew_realm_"+realm)??null,logs:logged};
}
test("Theme Crew has five fixed presets and four real worker roles",()=>{
 assert.equal(Object.keys(THEME_CREW_PRESETS).length,5);
 assert.equal(THEME_CREW_BOTS.length,4);
 assert.equal(themePlan("poison emerald forest").preset,"verdant_crypt");
 assert.equal(themePlan("old blood red vampire").preset,"blood_moon");
 assert.equal(themePlan("gold black royal").preset,"royal_abyss");
 assert.equal(themePlan("Ancient Egypt with Anubis, gold and scarabs").preset,"cathedral");
 assert.equal(themePlan("industrial moonsteel").preset,"iron_eclipse");
 assert.equal(themePlan("a classic cathedral").preset,"cathedral");
 assert.equal(themePlan("x".repeat(201)),null);
});
test("Invalid stored state fails safe to the approved cathedral",()=>{
 for(const value of [null,"malformed",JSON.stringify({preset:"<script>",revision:999}),{}])
  assert.equal(normalizeThemeState(value).preset,"cathedral");
});
test("A visitor may read current preset but never mutate it",async()=>{
 const f=fixture(null);
 const visible=(await f.call("/api/theme")).body;
 assert.equal(visible.preset,"cathedral");
 assert.equal(visible.revision,0);
 assert.deepEqual(Object.keys(visible.realms).sort(),["admin","arcade","chaosphere","madhouse"]);
 assert.ok(Object.values(visible.realms).every(value=>value.preset==="cathedral"));
 assert.equal((await f.call("/api/god/theme/status")).status,401);
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0})).status,401);
});
test("Administrators may inspect and plan, but only GOD can publish or roll back global styles",async()=>{
 const admin=fixture({id:2,role:"admin"});
 const status=await admin.call("/api/god/theme/status");
 assert.equal(status.status,200);
 assert.deepEqual(status.body.permissions,{can_view:true,can_plan:true,can_preview:true,can_publish:false,can_rollback:false});
 const proposal=await admin.call("/api/god/theme/plan","POST",{mood:"moss green"});
 assert.equal(proposal.status,200);
 assert.equal(proposal.body.plan.preset,"verdant_crypt");
 assert.equal(admin.read(),null,"planning never writes public theme state");
 for(const endpoint of ["/api/god/theme/activate","/api/god/theme/rollback"]){
  const denied=await admin.call(endpoint,"POST",{preset:"iron_eclipse",expectedRevision:0});
  assert.equal(denied.status,403);
  assert.equal(admin.read(),null,"admin cannot alter sitewide theme data");
 }
 for(const role of ["member","moderator"]){
  const f=fixture({id:2,role});
  assert.equal((await f.call("/api/god/theme/status")).status,403);
  assert.equal((await f.call("/api/god/theme/plan","POST",{mood:"moss green"})).status,403);
  assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"iron_eclipse",expectedRevision:0})).status,403);
 }
});
test("Theme mutations enforce origin, schema, and a revision guard",async()=>{
 const f=fixture();
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0},"https://attacker.example")).status,403);
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"<script>",expectedRevision:0})).status,400);
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:18})).status,409);
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0.5})).status,400);
});
test("GOD can publish a whole-site recipe, see history, and roll back",async()=>{
 const f=fixture();
 const first=await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0});
 assert.equal(first.status,200);assert.equal(first.body.current.preset,"blood_moon");
 assert.equal(first.body.current.revision,1);
 assert.equal((await f.call("/api/theme")).body.preset,"blood_moon");
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"iron_eclipse",expectedRevision:0})).status,409);
 const history=await f.call("/api/god/theme/status");
 assert.equal(history.body.history[0].to,"blood_moon");
 const undo=await f.call("/api/god/theme/rollback","POST",{expectedRevision:1});
 assert.equal(undo.status,200);assert.equal(undo.body.current.preset,"cathedral");
 assert.equal(undo.body.current.revision,2);
 assert.equal(undo.body.rolled_back,true);
 assert.equal(f.logs[0].details.action,"rollback");
});
test("Planner only proposes code-reviewed themes; never directly publishes",async()=>{
 const f=fixture();
 const result=await f.call("/api/god/theme/plan","POST",{mood:"Moonsteel industrial violet"});
 assert.equal(result.status,200);assert.equal(result.body.plan.preset,"iron_eclipse");assert.equal(result.body.published,false);
 assert.equal((await f.call("/api/theme")).body.preset,"cathedral");
});


test("verified accepted admin partner can publish reviewed presets and roll back with audit history",async()=>{
 const f=fixture({id:42,role:"admin"},true);
 const status=await f.call("/api/god/theme/status");
 assert.equal(status.status,200);
 assert.deepEqual(status.body.permissions,{can_view:true,can_plan:true,can_preview:true,can_publish:true,can_rollback:true});
 const publish=await f.call("/api/god/theme/activate","POST",{preset:"verdant_crypt",expectedRevision:0});
 assert.equal(publish.status,200);
 assert.equal(publish.body.current.preset,"verdant_crypt");
 const rollback=await f.call("/api/god/theme/rollback","POST",{expectedRevision:1});
 assert.equal(rollback.status,200);
 assert.equal(rollback.body.current.preset,"cathedral");
 assert.equal(f.logs.length,2);
 assert.equal(f.logs[0].details.action,"rollback");
 for(const user of [{id:44,role:"admin"},{id:42,role:"member"}]){
  const guard=fixture(user,false);
  assert.equal((await guard.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0})).status,403);
 }
 const memberWithInvite=fixture({id:42,role:"member"},true);
 assert.equal((await memberWithInvite.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0})).status,403);
 const revoked=fixture({id:42,role:"admin"},false);
 assert.equal((await revoked.call("/api/god/theme/rollback","POST",{expectedRevision:0})).status,403);
});

test("independent realm revisions, inherited defaults, and per-realm rollback never leak",async()=>{
 const f=fixture();
 const global=await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0});
 assert.equal(global.status,200);
 const initial=(await f.call("/api/theme")).body;
 assert.equal(initial.preset,"blood_moon");
 for(const item of Object.values(initial.realms))assert.equal(item.preset,"blood_moon","Uncustomized domains inherit sitewide theme");
 const madhouse=await f.call("/api/god/theme/activate","POST",{realm:"madhouse",preset:"verdant_crypt",expectedRevision:0});
 assert.equal(madhouse.status,200);
 assert.equal(madhouse.body.realm,"madhouse");
 assert.equal(madhouse.body.current.revision,1);
 const after=(await f.call("/api/theme")).body;
 assert.equal(after.realms.madhouse.preset,"verdant_crypt");
 assert.equal(after.realms.arcade.preset,"blood_moon");
 assert.equal(after.realms.chaosphere.preset,"blood_moon");
 assert.equal(after.realms.admin.preset,"blood_moon");
 const arcade=await f.call("/api/god/theme/activate","POST",{realm:"arcade",preset:"iron_eclipse",expectedRevision:0});
 assert.equal(arcade.status,200);
 const conflict=await f.call("/api/god/theme/activate","POST",{realm:"madhouse",preset:"royal_abyss",expectedRevision:0});
 assert.equal(conflict.status,409,"Independent realms guard against stale revisions");
 const rolled=await f.call("/api/god/theme/rollback","POST",{realm:"madhouse",expectedRevision:1});
 assert.equal(rolled.status,200);
 assert.equal(rolled.body.current.preset,"blood_moon");
 assert.equal(rolled.body.current.revision,2);
 const final=(await f.call("/api/theme")).body;
 assert.equal(final.realms.arcade.preset,"iron_eclipse","Rolling back the Madhouse must not alter the arcade");
 assert.equal(final.realms.madhouse.preset,"blood_moon");
 assert.equal(final.realms.chaosphere.preset,"blood_moon");
 assert.equal(final.realms.admin.preset,"blood_moon");
 assert.equal(final.preset,"blood_moon");
 const staff=(await f.call("/api/god/theme/status")).body;
 assert.equal(staff.realms.madhouse.revision,2);
 assert.equal(staff.realms.arcade.revision,1);
 assert.equal(staff.history[0].realm,"madhouse");
 assert.equal(f.logs[0].details.realm,"madhouse");
});
test("realm selectors are allowlisted and admin/Isis editing cannot bypass authorization",async()=>{
 const f=fixture();
 for(const realm of ["../../secrets","",42,"realm_test","__proto__"]){
  assert.equal((await f.call("/api/god/theme/activate","POST",{realm,preset:"blood_moon",expectedRevision:0})).status,400);
 }
 const unauthorized=fixture({id:6,role:"admin"});
 assert.equal((await unauthorized.call("/api/god/theme/activate","POST",{realm:"admin",preset:"blood_moon",expectedRevision:0})).status,403);
 const delegated=fixture({id:42,role:"admin"},true);
 assert.equal((await delegated.call("/api/god/theme/activate","POST",{realm:"admin",preset:"royal_abyss",expectedRevision:0})).status,200);
 assert.equal((await delegated.call("/api/theme")).body.realms.admin.preset,"royal_abyss");
});

test("global controls have fixed independent defaults and reject unsafe payloads",async()=>{
 assert.deepEqual(normalizeGlobalControls({density:"compact",corners:"rounded",typography:"large",effects:"subtle"}),
  {density:"compact",corners:"rounded",typography:"large",effects:"subtle"});
 assert.equal(normalizeGlobalControls({density:"javascript:evil"}).density,"balanced");
 assert.deepEqual(Object.keys(THEME_GLOBAL_OPTIONS).sort(),["corners","density","effects","typography"]);
 const f=fixture();
 const initial=(await f.call("/api/theme")).body;
 assert.equal(initial.globalControls.density,"balanced");
 assert.equal(initial.globalControls.corners,"soft");
 for(const controls of [
  {density:"custom",corners:"soft",typography:"standard",effects:"ceremonial"},
  {density:"compact",corners:"soft",typography:"standard",effects:"ceremonial",css:"body{display:none}"},
  {density:"compact",corners:"soft",typography:"standard"},
  "body{display:none}",null
 ]){
  assert.equal((await f.call("/api/god/theme/global","POST",{controls,expectedRevision:0})).status,400);
 }
 assert.equal((await f.call("/api/god/theme/global","POST",{controls:{density:"compact",corners:"soft",typography:"standard",effects:"subtle"},expectedRevision:0},"https://evil.example")).status,403);
 assert.equal((await f.call("/api/theme")).body.globalControls.revision,0);
});
test("GOD can publish global chrome without changing any realm, independently roll it back",async()=>{
 const f=fixture();
 const palette=await f.call("/api/god/theme/activate","POST",{realm:"chaosphere",preset:"iron_eclipse",expectedRevision:0});
 assert.equal(palette.status,200);
 const chosen={density:"compact",corners:"rounded",typography:"large",effects:"subtle"};
 const post=await f.call("/api/god/theme/global","POST",{controls:chosen,expectedRevision:0});
 assert.equal(post.status,200);
 assert.equal(post.body.current.revision,1);
 assert.equal(post.body.current.corners,"rounded");
 const pub=(await f.call("/api/theme")).body;
 assert.equal(pub.globalControls.density,"compact");
 assert.equal(pub.realms.chaosphere.preset,"iron_eclipse");
 assert.equal(pub.realms.chaosphere.revision,1);
 assert.equal(pub.realms.madhouse.preset,"cathedral");
 assert.equal((await f.call("/api/god/theme/global","POST",{controls:chosen,expectedRevision:0})).status,409);
 assert.equal((await f.call("/api/god/theme/global","POST",{controls:chosen,expectedRevision:1})).status,409);
 const history=(await f.call("/api/god/theme/status")).body.history;
 assert.equal(history[0].realm,"global");
 const rolled=await f.call("/api/god/theme/global/rollback","POST",{expectedRevision:1});
 assert.equal(rolled.status,200);
 assert.equal(rolled.body.current.density,"balanced");
 assert.equal(rolled.body.current.revision,2);
 assert.equal((await f.call("/api/theme")).body.realms.chaosphere.preset,"iron_eclipse");
 assert.equal(f.logs[0].details.action,"global_rollback");
});
test("global publishing requires GOD or a verified accepted admin partner",async()=>{
 const blocked=fixture({id:3,role:"admin"});
 const controls={density:"relaxed",corners:"square",typography:"extra_large",effects:"minimal"};
 assert.equal((await blocked.call("/api/god/theme/status")).body.permissions.can_publish,false);
 assert.equal((await blocked.call("/api/god/theme/global","POST",{controls,expectedRevision:0})).status,403);
 assert.equal((await blocked.call("/api/god/theme/global/rollback","POST",{expectedRevision:0})).status,403);
 const allowed=fixture({id:42,role:"admin"},true);
 assert.equal((await allowed.call("/api/god/theme/global","POST",{controls,expectedRevision:0})).status,200);
 assert.equal((await allowed.call("/api/theme")).body.globalControls.typography,"extra_large");
 const outsider=fixture({id:9,role:"member"},true);
 assert.equal((await outsider.call("/api/god/theme/global","POST",{controls,expectedRevision:0})).status,403);
});
