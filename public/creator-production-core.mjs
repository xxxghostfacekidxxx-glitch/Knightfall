/** Local-first creative helpers inspired by Piskel, FreeTexPacker and Tiled workflows.
 * Original Knightfall implementation; does not incorporate upstream application code.
 * Pure functions are shared with node:test and require no network or DOM.
 */
export const TILE_COLORS=['transparent','#6b9b70','#77717e','#c96e54','#e5c16b'];
export const TILE_NAMES=['Empty','Ground','Wall','Hazard','Spawn'];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const nextPowerOfTwo=n=>2**Math.ceil(Math.log2(Math.max(1,n)));
export function hexToRGBA(hex){
 if(!/^#[0-9a-f]{6}$/i.test(hex))throw Error('Invalid color.');
 return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];
}
export function floodFill(original,width,height,startX,startY,color){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16384||original.length!==width*height*4)throw Error('Invalid pixel frame.');
 const out=new Uint8ClampedArray(original),target=(startY*width+startX)*4;
 if(startX<0||startY<0||startX>=width||startY>=height)return out;
 const before=out.slice(target,target+4);
 if(before.every((v,i)=>v===color[i]))return out;
 const q=[startY*width+startX],seen=new Uint8Array(width*height);
 for(let k=0;k<q.length;k++){
  const p=q[k];if(seen[p])continue;seen[p]=1;
  const at=p*4;
  if(!before.every((v,i)=>out[at+i]===v))continue;
  for(let i=0;i<4;i++)out[at+i]=color[i];
  const x=p%width,y=Math.floor(p/width);
  if(x>0)q.push(p-1);if(x<width-1)q.push(p+1);
  if(y>0)q.push(p-width);if(y<height-1)q.push(p+width);
 }
 return out;
}
export function packAtlas(entries,{maxSize=2048,padding=2}={}){
 if(!Array.isArray(entries)||!entries.length||entries.length>48)throw Error('Choose 1–48 raster images.');
 if(!Number.isInteger(padding)||padding<0||padding>16)throw Error('Invalid atlas spacing.');
 const images=entries.map((item,index)=>{
  const width=item.width,height=item.height;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>maxSize-2*padding||height>maxSize-2*padding)throw Error('An image is too large for the atlas.');
  return {...item,index,width,height};
 }).sort((a,b)=>b.height-a.height||b.width-a.width||a.index-b.index);
 const area=images.reduce((n,x)=>n+(x.width+padding*2)*(x.height+padding*2),0);
 const minimum=nextPowerOfTwo(Math.max(Math.max(...images.map(x=>x.width+padding*2)),Math.ceil(Math.sqrt(area*.9))));
 for(let w=minimum;w<=maxSize;w*=2){
  const result=[];let x=0,y=0,row=0,usedW=0;
  for(const item of images){
   const iw=item.width+padding*2,ih=item.height+padding*2;
   if(x+iw>w){y+=row;x=0;row=0}
   result.push({...item,x:x+padding,y:y+padding});
   x+=iw;row=Math.max(row,ih);usedW=Math.max(usedW,x);
  }
  const h=nextPowerOfTwo(y+row);
  if(h<=maxSize)return {width:nextPowerOfTwo(usedW),height:h,frames:result.sort((a,b)=>a.index-b.index)};
 }
 throw Error('Atlas exceeds 2048px. Reduce source image sizes or pack fewer at once.');
}
export function makeTiledMap(tiles,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<4||width>40||height<4||height>30||tiles.length!==width*height)throw Error('Invalid map dimensions.');
 if(Array.from(tiles).some(n=>!Number.isInteger(n)||n<0||n>4))throw Error('Tile ID out of range.');
 return {type:'map',version:'1.10',tiledversion:'1.10.2',orientation:'orthogonal',renderorder:'right-down',
  width,height,tilewidth:32,tileheight:32,infinite:false,nextlayerid:2,nextobjectid:1,
  layers:[{id:1,name:'Terrain',type:'tilelayer',width,height,x:0,y:0,opacity:1,visible:true,data:Array.from(tiles)}],
  tilesets:[{firstgid:1,name:'Knightfall Prototype Tiles',image:'knightfall-tileset.png',
   imagewidth:128,imageheight:32,tilewidth:32,tileheight:32,columns:4,tilecount:4,margin:0,spacing:0,
   tiles:[{id:1,properties:[{name:'solid',type:'bool',value:true}]},{id:2,properties:[{name:'hazard',type:'bool',value:true}]},{id:3,properties:[{name:'spawn',type:'bool',value:true}]}]}]};
}
export function parseTiledMap(value){
 const m=typeof value==='string'?JSON.parse(value):value;
 if(!m||m.type!=='map'||!Array.isArray(m.layers)||!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<4||m.width>40||m.height<4||m.height>30)throw Error('Only 4–40 by 4–30 Tiled JSON maps are supported.');
 const layer=m.layers.find(x=>x.type==='tilelayer'&&Array.isArray(x.data)&&x.width===m.width&&x.height===m.height);
 if(!layer||layer.data.length!==m.width*m.height||layer.data.some(x=>!Number.isInteger(x)||x<0||x>4))throw Error('Map must contain one compatible, uncompressed 0–4 tile layer.');
 return {width:m.width,height:m.height,tiles:layer.data.slice()};
}
