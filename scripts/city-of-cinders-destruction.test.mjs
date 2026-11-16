import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('public/city-of-cinders-world.js','utf8');
const html=readFileSync('public/city-of-cinders.html','utf8');
const sandbox={module:{exports:{}}};
vm.runInNewContext(source,sandbox,{filename:'city-of-cinders-world.js',timeout:2000});
const World=sandbox.module.exports;
const ground=430;

function building() {
 const b=World.createBuilding(140,130,245,7);
 b._top=ground-b.h;
 return b;
}
function monster(x=48,y=318) {
 return {x,y,w:92,h:112,face:1,grounded:true,climbing:null,vy:0};
}

test('climbable city has unique damageable floors instead of a single three-hit box',()=>{
 const b=building();
 assert.ok(b.floors>=7);
 assert.equal(b.cols,4);
 assert.equal(b.cells.length,b.floors*b.cols);
 assert.ok(b.full>8);
 assert.equal(b.dead,false);
 assert.equal(World.createBuilding(140,130,245,7).full,b.full);
 assert.equal(World.hash(1,2,3),World.hash(1,2,3));
});

test('walls stop walking, but can be grabbed from either side',()=>{
 const b=building(),left=monster();
 assert.equal(World.findGrip([b],left,ground).side,'left');
 const right=monster(b.x+b.w,318);
 assert.equal(World.findGrip([b],right,ground).side,'right');
 const moved=monster(53,318);
 assert.equal(World.resolveWall([b],moved,48,ground),48);
 assert.equal(moved.x,48,'monster cannot walk through intact tower');
 assert.equal(World.findGrip([b],monster(5,318),ground),null);
 const high=monster(53,b._top-112);
 assert.equal(World.resolveWall([b],high,48,ground),53,'body fully above the rooftop can pass over');
});

test('climbing reaches roof and rooftop collisions allow a stable landing',()=>{
 const b=building();
 const m=monster(153,b._top-116);
 const landed=World.landing([b],m,b._top-4,b._top+9);
 assert.equal(landed.y,b._top-m.h);
 m.y=landed.y;
 const hit=World.findTarget([b],m,ground,112);
 assert.ok(hit?.roof,'punching while standing on a rooftop can damage the roof');
 assert.equal(hit.building,b);
});

test('each punch scars a distinct part of the facade, then enough damage collapses the building',()=>{
 const b=building(),top=b._top;
 const first=World.damageBuilding(b,1.3,b.x+9,top+12,ground);
 assert.equal(first.hit,true);
 assert.equal(first.floor,0);
 assert.equal(first.col,0);
 assert.ok(b.cells[0].hp<2);
 const second=World.damageBuilding(b,1.3,b.x+b.w-7,top+112,ground);
 assert.ok(second.floor>first.floor);
 assert.equal(second.col,3);
 assert.ok(b.cells[second.floor*b.cols+3].hp<2);
 let collapsed=false,attempts=0;
 while(!collapsed&&attempts++<20){
   const outcome=World.damageBuilding(b,1.65,b.x+8,top+29,ground);
   collapsed=outcome.collapsed;
 }
 assert.equal(collapsed,true);
 assert.equal(b.dead,true);
 assert.equal(b.hp,0);
 assert.ok(attempts<=8,'tower falls after several targeted blows, not hundreds');
 assert.equal(World.findGrip([b],monster(),ground),null);
 assert.equal(World.damageBuilding(b,99,b.x,top,ground).hit,false,'collapsed tower never awards repeated destruction');
 assert.ok(World.stepCollapse(b,20)>0);
 assert.equal(World.stepCollapse(b,100),Math.min(1,b.collapse));
});

