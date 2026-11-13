/* Knightfall Creator Production Lab, client-only workshop. No file contents leave browser. */
import {TILE_COLORS,TILE_NAMES,clamp,hexToRGBA,floodFill,packAtlas,makeTiledMap,parseTiledMap} from './creator-production-core.mjs';
const $=id=>document.getElementById(id);
const root=$('production-workbench');
if(root){
const say=(id,message)=>{const el=$(id);if(el)el.textContent=message};
const download=(blob,name)=>{
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
};
const downloadCanvas=(canvas,name)=>canvas.toBlob(blob=>blob?download(blob,name):say('lab-status','PNG export failed.'),'image/png');
const validRaster=file=>file&&['image/png','image/jpeg','image/webp'].includes(file.type)&&file.size<=8*1024*1024;
async function loadRaster(file){
 if(!validRaster(file))throw Error('Choose PNG, JPEG or WebP files under 8 MB each.');
 const url=URL.createObjectURL(file);
 try{
  const img=new Image();
  await new Promise((ok,fail)=>{img.onload=ok;img.onerror=()=>fail(Error('Cannot decode '+file.name));img.src=url});
  if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth>4096||img.naturalHeight>4096)throw Error('Image dimensions exceed 4096 pixels.');
  return img;
 }finally{URL.revokeObjectURL(url)}
}
function activate(name){
 root.querySelectorAll('[data-lab-panel]').forEach(el=>{el.hidden=el.dataset.labPanel!==name});
 root.querySelectorAll('[data-lab-tab]').forEach(el=>{const on=el.dataset.labTab===name;el.setAttribute('aria-selected',String(on));el.tabIndex=on?0:-1});
}
root.querySelectorAll('[data-lab-tab]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.labTab)));
activate('pixels');

// Piskel/Pixelorama-style local pixel editing, including frames and undo.
const sprite=$('lab-pixel-canvas'),ctx=sprite.getContext('2d',{willReadFrequently:true});
ctx.imageSmoothingEnabled=false;
const SIZE=32;let frames=[new Uint8ClampedArray(SIZE*SIZE*4)],frame=0,tool='draw',history=[],drawing=false;
const saveUndo=()=>{history.push({frame,bytes:frames[frame].slice()});if(history.length>40)history.shift()};
function redraw(){
 const img=new ImageData(frames[frame],SIZE,SIZE);ctx.putImageData(img,0,0);
 say('lab-pixel-info','Frame '+(frame+1)+' / '+frames.length+' · '+SIZE+'×'+SIZE+' · '+history.length+' undo steps');
}
const pixel=(event)=>{const r=sprite.getBoundingClientRect();return [clamp(Math.floor((event.clientX-r.left)*SIZE/r.width),0,SIZE-1),clamp(Math.floor((event.clientY-r.top)*SIZE/r.height),0,SIZE-1)]};
const paint=(x,y)=>{
 const color=tool==='erase'?[0,0,0,0]:hexToRGBA($('lab-pixel-color').value);
 const at=(y*SIZE+x)*4;
 if(tool==='pick'){
  const bytes=frames[frame].slice(at,at+4);
  if(bytes[3])$('lab-pixel-color').value='#'+[...bytes.slice(0,3)].map(n=>n.toString(16).padStart(2,'0')).join('');
  setTool('draw');return;
 }
 if(tool==='fill'){frames[frame]=floodFill(frames[frame],SIZE,SIZE,x,y,color);redraw();return}
 for(let i=0;i<4;i++)frames[frame][at+i]=color[i];
 redraw();
};
function setTool(id){
 tool=id;root.querySelectorAll('[data-pixel-tool]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pixelTool===id)));
}
root.querySelectorAll('[data-pixel-tool]').forEach(button=>button.addEventListener('click',()=>setTool(button.dataset.pixelTool)));
sprite.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();sprite.setPointerCapture(event.pointerId);saveUndo();drawing=true;const [x,y]=pixel(event);paint(x,y)});
sprite.addEventListener('pointermove',event=>{if(!drawing||!['draw','erase'].includes(tool))return;const [x,y]=pixel(event);paint(x,y)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])sprite.addEventListener(type,()=>{drawing=false});
$('lab-pixel-undo').addEventListener('click',()=>{const state=history.pop();if(!state)return;frame=state.frame;frames[frame]=state.bytes;redraw()});
$('lab-pixel-new').addEventListener('click',()=>{if(frames.length>=12)return say('lab-status','Maximum 12 animation frames.');frames.splice(frame+1,0,frames[frame].slice());frame++;redraw()});
$('lab-pixel-previous').addEventListener('click',()=>{frame=(frame+frames.length-1)%frames.length;redraw()});
$('lab-pixel-next').addEventListener('click',()=>{frame=(frame+1)%frames.length;redraw()});
$('lab-pixel-remove').addEventListener('click',()=>{if(frames.length===1)return;frames.splice(frame,1);frame=Math.min(frame,frames.length-1);redraw()});
$('lab-pixel-clear').addEventListener('click',()=>{saveUndo();frames[frame]=new Uint8ClampedArray(SIZE*SIZE*4);redraw()});
$('lab-pixel-import').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  const img=await loadRaster(file),c=document.createElement('canvas');c.width=c.height=SIZE;
  const g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;g.clearRect(0,0,SIZE,SIZE);
  const ratio=Math.min(SIZE/img.naturalWidth,SIZE/img.naturalHeight),w=Math.max(1,Math.floor(img.naturalWidth*ratio)),h=Math.max(1,Math.floor(img.naturalHeight*ratio));
  g.drawImage(img,Math.floor((SIZE-w)/2),Math.floor((SIZE-h)/2),w,h);
  saveUndo();frames[frame]=new Uint8ClampedArray(g.getImageData(0,0,SIZE,SIZE).data);
  redraw();say('lab-status','Image loaded locally and scaled to 32×32.');
 }catch(error){say('lab-status',error.message)}event.target.value='';
});
function frameStrip(){
 const canvas=document.createElement('canvas');canvas.width=SIZE*frames.length;canvas.height=SIZE;
 const g=canvas.getContext('2d');frames.forEach((bytes,i)=>g.putImageData(new ImageData(bytes,SIZE,SIZE),i*SIZE,0));return canvas;
}
$('lab-pixel-export').addEventListener('click',()=>downloadCanvas(sprite,'knightfall-sprite.png'));
$('lab-pixel-strip').addEventListener('click',()=>downloadCanvas(frameStrip(),'knightfall-frames.png'));
$('lab-pixel-metadata').addEventListener('click',()=>download(new Blob([JSON.stringify({name:'Knightfall Sprite Frames',frameWidth:SIZE,frameHeight:SIZE,frames:frames.map((_,i)=>({frame:i,x:i*SIZE,y:0,w:SIZE,h:SIZE})),format:'horizontal-strip'},null,2)],{type:'application/json'}),'knightfall-frames.json'));
setTool('draw');redraw();

