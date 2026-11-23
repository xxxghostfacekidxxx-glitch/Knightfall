import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {floodFill,packAtlas,uniqueAtlasName,makeTiledMap,parseTiledMap,tileAtPointer,nextPowerOfTwo,hexToRGBA} from '../public/creator-production-core.mjs';
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

test('atlas filenames remain unique across repeated imports and reset cleanly',()=>{
 const used=new Set();
 const names=['sprite.png','sprite.png','sprite.png','sprite.jpg','sprite.png','a b.png','a/b.png'].map(n=>uniqueAtlasName(n,used));
 assert.deepEqual(names,['sprite.png','sprite-2.png','sprite-3.png','sprite.jpg','sprite-4.png','a-b.png','a-b-2.png']);
 assert.equal(new Set(names).size,names.length,'JSON frame keys must not collide');
 used.clear();
 assert.equal(uniqueAtlasName('sprite.png',used),'sprite.png','clearing the atlas resets names');
 const script=read('public/creator-production-lab.js');
 assert.match(script,/uniqueAtlasName\(f\.name,atlasNames\)/);
 assert.match(script,/atlasNames\.clear\(\)/);
});

test('tilemap painter ignores pointer drags outside canvas instead of clamping to edges',()=>{
 const rect={left:100,top:50,width:400,height:300};
 assert.deepEqual(tileAtPointer(100,50,rect,20,12),[0,0]);
 assert.deepEqual(tileAtPointer(499,349,rect,20,12),[19,11]);
 for(const [x,y] of [[99,50],[100,49],[500,200],[300,350]]){
  assert.equal(tileAtPointer(x,y,rect,20,12),null);
 }
 assert.equal(tileAtPointer(100,50,{left:100,top:50,width:0,height:300},20,12),null);
 assert.match(read('public/creator-production-lab.js'),/tileAtPointer\(e\.clientX,e\.clientY/);
});

test('Pixel Studio keeps strokes in bounds and clears stale undo after frame structure changes',()=>{
 const script=read('public/creator-production-lab.js');
 assert.match(script,/const pixel=event=>tileAtPointer\(event\.clientX,event\.clientY,sprite\.getBoundingClientRect\(\),SIZE,SIZE\)/);
 assert.match(script,/const position=pixel\(event\);if\(!position\)return/);
 assert.match(script,/if\(position\)paint\(\.\.\.position\)/);
 assert.match(script,/frames\.splice\(frame\+1,0,frames\[frame\]\.slice\(\)\);frame\+\+;history=\[\]/);
 assert.match(script,/frames\.splice\(frame,1\);frame=Math\.min\(frame,frames\.length-1\);history=\[\]/);
});

test('mobile editors disable browser touch panning and ignore secondary pointer strokes',()=>{
 const script=read('public/creator-production-lab.js');
 assert.match(script,/sprite\.style\.touchAction='none'/);
 assert.match(script,/tileCanvas\.style\.touchAction='none'/);
 assert.equal((script.match(/isPrimary===false/g)||[]).length,2);
});
