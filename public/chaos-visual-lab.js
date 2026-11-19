// Chaos Visual Lab: local image, vector and QR processing; optional external text-only Commons search.
import pica from "./vendor/visual-lab/pica.min.mjs";
import qrcode from "./vendor/visual-lab/qrcode.mjs";
import {searchOpenverseImages,safeExternalHttps} from "./chaos-openverse.mjs";
const resizer=pica();
const $=id=>document.getElementById(id);
const source=$("visual-file"),grid=$("visual-grid"),size=$("visual-output-size");
const engine=$("visual-engine"),effect=$("visual-effect");
const processButton=$("visual-process"),pngButton=$("visual-png"),webpButton=$("visual-webp");
const preview=$("visual-preview"),drop=$("visual-drop");
const swatches=$("visual-swatches"),css=$("visual-css");
const copyButton=$("visual-copy-colors"),textButton=$("visual-save-colors");
const status=$("visual-status"),dimensions=$("visual-dimensions"),placeholder=$("visual-placeholder");
let revision=0,traceUrl=null,traceSvg="",qrSvg="",qrCanvas=null;
const types=new Set(["image/png","image/jpeg","image/webp","image/gif"]);
let bitmap=null,outputCanvas=null,palette=[];
function say(s){status.textContent=s;}
function reset(){
 revision++;
 processButton.disabled=true;pngButton.disabled=true;webpButton.disabled=true;
 copyButton.disabled=true;textButton.disabled=true;outputCanvas=null;palette=[];
 $("visual-trace").disabled=true;$("visual-svg").disabled=true;
 traceSvg="";if(traceUrl){URL.revokeObjectURL(traceUrl);traceUrl=null;}
 const traced=$("visual-svg-preview");traced.removeAttribute("src");traced.hidden=true;
 $("visual-trace-status").textContent="Load an image to unlock vector tracing.";
 swatches.replaceChildren();
 const p=document.createElement("p");p.textContent="Palette appears here after processing an image.";swatches.append(p);
 css.value="/* Your extracted palette will appear here. */";
 placeholder.hidden=false;
 const context=preview.getContext("2d");context?.clearRect(0,0,preview.width,preview.height);
}
async function openPicture(file){
 if(bitmap){bitmap.close();bitmap=null;}
 reset();
 if(!file){say("Choose an image to begin.");return;}
 if(!types.has(file.type)||file.size===0||file.size>12*1024*1024){
  say("Use a PNG, JPEG, WebP or GIF under 12 MB.");return;
 }
 say("Decoding the image on this device...");
 try{
  const candidate=await createImageBitmap(file);
  if(!candidate.width||!candidate.height||candidate.width>8192||candidate.height>8192||
    candidate.width*candidate.height>20_000_000){
   candidate.close();throw Error("Image exceeds the 20-megapixel or 8192-pixel-side safety limit.");
  }
  bitmap=candidate;
  processButton.disabled=false;
  $("visual-trace").disabled=false;
  say("Image ready. Choose a resize style, effect or stencil workflow.");
  dimensions.textContent="Source: "+candidate.width+" × "+candidate.height+" pixels. No upload occurred.";
  void render();
 }catch(err){say("Image could not be decoded here. "+String(err.message||"Try another file.").slice(0,130));}
}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function sampleColors(image){
 const scan=document.createElement("canvas"),factor=Math.min(1,192/Math.max(image.width,image.height));
 scan.width=Math.max(1,Math.round(image.width*factor));scan.height=Math.max(1,Math.round(image.height*factor));
 const context=scan.getContext("2d",{willReadFrequently:true});
 if(!context)throw Error("Cannot read pixels in this browser.");
 context.drawImage(image,0,0,scan.width,scan.height);
 const pixels=context.getImageData(0,0,scan.width,scan.height).data;
 const histogram=new Map();
 for(let i=0;i<pixels.length;i+=12){
  if(pixels[i+3]<128)continue;
  const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
  const key=((r>>4)<<8)|((g>>4)<<4)|(b>>4);
  let bucket=histogram.get(key);
  if(!bucket){bucket={count:0,r:0,g:0,b:0};histogram.set(key,bucket);}
  bucket.count++;bucket.r+=r;bucket.g+=g;bucket.b+=b;
 }
 const candidates=[...histogram.values()].sort((a,b)=>b.count-a.count).slice(0,170)
  .map(p=>({r:Math.round(p.r/p.count),g:Math.round(p.g/p.count),b:Math.round(p.b/p.count),count:p.count}));
 const chosen=[];
 for(const c of candidates){
  if(chosen.every(x=>Math.hypot(c.r-x.r,c.g-x.g,c.b-x.b)>48))chosen.push(c);
  if(chosen.length===6)break;
 }
 for(const c of candidates){
  if(chosen.length>=6)break;
  if(!chosen.some(x=>x.r===c.r&&x.g===c.g&&x.b===c.b))chosen.push(c);
 }
 return chosen.map(({r,g,b})=>"#"+[r,g,b].map(n=>n.toString(16).padStart(2,"0")).join("").toUpperCase());
}
function luminance(hex){
 const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const linear=v.map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
 return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function ink(hex){
 const l=luminance(hex),black=(l+0.05)/0.05,white=1.05/(l+0.05);
 return {color:black>=white?"#000000":"#FFFFFF",ratio:Math.max(black,white)};
}
function drawPalette(){
 swatches.replaceChildren();
 if(!palette.length){
  const p=document.createElement("p");p.textContent="No opaque colors found in the picture.";swatches.append(p);
  css.value="/* No opaque colors available. */";copyButton.disabled=true;textButton.disabled=true;return;
 }
 for(const [i,hex] of palette.entries()){
  const contrast=ink(hex);
  const item=document.createElement("div");
  item.className="cvl-swatch";item.style.backgroundColor=hex;item.style.color=contrast.color;
  item.title=hex+" · recommended text "+contrast.color;
  const strong=document.createElement("strong");strong.textContent=hex;
  const small=document.createElement("small");small.textContent="Ink "+contrast.color+" · "+contrast.ratio.toFixed(1)+":1";
  const span=document.createElement("span");span.textContent="Swatch "+(i+1);
  item.append(span,strong,small);swatches.append(item);
 }
 css.value=":root {\n"+palette.map((hex,i)=>"  --kf-art-"+(i+1)+": "+hex+";").join("\n")+"\n}";
 copyButton.disabled=false;textButton.disabled=false;
}
async function render(){
 if(!bitmap)return;
 const token=++revision,active=bitmap;
 processButton.disabled=true;
 try{
  const side=Number(size.value),pixel=Number(grid.value),mode=String(effect.value);
  if(![128,256,512,1024].includes(side)||![0,16,32,64,128].includes(pixel))throw Error("Unsupported image settings.");
  if(!["normal","grayscale","ink"].includes(mode))throw Error("Invalid image effect.");
  const ratio=side/Math.max(active.width,active.height);
  const outW=clamp(Math.round(active.width*ratio),1,1024),outH=clamp(Math.round(active.height*ratio),1,1024);
  const canvas=document.createElement("canvas");canvas.width=outW;canvas.height=outH;
  const ctx=canvas.getContext("2d",{alpha:true,willReadFrequently:true});
  if(!ctx)throw Error("Canvas is not available on this device.");
  let processor="browser-native";
  if(pixel){
   const small=document.createElement("canvas");
   const f=pixel/Math.max(active.width,active.height);
   small.width=Math.max(1,Math.round(active.width*f));small.height=Math.max(1,Math.round(active.height*f));
   const temp=small.getContext("2d",{alpha:true});
   if(!temp)throw Error("Canvas rendering unavailable.");
   temp.imageSmoothingEnabled=true;temp.drawImage(active,0,0,small.width,small.height);
   ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,outW,outH);
   processor="nearest-neighbor pixel art";
  }else if(engine.value==="pica"){
   // Native pre-downscale limits additional working memory before high-quality Pica pass.
   const bound=Math.min(2048,Math.max(active.width,active.height));
   const sr=bound/Math.max(active.width,active.height);
   const from=document.createElement("canvas");
   from.width=Math.max(1,Math.round(active.width*sr));from.height=Math.max(1,Math.round(active.height*sr));
   const pre=from.getContext("2d",{alpha:true});
   if(!pre)throw Error("Source canvas unavailable.");
   pre.imageSmoothingEnabled=true;pre.imageSmoothingQuality="high";
   pre.drawImage(active,0,0,from.width,from.height);
   try{await resizer.resize(from,canvas,{filter:"lanczos3",alpha:true});processor="Pica Lanczos3";}
   catch{
    // A resizer can fail on older/low-memory Androids. The user still gets a real local result.
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.drawImage(from,0,0,outW,outH);processor="browser fallback (Pica unavailable)";
   }
  }else{
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(active,0,0,outW,outH);
  }
  if(token!==revision||active!==bitmap)return;
  if(mode!=="normal"){
   const frame=ctx.getImageData(0,0,outW,outH),data=frame.data;
   for(let i=0;i<data.length;i+=4){
    if(!data[i+3])continue;
    const lum=Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);
    const val=mode==="ink"?(lum>=145?255:0):lum;
    data[i]=val;data[i+1]=val;data[i+2]=val;
   }
   ctx.putImageData(frame,0,0);
  }
  outputCanvas=canvas;preview.width=outW;preview.height=outH;
  preview.getContext("2d").drawImage(canvas,0,0);
  preview.style.imageRendering=pixel?"pixelated":"auto";
  placeholder.hidden=true;
  palette=sampleColors(canvas);drawPalette();pngButton.disabled=false;webpButton.disabled=false;
  dimensions.textContent="Export: "+outW+" × "+outH+" pixels · "+processor+" · "+
   (mode==="normal"?"Original colors":mode==="ink"?"Blackwork threshold":"Grayscale")+
   " · alpha preserved where supported.";
  say("Artwork processed locally using "+processor+". "+palette.length+" colors extracted.");
 }catch(err){if(token===revision)say(String(err.message||"Could not process this image.").slice(0,180));}
 finally{if(token===revision)processButton.disabled=false;}
}
function saveBlob(name,blob){
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function downloadImage(type){
 if(!outputCanvas)return;
 outputCanvas.toBlob(blob=>{
  if(!blob){say("This browser could not export the requested image.");return;}
  const realWebp=type==="image/webp"&&blob.type==="image/webp";
  saveBlob("knightfall-chaos-art."+(realWebp?"webp":"png"),blob);
  say("Exported "+(realWebp?"WebP":"PNG")+" locally. Nothing was uploaded.");
 },type,0.92);
}
source.addEventListener("change",()=>{void openPicture(source.files?.[0]);});
processButton.addEventListener("click",()=>{void render();});
grid.addEventListener("change",()=>{if(bitmap)void render();});
size.addEventListener("change",()=>{if(bitmap)void render();});
engine.addEventListener("change",()=>{if(bitmap)void render();});
effect.addEventListener("change",()=>{if(bitmap)void render();});
pngButton.addEventListener("click",()=>downloadImage("image/png"));
webpButton.addEventListener("click",()=>downloadImage("image/webp"));
copyButton.addEventListener("click",async()=>{
 try{await navigator.clipboard.writeText(css.value);say("CSS palette copied.");}
 catch{css.focus();css.select();say("Clipboard unavailable. CSS selected for manual copy.");}
});
textButton.addEventListener("click",()=>{
 if(palette.length)saveBlob("knightfall-chaos-palette.txt",new Blob([css.value+"\n"],{type:"text/plain;charset=utf-8"}));
});
drop.addEventListener("dragover",e=>{e.preventDefault();drop.classList.add("cvl-dropping");});
drop.addEventListener("dragleave",()=>drop.classList.remove("cvl-dropping"));
drop.addEventListener("drop",e=>{
 e.preventDefault();drop.classList.remove("cvl-dropping");
 if(e.dataTransfer?.files?.length)void openPicture(e.dataTransfer.files[0]);
});
window.addEventListener("pagehide",()=>{bitmap?.close();bitmap=null;});
