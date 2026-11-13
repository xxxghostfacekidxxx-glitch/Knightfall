import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {floodFill,packAtlas,makeTiledMap,parseTiledMap,nextPowerOfTwo,hexToRGBA} from '../public/creator-production-core.mjs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('pixel painter fills connected components without touching unrelated pixels',()=>{
 const pixels=new Uint8ClampedArray(4*4*4),red=[240,0,0,255],green=[0,160,0,255];
 pixels.set(red,0);pixels.set(red,4);pixels.set(green,8);
 const result=floodFill(pixels,4,4,0,0,[100,50,0,255]);
 assert.deepEqual([...result.slice(0,4)],[100,50,0,255]);
 assert.deepEqual([...result.slice(4,8)],[100,50,0,255]);
 assert.deepEqual([...result.slice(8,12)],green);
 assert.deepEqual([...pixels.slice(0,4)],red,'undo source stays intact');
 assert.deepEqual(hexToRGBA('#a0bc32'),[160,188,50,255]);
 assert.equal(nextPowerOfTwo(65),128);
});
test('atlas packer never overlaps rects and handles dimension limits',()=>{
 const images=[{name:'1',width:32,height:18},{name:'2',width:16,height:44},{name:'3',width:64,height:64},{name:'4',width:12,height:8}];
 const packed=packAtlas(images);assert.equal(packed.frames.length,images.length);
 assert.ok(packed.width<=2048&&packed.height<=2048);
 for(const f of packed.frames){
  assert.ok(f.x>=2&&f.y>=2&&f.x+f.width<packed.width&&f.y+f.height<packed.height);
  for(const other of packed.frames.filter(g=>g.name!==f.name)){
   const overlap=f.x<other.x+other.width&&f.x+f.width>other.x&&f.y<other.y+other.height&&f.y+f.height>other.y;
   assert.equal(overlap,false,'atlas sprites never overlap');
  }
 }
 assert.throws(()=>packAtlas([{width:3000,height:10}]),/too large/i);
});
test('tilemap JSON roundtrip validates dimensions and unsafe tile data',()=>{
 const data=Array.from({length:60},(_,i)=>i%5),map=makeTiledMap(data,10,6);
 assert.equal(map.tilesets[0].image,'knightfall-tileset.png');
 assert.deepEqual(parseTiledMap(JSON.stringify(map)),{width:10,height:6,tiles:data});
 assert.throws(()=>parseTiledMap({...map,width:100}),/4–40/);
 assert.throws(()=>parseTiledMap({...map,layers:[{...map.layers[0],data:[]}] }),/compatible/);
});
test('Creator Foundry exposes one authenticated local production workspace',()=>{
 const page=read('public/devil-tools.html'),script=read('public/creator-production-lab.js');
 assert.match(page,/id="production-workbench" data-workspace hidden/);
 for(const id of ['lab-pixel-canvas','lab-atlas-canvas','lab-tile-canvas','lab-atlas-input','lab-tile-import'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/src="\/creator-production-lab\.js\?v=/);
 assert.match(script,/packAtlas\(/);assert.match(script,/makeTiledMap\(/);
 assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage/,'artwork remains local-only');
 const foundry=read('public/creator-foundry.js');assert.match(foundry,/showLocation\(/);
});
