// Chaos Visual Lab: local image, vector and QR processing; optional external text-only Commons search.
import pica from "./vendor/visual-lab/pica.min.mjs";
import qrcode from "./vendor/visual-lab/qrcode.mjs";
import {searchOpenverseImages,safeExternalHttps} from "./chaos-openverse.mjs";
import {applyChaosArtworkEffects,buildChaosPrintSheet,stencilPaperConfig} from "./chaos-visual-effects.mjs";
const resizer=pica();
const $=id=>document.getElementById(id);
const source=$("visual-file"),grid=$("visual-grid"),size=$("visual-output-size");
const engine=$("visual-engine"),effect=$("visual-effect");
const threshold=$("visual-threshold"),thresholdLabel=$("visual-threshold-value");
const mirror=$("visual-mirror"),invert=$("visual-invert"),transparentWhite=$("visual-transparent-white");
const compareButton=$("visual-compare"),printButton=$("visual-print-sheet");
const processButton=$("visual-process"),pngButton=$("visual-png"),webpButton=$("visual-webp");
const preview=$("visual-preview"),drop=$("visual-drop");
const swatches=$("visual-swatches"),css=$("visual-css");
const copyButton=$("visual-copy-colors"),textButton=$("visual-save-colors");
const status=$("visual-status"),dimensions=$("visual-dimensions"),placeholder=$("visual-placeholder");
let revision=0,loadRevision=0,compareOriginal=false,traceUrl=null,traceSvg="",qrSvg="",qrCanvas=null;
const types=new Set(["image/png","image/jpeg","image/webp","image/gif"]);
let bitmap=null,outputCanvas=null,palette=[];
function say(s){status.textContent=s;}
function reset(){
 revision++;
 processButton.disabled=true;pngButton.disabled=true;webpButton.disabled=true;
 copyButton.disabled=true;textButton.disabled=true;compareButton.disabled=true;printButton.disabled=true;
 compareOriginal=false;compareButton.setAttribute("aria-pressed","false");compareButton.textContent="Compare original";
 outputCanvas=null;palette=[];
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
 const opened=++loadRevision;
 if(bitmap){bitmap.close();bitmap=null;}
 reset();
 if(!file){say("Choose an image to begin.");return;}
 if(!types.has(file.type)||file.size===0||file.size>12*1024*1024){
  say("Use a PNG, JPEG, WebP or GIF under 12 MB.");return;
 }
 say("Decoding the image on this device...");
 try{
  const candidate=await createImageBitmap(file);
  if(opened!==loadRevision){candidate.close();return;}
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
 pngButton.disabled=true;webpButton.disabled=true;printButton.disabled=true;
 compareButton.disabled=true;outputCanvas=null;
 $("visual-trace").disabled=true;$("visual-svg").disabled=true;
 compareOriginal=false;compareButton.setAttribute("aria-pressed","false");compareButton.textContent="Compare original";
 try{
  const side=Number(size.value),pixel=Number(grid.value),mode=String(effect.value);
  if(![128,256,512,1024].includes(side)||![0,16,32,64,128].includes(pixel))throw Error("Unsupported image settings.");
  if(!["normal","grayscale","ink","outline"].includes(mode))throw Error("Invalid image effect.");
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
  const adjusted=ctx.getImageData(0,0,outW,outH);
  applyChaosArtworkEffects(adjusted,{
   mode,threshold:Number(threshold.value),mirror:mirror.checked,
   invert:invert.checked,transparentWhite:transparentWhite.checked
  });
  ctx.putImageData(adjusted,0,0);
  traceSvg="";
  if(traceUrl){URL.revokeObjectURL(traceUrl);traceUrl=null;}
  $("visual-svg-preview").hidden=true;
  $("visual-svg").disabled=true;
  $("visual-trace-status").textContent="Image processed. Trace the current result to create fresh vector paths.";
  outputCanvas=canvas;preview.width=outW;preview.height=outH;
  preview.getContext("2d").drawImage(canvas,0,0);
  preview.style.imageRendering=pixel?"pixelated":"auto";
  placeholder.hidden=true;
  palette=sampleColors(canvas);drawPalette();pngButton.disabled=false;webpButton.disabled=false;
  compareButton.disabled=false;printButton.disabled=false;
  dimensions.textContent="Export: "+outW+" × "+outH+" pixels · "+processor+" · "+
   (mode==="normal"?"Original colors":mode==="ink"?"Blackwork threshold":mode==="outline"?"Extracted edges":"Grayscale")+
   (mirror.checked?" · mirrored":"")+
   (transparentWhite.checked&&["ink","outline"].includes(mode)?" · transparent white":"")+
   " · alpha preserved where supported.";
  say("Artwork processed locally using "+processor+". "+palette.length+" colors extracted.");
 }catch(err){if(token===revision)say(String(err.message||"Could not process this image.").slice(0,180));}
 finally{
  if(token===revision){
   processButton.disabled=false;
   $("visual-trace").disabled=!bitmap||!outputCanvas;
   if(!outputCanvas)printButton.disabled=true;
  }
 }
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
// ---- Raster-to-vector: separate opt-in, bounded synchronous ImageTracerJS. ----
const traceButton=$("visual-trace"),svgButton=$("visual-svg"),traceStatus=$("visual-trace-status");
const svgPreview=$("visual-svg-preview"),traceStyle=$("visual-trace-style"),traceDetail=$("visual-trace-detail");
function traceStatusText(message){traceStatus.textContent=message;}
traceButton.addEventListener("click",async()=>{
 if(!bitmap)return;
 traceButton.disabled=true;svgButton.disabled=true;
 traceStatusText("Building local vector paths from the processed pixels...");
 try{
  // One yield lets the status paint before a deliberately limited synchronous trace.
  await new Promise(resolve=>setTimeout(resolve,0));
  if(!window.ImageTracer?.imagedataToSVG)throw Error("ImageTracerJS did not initialize.");
  const style=traceStyle.value,detail=traceDetail.value;
  if(!["blackwork","grayscale","color"].includes(style)||
     !["simple","balanced","detailed"].includes(detail))throw Error("Unsupported trace settings.");
  const art=outputCanvas||bitmap;
  const longest=style==="color"?160:192,f=Math.min(1,longest/Math.max(art.width,art.height));
  const frame=document.createElement("canvas");
  frame.width=Math.max(1,Math.round(art.width*f));
  frame.height=Math.max(1,Math.round(art.height*f));
  const context=frame.getContext("2d",{willReadFrequently:true});
  if(!context)throw Error("Pixel data access unavailable.");
  context.imageSmoothingEnabled=true;context.drawImage(art,0,0,frame.width,frame.height);
  const data=context.getImageData(0,0,frame.width,frame.height);
  // Trace on white paper. Transparent areas become white; blackwork has two colors.
  for(let i=0;i<data.data.length;i+=4){
   const d=data.data;
   if(d[i+3]<128){d[i]=255;d[i+1]=255;d[i+2]=255;d[i+3]=255;continue;}
   if(style!=="color"){
    const gray=Math.round(d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722);
    const value=style==="blackwork"?(gray>=145?255:0):gray;
    d[i]=value;d[i+1]=value;d[i+2]=value;d[i+3]=255;
   }
  }
  const precision={simple:{pathomit:12,ltres:2.5,qtres:2.5},
   balanced:{pathomit:5,ltres:1.2,qtres:1.2},
   detailed:{pathomit:2,ltres:.7,qtres:.7}}[detail];
  const vector=window.ImageTracer.imagedataToSVG(data,{
   ...precision,colorsampling:2,numberofcolors:style==="blackwork"?2:style==="grayscale"?6:8,
   colorquantcycles:2,strokewidth:0,roundcoords:1,scale:1,viewbox:true,blurradius:0
  });
  if(typeof vector!=="string"||vector.length>2_000_000||!vector.startsWith("<svg ")||
    /<(?:script|iframe|foreignObject|object)\b|\bon[a-z]+\s*=|javascript:/i.test(vector))
   throw Error("SVG output failed the safety and size checks.");
  const blob=new Blob([vector],{type:"image/svg+xml;charset=utf-8"});
  if(traceUrl)URL.revokeObjectURL(traceUrl);
  traceUrl=URL.createObjectURL(blob);svgPreview.src=traceUrl;svgPreview.hidden=false;
  traceSvg=vector;svgButton.disabled=false;
  traceStatusText("Created a real "+style+" vector SVG ("+frame.width+" × "+frame.height+" trace grid, "+
   Math.round(vector.length/1024)+" KB). Review and edit curves before production.");
 }catch(err){traceSvg="";traceStatusText(String(err.message||"Could not trace the selected image.").slice(0,180));}
 finally{traceButton.disabled=!bitmap;}
});
svgButton.addEventListener("click",()=>{
 if(traceSvg)saveBlob("knightfall-traced-stencil.svg",new Blob([traceSvg],{type:"image/svg+xml;charset=utf-8"}));
});

// ---- Offline QR share cards: locally hosted MIT QR Code Generator. ----
const qrUrl=$("visual-qr-url"),qrLabel=$("visual-qr-label");
const qrButton=$("visual-qr-generate"),qrPng=$("visual-qr-png"),qrSvgButton=$("visual-qr-svg");
const qrPreview=$("visual-qr-preview"),qrStatus=$("visual-qr-status");
function qrMessage(message){qrStatus.textContent=message;}
function makeQrSvg(code){
 const n=code.getModuleCount(),quiet=4,cell=10,width=(n+quiet*2)*cell;
 const dark=['<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+width+
  '" viewBox="0 0 '+width+' '+width+'"><rect width="100%" height="100%" fill="#fff"/>'];
 for(let row=0;row<n;row++)for(let col=0;col<n;col++)if(code.isDark(row,col))
  dark.push('<rect x="'+(col+quiet)*cell+'" y="'+(row+quiet)*cell+'" width="'+cell+'" height="'+cell+'" fill="#000"/>');
 dark.push("</svg>");
 return dark.join("");
}
qrButton.addEventListener("click",()=>{
 qrPng.disabled=true;qrSvgButton.disabled=true;qrSvg="";qrCanvas=null;
 try{
  const urlString=qrUrl.value.trim(),address=new URL(urlString);
  if(address.protocol!=="https:"||!address.hostname||address.username||address.password||
    urlString.length>300)throw Error("Enter a HTTPS link with no embedded credentials (up to 300 characters).");
  const label=qrLabel.value.trim().slice(0,45)||"SCAN MY PORTAL";
  const code=qrcode(0,"M");code.addData(urlString);code.make();
  qrSvg=makeQrSvg(code);
  const canvas=qrPreview,ctx=canvas.getContext("2d");
  if(!ctx)throw Error("QR canvas unavailable.");
  canvas.width=720;canvas.height=880;
  ctx.fillStyle="#100e18";ctx.fillRect(0,0,720,880);
  ctx.fillStyle="#b25b68";ctx.fillRect(0,0,720,18);ctx.fillRect(0,862,720,18);
  ctx.fillStyle="#ece1d3";ctx.textAlign="center";
  ctx.font="bold 34px sans-serif";ctx.fillText("KNIGHTFALL",360,78);
  ctx.font="700 19px sans-serif";ctx.fillStyle="#c7a77c";ctx.fillText(label.toUpperCase(),360,116,650);
  const n=code.getModuleCount(),quiet=4,cell=Math.max(1,Math.floor(560/(n+quiet*2)));
  const occupied=(n+quiet*2)*cell,x=Math.floor((720-occupied)/2),y=150;
  ctx.fillStyle="#fff";ctx.fillRect(x,y,occupied,occupied);
  ctx.fillStyle="#000";
  for(let row=0;row<n;row++)for(let col=0;col<n;col++)if(code.isDark(row,col))
   ctx.fillRect(x+(col+quiet)*cell,y+(row+quiet)*cell,cell,cell);
  ctx.fillStyle="#ece1d3";ctx.font="bold 25px sans-serif";ctx.fillText("SCAN THE SIGIL",360,760,645);
  ctx.font="17px monospace";ctx.fillStyle="#c7a77c";
  ctx.fillText(urlString.length>65?urlString.slice(0,61)+"…":urlString,360,808,650);
  qrCanvas=canvas;qrPng.disabled=false;qrSvgButton.disabled=false;
  qrMessage("QR card ready. The full encoded HTTPS link is "+urlString.length+
   " characters. Check the result with your phone camera before printing.");
 }catch(err){qrMessage(String(err.message||"Could not create a QR code.").slice(0,200));}
});
qrPng.addEventListener("click",()=>{
 if(!qrCanvas)return;
 qrCanvas.toBlob(blob=>{
  if(blob){saveBlob("knightfall-portal-qr-card.png",blob);qrMessage("QR card PNG exported locally.");}
  else qrMessage("QR PNG export unavailable in this browser.");
 },"image/png");
});
qrSvgButton.addEventListener("click",()=>{
 if(qrSvg)saveBlob("knightfall-portal-qr.svg",new Blob([qrSvg],{type:"image/svg+xml;charset=utf-8"}));
});

// ---- Opt-in online Commons metadata search: unrelated to local image files. ----
const commonsQuery=$("visual-commons-query"),commonsFilter=$("visual-commons-license");
const commonsButton=$("visual-commons-search"),commonsStatus=$("visual-commons-status");
const commonsResults=$("visual-commons-results"),commonsExternal=$("visual-commons-external");
function externalLink(label,url){
 const safe=safeExternalHttps(url);
 if(!safe)return null;
 const a=document.createElement("a");
 a.href=safe;a.target="_blank";a.rel="noopener noreferrer";a.textContent=label;return a;
}
function showCommons(items){
 commonsResults.replaceChildren();
 if(!items.length){const p=document.createElement("p");p.textContent="No matching works in this limited result set. Adjust keywords or open Openverse directly.";commonsResults.append(p);return;}
 for(const item of items){
  const article=document.createElement("article");article.className="cvl-result";
  const h=document.createElement("h3");h.textContent=item.title;
  const credit=document.createElement("p");credit.textContent="Creator: "+item.creator+
   " · License: "+item.license+(item.source?" · Source: "+item.source:"");
  const actions=document.createElement("p");actions.className="cvl-result-links";
  const origin=externalLink("View original and verify rights",item.url);
  if(origin)actions.append(origin);
  const license=externalLink("Read license",item.license_url);
  if(license)actions.append(license);
  article.append(h,credit);
  if(item.attribution){const attribution=document.createElement("p");attribution.textContent=
   "Attribution: "+item.attribution;article.append(attribution);}
  article.append(actions);
  // Never fetch source thumbnails just because a search result was returned.
  // Loading a preview is a separate explicit user click and contacts its origin.
  if(item.thumbnail_url){
   const show=document.createElement("button");
   show.type="button";show.className="cvl-preview-button";
   show.textContent="Show image preview (contacts external host)";
   const image=document.createElement("img");image.className="cvl-result-image";
   image.alt="External preview: "+item.title;image.loading="lazy";
   image.referrerPolicy="no-referrer";image.hidden=true;
   show.addEventListener("click",()=>{
    if(!item.thumbnail_url)return;
    image.src=item.thumbnail_url;image.hidden=false;show.disabled=true;
   });
   image.addEventListener("error",()=>{image.hidden=true;show.disabled=false;show.textContent="Preview unavailable; open original source";});
   article.append(show,image);
  }
  commonsResults.append(article);
 }
}
commonsButton.addEventListener("click",async()=>{
 const term=commonsQuery.value.trim();
 commonsExternal.href="https://openverse.org/search/image?q="+encodeURIComponent(term.slice(0,120));
 commonsResults.replaceChildren();commonsButton.disabled=true;
 commonsStatus.textContent="Searching Openverse for openly licensed works. Only your search phrase is sent...";
 try{
  const result=await searchOpenverseImages({query:term,license:commonsFilter.value});
  showCommons(result.items);
  commonsStatus.textContent="Openverse returned "+result.items.length+
   " usable results from this page. Always verify each original license and creator credit.";
 }catch(err){commonsStatus.textContent=String(err.message||"Commons search unavailable.").slice(0,200);}
 finally{commonsButton.disabled=false;}
});
commonsQuery.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();commonsButton.click();}});
window.addEventListener("pagehide",()=>{
 bitmap?.close();bitmap=null;
 if(traceUrl){URL.revokeObjectURL(traceUrl);traceUrl=null;}
});