// FreeTexPacker-style atlas, with shelf packing and JSON metadata export.
const atlasCanvas=$('lab-atlas-canvas'),atlasCtx=atlasCanvas.getContext('2d');
let atlasImages=[],atlasResult=null;
$('lab-atlas-input').addEventListener('change',async event=>{
 const files=Array.from(event.target.files||[]);
 if(files.length+atlasImages.length>48)return say('lab-atlas-status','Maximum 48 images per atlas.');
 for(const f of files){
  try{
   const image=await loadRaster(f);
   if(image.naturalWidth>2044||image.naturalHeight>2044)throw Error('Atlas images must be 2044px or smaller.');
   atlasImages.push({name:f.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,75),image,width:image.naturalWidth,height:image.naturalHeight});
  }catch(e){say('lab-atlas-status',e.message)}
 }
 event.target.value='';atlasResult=null;
 $('lab-atlas-list').replaceChildren(...atlasImages.map(item=>{const li=document.createElement('li');li.textContent=item.name+' · '+item.width+'×'+item.height;return li}));
 if(atlasImages.length)say('lab-atlas-status',atlasImages.length+' local images ready. Click Pack sprites.');
});
$('lab-atlas-clear').addEventListener('click',()=>{atlasImages=[];atlasResult=null;$('lab-atlas-list').replaceChildren();atlasCanvas.width=1;atlasCanvas.height=1;say('lab-atlas-status','Atlas cleared.')});
$('lab-atlas-pack').addEventListener('click',()=>{
 try{
  atlasResult=packAtlas(atlasImages.map(({name,width,height,image})=>({name,width,height,image})));
  atlasCanvas.width=atlasResult.width;atlasCanvas.height=atlasResult.height;atlasCtx.clearRect(0,0,atlasCanvas.width,atlasCanvas.height);
  for(const f of atlasResult.frames)atlasCtx.drawImage(f.image,f.x,f.y);
  say('lab-atlas-status','Packed '+atlasResult.frames.length+' sprites into '+atlasResult.width+'×'+atlasResult.height+' PNG. Export image and JSON together.');
 }catch(error){say('lab-atlas-status',error.message)}
});
$('lab-atlas-png').addEventListener('click',()=>{if(atlasResult)downloadCanvas(atlasCanvas,'knightfall-atlas.png');else say('lab-atlas-status','Pack your sprites first.')});
$('lab-atlas-json').addEventListener('click',()=>{
 if(!atlasResult)return say('lab-atlas-status','Pack your sprites first.');
 const sprites=atlasResult.frames.map(({name,x,y,width,height})=>({name,x,y,width,height}));
 const manifest={image:'knightfall-atlas.png',width:atlasResult.width,height:atlasResult.height,padding:2,format:'rgba8888',frames:Object.fromEntries(sprites.map(f=>[f.name,{frame:{x:f.x,y:f.y,w:f.width,h:f.height},rotated:false,trimmed:false}]))};
 download(new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'}),'knightfall-atlas.json');
});

// Tiled-style local tilemap painter with compatible JSON and companion tile PNG.
const tileCanvas=$('lab-tile-canvas'),tileCtx=tileCanvas.getContext('2d');
let tw=20,th=12,tiles=new Array(tw*th).fill(0),tile=1,tileDown=false;
const tileSize=32;
const drawTiles=()=>{
 tileCanvas.width=tw*tileSize;tileCanvas.height=th*tileSize;
 tileCtx.imageSmoothingEnabled=false;
 for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
  const n=tiles[y*tw+x],px=x*tileSize,py=y*tileSize;
  tileCtx.fillStyle=n?TILE_COLORS[n]:'#1b202d';tileCtx.fillRect(px,py,tileSize,tileSize);
  if(n===2){tileCtx.fillStyle='#444452';tileCtx.fillRect(px+4,py+4,24,24)}
  if(n===3){tileCtx.fillStyle='#5d2e2a';tileCtx.beginPath();tileCtx.moveTo(px+16,py+5);tileCtx.lineTo(px+27,py+27);tileCtx.lineTo(px+5,py+27);tileCtx.closePath();tileCtx.fill()}
  if(n===4){tileCtx.fillStyle='#382b39';tileCtx.beginPath();tileCtx.arc(px+16,py+16,9,0,Math.PI*2);tileCtx.fill()}
  tileCtx.strokeStyle='#ffffff1b';tileCtx.strokeRect(px+.5,py+.5,31,31);
 }
 say('lab-tile-info',tw+'×'+th+' tiles · '+tiles.filter(x=>x!==0).length+' painted · '+TILE_NAMES[tile]);
};
const placeTile=e=>{
 const r=tileCanvas.getBoundingClientRect(),x=clamp(Math.floor((e.clientX-r.left)*tw/r.width),0,tw-1),y=clamp(Math.floor((e.clientY-r.top)*th/r.height),0,th-1);
 if(tile===4)tiles=tiles.map(n=>n===4?0:n);
 tiles[y*tw+x]=tile;drawTiles();
};
tileCanvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();tileDown=true;tileCanvas.setPointerCapture(e.pointerId);placeTile(e)});
tileCanvas.addEventListener('pointermove',e=>{if(tileDown)placeTile(e)});
for(const type of ['pointerup','pointercancel','lostpointercapture'])tileCanvas.addEventListener(type,()=>tileDown=false);
$('lab-tile-brush').addEventListener('change',e=>{tile=Number(e.target.value);drawTiles()});
$('lab-tile-reset').addEventListener('click',()=>{
 const w=Number($('lab-map-width').value),h=Number($('lab-map-height').value);
 if(!Number.isInteger(w)||w<4||w>40||!Number.isInteger(h)||h<4||h>30)return say('lab-tile-status','Map must be 4–40 wide and 4–30 high.');
 tw=w;th=h;tiles=new Array(tw*th).fill(0);drawTiles();say('lab-tile-status','New blank map ready.');
});
$('lab-tile-import').addEventListener('change',async event=>{
 const f=event.target.files?.[0];if(!f)return;
 try{
  if(f.size>512*1024)throw Error('Map JSON must be smaller than 512 KB.');
  const imported=parseTiledMap(await f.text());tw=imported.width;th=imported.height;tiles=imported.tiles;
  $('lab-map-width').value=tw;$('lab-map-height').value=th;drawTiles();say('lab-tile-status','Imported compatible Tiled JSON locally.');
 }catch(error){say('lab-tile-status',error.message)}event.target.value='';
});
$('lab-tile-json').addEventListener('click',()=>{
 download(new Blob([JSON.stringify(makeTiledMap(tiles,tw,th),null,2)],{type:'application/json'}),'knightfall-map.json');
 say('lab-tile-status','Exported map JSON. Download matching tileset PNG for viewing it in Tiled.');
});
$('lab-tile-png').addEventListener('click',()=>downloadCanvas(tileCanvas,'knightfall-map-preview.png'));
$('lab-tile-tileset').addEventListener('click',()=>{
 const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');
 for(let i=0;i<4;i++){
  const n=i+1,x=i*32;
  g.fillStyle=TILE_COLORS[n];g.fillRect(x,0,32,32);
  if(n===2){g.fillStyle='#444452';g.fillRect(x+4,4,24,24)}
  if(n===3){g.fillStyle='#5d2e2a';g.beginPath();g.moveTo(x+16,5);g.lineTo(x+27,27);g.lineTo(x+5,27);g.closePath();g.fill()}
  if(n===4){g.fillStyle='#382b39';g.beginPath();g.arc(x+16,16,9,0,Math.PI*2);g.fill()}
 }
 downloadCanvas(c,'knightfall-tileset.png');
});
drawTiles();
say('lab-status','All three workspaces run locally. Nothing is uploaded or published automatically.');
}
