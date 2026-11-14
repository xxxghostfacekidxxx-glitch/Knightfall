/* Knightfall premium art runtime for opt-in game integration.
 * Does not modify existing game sprites. To use: import {loadKnightfallArt} from '/knightfall-art-runtime.js';
 * const art=await loadKnightfallArt(); art.draw(ctx,'bone-raccoon',x,y,w,h);
 */
const MANIFEST='/assets/knightfall/manifest.json?v=20261114-relics2';
let loader=null;
function imageReady(src){
 return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';
  image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Knightfall image unavailable: '+src));image.src=src;
 });
}
export async function loadKnightfallArt(){
 if(!loader)loader=(async()=>{
   const response=await fetch(MANIFEST,{cache:'force-cache'});
   if(!response.ok)throw Error('Knightfall asset manifest unavailable.');
   const manifest=await response.json();
   if(!manifest?.sprites?.length)throw Error('Knightfall sprite manifest is empty.');
   const characters=await imageReady('/assets/knightfall/horror-space-characters.png');
   const definitions=new Map(manifest.sprites.filter(s=>s.collection==='horror-space-characters').map(s=>[s.id,s]));
   function renderSprite(ctx,id,x,y,width,height,options={}){
     const def=definitions.get(String(id));if(!def)return false;
     if(!ctx||typeof ctx.drawImage!=='function')throw TypeError('Canvas 2D context required.');
     const r=def.atlasRect;
     if(!r||[r.x,r.y,r.width,r.height].some(v=>!Number.isFinite(v)))return false;
     const w=width??r.width,h=height??r.height;
     if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return false;
     ctx.save();
     ctx.imageSmoothingEnabled=true;
     ctx.imageSmoothingQuality='high';
     ctx.globalAlpha=Math.max(0,Math.min(1,Number(options.alpha??1)));
     if(options.flipX){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(characters,r.x,r.y,r.width,r.height,0,0,w,h);}
     else ctx.drawImage(characters,r.x,r.y,r.width,r.height,x,y,w,h);
     ctx.restore();return true;
   }
   // Animated *poses* of the original single-frame art, not a fabricated walk-cycle sheet.
   // Foot-anchored transforms preserve collision rectangles managed by each game.
   function drawMotion(ctx,id,x,y,w,h,options={}){
     if(!definitions.has(String(id)))return false;
     if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return false;
     if(!ctx||typeof ctx.drawImage!=='function')throw TypeError('Canvas 2D context required.');
     const state=['idle','walk','run','jump','attack','hurt'].includes(options.state)?options.state:'idle';
     const time=Number.isFinite(Number(options.time))?Number(options.time):0;
     const offset=Number.isFinite(Number(options.phase))?Number(options.phase):0;
     const animate=!options.reducedMotion;
     const phase=time*(state==='run'?13:state==='walk'?9:state==='attack'?11:2.5)+offset;
     const stride=Math.abs(Math.sin(phase));
     const bob=animate?(state==='walk'||state==='run'?-stride*(state==='run'?3.7:2.3):state==='jump'?-2:Math.sin(phase)*1.3):0;
     const tilt=animate?(state==='attack'?.095*Math.sin(phase):state==='hurt'?.055*Math.sin(phase*2):state==='run'?.035*Math.sin(phase):state==='walk'?.022*Math.sin(phase):.012*Math.sin(phase)) : 0;
     const stretch=animate?(state==='jump'?1.045:state==='run'?1-stride*.027:state==='walk'?1-stride*.018:1+Math.sin(phase)*.009):1;
     ctx.save();
     ctx.translate(x+w*.5,y+h+bob);
     ctx.rotate(tilt);
     ctx.scale(options.flipX?-1:1,stretch);
     if(options.glow){
       ctx.shadowColor=typeof options.glow==='string'?options.glow:'#d9bcb5';
       ctx.shadowBlur=Number.isFinite(Number(options.blur))?Math.max(0,Math.min(35,Number(options.blur))):10;
     }
     if(state==='hurt'&&options.flash)ctx.filter='brightness(1.55) saturate(.75)';
     try{return renderSprite(ctx,id,-w*.5,-h,w,h,{alpha:options.alpha});}
     finally{ctx.restore();}
   }
   return Object.freeze({
     manifest,
     list:()=>[...definitions.values()],
     has:id=>definitions.has(String(id)),
     draw:renderSprite,
     drawMotion
   });
 })().catch(error=>{loader=null;throw error});
 return loader;
}