test('remote and on-screen controls have a usable climb path and responsive renderer options',()=>{
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code,'Game script missing');
 assert.doesNotThrow(()=>new vm.Script(code,{filename:'city-of-cinders-inline.js'}));
 assert.ok(html.indexOf('city-of-cinders-world.js')<html.indexOf('(()=>{\'use strict\''),'world logic loads before gameplay');
 for(const needle of ['data-hold="up"','id="kf-city-fidelity"','Cinematic HD','Performance','JUMP','CLIMB','Wall','Punch'])
   assert.ok(html.toLowerCase().includes(needle.toLowerCase()),needle+' missing');
 assert.match(code,/World\.findGrip\(buildings,monster,ground\)/);
 assert.match(code,/World\.resolveWall\(buildings,monster,oldX,ground\)/);
 assert.match(code,/World\.landing\(buildings,monster,oldFoot,monster\.y\+monster\.h\)/);
 assert.match(code,/World\.damageBuilding\(b,amount,x,y,ground\)/);
 assert.match(code,/function configureRenderer\(\)/);
 assert.match(code,/ctx\.setTransform\(ratio,0,0,ratio,0,0\)/);
 assert.match(code,/World\.drawBuilding\(ctx,b,cam,ground,frame,renderMode\)/);
 assert.match(html,/class="control" data-hold="up"/);
});

test('facade renderer caches procedural art rather than rebuilding every frame',()=>{
 let rendered=0,canvases=0;
 const grad={addColorStop(){}};
 const cx={
   createLinearGradient(){return grad;},fillRect(){rendered++;},strokeRect(){},
   save(){},restore(){},drawImage(){rendered++;},beginPath(){},moveTo(){},
   lineTo(){},closePath(){},stroke(){},fill(){},transform(){},translate(){},rotate(){},
   set globalAlpha(v){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){}
 };
 const document={createElement(){canvases++;return {width:0,height:0,getContext(){return cx}}}};
 const env={module:{exports:{}},document};
 vm.runInNewContext(source,env,{filename:'city-of-cinders-world-renderer.js',timeout:2000});
 const api=env.module.exports,b=api.createBuilding(140,130,245,7);
 api.drawBuilding(cx,b,0,ground,0);
 api.drawBuilding(cx,b,0,ground,1);
 assert.equal(canvases,1,'facade cached across frames');
 assert.ok(rendered>50,'architectural elements painted');
});

