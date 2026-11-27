(()=>{
"use strict";
// Realm Theme Engine v3: each realm may inherit the published site theme, or
// hold its own allowlisted, revision-guarded recipe. Browser state is NEVER auth.
const API="https://api.ash-fall.com/api/theme";
const PREVIEW="kf:theme-crew-preview";
const LIVE_CACHE="kf:theme-live-cache-v3";
const GLOBAL_PREVIEW="kf:global-design-preview";
const PUBLISH_SIGNAL="kf:theme-published-v1";
const channel=typeof BroadcastChannel==="function"?new BroadcastChannel("kf:theme-published"):null;
const KNOWN=new Set(["cathedral","egyptian_eclipse","dark_lord_ascendant","korriban_necropolis","mustafar_forge","blood_moon","verdant_crypt","iron_eclipse","royal_abyss","jedi_sanctuary","neon_dystopia","the_asylum","arcade_anarchy","astral_dominion"]);
// Separate visual flag; trusted preset keys remain server-allowlisted.
const ART_KITS=new Set(["dark_lord_ascendant","korriban_necropolis","mustafar_forge","jedi_sanctuary","neon_dystopia","the_asylum","arcade_anarchy","astral_dominion"]);
const REALMS=new Set(["site","madhouse","arcade","chaosphere","admin"]);
const GLOBAL_OPTIONS=Object.freeze({
 density:["balanced","compact","relaxed"],
 corners:["soft","square","rounded"],
 typography:["standard","large","extra_large"],
 effects:["ceremonial","subtle","minimal"]
});
const GLOBAL_DEFAULT=Object.freeze({density:"balanced",corners:"soft",typography:"standard",effects:"ceremonial"});
const globalKeys=Object.keys(GLOBAL_OPTIONS);
// Published API data also carries revision metadata; preview requests never do.
const validGlobal=value=>value&&typeof value==="object"&&!Array.isArray(value)&&
 globalKeys.every(key=>GLOBAL_OPTIONS[key].includes(value[key]));
const exactGlobal=value=>validGlobal(value)&&Object.keys(value).length===globalKeys.length;
const safeGlobal=value=>validGlobal(value)?Object.fromEntries(globalKeys.map(key=>[key,value[key]])):GLOBAL_DEFAULT;
const globalPreview=()=>{try{const data=JSON.parse(sessionStorage.getItem(GLOBAL_PREVIEW)||"null");
 return exactGlobal(data)?safeGlobal(data):null}catch{return null}};
const enabledHosts=new Set(["ash-fall.com","www.ash-fall.com"]);
const path=location.pathname.toLowerCase();
// Hosted games and account recovery remain outside the theme orchestration.
if(/^\/(?:arcade\/hosted\/|games\/|casino\/)/.test(path)||/^\/(?:offline|personal-bots-offline)(?:\.html)?$/.test(path))return;
const isLive=enabledHosts.has(location.hostname.toLowerCase());
const safe=value=>KNOWN.has(value)?value:null;
const safeRealm=value=>REALMS.has(value)?value:null;
const routeRealm=()=>{
 const p=path.replace(/\.html$/,"");
 if(/^\/(?:community|homepage|thread|create-thread|forums|madhouse)(?:-|\/|$)/.test(p))return "madhouse";
 if(/^\/(?:chaos-cartridge|chaos-lab|arcade|arcade-vault|casino|card-room)(?:-|\/|$)/.test(p))return "arcade";
 if(/^\/(?:chaosphere|ruinwire|messages|social|friends|notifications|miss-chaos)(?:-|\/|$)/.test(p))return "chaosphere";
 if(/^\/(?:admin|eye-of-chaos|eye-of-horus|god|moderation|theme-crew)(?:-|\/|$)/.test(p))return "admin";
 return "site";
};
const activeScope=routeRealm();
const validState=value=>value&&safe(value.preset)&&Number.isSafeInteger(value.revision)&&value.revision>=0;
const fromStorage=()=>{try{
 const value=JSON.parse(localStorage.getItem(LIVE_CACHE)||"null");
 return validState(value)?value:null;
}catch{return null}};
const cached=fromStorage();
let live={preset:cached?.preset||"cathedral",revision:cached?.revision??-1,
 realms:cached?.realms&&typeof cached.realms==="object"?cached.realms:{},
 globalControls:validGlobal(cached?.globalControls)?cached.globalControls:GLOBAL_DEFAULT};
let pendingRefresh=null,lastRefreshStart=0;
const publishedState=scope=>{
 const site={preset:live.preset,revision:live.revision};
 const scoped=scope!=="site"?live.realms[scope]:null;
 return validState(scoped)?scoped:site;
};
const previewKey=scope=>scope==="site"?PREVIEW:PREVIEW+":"+scope;
const preview=scope=>{try{return safe(sessionStorage.getItem(previewKey(scope)))}catch{return null}};
const params=new URLSearchParams(location.search);
const param=safe(params.get("kf_theme_preview"));
const requestedScope=safeRealm(params.get("kf_theme_scope"))||"site";
if(param&&requestedScope===activeScope)try{sessionStorage.setItem(previewKey(activeScope),param)}catch{}
const paint=()=>{
 if(!document.body)return;
 const state=publishedState(activeScope),privatePreset=preview(activeScope);
 const chosen=privatePreset||state.preset;
 const global=globalPreview()||safeGlobal(live.globalControls);
 document.body.dataset.kfGlobalDensity=global.density;
 document.body.dataset.kfGlobalCorners=global.corners;
 document.body.dataset.kfGlobalTypography=global.typography;
 document.body.dataset.kfGlobalEffects=global.effects;
 document.body.dataset.kfThemeScope=activeScope;
 document.body.dataset.kfTheme=chosen;
 document.body.dataset.kfArtTheme=String(ART_KITS.has(chosen));
 if(privatePreset)document.body.dataset.kfThemePreview="true";
 else delete document.body.dataset.kfThemePreview;
 document.dispatchEvent(new CustomEvent("kf:theme-change",{
  detail:{scope:activeScope,preset:chosen,published:state.preset,preview:!!privatePreset,revision:state.revision,globalControls:global}
 }));
};
const refresh=(force=false)=>{
 if(!isLive||document.visibilityState==="hidden"||navigator.onLine===false)return Promise.resolve();
 if(pendingRefresh)return pendingRefresh;
 if(!force&&Date.now()-lastRefreshStart<2000)return Promise.resolve();
 lastRefreshStart=Date.now();
 pendingRefresh=(async()=>{
  try{
   const response=await fetch(API,{credentials:"include",cache:"no-store",headers:{accept:"application/json"}});
   if(!response.ok)return;
   const result=await response.json();
   if(!validState(result))return;
   const realms={};
   for(const scope of REALMS){
    if(scope==="site")continue;
    const state=result.realms?.[scope];
    if(validState(state))realms[scope]={preset:state.preset,revision:state.revision};
   }
   const next={preset:result.preset,revision:result.revision,realms,
    globalControls:validGlobal(result.globalControls)?safeGlobal(result.globalControls):GLOBAL_DEFAULT};
   if(JSON.stringify(next)!==JSON.stringify(live)){live=next;paint()}
   try{localStorage.setItem(LIVE_CACHE,JSON.stringify(next))}catch{}
  }catch{/* Offline fallback: last known vetted theme, no blank screens. */}
 })().finally(()=>{pendingRefresh=null});
 return pendingRefresh;
};
const addFallbackRealm=()=>{
 if(document.body?.dataset.kfRealm)return;
 const p=path.replace(/\.html$/,"");
 if(/^\/(?:admin-bot-archive|moderation-accounts|theme-crew)$/.test(p))document.body.dataset.kfRealm="god";
 else if(/^\/(?:reset-password|verify-email)$/.test(p))document.body.dataset.kfRealm="members";
 else document.body.dataset.kfRealm="general";
};
const start=()=>{
 addFallbackRealm();paint();refresh();
 window.addEventListener("storage",event=>{
  if(event.key?.startsWith(PREVIEW)||event.key===GLOBAL_PREVIEW)paint();
  if(event.key===PUBLISH_SIGNAL)refresh(true);
 });
 channel?.addEventListener("message",event=>{if(event?.data?.kind==="theme-published")refresh(true)});
 window.addEventListener("pageshow",()=>{paint();refresh()});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
 if(isLive)window.setInterval(()=>refresh(),activeScope==="admin"?20000:60000);
};
window.KnightfallThemeCrew=Object.freeze({
 previewGlobal(value){
  if(value!==null&&!exactGlobal(value))return false;
  try{if(value)sessionStorage.setItem(GLOBAL_PREVIEW,JSON.stringify(safeGlobal(value)));
  else sessionStorage.removeItem(GLOBAL_PREVIEW)}
  catch{return false}
  paint();return true;
 },
 currentGlobal(){
  const published=safeGlobal(live.globalControls),privateControls=globalPreview();
  return {...(privateControls||published),published,preview:!!privateControls};
 },
 preview(key,realm=activeScope){
  const scope=safeRealm(realm);if(!scope||(key!==null&&!safe(key)))return false;
  try{if(key)sessionStorage.setItem(previewKey(scope),key);else sessionStorage.removeItem(previewKey(scope))}
  catch{return false}
  if(scope===activeScope)paint();
  return true;
 },
 refresh(){return refresh(true)},
 current(realm=activeScope){
  const scope=safeRealm(realm);if(!scope)return null;
  const state=publishedState(scope),privatePreset=preview(scope);
  return {scope,preset:privatePreset||state.preset,published:state.preset,preview:!!privatePreset,revision:state.revision};
 },
 announceGlobalPublished(revision){
  if(!Number.isSafeInteger(revision)||revision<0)return false;
  channel?.postMessage({kind:"theme-published",realm:"global",revision});
  try{localStorage.setItem(PUBLISH_SIGNAL,"global:"+revision+":"+Date.now())}catch{}
  refresh(true);return true;
 },
 announcePublished(revision,realm="site"){
  if(!Number.isSafeInteger(revision)||revision<0||!safeRealm(realm))return false;
  channel?.postMessage({kind:"theme-published",realm,revision});
  try{localStorage.setItem(PUBLISH_SIGNAL,realm+":"+revision+":"+Date.now())}catch{}
  refresh(true);return true;
 }
});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();