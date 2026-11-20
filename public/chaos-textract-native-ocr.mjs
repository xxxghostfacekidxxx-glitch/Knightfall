/**
 * Knightfall Glyph Forge: original, zero-dependency, template-based OCR.
 * It recognizes only high-contrast printed Latin text. No machine learning
 * model, pre-trained weight, external library or external network call.
 * Not suitable for handwriting, legal/medical values or critical documents.
 */
const CHARACTER_SET="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?$%#@&()+-=/\\'\"";
const SAMPLE_X=12,SAMPLE_Y=18,MAX_IMAGE_PIXELS=1500000;
const FONTS=["Arial","Georgia","monospace"];
const WIDTH=96,HEIGHT=96;
let cached=null;
function canvasFor(width,height){
 const canvas=document.createElement("canvas");
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d",{willReadFrequently:true,alpha:false});
 if(!ctx)throw Error("This browser cannot access a 2D canvas.");
 return {canvas,ctx};
}
export function otsuThreshold(grey){
 const hist=new Uint32Array(256);
 for(const value of grey)hist[value]++;
 let sum=0;for(let i=0;i<256;i++)sum+=i*hist[i];
 let best=0,bestScore=-1,background=0,weighted=0;
 for(let threshold=0;threshold<256;threshold++){
  background+=hist[threshold];if(!background)continue;
  const foreground=grey.length-background;if(!foreground)break;
  weighted+=threshold*hist[threshold];
  const delta=weighted/background-(sum-weighted)/foreground;
  const score=background*foreground*delta*delta;
  if(score>bestScore){bestScore=score;best=threshold;}
 }
 return best;
}
/**
 * Bounded local-mean threshold for phone photos with uneven illumination.
 * The integral image makes each neighborhood lookup constant-time.
 * This prepares pixels only: the glyph engine still rejects uncertain text.
 */
