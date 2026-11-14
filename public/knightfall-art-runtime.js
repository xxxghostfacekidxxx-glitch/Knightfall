/* Knightfall premium art runtime for opt-in game integration.
 * Does not modify existing game sprites. To use: import {loadKnightfallArt} from '/knightfall-art-runtime.js';
 * const art=await loadKnightfallArt(); art.draw(ctx,'bone-raccoon',x,y,w,h);
 */
const MANIFEST='/assets/knightfall/manifest.json';
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
   return Object.freeze({
     manifest,
     list:()=>[...definitions.values()],
     has:id=>definitions.has(String(id)),
     draw(ctx,id,x,y,width,height,options={}){
       const def=definitions.get(String(id));if(!def)return false;
       if(!ctx||typeof ctx.drawImage!=='function')throw TypeError('Canvas 2D context required.');
       const r=def.atlasRect;
       if(!r||[r.x,r.y,r.width,r.height].some(v=>!Number.isFinite(v)))return false;
       const w=width??r.width,h=height??r.height;
       if(w<=0||h<=0)return false;
       ctx.save();
       ctx.imageSmoothingEnabled=true;
       ctx.imageSmoothingQuality='high';
       ctx.globalAlpha=Math.max(0,Math.min(1,Number(options.alpha??1)));
       if(options.flipX){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(characters,r.x,r.y,r.width,r.height,0,0,w,h);}
       else ctx.drawImage(characters,r.x,r.y,r.width,r.height,x,y,w,h);
       ctx.restore();return true;
     }
   });
 })().catch(error=>{loader=null;throw error});
 return loader;
}
