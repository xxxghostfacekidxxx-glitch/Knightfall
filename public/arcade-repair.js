/* Chaos Cartridge: opt-in repair for stale game assets.
 * Never clears signed-in state, conversations, game saves or localStorage data.
 * Every game remains a first-party original path, with no redirect offsite. */
(()=>{
"use strict";
const button=document.getElementById("arcade-repair");
const status=document.getElementById("arcade-repair-status");
if(!button||!status)return;
let active=false;
const gamePage=path=>/^\/arcade\/hosted\/[^/]+\/(?!source\.html$)[^/]+\.html$/i.test(path)||["/arcade/async-play.html","/arcade/cinder-sequence.html","/arcade/city-forge.html"].includes(path);
const cachedAsset=pathname=>pathname.startsWith("/arcade/")||
  ["/arcade-cabinet-ui.js","/arcade-cabinet-ui.css","/arcade-fullscreen.js","/arcade-save.js","/arcade-polish.css"].includes(pathname);
async function refresh(){
 if(button.disabled)return;
 button.disabled=true;button.setAttribute("aria-busy","true");
 status.hidden=false;status.textContent="Checking cached arcade files…";
 let removed=0,issues=0;
 try {
  if("caches" in window){
   const names=await caches.keys();
   for(const name of names.filter(n=>/^(?:knightfall|ashfall)-shell-/.test(n))){
    try{
     const cache=await caches.open(name);
     const entries=await cache.keys();
     for(const entry of entries){
      try{
       const url=new URL(entry.url);
       if(url.origin===location.origin&&cachedAsset(url.pathname)){
        if(await cache.delete(entry))removed++;
       }
      }catch{issues++;}
     }
    }catch{issues++;}
   }
  }
  active=true;
  try{sessionStorage.setItem("kf-arcade-fresh-launch","1");}catch{}
  status.textContent="Fresh launch enabled. "+removed+" cached game file"+(removed===1?"":"s")+
    " cleared. Open a game below; your saves and messages are untouched."+
    (issues?" Some files could not be cleared; launch still bypasses old game-page cache.":"");
  button.textContent="✓ Fresh launches enabled";
 }catch{
  active=true;
  try{sessionStorage.setItem("kf-arcade-fresh-launch","1");}catch{}
  button.textContent="✓ Fresh launches enabled";
  status.textContent="Fresh launch enabled. Open a game below; browser storage could not be fully checked.";
 }finally{button.disabled=false;button.removeAttribute("aria-busy");}
}
button.addEventListener("click",()=>{void refresh();});
try{active=sessionStorage.getItem("kf-arcade-fresh-launch")==="1"}catch{}
if(active){button.textContent="✓ Fresh launches enabled";status.hidden=false;status.textContent="Fresh launch is enabled for game links in this tab.";}
document.addEventListener("click",event=>{
 if(!active||event.defaultPrevented||event.button>0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const anchor=event.target?.closest?.('a[href]');
 if(!anchor)return;
 let url;
 try{url=new URL(anchor.href,location.href)}catch{return;}
 if(url.origin!==location.origin||!gamePage(url.pathname))return;
 url.searchParams.set("kf-fresh",String(Date.now()));
 anchor.href=url.pathname+url.search+url.hash;
},true);
})();
