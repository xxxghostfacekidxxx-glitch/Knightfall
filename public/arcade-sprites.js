/* Chaos Cartridge shared sprite renderer. Purely visual: it never touches game state or saves. */
(()=>{'use strict';
const names=['imp','skull','glitch','heart','coin','bolt','boom','fish','jelly','cannon','bat','crown','orb','rocket','crab','portal','skullfish','heartbreak','star','bug','flame','diamond','trophy','eye'];
const image=new Image();image.decoding='async';image.src='/assets/arcade/chaos-sprite-atlas.svg?v=20261023-5';
const positions=Object.fromEntries(names.map((name,i)=>[name,{x:(i%12)*64,y:Math.floor(i/12)*64}]));
const colors={pink:'#ff55d8',green:'#c6ff45',cyan:'#54f5df',white:'#fff'};
function draw(ctx,name,x,y,w,h,opts={}){if(!ctx||!image.complete||!image.naturalWidth)return false;const p=positions[name];if(!p)return false;ctx.save();ctx.imageSmoothingEnabled=false;if(opts.alpha!==undefined)ctx.globalAlpha=opts.alpha;if(opts.glow){ctx.shadowColor=opts.glow===true?colors.pink:opts.glow;ctx.shadowBlur=opts.blur||12}if(opts.rotation){ctx.translate(x+w/2,y+h/2);ctx.rotate(opts.rotation);ctx.drawImage(image,p.x,p.y,64,64,-w/2,-h/2,w,h)}else ctx.drawImage(image,p.x,p.y,64,64,x,y,w,h);ctx.restore();return true}
/* Original Gravewave artwork can be drawn in any existing canvas game without changing game state. */
const originalIds=['bone-drone','toxic-turret','void-eye','skull-missile','plasma-bolt','hex-flame','cinder-heart','bone-coin','chaos-shield','ghost-key','grave-platform','grave-crate','acid-spikes','neon-portal','impact-burst','warning-skull'];
const originalImages=new Map();
function preloadOriginal(name){
 if(!originalIds.includes(name))return Promise.resolve(false);
 const existing=originalImages.get(name);
 if(existing)return existing.promise;
 const img=new Image();img.decoding='async';
 const promise=new Promise(resolve=>{img.onload=()=>resolve(true);img.onerror=()=>{originalImages.delete(name);resolve(false)};img.src='/assets/arcade/gravewave/'+name+'.svg'});
 originalImages.set(name,{img,promise});
 return promise;
}
function drawOriginal(ctx,name,x,y,w=48,h=w,opts={}){
 if(!ctx||!originalIds.includes(name))return false;
 const cached=originalImages.get(name);
 if(!cached){preloadOriginal(name);return false}
 if(!cached.img.complete||!cached.img.naturalWidth)return false;
 ctx.save();
 try{
  ctx.globalAlpha=Number.isFinite(opts.alpha)?Math.min(1,Math.max(0,opts.alpha)):1;
  if(opts.glow){ctx.shadowColor=typeof opts.glow==='string'?opts.glow:'#ff55d8';ctx.shadowBlur=Number.isFinite(opts.blur)?opts.blur:12}
  if(opts.rotation){ctx.translate(x+w/2,y+h/2);ctx.rotate(opts.rotation);ctx.drawImage(cached.img,-w/2,-h/2,w,h)}
  else ctx.drawImage(cached.img,x,y,w,h);
  return true;
 }finally{ctx.restore()}
}
function burst(ctx,x,y,frame=0,scale=1){const names=['boom','star','bolt','glitch'];const name=names[Math.abs(frame|0)%names.length];return draw(ctx,name,x-18*scale,y-18*scale,36*scale,36*scale,{glow:true,blur:15,alpha:.95})}
function ready(){return image.complete&&image.naturalWidth===768&&image.naturalHeight===128}
function css(name){const i=names.indexOf(name);if(i<0)return null;return {backgroundImage:"url('/assets/arcade/chaos-sprite-atlas.svg?v=20261023-5')",backgroundSize:'1200% 200%',backgroundPosition:((i%12)*100/11)+'% '+(Math.floor(i/12)*100)+'%',backgroundRepeat:'no-repeat',imageRendering:'pixelated'};}
function decoratePanels(){const panels=document.querySelectorAll('.cartridge-cabinet,.game-card,.arcade-card');panels.forEach((panel,i)=>{if(panel.querySelector('.chaos-sprite-stamp'))return;const stamp=document.createElement('span');stamp.className='chaos-sprite-stamp';stamp.setAttribute('aria-hidden','true');Object.assign(stamp.style,css(names[i%names.length]));panel.appendChild(stamp);});}
function installDecorations(){if(!document.querySelector('#chaos-sprite-stamp-style')){const style=document.createElement('style');style.id='chaos-sprite-stamp-style';style.textContent='.cartridge-cabinet,.game-card,.arcade-card{position:relative}.chaos-sprite-stamp{position:absolute;right:10px;top:10px;width:30px;height:30px;opacity:.42;pointer-events:none;background-repeat:no-repeat;image-rendering:pixelated;filter:drop-shadow(0 0 6px #ff55d855);z-index:0;animation:chaos-stamp-pulse 2.8s steps(2,end) infinite}@keyframes chaos-stamp-pulse{0%,100%{transform:translateY(0);opacity:.32}50%{transform:translateY(-2px);opacity:.58}}@media(prefers-reduced-motion:reduce){.chaos-sprite-stamp{animation:none!important}}.cartridge-cabinet>*:not(.chaos-sprite-stamp),.game-card>*:not(.chaos-sprite-stamp),.arcade-card>*:not(.chaos-sprite-stamp){position:relative;z-index:1}@media(max-width:520px){.chaos-sprite-stamp{width:22px;height:22px;right:7px;top:7px}}';document.head.appendChild(style);}decoratePanels();}
image.addEventListener('error',()=>console.warn('[ChaosSprites] Atlas failed to load:',image.src));
window.ChaosSprites=Object.freeze({draw,burst,ready,css,names:Object.freeze([...names]),image,decoratePanels,installDecorations,drawOriginal,preloadOriginal,originalIds:Object.freeze(originalIds.slice())});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installDecorations,{once:true});else installDecorations();
})();