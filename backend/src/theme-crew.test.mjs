import test from "node:test";
import assert from "node:assert/strict";
import {handleThemeCrew,normalizeThemeState,themePlan,THEME_CREW_PRESETS,THEME_CREW_BOTS} from "./theme-crew.js";
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json"}});
function fixture(user={id:1,role:"god"}){
 let saved=null,logged=[];
 const env={DB:{prepare(sql){
  return {bind(...params){return {
   async first(){if(sql.startsWith("SELECT value"))return saved===null?null:{value:saved};return null},
   async all(){return {results:logged.map(e=>({created_at:e.created_at,actor_id:e.actor_id,details:JSON.stringify(e.details)}))}},
   async run(){
    if(sql.startsWith("INSERT OR IGNORE")){if(saved===null)saved=params[1];return {meta:{changes:1}}}
    if(sql.startsWith("UPDATE site_settings")){
     if(saved!==params[4])return {meta:{changes:0}};
     saved=params[0];return {meta:{changes:1}};
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
 return {call,read:()=>saved,logs:logged};
}
test("Theme Crew has five fixed presets and four real worker roles",()=>{
 assert.equal(Object.keys(THEME_CREW_PRESETS).length,5);
 assert.equal(THEME_CREW_BOTS.length,4);
 assert.equal(themePlan("poison emerald forest").preset,"verdant_crypt");
 assert.equal(themePlan("old blood red vampire").preset,"blood_moon");
 assert.equal(themePlan("gold black royal").preset,"royal_abyss");
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
 assert.deepEqual((await f.call("/api/theme")).body,{preset:"cathedral",revision:0,updated_at:null});
 assert.equal((await f.call("/api/god/theme/status")).status,401);
 assert.equal((await f.call("/api/god/theme/activate","POST",{preset:"blood_moon",expectedRevision:0})).status,401);
});
test("Admin accounts cannot impersonate GOD to publish global styles",async()=>{
 for(const role of ["admin","member","moderator"]){
  const f=fixture({id:2,role});
  assert.equal((await f.call("/api/god/theme/status")).status,403);
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
