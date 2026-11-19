import {canAccessEyeOfChaos,canAccessEyeOfHorus} from "./staff-capabilities.js";

// Theme Crew: fixed, allowlisted sitewide looks. No AI-generated or arbitrary CSS
// reaches the browser. This state is stored in the existing site_settings D1 table.
export const THEME_CREW_PRESETS=Object.freeze({
 cathedral:Object.freeze({name:"Cathedral Ascendant",tag:"Approved original",mood:"Opulent Gothic architecture, antique metal, eclipse violet, bone parchment",accent:"#c7a77c"}),
 blood_moon:Object.freeze({name:"Blood Moon Court",tag:"Crimson / velvet",mood:"Ox-blood velvet, candlelight, rose gold and dark cathedral stone",accent:"#e59ab1"}),
 verdant_crypt:Object.freeze({name:"Verdant Crypt",tag:"Poison ivy / copper",mood:"Moss-covered ironwork, emerald stained glass and aged bronze",accent:"#a7c899"}),
 iron_eclipse:Object.freeze({name:"Iron Eclipse",tag:"Steel / electric violet",mood:"Cold moonsteel, bruised violet and mechanical Gothic ruins",accent:"#b3a4de"}),
 royal_abyss:Object.freeze({name:"Royal Abyss",tag:"Gold / obsidian",mood:"Black marble, gilded heraldry, deep plum and ceremonial gold",accent:"#efd2a0"})
});
export const THEME_CREW_BOTS=Object.freeze([
 {key:"veil-sentinel",name:"Veil Sentinel",role:"CSS Auditor",capability:"Scheduled repository-wide CSS inventory, import/asset checks and isolation guards",execution:"GitHub Actions schedule",publishes:false},
 {key:"morgue-mason",name:"Morgue Mason",role:"Style Architect",capability:"Rule-based look planning from approved theme recipes; preview only until GOD publishes",execution:"GOD command",publishes:false},
 {key:"prism-warden",name:"Prism Warden",role:"Visual QA",capability:"Real route, game-exclusion, accessibility and responsive regression checks",execution:"GitHub Actions checks",publishes:false},
 {key:"switchblade",name:"Switchblade",role:"Theme Publisher",capability:"Immediate allowlisted sitewide preset change and single-step rollback",execution:"GOD approval required",publishes:true}
]);
const STORE_KEY="theme_crew_current";
const DEFAULT=Object.freeze({preset:"cathedral",previous:"cathedral",revision:0,updated_at:null});
const allowedOrigin=new Set(["https://ash-fall.com","https://www.ash-fall.com"]);
const ts=()=>new Date().toISOString();
const respondStatus="private, no-store";
export const publicTheme=state=>({preset:state.preset,revision:state.revision,updated_at:state.updated_at});
export function normalizeThemeState(value){
 try{
  const state=typeof value==="string"?JSON.parse(value):value;
  if(!state||!Object.hasOwn(THEME_CREW_PRESETS,state.preset))return {...DEFAULT};
  const previous=Object.hasOwn(THEME_CREW_PRESETS,state.previous)?state.previous:"cathedral";
  const revision=Number.isSafeInteger(state.revision)&&state.revision>=0?state.revision:0;
  return {preset:state.preset,previous,revision,updated_at:typeof state.updated_at==="string"?state.updated_at:null};
 }catch{return {...DEFAULT}}
}
async function readCurrent(env){
 const row=await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(STORE_KEY).first();
 return {state:normalizeThemeState(row?.value),raw:row?.value??null};
}
async function prepareCurrent(env){
 await env.DB.prepare("INSERT OR IGNORE INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,NULL,?)")
  .bind(STORE_KEY,JSON.stringify(DEFAULT),ts()).run();
 return readCurrent(env);
}
async function history(env){
 try{
  const rows=(await env.DB.prepare("SELECT created_at,actor_id,details FROM audit_logs WHERE action=? ORDER BY id DESC LIMIT 25")
   .bind("theme_crew.publish").all()).results||[];
  return rows.map(row=>{
   let details={};try{details=JSON.parse(row.details||"{}")}catch{}
   return {at:row.created_at,actor_id:row.actor_id,from:details.from,to:details.to,revision:details.revision,action:details.action};
  }).filter(x=>typeof x.to==="string");
 }catch{return []}
}
async function readBody(request){
 const size=Number(request.headers.get("content-length")||0);
 if(size>2048)throw Error("Request is too large.");
 const text=await request.text();
 if(text.length>2048)throw Error("Request is too large.");
 return JSON.parse(text);
}
export function themePlan(mood){
 if(typeof mood!=="string"||mood.length>200)return null;
 const q=mood.toLowerCase().trim();
 const patterns=[
  [/blood|rose|red|velvet|vamp|crimson|gore/,"blood_moon"],
  [/green|poison|forest|moss|ivy|emerald|crypt/,"verdant_crypt"],
  [/steel|iron|industrial|silver|blue|violet|cyber/,"iron_eclipse"],
  [/royal|gold|luxur|regal|black|abyss|baroque/,"royal_abyss"]
 ];
 const preset=patterns.find(([re])=>re.test(q))?.[1]||"cathedral";
 return {preset,reason:"Matched to a reviewed, code-defined theme recipe. No generated CSS or images were published.",mood:q};
}
export async function handleThemeCrew(request,env,url,{requireUser,json,origin,audit}){
 const path=url.pathname;
 const isPublic=path==="/api/theme";
 const isGod=path==="/api/god/theme"||path.startsWith("/api/god/theme/");
 if(!isPublic&&!isGod)return null;
 const reply=(value,status=200)=>json(value,status,origin,{"cache-control":respondStatus,"x-robots-tag":"noindex,nofollow"});
 if(isPublic){
  if(request.method!=="GET")return reply({error:"Method not allowed"},405);
  return reply(publicTheme((await readCurrent(env)).state));
 }
 const user=await requireUser(request,env);
 if(!user)return reply({error:"Sign in as Knightfall staff."},401);
 if(!canAccessEyeOfChaos(user))return reply({error:"Administrator or GOD access required."},403);
 const canPublish=canAccessEyeOfHorus(user);
 // Administrators can inspect, plan and preview, but cannot mutate sitewide theme.
 if(!canPublish&&(path==="/api/god/theme/activate"||path==="/api/god/theme/rollback"))
   return reply({error:"Only GOD can publish or roll back the sitewide theme."},403);
 if(path==="/api/god/theme/status"&&request.method==="GET"){
  const state=(await readCurrent(env)).state;
  return reply({current:state,presets:THEME_CREW_PRESETS,bots:THEME_CREW_BOTS,
    history:await history(env),workflow:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/theme-crew.yml",
    permissions:{can_view:true,can_plan:true,can_preview:true,can_publish:canPublish,can_rollback:canPublish},
    policy:"Staff may inspect and plan. Only GOD may publish or roll back. Every update is versioned and reversible. No arbitrary CSS endpoint."});
 }
 if(request.method!=="POST")return reply({error:"Unsupported Theme Crew action."},405);
 if(!allowedOrigin.has(request.headers.get("Origin")))return reply({error:"Open the staff theme console on Knightfall."},403);
 if(!String(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return reply({error:"JSON required."},415);
 let data;try{data=await readBody(request)}catch{return reply({error:"Invalid JSON payload."},400)}
 if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Invalid payload."},400);
 if(path==="/api/god/theme/plan"){
  const plan=themePlan(data.mood);
  if(!plan)return reply({error:"Provide a short mood description."},400);
  return reply({plan,preset:THEME_CREW_PRESETS[plan.preset],published:false});
 }
 if(path!=="/api/god/theme/activate"&&path!=="/api/god/theme/rollback")return reply({error:"Unknown Theme Crew operation."},404);
 if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0)return reply({error:"Expected revision required. Refresh the console."},400);
 const {state,raw}=await prepareCurrent(env);
 if(data.expectedRevision!==state.revision)return reply({error:"Theme was updated elsewhere. Refresh before publishing.",current:state},409);
 const rollback=path.endsWith("/rollback");
 const target=rollback?state.previous:data.preset;
 if(!Object.hasOwn(THEME_CREW_PRESETS,target))return reply({error:"Choose an approved theme."},400);
 if(target===state.preset)return reply({error:rollback?"No earlier theme to restore.":"This theme is already live.",current:state},409);
 const next={preset:target,previous:state.preset,revision:state.revision+1,updated_at:ts()};
 // Compare-and-swap. Two simultaneous GOD commands cannot overwrite each other.
 const result=await env.DB.prepare("UPDATE site_settings SET value=?,updated_by=?,updated_at=? WHERE key=? AND value=?")
  .bind(JSON.stringify(next),user.id,next.updated_at,STORE_KEY,raw).run();
 if(Number(result.meta?.changes||0)!==1)return reply({error:"Theme changed concurrently. Refresh and retry."},409);
 try{await audit(env,user,"theme_crew.publish","site_theme",null,
  {from:state.preset,to:next.preset,revision:next.revision,action:rollback?"rollback":"activate"})}
 catch(error){console.warn("theme_crew_audit_failed",String(error))}
 return reply({ok:true,current:next,preset:THEME_CREW_PRESETS[next.preset],rolled_back:rollback});
}