export function adaptiveInkMask(grey,width,height,{radius=0,lightText=false}={}){
 if(!(grey instanceof Uint8Array)||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<1||height<1||width*height!==grey.length||grey.length>MAX_IMAGE_PIXELS)
  throw Error("Invalid image dimensions for adaptive OCR.");
 const r=radius>0?Math.min(48,Math.max(2,Math.round(radius))):
  Math.max(8,Math.min(32,Math.round(Math.min(width,height)/30)));
 const stride=width+1,integral=new Float64Array(stride*(height+1));
 for(let y=1;y<=height;y++){
  let rowTotal=0;
  for(let x=1;x<=width;x++){
   rowTotal+=grey[(y-1)*width+x-1];
   integral[y*stride+x]=integral[(y-1)*stride+x]+rowTotal;
  }
 }
 const mask=new Uint8Array(grey.length);
 for(let y=0;y<height;y++){
  const top=Math.max(0,y-r),bottom=Math.min(height-1,y+r);
  for(let x=0;x<width;x++){
   const left=Math.max(0,x-r),right=Math.min(width-1,x+r);
   const sum=integral[(bottom+1)*stride+right+1]-integral[top*stride+right+1]-
    integral[(bottom+1)*stride+left]+integral[top*stride+left];
   const mean=sum/((bottom-top+1)*(right-left+1));
   const bias=Math.max(6,Math.min(14,mean*.055));
   const value=grey[y*width+x];
   mask[y*width+x]=lightText?(value>mean+bias?1:0):(value<mean-bias?1:0);
  }
 }
 return mask;
}
export function normalizeGlyph(mask,width,height){
 const grid=new Float32Array(SAMPLE_X*SAMPLE_Y);
 if(!width||!height)return grid;
 // Downsample with bilinear center sampling to be tolerant of antialiasing.
 for(let y=0;y<SAMPLE_Y;y++)for(let x=0;x<SAMPLE_X;x++){
  const fromX=Math.floor(x*width/SAMPLE_X),toX=Math.max(fromX+1,Math.ceil((x+1)*width/SAMPLE_X));
  const fromY=Math.floor(y*height/SAMPLE_Y),toY=Math.max(fromY+1,Math.ceil((y+1)*height/SAMPLE_Y));
  let pixels=0,dark=0;
  for(let py=fromY;py<toY;py++)for(let px=fromX;px<toX;px++){dark+=mask[py*width+px]||0;pixels++;}
  grid[y*SAMPLE_X+x]=dark/Math.max(1,pixels);
 }
 return grid;
}
function cropInk(mask,width,height){
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x]){
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
 }
 if(maxX<minX)return null;
 const w=maxX-minX+1,h=maxY-minY+1,out=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)out[y*w+x]=mask[(minY+y)*width+minX+x];
 return {mask:out,width:w,height:h,x:minX,y:minY};
}
function fontTemplates(){
 if(cached)return cached;
 const templates=[];const {ctx}=canvasFor(WIDTH,HEIGHT);
 for(const family of FONTS)for(const weight of ["normal","bold"]){
  for(const letter of CHARACTER_SET){
   ctx.fillStyle="#fff";ctx.fillRect(0,0,WIDTH,HEIGHT);
   ctx.font=weight+" 54px "+family;ctx.fillStyle="#000";
   ctx.textBaseline="alphabetic";ctx.fillText(letter,14,67);
   const rgba=ctx.getImageData(0,0,WIDTH,HEIGHT).data;
   const mask=new Uint8Array(WIDTH*HEIGHT);
   for(let p=0;p<mask.length;p++)mask[p]=rgba[p*4]<155?1:0;
   const rect=cropInk(mask,WIDTH,HEIGHT);if(!rect)continue;
   templates.push({letter,ratio:rect.width/rect.height,grid:normalizeGlyph(rect.mask,rect.width,rect.height)});
  }
 }
 cached=templates;return templates;
}
export function classifyGlyph(mask,width,height,templates){
 if(!width||!height)return {letter:"?",confidence:0};
 const grid=normalizeGlyph(mask,width,height),ratio=width/height;
 let best=Infinity,winner="?";
 for(const template of templates){
  let diff=0;
  for(let i=0;i<grid.length;i++)diff+=Math.abs(grid[i]-template.grid[i]);
  const ratioPenalty=Math.min(1.5,Math.abs(Math.log(Math.max(.08,ratio)/template.ratio)))*12;
  const score=diff/216+ratioPenalty/216;
  if(score<best){best=score;winner=template.letter;}
 }
 const confidence=Math.max(0,1-best*2.1);
 return {letter:confidence<.26?"?":winner,confidence};
}
function extractLines(mask,width,height){
 const rows=new Int32Array(height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)rows[y]+=mask[y*width+x];
 const bands=[];let start=-1,last=-1;
 for(let y=0;y<height;y++){
  if(rows[y]>0){if(start<0)start=y;last=y;}
  else if(start>=0&&(y-last>Math.min(7,Math.max(3,Math.round(height/180))))){
   if(last-start>=2)bands.push({start,end:last});
   start=-1;
  }
 }
 if(start>=0&&last-start>=2)bands.push({start,end:last});
 return bands.slice(0,100);
}
function charactersInLine(mask,width,band){
 const columns=new Int32Array(width);
 for(let y=band.start;y<=band.end;y++)for(let x=0;x<width;x++)columns[x]+=mask[y*width+x];
 const chunks=[];let first=-1,last=-1;
 for(let x=0;x<width;x++){
  if(columns[x]){if(first<0)first=x;last=x;}
  else if(first>=0){chunks.push({start:first,end:last});first=-1;}
 }
 if(first>=0)chunks.push({start:first,end:last});
 return chunks;
}
function glyphFromArea(mask,width,band,chunk){
 const w=chunk.end-chunk.start+1,h=band.end-band.start+1;
 const out=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)
  out[y*w+x]=mask[(band.start+y)*width+chunk.start+x];
 return cropInk(out,w,h);
}
/* Touching printed letters can form one wide vertical-ink chunk (e.g. FA).
 * Split only when two independently strong glyph matches beat the unsplit one.
 * Bounded cut search protects phone CPUs from adversarial or noisy images. */
