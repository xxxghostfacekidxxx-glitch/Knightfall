/* Gravewave game sprite loader. Add <script src="/gravewave-sprites.js" defer></script>. */
(()=>{'use strict';
const base='/assets/arcade/gravewave/';
const ids=['bone-drone','toxic-turret','void-eye','skull-missile','plasma-bolt','hex-flame','cinder-heart','bone-coin','chaos-shield','ghost-key','grave-platform','grave-crate','acid-spikes','neon-portal','impact-burst','warning-skull'];
const valid=new Set(ids),cache=new Map(),pending=new Map();
function url(id){return valid.has(id)?base+id+'.svg':null}
function preload(id){if(!valid.has(id))return Promise.resolve(false);if(cache.has(id))return Promise.resolve(true);if(pending.has(id))return pending.get(id);const p=new Promise(resolve=>{const img=new Image();img.onload=()=>{cache.set(id,img);pending.delete(id);resolve(true)};img.onerror=()=>{pending.delete(id);resolve(false)};img.src=url(id)});pending.set(id,p);return p}
function draw(ctx,id,x,y,width=48,height=width,opts={}){if(!ctx||!valid.has(id))return false;const img=cache.get(id);if(!img){preload(id);return false}ctx.save();try{ctx.globalAlpha=Number.isFinite(opts.alpha)?Math.max(0,Math.min(1,opts.alpha)):1;if(opts.glow){ctx.shadowColor=typeof opts.glow==='string'?opts.glow:'#c6ff45';ctx.shadowBlur=Number.isFinite(opts.blur)?opts.blur:10}ctx.translate(x+width/2,y+height/2);if(opts.rotation)ctx.rotate(opts.rotation);if(opts.flipX)ctx.scale(-1,1);ctx.drawImage(img,-width/2,-height/2,width,height);return true}catch(e){return false}finally{ctx.restore()}}
function element(id,opts={}){const src=url(id);if(!src)return null;const img=document.createElement('img');img.src=src;img.alt=opts.alt||id.replace(/-/g,' ');img.width=opts.width||96;img.height=opts.height||96;img.decoding='async';img.loading=opts.lazy?'lazy':'eager';return img}
function preloadAll(){return Promise.all(ids.map(preload))}
window.GravewaveSprites=Object.freeze({ids:Object.freeze(ids.slice()),url,preload,preloadAll,draw,element,ready:id=>cache.has(id)});
})();