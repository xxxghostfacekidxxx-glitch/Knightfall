/**
 * Chaos Visual Lab print/stencil helpers.
 * Pure pixel math only: never fetches, uploads, evaluates or stores member art.
 */
const clampByte=x=>Math.max(0,Math.min(255,Math.round(x)));
const luminance=(r,g,b)=>0.2126*r+0.7152*g+0.0722*b;
const SETTINGS=new Set(["normal","grayscale","ink","outline"]);
const PAPER=Object.freeze({letter:{width:215.9,height:279.4,label:"US Letter"},
 a4:{width:210,height:297,label:"A4"}});
function checkedOptions(options={}){
 const mode=options.mode||"normal";
 const threshold=options.threshold??145;
 if(!SETTINGS.has(mode))throw Error("Unsupported artwork effect.");
 if(!Number.isInteger(threshold)||threshold<1||threshold>254)throw Error("Threshold must be an integer from 1 to 254.");
 return {mode,threshold,mirror:options.mirror===true,invert:options.invert===true,
  transparentWhite:options.transparentWhite===true};
}
export function applyChaosArtworkEffects(imageData,options={}){
 const {mode,threshold,mirror,invert,transparentWhite}=checkedOptions(options);
 if(!imageData||!Number.isInteger(imageData.width)||!Number.isInteger(imageData.height)||
  imageData.width<1||imageData.height<1||imageData.width*imageData.height>1_048_576||
  !imageData.data||imageData.data.length!==imageData.width*imageData.height*4)
  throw Error("Provide image pixel data up to 1024 × 1024.");
 const {width,height}=imageData,data=imageData.data;
 // Contrast detection blends transparent input onto paper-white without modifying source pixels.
 let gray=null;
 if(mode==="outline"){
  gray=new Uint8Array(width*height);
  for(let p=0;p<gray.length;p++){
   const i=p*4,opacity=data[i+3]/255;
   gray[p]=clampByte(luminance(data[i],data[i+1],data[i+2])*opacity+255*(1-opacity));
  }
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  if(data[i+3]===0&&mode!=="outline")continue;
  if(mode==="normal")continue;
  let shade;
  if(mode==="outline"){
   const at=(cx,cy)=>gray[Math.max(0,Math.min(height-1,cy))*width+
    Math.max(0,Math.min(width-1,cx))];
   const gx=-at(x-1,y-1)+at(x+1,y-1)-2*at(x-1,y)+2*at(x+1,y)-at(x-1,y+1)+at(x+1,y+1);
   const gy=-at(x-1,y-1)-2*at(x,y-1)-at(x+1,y-1)+at(x-1,y+1)+2*at(x,y+1)+at(x+1,y+1);
   shade=Math.hypot(gx,gy)>=threshold*2?0:255;
  }else{
   const value=clampByte(luminance(data[i],data[i+1],data[i+2]));
   shade=mode==="ink"?(value>=threshold?255:0):value;
  }
  if(invert)shade=255-shade;
  data[i]=shade;data[i+1]=shade;data[i+2]=shade;
  if(mode==="outline")data[i+3]=255;
  if(transparentWhite&&(mode==="outline"||mode==="ink")&&shade===255)data[i+3]=0;
 }
 // Mirror in-place so SVG tracing, PNG and physical stencil printing use identical direction.
 if(mirror){
  for(let y=0;y<height;y++)for(let x=0;x<Math.floor(width/2);x++){
   const a=(y*width+x)*4,b=(y*width+width-1-x)*4;
   for(let k=0;k<4;k++){const t=data[a+k];data[a+k]=data[b+k];data[b+k]=t;}
  }
 }
 return imageData;
}
export function stencilPaperConfig({paper="letter",widthMm=100,widthPx,heightPx}={}){
 if(!Object.hasOwn(PAPER,paper))throw Error("Choose US Letter or A4 paper.");
 if(typeof widthMm!=="number"||!Number.isFinite(widthMm)||widthMm<15||widthMm>195)
  throw Error("Stencil width must be 15–195 mm.");
 if(!Number.isInteger(widthPx)||!Number.isInteger(heightPx)||widthPx<1||heightPx<1||
    widthPx>1024||heightPx>1024)throw Error("Invalid stencil pixel dimensions.");
 const page=PAPER[paper],heightMm=widthMm*heightPx/widthPx,margin=10;
 if(widthMm>page.width-2*margin||heightMm>page.height-2*margin)
  throw Error("Artwork does not fit on this paper at the requested physical size. Reduce width or choose a different orientation.");
 const centerX=(page.width-widthMm)/2,centerY=(page.height-heightMm)/2;
 return {paper,pageWidthMm:page.width,pageHeightMm:page.height,
  artWidthMm:widthMm,artHeightMm:Number(heightMm.toFixed(3)),
  xMm:Number(centerX.toFixed(3)),yMm:Number(centerY.toFixed(3)),
  note:"Print at Actual size / 100%. Disable fit-to-page. Measure the 50 mm calibration line with a ruler before transfer."};
}
export function buildChaosPrintSheet({paper="letter",widthMm=100,widthPx,heightPx,pngDataUrl}={}){
 const layout=stencilPaperConfig({paper,widthMm,widthPx,heightPx});
 if(typeof pngDataUrl!=="string"||pngDataUrl.length>6_000_000||
  !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(pngDataUrl))
  throw Error("Only a bounded, locally encoded PNG may be printed.");
 const {pageWidthMm:pw,pageHeightMm:ph,artWidthMm:aw,artHeightMm:ah,xMm:x,yMm:y}=layout;
 // Image data is the already-processed, already-mirrored local artwork, not a remote URL.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${pw}mm" height="${ph}mm" viewBox="0 0 ${pw} ${ph}">
<rect width="${pw}" height="${ph}" fill="#fff"/>
<image x="${x}" y="${y}" width="${aw}" height="${ah}" preserveAspectRatio="none" href="${pngDataUrl}"/>
<g fill="none" stroke="#999" stroke-width=".25">
<path d="M ${x-3} ${y} h -4 M ${x} ${y-3} v -4
M ${x+aw+3} ${y} h 4 M ${x+aw} ${y-3} v -4
M ${x-3} ${y+ah} h -4 M ${x} ${y+ah+3} v 4
M ${x+aw+3} ${y+ah} h 4 M ${x+aw} ${y+ah+3} v 4"/>
</g>
<path d="M 15 ${ph-12} h 50" stroke="#000" stroke-width=".4"/>
<text x="15" y="${ph-14}" font-family="sans-serif" font-size="3" fill="#000">50 mm calibration · print at 100%</text>
</svg>`;
 return {svg,layout};
}
