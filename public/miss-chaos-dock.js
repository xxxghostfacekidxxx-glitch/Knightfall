/* Miss Chaos site-wide floating dock. Avoids actionable page controls,
   provides manual four-corner parking and a truly compact restore tab. */
(()=>{'use strict';
const root=document.getElementById('miss-chaos-presence');
if(!root||root.dataset.dockReady)return;
root.dataset.dockReady='true';
const button=id=>root.querySelector('#'+id),move=button('mc-move'),mini=button('mc-minimize'),restore=button('mc-restore');
const options=['br','bl','tl','tr'],descriptions={br:'bottom right',bl:'bottom left',tl:'top left',tr:'top right'};
let preference='auto',frame=0,current='br',headerBottom=0;
const compactKey='kf:miss-chaos:compact';
// A phone is not a reason to hide the entire assistant, its memo pad or mode switch.
// Reset the old compact setting once for existing members who lost the dock.
let initiallyMinimized=false;
try{
 const stored=localStorage.getItem(compactKey);
 const recovered=localStorage.getItem('kf:miss-chaos:visible-recovery-v1');
 if(recovered==='done')initiallyMinimized=stored==='true';
 else{
  localStorage.setItem('kf:miss-chaos:visible-recovery-v1','done');
  localStorage.setItem(compactKey,'false');
 }
}catch{}
try{const saved=localStorage.getItem('kf:miss-chaos:dock');if(options.includes(saved))preference=saved;}catch{}
function overlap(a,b){
 const x=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
 const y=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 return x*y;
}
function valid(el){
 if(!el||root.contains(el))return false;
 const r=el.getBoundingClientRect();
 if(r.width<10||r.height<10||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;
 const style=getComputedStyle(el);
 if(style.display==='none'||style.visibility==='hidden'||style.pointerEvents==='none'||Number(style.opacity)===0)return false;
 return true;
}
function obstacles(){
 const result=[],seen=new Set();
 const elements=document.querySelectorAll('a[href],button,input,select,textarea,h1,h2,h3,[role="button"],[role="navigation"],[data-mc-keep-clear],#ashfall-support-footer,#kf-chat-heads,.kf-chat-panel,.kf-chat-head-row');
 for(const el of elements){
  if(result.length>=500)break;
  if(!valid(el)||seen.has(el))continue;
  seen.add(el);
  // Headings are content too. Measure painted text, not a full-width block,
  // so the dock avoids words without constantly chasing empty heading space.
  let rect=el.getBoundingClientRect();
  if(/^H[1-3]$/.test(el.tagName) && document.createRange){
    const range=document.createRange();
    range.selectNodeContents(el);
    const painted=range.getBoundingClientRect();
    if(painted.width>0&&painted.height>0)rect=painted;
  }
  const style=getComputedStyle(el);
  // Exclude huge general containers but include full-width sticky nav/footer bars.
  const structural=el.hasAttribute('data-mc-keep-clear')||el.id==='ashfall-support-footer'||style.position==='fixed'||style.position==='sticky';
  if((rect.width>innerWidth*.89||rect.height>innerHeight*.57)&&!structural)continue;
  const critical=el.matches('textarea,input,[contenteditable="true"],[role="textbox"],button[type="submit"],.message-composer,.chat-composer,[data-mc-keep-clear]');
  result.push({rect,weight:critical?9:structural?3:1});
 }
 return result;
}
function anchorBox(position,width,height){
 const visual=window.visualViewport;
 const widthWindow=Math.max(280,visual?.width||window.innerWidth),heightWindow=Math.max(240,visual?.height||window.innerHeight);
 const gap=window.innerWidth<500?10:16;
 const offsetLeft=visual?.offsetLeft||0,offsetTop=visual?.offsetTop||0;
 const left=offsetLeft+(position.endsWith('r')?widthWindow-width-gap:gap);
 const top=position.startsWith('b')?offsetTop+heightWindow-height-gap:Math.max(offsetTop,headerBottom)+gap;
 return {left,top,right:left+width,bottom:top+height,width,height};
}
function score(position,width,height,blocked){
 const rect=anchorBox(position,width,height);
 const area=Math.max(1,width*height);
 let total=position==='br'?0:position==='bl'?.22:position==='tr'?.65:.85;
 for(const {rect:element,weight} of blocked)total+=overlap(rect,element)/area*weight*7;
 return total;
}
function apply(position){
 if(current===position&&root.dataset.dock===position)return;
 current=position;root.dataset.dock=position;
 move.title='Parked '+descriptions[position]+'. Tap to move to another corner.';
 move.setAttribute('aria-label','Move Miss Chaos tools, currently '+descriptions[position]);
}
function occupiedSize(dock){
 const panels=['miss-chaos-window','mc-memo-panel'].map(button).filter(el=>el&&!el.hidden&&getComputedStyle(el).display!=='none');
 if(!panels.length)return {width:Math.max(30,dock.width),height:Math.max(24,dock.height)};
 const panelWidth=Math.max(...panels.map(el=>el.getBoundingClientRect().width));
 const panelHeight=Math.max(...panels.map(el=>el.getBoundingClientRect().height));
 return {width:Math.max(dock.width,panelWidth),height:dock.height+panelHeight+10};
}
function recalculate(){
 frame=0;
 syncOverlaySuspension();
 const header=document.querySelector('body > .kf-header');
 const bounds=header?.getBoundingClientRect();
 headerBottom=bounds && bounds.top<=1 ? Math.max(0,bounds.bottom) : 0;
 root.style.setProperty('--mc-header-bottom',headerBottom+'px');
 const visual=window.visualViewport;
 // The layout viewport can extend behind the on-screen keyboard. Keep the dock
 // inside the actually visible area and re-score when pinch zoom moves it.
 root.style.setProperty('--mc-visual-top',(visual?.offsetTop||0)+'px');
 root.style.setProperty('--mc-visual-left',(visual?.offsetLeft||0)+'px');
 root.style.setProperty('--mc-visual-bottom-clearance',Math.max(0,window.innerHeight-((visual?.offsetTop||0)+(visual?.height||window.innerHeight)))+'px');
 root.style.setProperty('--mc-visual-right-clearance',Math.max(0,window.innerWidth-((visual?.offsetLeft||0)+(visual?.width||window.innerWidth)))+'px');
 if(preference!=='auto'){apply(preference);return}
 const dock=button('mc-dock');if(!dock)return;
 const oldPosition=root.dataset.dock||'br';
 const dockBounds=dock.getBoundingClientRect();
 const {width,height}=occupiedSize(dockBounds);
 const blocked=obstacles();
 let winner='br',best=Infinity;
 for(const candidate of options){
  const rank=score(candidate,width,height,blocked);
  if(rank<best){winner=candidate;best=rank}
 }
 const currentScore=score(oldPosition,width,height,blocked);
 // Avoid flickering between corners when a page scrolls by just a few pixels.
 // Never let anti-flicker preserve a corner over a compose field or dock control.
 if(oldPosition!==winner&&currentScore-best<1.2&&currentScore<2)return;
 apply(winner);
}
// Page dialogs and custom modal sheets own the foreground while they are open.
// Keeping the dock mounted but visually and interactively suspended prevents
// its very high utility layer from covering confirmation, upload, or auth UI.
function syncOverlaySuspension(){
 const blocking=[...document.querySelectorAll('dialog[open],[aria-modal="true"],[role="dialog"][data-overlay-blocking="true"]')]
  .some(el=>{
   if(root.contains(el))return false;
   if(el.hidden)return false;
   const style=getComputedStyle(el);
   return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0;
  });
 root.classList.toggle('mc-overlay-suspended',blocking);
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(recalculate);
}
move.addEventListener('click',()=>{
 const next=preference==='auto'?options[(options.indexOf(current)+1)%options.length]:
  options.indexOf(preference)===options.length-1?'auto':options[options.indexOf(preference)+1];
 preference=next;
 try{if(next==='auto')localStorage.removeItem('kf:miss-chaos:dock');else localStorage.setItem('kf:miss-chaos:dock',next)}catch{}
 if(next==='auto')schedule();else apply(next);
 move.title=next==='auto'?'Auto-avoid page controls. Tap to move manually.':'Parked '+descriptions[next]+'. Tap to move.';
});
mini.addEventListener('click',()=>{
 if(!button('miss-chaos-window').hidden)button('mc-close').click();
 if(!button('mc-memo-panel').hidden)button('mc-memo-close').click();
 root.dataset.minimized='true';restore.hidden=false;
 try{localStorage.setItem(compactKey,'true')}catch{}schedule();
});
restore.addEventListener('click',()=>{
 root.dataset.minimized='false';restore.hidden=true;
 try{localStorage.setItem(compactKey,'false')}catch{}
 schedule();
 // A collapsed phone dock is one action away from chat, not a two-tap mystery.
 if(window.innerWidth<=600&&button('miss-chaos-window')?.hidden)
   button('miss-chaos-launcher')?.click();
});
for(const event of ['scroll','resize','orientationchange'])window.addEventListener(event,schedule,{passive:true});
if(window.visualViewport){
 window.visualViewport.addEventListener('resize',schedule,{passive:true});
 window.visualViewport.addEventListener('scroll',schedule,{passive:true});
}
// Native fullscreen hides document siblings. Place the dock inside a fullscreen
// GAME CONTAINER instead of deliberately hiding it from the player.
function syncFullscreenDock(){
 const stage=document.fullscreenElement||document.webkitFullscreenElement;
 const canHost=stage&&stage!==root&&!root.contains(stage)&&!['CANVAS','VIDEO','IMG'].includes(stage.tagName);
 const host=canHost?stage:document.body;
 if(root.parentElement!==host)host.append(root);
 root.hidden=false;
 root.classList.toggle('mc-fullscreen',!!canHost);
 schedule();
}
document.addEventListener('fullscreenchange',syncFullscreenDock);
document.addEventListener('webkitfullscreenchange',syncFullscreenDock);
// Re-score the full chat/memo footprint after the user opens or closes it.
document.addEventListener('click',()=>setTimeout(schedule,0),true);
document.addEventListener('toggle',schedule,true);
window.addEventListener('pageshow',schedule,{passive:true});
const header=document.querySelector('body > .kf-header');
if(header && window.ResizeObserver)new ResizeObserver(schedule).observe(header);
// Observe newly mounted sticky bars and footers without changing page layout.
if(window.MutationObserver){
 const observer=new MutationObserver(records=>{
  if(records.some(r=>r.type==='attributes'?!root.contains(r.target):[...r.addedNodes].some(n=>n.nodeType===1&&!root.contains(n))))schedule();
 });
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','hidden','aria-modal','aria-hidden','class','style']});
}
root.dataset.minimized=initiallyMinimized?'true':'false';
restore.hidden=!initiallyMinimized;
root.dataset.dock='br';
syncFullscreenDock();
})();
