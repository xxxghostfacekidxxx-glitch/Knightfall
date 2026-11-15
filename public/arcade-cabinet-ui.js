(()=>{'use strict';
// Bootstrap one shared header and authenticated chat dock on first-party arcade cabinets.
if(document.querySelector(".kf-header")&&!document.querySelector('script[src*="/nav.js"]')&&!document.querySelector('script[data-kf-arcade-nav]')){
 const navScript=document.createElement("script");
 navScript.src="/nav.js?v=20261114-game-chat2";navScript.dataset.kfArcadeNav="true";
 document.head.append(navScript);
}
const main=document.querySelector('main');
// Do not duplicate a cabinet's more specialized fullscreen controls.
if(!main||document.querySelector('.cabinet-view-controls')||
   main.querySelector('#full,#fullscreen,#toggle-fullscreen,#cac-fullscreen,[data-fullscreen]'))return;
const style=document.createElement('style');style.id='kf-arcade-cabinet-theater-css';
style.textContent='.kf-cabinet-theater{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:clamp(8px,2vw,24px)!important;overflow:auto!important;box-sizing:border-box!important;z-index:2147483000!important;background:#080917!important;border-radius:0!important}.kf-cabinet-theater canvas{max-width:100%;max-height:calc(100dvh - 90px);object-fit:contain}body.kf-cabinet-theater-open{overflow:hidden!important}.cabinet-view-controls{display:flex;align-items:center;gap:12px;justify-content:flex-end;margin:.6rem 0}.cabinet-view-controls button{min-height:42px;padding:.6rem 1rem;border:1px solid #c7a77c;border-radius:9px;background:#161021;color:#eafbd0;font:700 14px system-ui,sans-serif;cursor:pointer}.cabinet-view-controls button:focus-visible{outline:3px solid #b25b68;outline-offset:2px}main:fullscreen{width:100vw;min-height:100dvh;max-width:none;overflow:auto;background:#080917}';
document.head.append(style);
const bar=document.createElement('div');bar.className='cabinet-view-controls';
const button=document.createElement('button');button.type='button';button.textContent='Fullscreen';button.setAttribute('aria-label','Fullscreen game');button.setAttribute('aria-pressed','false');
let theater=false;
function sync(){
 const active=theater || document.fullscreenElement===main || document.webkitFullscreenElement===main;
 button.textContent=active?'Exit fullscreen':'Fullscreen';
 button.setAttribute('aria-label',active?'Exit fullscreen game':'Fullscreen game');
 button.setAttribute('aria-pressed',String(!!active));
 document.body.classList.toggle('kf-cabinet-theater-open',theater);
 main.classList.toggle('kf-cabinet-theater',theater);
 window.dispatchEvent(new Event('resize'));
}
button.addEventListener('click',async()=>{
 if(theater){theater=false;sync();return;}
 if(document.fullscreenElement===main || document.webkitFullscreenElement===main){
   try{if(document.exitFullscreen)await document.exitFullscreen();else if(document.webkitExitFullscreen)await document.webkitExitFullscreen();}catch{theater=false;sync();}
   return;
 }
 try{
   if(!document.fullscreenEnabled&&!document.webkitFullscreenEnabled)throw Error('fullscreen unavailable');
   if(main.requestFullscreen)await main.requestFullscreen();
   else if(main.webkitRequestFullscreen)await main.webkitRequestFullscreen();
   else throw Error('fullscreen unsupported');
 }catch{
   theater=true;sync();
 }
});
document.addEventListener('fullscreenchange',sync);
document.addEventListener('webkitfullscreenchange',sync);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&theater){theater=false;sync();}});
bar.append(button);
const heading=main.querySelector('h1');if(heading)heading.after(bar);else main.prepend(bar);
})();
