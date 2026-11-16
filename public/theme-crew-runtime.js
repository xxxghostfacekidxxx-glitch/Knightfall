(()=>{
"use strict";
// Single source of theme truth: the public Worker endpoint. GOD previews are
// session-local, never published by an unprivileged browser.
const API="https://api.ash-fall.com/api/theme";
const PREVIEW="kf:theme-crew-preview";
const KNOWN=new Set(["cathedral","blood_moon","verdant_crypt","iron_eclipse","royal_abyss"]);
const enabledHosts=new Set(["ash-fall.com","www.ash-fall.com"]);
const path=location.pathname.toLowerCase();
if(/^\/(?:arcade\/hosted\/|games\/|casino\/)/.test(path))return;
const isLive=enabledHosts.has(location.hostname.toLowerCase());
let lastRevision=-1,published="cathedral";
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
const refresh=async()=>{
 if(!isLive||document.visibilityState==="hidden")return;
 try{
  const response=await fetch(API,{credentials:"include",cache:"no-store",headers:{accept:"application/json"}});
  if(!response.ok)return;
  const result=await response.json();
  const key=safe(result.preset);
  if(!key||!Number.isSafeInteger(result.revision))return;
  if(lastRevision!==result.revision||published!==key){lastRevision=result.revision;published=key;paint()}
 }catch{/* Safe, offline fallback: use the last known theme. */}
};
const start=()=>{
 paint();
 refresh();
 window.addEventListener("storage",event=>{if(event.key===PREVIEW)paint()});
 window.addEventListener("pageshow",()=>{paint();refresh()});
 document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh()});
 // Existing open pages catch sitewide GOD changes without a reload.
 if(isLive)window.setInterval(refresh,45000);
};
window.KnightfallThemeCrew=Object.freeze({
 preview(key){if(key!==null&&!safe(key))return false;try{if(key)sessionStorage.setItem(PREVIEW,key);else sessionStorage.removeItem(PREVIEW)}catch{return false}paint();return true},
 refresh(){return refresh()},
 current(){return {preset:preview()||published,published,preview:!!preview(),revision:lastRevision}}
});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
