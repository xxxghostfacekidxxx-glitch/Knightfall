(()=>{'use strict';
// Bootstrap one shared header and authenticated chat dock on first-party arcade cabinets.
if(document.querySelector(".kf-header")&&!document.querySelector('script[src*="/nav.js"]')&&!document.querySelector('script[data-kf-arcade-nav]')){
 const navScript=document.createElement("script");
 navScript.src="/nav.js?v=20261114-game-chat2";navScript.dataset.kfArcadeNav="true";
 document.head.append(navScript);
}
// A shared launch guard for lightweight cabinets. A title alone never proves a board rendered.
(function installBoardRecovery(){
 const id=(location.pathname.match(/\/arcade\/hosted\/([^/]+)\//)||[])[1];
 const specs={
  'neon-mahjong':['#board .tile',40],
  'cinder-merge':['#board .tile',16],
  'cinder-checkers':['#board button',64],
  'cinder-chess':['#board button',64],
  'cinder-life':['canvas#board',1],
  'cinder-slots':['#reels',1]
 };
 const spec=specs[id];if(!spec)return;
 const healthy=()=>{
  const nodes=document.querySelectorAll(spec[0]),first=nodes[0];
  if(!first||nodes.length<spec[1])return false;
  const rect=first.getBoundingClientRect(),style=getComputedStyle(first);
  if(rect.width<2||rect.height<2||style.display==='none'||style.visibility==='hidden')return false;
  if(id==='cinder-slots'&&!first.textContent.trim())return false;
  if(id==='cinder-life'&&(first.width<100||first.height<100))return false;
  return true;
 };
 let bootReady=false;const monitor=()=>{if(healthy()){bootReady=true;return true}return false};
 const show=()=>{
  if(bootReady||monitor()||document.getElementById('kf-arcade-boot-help'))return;
  const css=document.createElement('style');css.id='kf-arcade-boot-help-css';
  css.textContent='#kf-arcade-boot-help{position:fixed;z-index:2147483400;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:540px;margin:auto;border:2px solid #b25b68;border-radius:14px;background:#160f22;color:#fff;padding:16px;font:15px/1.5 system-ui;box-shadow:0 12px 40px #000d}#kf-arcade-boot-help strong{display:block;color:#ffdbac;margin-bottom:6px}#kf-arcade-boot-help a,#kf-arcade-boot-help button{display:inline-block;margin:10px 10px 0 0;padding:9px 12px;border-radius:9px;border:1px solid #c7a77c;background:#231a31;color:#fff;font:700 14px system-ui;text-decoration:none;cursor:pointer}';
  document.head.append(css);
  const box=document.createElement('aside');box.id='kf-arcade-boot-help';box.setAttribute('role','alert');
  const label=document.createElement('strong');label.textContent='Game board failed to start';
  const info=document.createElement('span');info.textContent='Your saved progress has not been cleared. Reload with a fresh request to retry the game assets.';
  const reload=document.createElement('button');reload.type='button';reload.textContent='Retry game';
  reload.onclick=()=>{const url=new URL(location.href);url.searchParams.set('retry',Date.now().toString(36));location.replace(url.href)};
  const back=document.createElement('a');back.href='/chaos-cartridge.html';back.textContent='Back to arcade';
  box.append(label,info,document.createElement('div'),reload,back);document.body.append(box);
 };
 // Head-deferred scripts can run after an inline game script has already failed. Inspect the actual board.
 const start=()=>{monitor();setTimeout(show,8000)};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.addEventListener('error',event=>{if(event.target?.tagName==='SCRIPT')setTimeout(show,300)},true);
 window.addEventListener('unhandledrejection',()=>setTimeout(show,300));
})();
const main=document.querySelector('main');
// Do not duplicate a cabinet's more specialized fullscreen controls.
if(!main||document.querySelector('.cabinet-view-controls')||
   main.querySelector('#full,#fullscreen,#toggle-fullscreen,#cac-fullscreen,[data-fullscreen]'))return;
const style=document.createElement('style');style.id='kf-arcade-cabinet-theater-css';
style.textContent='.kf-cabinet-theater{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:clamp(8px,2vw,24px)!important;overflow:auto!important;box-sizing:border-box!important;z-index:2147483000!important;background:#080917!important;border-radius:0!important}.kf-cabinet-theater :is(canvas,video){max-width:100%;max-height:calc(100dvh - 110px);height:auto;object-fit:contain}body.kf-cabinet-theater-open{overflow:hidden!important}.cabinet-view-controls{display:flex;align-items:center;gap:12px;justify-content:flex-end;margin:.6rem 0}.cabinet-view-controls button{min-height:42px;padding:.6rem 1rem;border:1px solid #c7a77c;border-radius:9px;background:#1c1727;color:#f7e4d2;font:700 14px system-ui,sans-serif;cursor:pointer}.cabinet-view-controls button:focus-visible{outline:3px solid #b25b68;outline-offset:2px}main:fullscreen{width:100vw;min-height:100dvh;max-width:none;overflow:auto;background:#080917}';
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
