/* CARDS AGAINST CHAOS: cabinet navigation, immersive fullscreen and safe mobile focus mode. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const shell=$("cac-shell"),buttons={local:$("cac-tab-local"),online:$("cac-tab-online")};
 const views={local:$("cac-local-view"),online:$("cac-online-view")};
 const fullscreen=$("cac-fullscreen"),fullscreenLabel=$("cac-fullscreen-label"),fullscreenIcon=$("cac-fullscreen-icon");
 if(!shell||!buttons.local||!buttons.online||!fullscreen)return;
 let currentMode="local",localPlaying=false,onlineMatchOpen=false,focusMode=false;
 const isNative=()=>document.fullscreenElement===shell||document.webkitFullscreenElement===shell;
 function updatePlaying(){
  document.body.classList.toggle("cac-playing",currentMode==="local"?localPlaying:onlineMatchOpen);
 }
 function activateMode(next,{focusTab=false}={}){
  if(!views[next])return;
  currentMode=next;
  for(const mode of ["local","online"]){
   const selected=mode===next;
   buttons[mode].setAttribute("aria-selected",String(selected));
   buttons[mode].tabIndex=selected?0:-1;
   views[mode].hidden=!selected;
  }
  if(focusTab)buttons[next].focus({preventScroll:true});
  updatePlaying();
 }
 function setPlaying(value){localPlaying=Boolean(value);updatePlaying();}
 function showMatch(value){
  onlineMatchOpen=Boolean(value);
  const lobby=$("cac-online-lobby");
  if(lobby)lobby.hidden=onlineMatchOpen;
  if(onlineMatchOpen)activateMode("online");
  updatePlaying();
 }
 function updateFullscreen(){
  const active=isNative()||focusMode;
  fullscreen.setAttribute("aria-pressed",String(active));
  fullscreenLabel.textContent=isNative()?"EXIT FULLSCREEN":focusMode?"EXIT FOCUS MODE":"FULLSCREEN";
  fullscreenIcon.textContent=active?"⤡":"⛶";
  fullscreen.setAttribute("aria-label",isNative()?"Exit fullscreen game":focusMode?"Exit focus mode":"Enter fullscreen game");
  fullscreen.title=isNative()?"Exit fullscreen":focusMode?"Exit immersive focus mode":"Fullscreen arcade mode";
 }
 function setFocusMode(value){
  focusMode=Boolean(value);
  document.body.classList.toggle("cac-focus-mode",focusMode);
  updateFullscreen();
 }
 async function toggleFullscreen(){
  if(isNative()){
   try{await (document.exitFullscreen?.()||document.webkitExitFullscreen?.());}
   catch(error){console.warn("Could not exit fullscreen",error);}
   updateFullscreen();
   return;
  }
  if(focusMode){setFocusMode(false);return;}
  try{
   if(typeof shell.requestFullscreen==="function"){
    // Requests must originate from this button's trusted user gesture.
    await shell.requestFullscreen({navigationUI:"hide"});
    setFocusMode(false);
    updateFullscreen();return;
   }
   if(typeof shell.webkitRequestFullscreen==="function"){
    shell.webkitRequestFullscreen();setFocusMode(false);updateFullscreen();return;
   }
  }catch(error){
   // Many embedded arcade webviews deny Fullscreen API access. Stay usable.
   console.warn("Native fullscreen blocked; using immersive focus mode",error);
  }
  setFocusMode(true);
 }
 for(const mode of ["local","online"]){
  buttons[mode].addEventListener("click",()=>activateMode(mode));
  buttons[mode].addEventListener("keydown",event=>{
   let next;
   if(event.key==="ArrowRight"||event.key==="ArrowLeft")next=mode==="local"?"online":"local";
   if(event.key==="Home")next="local";
   if(event.key==="End")next="online";
   if(next){event.preventDefault();activateMode(next,{focusTab:true});}
  });
 }
 fullscreen.addEventListener("click",toggleFullscreen);
 document.addEventListener("fullscreenchange",updateFullscreen);
 document.addEventListener("webkitfullscreenchange",updateFullscreen);
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&focusMode&&!isNative())setFocusMode(false);
 });
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&focusMode)updateFullscreen();});
 // Direct table and invite URLs must land in the correct mode, not the local menu.
 const params=new URLSearchParams(location.search);
 activateMode(params.has("match")||params.has("invite")?"online":"local");
 window.CACCabinet=Object.freeze({activateMode,showMatch,setPlaying,get mode(){return currentMode;}});
 updateFullscreen();
})();