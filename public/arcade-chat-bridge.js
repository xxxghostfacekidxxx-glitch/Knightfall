/* Chaos Cartridge signed-in messaging bridge.
 * Standalone games keep their own rendering/styles while reusing Ruinwire
 * conversations, permissions, live signals and message storage. */
(()=>{
 "use strict";
 const links=[...document.querySelectorAll('a[data-kf-arcade-chat]')];
 if(!links.length)return;
 const liveHost=["ash-fall.com","www.ash-fall.com"].includes(location.hostname.toLowerCase());
 const onPageWithNavigation=!!document.querySelector('script[src^="/nav.js"]');
 let ready=false;
 const dock=()=>document.getElementById("kf-chat-heads");
 function ensureArcadeStyles(){
  if(document.querySelector('link[data-kf-arcade-chat-css]'))return;
  const sheet=document.createElement("link");
  sheet.rel="stylesheet";sheet.href="/arcade-chat.css?v=20261117-arcade1";
  sheet.dataset.kfArcadeChatCss="true";
  document.head.appendChild(sheet);
 }
 function sync(open=!!window.KnightfallChat?.isOpen?.()){
  for(const link of links){
   link.setAttribute("aria-expanded",String(open));
   link.title=open?"Minimize messages and return to the game":"Open Ruinwire conversations over the game";
  }
 }
 function activate(){
  if(ready||!window.KnightfallChat||!dock())return;
  ready=true;
  ensureArcadeStyles();
  dock().classList.add("kf-chat-arcade");
  for(const link of links){
   link.dataset.kfChatReady="true";
   link.addEventListener("click",event=>{
    // Guest links stay ordinary, working inbox navigation.
    event.preventDefault();
    window.KnightfallChat.toggle();
    sync();
   });
  }
  sync();
 }
 window.addEventListener("kf:chat-ready",activate);
 window.addEventListener("kf:chat-visibility",event=>sync(!!event.detail?.open));
 if(window.KnightfallChat){activate();return;}
 // Pages that already load nav.js own session detection and the live socket.
 // Never mount a second messenger or duplicate their authentication requests.
 if(onPageWithNavigation||!liveHost)return;
 const API="https://api.ash-fall.com";
 function stylesheet(url){
  const link=document.createElement("link");
  link.rel="stylesheet";link.href=url;document.head.appendChild(link);
 }
 function chatScript(userId){
  if(window.KnightfallChat){activate();return;}
  if(document.querySelector('script[data-kf-chat-bubbles]'))return;
  const script=document.createElement("script");
  script.src="/chat-bubbles.js?v=20261117-arcade1";
  script.dataset.kfChatBubbles="true";
  script.dataset.userId=String(userId);
  script.addEventListener("load",activate,{once:true});
  document.body.appendChild(script);
 }
 function connect(userId){
  stylesheet("/chat-bubbles.css?v=20261115-gothic10");
  ensureArcadeStyles();
  const activeLive=window.KnightfallLive;
  if(activeLive){chatScript(userId);return;}
  const existing=document.querySelector('script[data-kf-message-live]');
  if(existing){
   existing.addEventListener("load",()=>chatScript(userId),{once:true});
   existing.addEventListener("error",()=>chatScript(userId),{once:true});
   if(window.KnightfallLive)chatScript(userId);
   return;
  }
  const live=document.createElement("script");
  live.src="/message-live.js?v=20261113-realtime1";
  live.dataset.kfMessageLive="true";
  live.addEventListener("load",()=>chatScript(userId),{once:true});
  live.addEventListener("error",()=>chatScript(userId),{once:true}); // 15s polling still works.
  document.body.appendChild(live);
 }
 async function boot(){
  try{
   const response=await fetch(API+"/api/auth/me",{credentials:"include",cache:"no-store",headers:{accept:"application/json"}});
   if(!response.ok)return;
   const info=await response.json();
   const id=Number(info?.user?.id);
   if(!Number.isSafeInteger(id)||id<1)return;
   connect(id);
  }catch{/* Offline, signed-out and preview games still play; link opens the inbox. */}
 }
 void boot();
})();
