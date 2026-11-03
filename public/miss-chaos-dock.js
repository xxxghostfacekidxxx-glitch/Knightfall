/* Miss Chaos site-wide floating dock. Avoids actionable page controls,
   provides manual four-corner parking and a truly compact restore tab. */
(()=>{'use strict';
const root=document.getElementById('miss-chaos-presence');
if(!root||root.dataset.dockReady)return;
root.dataset.dockReady='true';
const button=id=>root.querySelector('#'+id),move=button('mc-move'),mini=button('mc-minimize'),restore=button('mc-restore');
const options=['br','bl','tl','tr'],descriptions={br:'bottom right',bl:'bottom left',tl:'top left',tr:'top right'};
let preference='auto',frame=0,current='br';
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
 const elements=document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[role="navigation"],[data-mc-keep-clear],#ashfall-support-footer');
 for(const el of elements){
  if(result.length>=180)break;
  if(!valid(el)||seen.has(el))continue;
  seen.add(el);
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  // Exclude huge general containers but include full-width sticky nav/footer bars.
  const structural=el.id==='ashfall-support-footer'||style.position==='fixed'||style.position==='sticky';
  if((rect.width>innerWidth*.89||rect.height>innerHeight*.57)&&!structural)continue;
  result.push({rect,weight:structural?2.5:1});
 }
 return result;
}
function anchorBox(position,width,height){
 const widthWindow=Math.max(280,window.innerWidth),heightWindow=Math.max(360,window.innerHeight);
 const gap=window.innerWidth<500?10:16;
 const left=position.endsWith('r')?widthWindow-width-gap:gap;
 const top=position.startsWith('b')?heightWindow-height-gap:gap;
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
function activePanel(){
 return !button('miss-chaos-window')?.hidden||!button('mc-memo-panel')?.hidden;
}
function recalculate(){
 frame=0;
 if(preference!=='auto'){apply(preference);return}
 if(activePanel())return;
 const dock=button('mc-dock');if(!dock)return;
 const oldPosition=root.dataset.dock||'br';
 const bounds=dock.getBoundingClientRect();
 const width=Math.max(30,bounds.width),height=Math.max(24,bounds.height);
 const blocked=obstacles();
 let winner='br',best=Infinity;
 for(const candidate of options){
  const rank=score(candidate,width,height,blocked);
  if(rank<best){winner=candidate;best=rank}
 }
 const currentScore=score(oldPosition,width,height,blocked);
 // Avoid flickering between corners when a page scrolls by just a few pixels.
 if(oldPosition!==winner&&currentScore-best<1.2)return;
 apply(winner);
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
 root.dataset.minimized='true';restore.hidden=false;schedule();
});
restore.addEventListener('click',()=>{
 root.dataset.minimized='false';restore.hidden=true;schedule();
});
for(const event of ['scroll','resize','orientationchange'])window.addEventListener(event,schedule,{passive:true});
document.addEventListener('fullscreenchange',()=>{
 root.hidden=!!document.fullscreenElement;schedule();
});
window.addEventListener('pageshow',schedule,{passive:true});
// Observe newly mounted sticky bars and footers without changing page layout.
if(window.MutationObserver){
 const observer=new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&!root.contains(n))))schedule();
 });
 observer.observe(document.body,{childList:true,subtree:false});
}
root.dataset.minimized='false';root.dataset.dock='br';
if(preference!=='auto')apply(preference);else schedule();
})();