test('legendary playable monster cast replaces obsolete silhouettes',()=>{
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code);
 for(const id of ['minion-mouse','mini-villain','the-eddie']){
  assert.match(html,new RegExp('data-character="'+id+'"'));
  assert.match(html,new RegExp('data-portrait="'+id+'"'));
  assert.match(code,new RegExp("'"+id+"'"));
 }
 assert.match(code,/const roster=Object\.freeze/);
 assert.match(code,/Art\.draw\(ctx,selectedCharacter/);
 assert.match(code,/Art\.portrait\(c,c\.dataset\.portrait/);
 assert.match(code,/touch\.punch=true;punch\(\)/);
 assert.match(code,/\(keys\[' '\]\|\|touch\.punch\)&&monster\.punch<=0/);
 assert.match(code,/monster\.punch=Math\.max\(0,monster\.punch-step\)/);
 assert.match(code,/function drawSky\(\)/);
 assert.match(code,/skySurface\.getContext\('2d'/);
 assert.doesNotMatch(html,/Guttermaw|Malpractice|Wreckoning/);
 assert.ok(html.indexOf('city-of-cinders-monsters.js')<html.indexOf("(()=>{'use strict'"));
});

test('the rebuilt destruction game is listed as a featured full arcade game',()=>{
 const catalog=JSON.parse(readFileSync('public/arcade/catalog.json','utf8'));
 const game=catalog.games.find(x=>x.id==='city-of-cinders');
 assert.ok(game,'City of Cinders must be in canonical catalog');
 assert.equal(game.collection,'games');
 assert.equal(game.featured,true);
 assert.match(game.description,/scale buildings, punch holes through separate floors/);
 const shelf=readFileSync('public/chaos-cartridge.html','utf8');
 assert.match(shelf,/data-game-id="city-of-cinders" data-category="Action" data-collection="games" data-device="touch" data-featured="true"/);
 assert.match(shelf,/77 full games/);
});

test('damage renderer creates recessed holes, masonry debris and a falling-floor animation',()=>{
 const b=building();
 const breach=World.damageBuilding(b,1.2,b.x+8,ground-b.h+30,ground);
 assert.equal(breach.broken,true);
 assert.ok(b.shards.length>0,'a punch should spawn physical rubble');
 const oldY=b.shards[0].y;World.stepCollapse(b,3);
 assert.notEqual(b.shards[0].y,oldY,'flying concrete should advance each frame');
 let collapsed=false;
 for(let i=0;i<12&&!collapsed;i++)collapsed=World.damageBuilding(b,3,b.x+8,ground-b.h+30,ground).collapsed;
 assert.ok(collapsed,'structural hits should collapse tower');
});

test('Rampage now exposes fullscreen, pause, and visually distinct wall breaches',()=>{
 assert.match(html,/id="fullscreen"/);
 assert.match(html,/requestFullscreen\(\)/);
 assert.match(html,/id="pause"/);
 assert.match(html,/function togglePause\(\)/);
 assert.match(html,/\.game-shell:fullscreen/);
 assert.match(html,/WALL BREACHED/);
 assert.match(html,/MONSTER MAYHEM/);
});

test('visible tanks fire from simulated vehicles and can be punched or destroyed by rage',()=>{
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
 assert.ok(code);
 assert.match(code,/tanks\.push\(\{x,y:ground\+5,hp:3/);
 assert.match(code,/shots\.push\(\{x:tank\.x-26,y:ground-9/);
 assert.match(code,/const tank=tanks\.find\(/);
 assert.match(code,/tanks=tanks\.filter\(t=>t\.hp>0\)/);
 assert.match(code,/for\(const tank of tanks\)\{/);
 assert.doesNotMatch(code,/shots\.push\(\{x:cam\+W\+rand\(30,100\)/);
});

test('monster renderer draws original animated silhouettes and matching portraits for each hero',()=>{
 const script=readFileSync('public/city-of-cinders-monsters.js','utf8');
 const fake={module:{exports:{}}};
 vm.runInNewContext(script,fake,{filename:'city-of-cinders-monsters.js',timeout:2000});
 const art=fake.module.exports;
 assert.deepEqual(Array.from(art.ids),['minion-mouse','mini-villain','the-eddie']);
 const gradient={addColorStop(){}};
 for(const id of art.ids){
  let drawn=0;
  const ctx={
   beginPath(){drawn++},ellipse(){},moveTo(){},lineTo(){},closePath(){},quadraticCurveTo(){},bezierCurveTo(){},arc(){},
   fill(){},stroke(){},fillRect(){},clearRect(){},save(){},restore(){},translate(){},scale(){},rotate(){},
   createLinearGradient(){return gradient},createRadialGradient(){return gradient}
  };
  for(const state of ['idle','walk','run','climb','attack','jump','roar','hurt']){
    assert.equal(art.draw(ctx,id,30,180,100,120,{state,frame:44,face:-1,mutation:'feral'}),true);
  }
  assert.equal(art.portrait({width:300,height:200,getContext:()=>ctx},id,{mutation:'armored'}),true);
  assert.ok(drawn>110,id+' needs detailed vector artwork, not a blank canvas');
 }
 assert.equal(art.draw({},'missing',0,0,100,100),false);
});

test('three monstrous playstyles are explicit and free from obsolete unlock requirements',()=>{
 const code=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
 assert.match(code,/unlockedCharacters=Object\.keys\(roster\)/);
 assert.match(code,/selectedCharacter='minion-mouse'/);
 assert.match(code,/selectedCharacter==='minion-mouse'\?5/);
 assert.match(code,/selectedCharacter==='mini-villain'&&!monster\.grounded/);
 assert.match(code,/selectedCharacter==='the-eddie'\?5\.2/);
 assert.match(code,/climbSpeed/);
 assert.doesNotMatch(code,/const unlockRules/);
});