function splitConnectedGlyph(mask,width,band,chunk,templates,whole,median,cancelled){
 const w=chunk.end-chunk.start+1,h=band.end-band.start+1;
 const gate=Math.max(h*1.42,Math.min(median*1.65,h*1.58));
 if(w<=gate||w<12||w>Math.max(180,h*3.4))return null;
 const min=Math.max(4,Math.floor(w*.23)),max=Math.min(w-4,Math.ceil(w*.77));
 const step=Math.max(1,Math.ceil((max-min)/24));
 let best=null,score=0;
 for(let offset=min;offset<=max;offset+=step){
  if(cancelled())throw Error("OCR cancelled.");
  const cut=chunk.start+offset-1;
  const left=glyphFromArea(mask,width,band,{start:chunk.start,end:cut});
  const right=glyphFromArea(mask,width,band,{start:cut+1,end:chunk.end});
  if(!left||!right||left.width<3||right.width<3||left.height<3||right.height<3)continue;
  const a=classifyGlyph(left.mask,left.width,left.height,templates);
  const b=classifyGlyph(right.mask,right.width,right.height,templates);
  if(a.letter==="?"||b.letter==="?"||Math.min(a.confidence,b.confidence)<.60)continue;
  const quality=(a.confidence+b.confidence)/2;
  if(quality>score){score=quality;best=[a,b];}
 }
 if(score>=.72&&score>whole.confidence+.14)return best;
 // Very wide touching runs can contain three letters, not just two.
 // Search a tiny neighbourhood around thirds instead of an unbounded
 // combinatorial segmenter. A strong three-way match must beat the original.
 if(w>Math.max(h*2.35,Math.min(median*2.3,h*2.75))&&w<=Math.max(230,h*5.8)){
  const mid1=Math.round(w/3),mid2=Math.round(w*2/3);
  let bestThree=null,bestScore=0;
  const adjustments=[-9,-6,-3,0,3,6,9];
  for(const da of adjustments)for(const db of adjustments){
   if(cancelled())throw Error("OCR cancelled.");
   const cut1=chunk.start+mid1+da-1,cut2=chunk.start+mid2+db-1;
   if(cut1<chunk.start+3||cut2>chunk.end-3||cut2-cut1<4)continue;
   const sections=[
    {start:chunk.start,end:cut1},
    {start:cut1+1,end:cut2},
    {start:cut2+1,end:chunk.end}
   ];
   const glyphs=sections.map(x=>glyphFromArea(mask,width,band,x));
   if(glyphs.some(g=>!g||g.width<3||g.height<3))continue;
   const matches=glyphs.map(g=>classifyGlyph(g.mask,g.width,g.height,templates));
   if(matches.some(x=>x.letter==="?"||x.confidence<.60))continue;
   const quality=matches.reduce((sum,x)=>sum+x.confidence,0)/3;
   if(quality>bestScore){bestScore=quality;bestThree=matches;}
  }
  if(bestScore>.76&&bestScore>whole.confidence+.16)return bestThree;
 }
 return null;
}
export function decodeGlyphMask(mask,width,height,templates,{notify=()=>{},cancelled=()=>false}={}){
 const bands=extractLines(mask,width,height),lines=[],confidences=[];
 for(let lineIndex=0;lineIndex<bands.length;lineIndex++){
  if(cancelled())throw Error("OCR cancelled.");
  const band=bands[lineIndex],chunks=charactersInLine(mask,width,band);
  const widths=chunks.map(c=>c.end-c.start+1).sort((a,b)=>a-b);
  const median=widths[Math.floor(widths.length/2)]||1;
  let output="",previous=null;
  for(const chunk of chunks.slice(0,300)){
   if(cancelled())throw Error("OCR cancelled.");
   if(previous&&chunk.start-previous.end-1>Math.max(4,median*.48))output+=" ";
   const glyph=glyphFromArea(mask,width,band,chunk);
   if(glyph&&glyph.width>=1&&glyph.height>=2){
    const match=classifyGlyph(glyph.mask,glyph.width,glyph.height,templates);
    const found=splitConnectedGlyph(mask,width,band,chunk,templates,match,median,cancelled)||[match];
    for(const letter of found){output+=letter.letter;confidences.push(letter.confidence);}
   }
   previous=chunk;
  }
  if(output.trim())lines.push(output);
  notify("Reading printed text line "+(lineIndex+1)+" of "+bands.length+"…");
 }
 return {text:lines.join("\n"),confidence:confidences.length?
  confidences.reduce((a,b)=>a+b,0)/confidences.length:0,lines:lines.length};
}
/** Clockwise grayscale rotation, bounded to the same pixel budget as OCR. */
export function rotateKnightfallGrey(grey,width,height,angle){
 if(!(grey instanceof Uint8Array)||width<1||height<1||width*height!==grey.length||
   grey.length>MAX_IMAGE_PIXELS||![0,90,180,270].includes(angle))
  throw Error("Invalid local OCR rotation.");
 if(angle===0)return {grey,width,height};
 const outWidth=angle===180?width:height,outHeight=angle===180?height:width;
 const out=new Uint8Array(grey.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const dst=angle===90?x*outWidth+height-1-y:
   angle===180?(height-1-y)*outWidth+width-1-x:
   (width-1-x)*outWidth+y;
  out[dst]=grey[y*width+x];
 }
 return {grey:out,width:outWidth,height:outHeight};
}
function scanKnightfallGrey(greys,width,height,templates,{notify,cancelled}){
 const threshold=otsuThreshold(greys),mask=new Uint8Array(greys.length);
 let dark=0;
 for(let i=0;i<mask.length;i++){mask[i]=greys[i]<=threshold?1:0;dark+=mask[i];}
 const lightText=dark>mask.length*.55;
 if(lightText)for(let i=0;i<mask.length;i++)mask[i]=1-mask[i];
 let result=decodeGlyphMask(mask,width,height,templates,{notify,cancelled});
 const grade=x=>{
  const letters=(x.text.match(/[A-Za-z0-9]/g)||[]).length;
  const unknown=(x.text.match(/\?/g)||[]).length;
  const fragment=x.lines>=5&&letters/x.lines<3?.18:0;
  return x.confidence-Math.min(.6,unknown/Math.max(1,letters+unknown))+
   Math.min(.04,letters*.003)-fragment;
 };
 if(cancelled())throw Error("OCR cancelled.");
 if(result.confidence<.75||result.text.includes("?")||!result.text.trim()){
  const improved=decodeGlyphMask(adaptiveInkMask(greys,width,height,{lightText}),
   width,height,templates,{notify,cancelled});
  if(grade(improved)>grade(result)+.055&&improved.text.replace(/[^A-Za-z0-9]/g,"").length>=2)
   result=improved;
 }
 return {result,score:grade(result)};
}
export async function readKnightfallImageOcr(file,{notify=()=>{},cancelled=()=>false,rotation="auto"}={}){
 if(typeof createImageBitmap!=="function")throw Error("This browser cannot decode images for native OCR.");
 notify("Preparing original Knightfall printed-text OCR…");
 const bitmap=await createImageBitmap(file);
 try{
  if(cancelled())throw Error("OCR cancelled.");
  if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>50000000)
   throw Error("Picture is too large or corrupted. Resize it first.");
  // Some Chromium builds expose an on-device TextDetector implementation.
  // It is optional, local, and does not require a model download from us.
  if(typeof TextDetector==="function"&&(rotation==="auto"||rotation===0)){
   try{
    notify("Using built-in device text recognition…");
    const hits=await new TextDetector().detect(bitmap);
    if(cancelled())throw Error("OCR cancelled.");
    const ordered=(Array.isArray(hits)?hits:[])
     .filter(x=>typeof x.rawValue==="string"&&x.rawValue.trim())
     .sort((a,b)=>{
      const ay=a.boundingBox?.y??0,by=b.boundingBox?.y??0;
      return Math.abs(ay-by)<12?(a.boundingBox?.x??0)-(b.boundingBox?.x??0):ay-by;
     });
    const detected=ordered.map(x=>x.rawValue.trim()).join("\n").trim();
    if(detected.length>=2)return {text:detected,confidence:null,method:"device-native-text-detector"};
   }catch(error){
    if(cancelled())throw Error("OCR cancelled.");
    notify("Device text recognition unavailable; trying the original high-contrast reader…");
   }
  }
  const scale=Math.min(1,Math.sqrt(MAX_IMAGE_PIXELS/(bitmap.width*bitmap.height)),1300/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
  const {canvas,ctx}=canvasFor(w,h);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);
  const rgba=ctx.getImageData(0,0,w,h).data;
  const greys=new Uint8Array(w*h);
  for(let i=0;i<greys.length;i++)greys[i]=Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2]);
  if(rotation!=="auto"&&![0,90,180,270].includes(rotation))
   throw Error("Unsupported OCR photo orientation.");
  const templates=fontTemplates();
  let chosen=rotation==="auto"?0:rotation;
  let rotated=rotateKnightfallGrey(greys,w,h,chosen);
  let scan=scanKnightfallGrey(rotated.grey,rotated.width,rotated.height,templates,{notify,cancelled});
  if(rotation==="auto"){
   const letters=(scan.result.text.match(/[A-Za-z0-9]/g)||[]).length;
   const fragmented=scan.result.lines>=5&&letters/scan.result.lines<3;
   if(scan.result.confidence<.65||!scan.result.text.trim()||fragmented){
    notify("Checking photo orientation locally…");
    for(const angle of fragmented?[270,90,180]:[180,90,270]){
     if(cancelled())throw Error("OCR cancelled.");
     rotated=rotateKnightfallGrey(greys,w,h,angle);
     const trial=scanKnightfallGrey(rotated.grey,rotated.width,rotated.height,templates,{notify,cancelled});
     const count=(trial.result.text.match(/[A-Za-z0-9]/g)||[]).length;
     if(count>=4&&trial.score>scan.score+.12){scan=trial;chosen=angle;}
     if(scan.result.confidence>=.86&&scan.result.lines<=3&&count>=8)break;
    }
   }
  }
  const result=scan.result;
  canvas.width=0;canvas.height=0;
  if(!result.text.trim())throw Error("No high-contrast printed text detected. Try a sharper, straight-on photo with dark text on a bright background.");
  const unknowns=(result.text.match(/\?/g)||[]).length;
  const letters=(result.text.match(/[A-Za-z0-9]/g)||[]).length;
  if(result.confidence<.45||unknowns>Math.max(3,letters*.25))
   throw Error("This photo is too difficult for the offline experimental OCR. Improve lighting/crop and straighten it, or use a selectable-text document. No guessed text was returned.");
  return {text:result.text,confidence:result.confidence,method:"original-template-ocr",rotation:chosen};
 }finally{bitmap.close();}
}
