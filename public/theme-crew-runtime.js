(()=>{
"use strict";
// Single source of theme truth: the public Worker endpoint. GOD previews are
// session-local, never published by an unprivileged browser.
const API="https://api.ash-fall.com/api/theme";
const PREVIEW="kf:theme-crew-preview";
const LIVE_CACHE="kf:theme-live-cache-v1";
const PUBLISH_SIGNAL="kf:theme-published-v1";
const channel=typeof BroadcastChannel==="function"?new BroadcastChannel("kf:theme-published"):null;
const KNOWN=new Set(["cathedral","blood_moon","verdant_crypt","iron_eclipse","royal_abyss"]);
const enabledHosts=new Set(["ash-fall.com","www.ash-fall.com"]);
const path=location.pathname.toLowerCase();
if(/^\/(?:arcade\/hosted\/|games\/|casino\/)/.test(path)||/^\/(?:offline|personal-bots-offline)(?:\.html)?$/.test(path))return;
const isLive=enabledHosts.has(location.hostname.toLowerCase());
const cached=(()=>{try{
 const value=JSON.parse(localStorage.getItem(LIVE_CACHE)||"null");
 return value&&KNOWN.has(value.preset)&&Number.isSafeInteger(value.revision)&&value.revision>=0?value:null;
}catch{return null}})();
let lastRevision=cached?.revision??-1,published=cached?.preset??"cathedral";
const safe=value=>KNOWN.has(value)?value:null;
const params=new URLSearchParams(location.search);
const param=safe(params.get("kf_theme_preview"));
try{if(param)sessionStorage.setItem(PREVIEW,param)}catch{}
const preview=()=>{try{return safe(sessionStorage.getItem(PREVIEW))}catch{return null}};
const paint=()=>{
 if(!document.body)return;
 const chosen=preview()||published;
 document.body.dataset.kfTheme=chosen;
 if(preview())document.body.dataset.kfThemePreview="true";
 else delete document.body.dataset.kfThemePreview;
 document.dispatchEvent(new CustomEvent("kf:theme-change",{detail:{preset:chosen,published,preview:!!preview(),revision:lastRevision}}));
};
let pendingRefresh=null;
const refresh=()=>{
 if(!isLive||document.visibilityState==="hidden")return Promise.resolve();
 if(pendingRefresh)return pendingRefresh;
 pendingRefresh=(async()=>{
 try{
  const response=await fetch(API,{credentials:"include",cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)return;
  const result=await response.json();
  const key=safe(result.preset);
  if(!key||!Number.isSafeInteger(result.revision))return;
  if(lastRevision!==result.revision||published!==key){lastRevision=result.revision;published=key;paint()}
  try{localStorage.setItem(LIVE_CACHE,JSON.stringify({preset:key,revision:result.revision}))}catch{}
 }catch{/* Safe, offline fallback: use the last known theme. */}
 })().finally(()=>{pendingRefresh=null});
 return pendingRefresh;
};
const addFallbackRealm=()=>{
 if(document.body?.dataset.kfRealm)return;
 const p=path.replace(/\.html$/,"");
 if(/^\/(?:admin-bot-archive|moderation-accounts)$/.test(p))document.body.dataset.kfRealm="god";
 else if(/^\/(?:reset-password|verify-email)$/.test(p))document.body.dataset.kfRealm="members";
 else document.body.dataset.kfRealm="general";
};
const start=()=>{
 addFallbackRealm();
 paint();
 refresh();
 window.addEventListener("storage",event=>{
  if(event.key===PREVIEW)paint();
  if(event.key===PUBLISH_SIGNAL)refresh();
 });
 channel?.addEventListener("message",event=>{if(event?.data?.kind==="theme-published")refresh()});
 window.addEventListener("pageshow",()=>{paint();refresh()});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
 // Existing open pages catch sitewide GOD changes without a reload.
 if(isLive)window.setInterval(refresh,20000);
};
window.KnightfallThemeCrew=Object.freeze({
 preview(key){if(key!==null&&!safe(key))return false;try{if(key)sessionStorage.setItem(PREVIEW,key);else sessionStorage.removeItem(PREVIEW)}catch{return false}paint();return true},
 refresh(){return refresh()},
 current(){return {preset:preview()||published,published,preview:!!preview(),revision:lastRevision}},
 announcePublished(revision){
  if(!Number.isSafeInteger(revision)||revision<0)return false;
  channel?.postMessage({kind:"theme-published",revision});
  try{localStorage.setItem(PUBLISH_SIGNAL,String(revision)+":"+Date.now())}catch{}
  refresh();
  return true;
 }
});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
