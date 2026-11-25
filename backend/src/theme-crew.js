import {canAccessEyeOfChaos,canAccessEyeOfHorus} from "./staff-capabilities.js";
import {acceptedAdminPartner} from "./chaos-companion.mjs";

// Theme Crew: fixed, allowlisted sitewide looks. No AI-generated or arbitrary CSS
// reaches the browser. This state is stored in the existing site_settings D1 table.
export const THEME_CREW_PRESETS=Object.freeze({
 jedi_sanctuary:Object.freeze({"name":"Jedi Sanctuary","tag":"Bronze / sapphire","mood":"Ceremonial temple vector ornaments; vector edition, environmental artwork pending","accent":"#e6c78c"}),
 neon_dystopia:Object.freeze({"name":"Neon Dystopia","tag":"Magenta / acid green","mood":"Cyberpunk circuit ornaments; vector edition, environmental artwork pending","accent":"#ff38ae"}),
 the_asylum:Object.freeze({"name":"The Asylum","tag":"Iron / crimson","mood":"Gothic institutional ornaments; vector edition, environmental artwork pending","accent":"#bba18b"}),
 arcade_anarchy:Object.freeze({"name":"Arcade Anarchy","tag":"Magenta / cyan","mood":"Retro arcade geometric ornaments; vector edition, environmental artwork pending","accent":"#f64cff"}),
 astral_dominion:Object.freeze({"name":"Astral Dominion","tag":"Silver / violet","mood":"Celestial orbital ornaments; vector edition, environmental artwork pending","accent":"#c5c9ef"}),
 egyptian_eclipse:Object.freeze({name:"Egyptian Eclipse",tag:"Gold / turquoise / obsidian",mood:"Original eclipsed temple artwork, gilded Anubis halls, turquoise lunar fire, custom winged cartouches and eight matching SVG ornaments",accent:"#e7b65c"}),
 dark_lord_ascendant:Object.freeze({name:"Dark Lord Ascendant",tag:"Crimson / gunmetal / obsidian",mood:"Original dark-space-fantasy throne room, crimson eclipsed command citadel and eight brushed metal SVG ornaments",accent:"#d5b8c1"}),
 korriban_necropolis:Object.freeze({name:"Korriban · Red Necropolis",tag:"Crimson / sandstone / iron",mood:"Original red desert crypt and tomb-city painting with eight sandstone and iron SVG ornaments",accent:"#d9a078"}),
 mustafar_forge:Object.freeze({name:"Mustafar · Obsidian Forge",tag:"Lava / copper / black glass",mood:"Original volcanic black-stone citadel painting, molten rivers and eight lava-metal SVG ornaments",accent:"#edaf65"}),
 cathedral:Object.freeze({name:"Black Sun Temple",tag:"Egyptian / obsidian",mood:"Anubis guardians, golden cartouches, dark temples, crimson eclipse and emerald scarabs",accent:"#e2bc76"}),
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
// Each domain can inherit the site look or publish its own independent recipe.
export const THEME_CREW_REALMS=Object.freeze({
 site:Object.freeze({name:"Knightfall / Shared",path:"/"}),
 madhouse:Object.freeze({name:"The Madhouse",path:"/community.html"}),
 arcade:Object.freeze({name:"Chaos Cartridge",path:"/chaos-cartridge.html"}),
 chaosphere:Object.freeze({name:"Chaosphere",path:"/chaosphere.html"}),
 admin:Object.freeze({name:"Eye of Chaos / Osiris & Isis",path:"/eye-of-chaos.html"})
});
// Shared interface controls are a separate versioned record, NOT another realm.
export const THEME_GLOBAL_OPTIONS=Object.freeze({
 density:Object.freeze(["balanced","compact","relaxed"]),
 corners:Object.freeze(["soft","square","rounded"]),
 typography:Object.freeze(["standard","large","extra_large"]),
 effects:Object.freeze(["ceremonial","subtle","minimal"])
});
const GLOBAL_KEY="theme_crew_global_controls";
const GLOBAL_DEFAULT=Object.freeze({density:"balanced",corners:"soft",typography:"standard",effects:"ceremonial"});
const globalKeys=Object.keys(THEME_GLOBAL_OPTIONS);
const validGlobalControls=value=>value&&typeof value==="object"&&!Array.isArray(value)&&
 Object.keys(value).length===globalKeys.length&&globalKeys.every(key=>THEME_GLOBAL_OPTIONS[key].includes(value[key]));
export function normalizeGlobalControls(value){
 let data=value;
 try{if(typeof data==="string")data=JSON.parse(data)}catch{data=null}
 return Object.fromEntries(globalKeys.map(key=>[key,THEME_GLOBAL_OPTIONS[key].includes(data?.[key])?data[key]:GLOBAL_DEFAULT[key]]));
}
export function normalizeGlobalState(value){
 let data=value;
 try{if(typeof data==="string")data=JSON.parse(data)}catch{data=null}
 return {...normalizeGlobalControls(data),previous:normalizeGlobalControls(data?.previous),
  revision:Number.isSafeInteger(data?.revision)&&data.revision>=0?data.revision:0,
  updated_at:typeof data?.updated_at==="string"?data.updated_at:null};
}
const publicGlobal=state=>({...normalizeGlobalControls(state),revision:state.revision,updated_at:state.updated_at});
async function readGlobal(env){
 const row=await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(GLOBAL_KEY).first();
 return {state:normalizeGlobalState(row?.value),raw:row?.value??null};
}
async function prepareGlobal(env){
 const initial={...GLOBAL_DEFAULT,previous:GLOBAL_DEFAULT,revision:0,updated_at:null};
 await env.DB.prepare("INSERT OR IGNORE INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,NULL,?)")
  .bind(GLOBAL_KEY,JSON.stringify(initial),ts()).run();
 return readGlobal(env);
}
const globalLabel=value=>globalKeys.map(key=>String(value[key])).join(" / ");
const STORE_KEY="theme_crew_current";
const storeKey=realm=>realm==="site"?STORE_KEY:"theme_crew_realm_"+realm;
const validRealm=value=>typeof value==="string"&&Object.hasOwn(THEME_CREW_REALMS,value);
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
async function readCurrent(env,realm="site",inherited=null){
 const row=await env.DB.prepare("SELECT value FROM site_settings WHERE key=?").bind(storeKey(realm)).first();
 if(row?.value!=null)return {state:normalizeThemeState(row.value),raw:row.value};
 const base=inherited||DEFAULT;
 return {state:{preset:base.preset,previous:base.preset,revision:0,updated_at:null,inherited:realm!=="site"},raw:null};
}
async function prepareCurrent(env,realm="site"){
 // Realm first-edit snapshot comes from the live shared theme; later edits are isolated.
 const inherited=realm==="site"?DEFAULT:(await readCurrent(env)).state;
 const initial={preset:inherited.preset,previous:inherited.preset,revision:0,updated_at:null};
 await env.DB.prepare("INSERT OR IGNORE INTO site_settings (key,value,updated_by,updated_at) VALUES (?,?,NULL,?)")
  .bind(storeKey(realm),JSON.stringify(initial),ts()).run();
 return readCurrent(env,realm);
}
async function readAllCurrent(env){
 const site=(await readCurrent(env)).state;
 const entries=await Promise.all(Object.keys(THEME_CREW_REALMS).filter(key=>key!=="site")
  .map(async realm=>[realm,(await readCurrent(env,realm,site)).state]));
 return {site,realms:Object.fromEntries(entries)};
}
async function history(env){
 try{
  const rows=(await env.DB.prepare("SELECT created_at,actor_id,details FROM audit_logs WHERE action=? ORDER BY id DESC LIMIT 25")
   .bind("theme_crew.publish").all()).results||[];
  return rows.map(row=>{
   let details={};try{details=JSON.parse(row.details||"{}")}catch{}
   return {at:row.created_at,actor_id:row.actor_id,realm:details.realm||"site",from:details.from,to:details.to,revision:details.revision,action:details.action};
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
  [/jedi|sanctuary|meditation temple/,"jedi_sanctuary"],
  [/dystopia|cyberpunk|neon city/,"neon_dystopia"],
  [/asylum|madhouse|gothic hospital/,"the_asylum"],
  [/arcade|retro gaming|anarchy/,"arcade_anarchy"],
  [/astral|celestial|astrology|dominion/,"astral_dominion"],
  [/dark lord|dark.?space|crimson citadel|ascendant|black armour|star fortress/,"dark_lord_ascendant"],
  [/korriban|necropolis|red desert|ancient tomb|tomb.?city/,"korriban_necropolis"],
  [/mustafar|obsidian forge|volcanic fortress|lava river|molten|black glass/,"mustafar_forge"],
   [/egypt|anubis|horus|isis|osiris|scarab|pharaoh|duat|sphinx|turquoise|solar temple/,"egyptian_eclipse"],
  [/temple|black sun|cathedral/,"cathedral"],
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
  const [{site,realms},{state:globalControls}]=await Promise.all([readAllCurrent(env),readGlobal(env)]);
  return reply({...publicTheme(site),globalControls:publicGlobal(globalControls),realms:Object.fromEntries(Object.entries(realms).map(([key,value])=>[key,publicTheme(value)]))});
 }
 const user=await requireUser(request,env);
 if(!user)return reply({error:"Sign in as Knightfall staff."},401);
 if(!canAccessEyeOfChaos(user))return reply({error:"Administrator or GOD access required."},403);
 // Trusted admin collaborators can publish only reviewed, version-guarded presets.
 // Other administrators can inspect and preview without affecting the site.
 const canPublish=canAccessEyeOfHorus(user)||await acceptedAdminPartner(env,user);
 if(!canPublish&&["/api/god/theme/activate","/api/god/theme/rollback","/api/god/theme/global","/api/god/theme/global/rollback"].includes(path))
   return reply({error:"Owner or delegated admin partner approval required."},403);
 if(path==="/api/god/theme/status"&&request.method==="GET"){
  const [{site,realms},{state:globalControls}]=await Promise.all([readAllCurrent(env),readGlobal(env)]);
  return reply({current:site,realms,globalControls,globalOptions:THEME_GLOBAL_OPTIONS,realmMeta:THEME_CREW_REALMS,presets:THEME_CREW_PRESETS,bots:THEME_CREW_BOTS,
    history:await history(env),workflow:"https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/theme-crew.yml",
    permissions:{can_view:true,can_plan:true,can_preview:true,can_publish:canPublish,can_rollback:canPublish},
    policy:"All administrators can inspect and plan. GOD and the accepted admin partner can publish reviewed presets and roll back. Every update is versioned, audited, and reversible. No arbitrary CSS endpoint."});
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
 if(path==="/api/god/theme/global"||path==="/api/god/theme/global/rollback"){
  if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0)
   return reply({error:"Expected global revision required. Refresh the console."},400);
  const rollback=path.endsWith("/rollback");
  if(!rollback&&!validGlobalControls(data.controls))
   return reply({error:"Choose only the approved global interface options."},400);
  const {state,raw}=await prepareGlobal(env);
  if(state.revision!==data.expectedRevision)
   return reply({error:"Global controls changed elsewhere. Refresh before publishing.",current:state},409);
  const target=rollback?state.previous:data.controls;
  if(!validGlobalControls(target))return reply({error:"Stored global control values invalid."},409);
  if(globalKeys.every(key=>target[key]===state[key]))
   return reply({error:rollback?"No earlier global controls to restore.":"Those global controls are already live.",current:state},409);
  const next={...normalizeGlobalControls(target),previous:normalizeGlobalControls(state),revision:state.revision+1,updated_at:ts()};
  const result=await env.DB.prepare("UPDATE site_settings SET value=?,updated_by=?,updated_at=? WHERE key=? AND value=?")
   .bind(JSON.stringify(next),user.id,next.updated_at,GLOBAL_KEY,raw).run();
  if(Number(result.meta?.changes||0)!==1)return reply({error:"Global controls changed concurrently. Refresh and retry."},409);
  try{await audit(env,user,"theme_crew.publish","site_theme",null,
   {realm:"global",from:globalLabel(state),to:globalLabel(next),revision:next.revision,action:rollback?"global_rollback":"global_activate"})}
  catch(error){console.warn("theme_crew_global_audit_failed",String(error))}
  return reply({ok:true,realm:"global",current:next,rolled_back:rollback});
 }
 if(path!=="/api/god/theme/activate"&&path!=="/api/god/theme/rollback")return reply({error:"Unknown Theme Crew operation."},404);
 const realm=data.realm??"site";
 if(!validRealm(realm))return reply({error:"Unknown theme realm."},400);
 if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0)return reply({error:"Expected revision required. Refresh the console."},400);
 const {state,raw}=await prepareCurrent(env,realm);
 if(data.expectedRevision!==state.revision)return reply({error:"Theme was updated elsewhere. Refresh before publishing.",current:state},409);
 const rollback=path.endsWith("/rollback");
 const target=rollback?state.previous:data.preset;
 if(!Object.hasOwn(THEME_CREW_PRESETS,target))return reply({error:"Choose an approved theme."},400);
 if(target===state.preset)return reply({error:rollback?"No earlier theme to restore.":"This theme is already live.",current:state},409);
 const next={preset:target,previous:state.preset,revision:state.revision+1,updated_at:ts()};
 // Compare-and-swap. Two authorized staff commands cannot overwrite each other.
 const result=await env.DB.prepare("UPDATE site_settings SET value=?,updated_by=?,updated_at=? WHERE key=? AND value=?")
  .bind(JSON.stringify(next),user.id,next.updated_at,storeKey(realm),raw).run();
 if(Number(result.meta?.changes||0)!==1)return reply({error:"Theme changed concurrently. Refresh and retry."},409);
 try{await audit(env,user,"theme_crew.publish","site_theme",null,
  {realm,from:state.preset,to:next.preset,revision:next.revision,action:rollback?"rollback":"activate"})}
 catch(error){console.warn("theme_crew_audit_failed",String(error))}
 return reply({ok:true,realm,current:next,preset:THEME_CREW_PRESETS[next.preset],rolled_back:rollback});
}
