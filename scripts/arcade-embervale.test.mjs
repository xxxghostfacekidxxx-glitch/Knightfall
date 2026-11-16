import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const r=p=>readFileSync(p,'utf8');
const dir='public/arcade/hosted/embervale/';
test('Embervale ships complete MIT-licensed game, sprites, soundtrack and touch controls',()=>{
 const html=r(dir+'index.html');
 assert.match(html,/<canvas id="game"/);
 for(const file of ['audio','sprites','world','entities','game','knightfall-touch']){
   assert.match(html,new RegExp('js/'+file+'\\.js'));
   assert.ok(existsSync(dir+'js/'+file+'.js'));
 }
 assert.match(html,/id="touch-controls"/);
 assert.match(html,/data-code="KeyZ"/);
 assert.match(html,/data-code="KeyX"/);
 assert.match(html,/data-code="Enter"/);
 assert.match(r(dir+'js/knightfall-touch.js'),/pointerdown/);
 assert.match(r(dir+'js/game.js'),/window.matchMedia/);
 assert.match(r(dir+'LICENSE'),/MIT License/);
 assert.match(r(dir+'LICENSE'),/Nicholas Aryel Ferreira/);
 assert.match(r(dir+'SOURCE.md'),/Nicholas Aryel Ferreira/);
 const htmlUrls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(!htmlUrls.some(u=>/^https?:/.test(u)),'Game should have no remote runtime dependencies');
});
test('Embervale appears once in both generated catalogs and preserves source attribution',()=>{
 const c=JSON.parse(r('public/arcade/catalog.json'));
 assert.equal(c.games.filter(g=>g.id==='embervale').length,1);
 assert.equal(c.games.find(g=>g.id==='embervale').device,'touch');
 const m=JSON.parse(r('public/arcade/import-manifest.json'));
 assert.equal(m.imports.find(g=>g.gameId==='cabinet-embervale').license,'MIT');
 for(const page of ['chaos-cartridge.html'])
   assert.equal((r('public/'+page).match(/data-game-id="embervale"/g)||[]).length,1);
});

function saveHarness() {
 const source=r(dir+'js/game.js');
 const original="Input.init();\nG.player = new Player();\nrequestAnimationFrame(frame);\nconsole.log('[EMBERVALE] ready');";
 assert.ok(source.includes(original),'Game boot must stay interceptable');
 const storage=new Map(),events={};
 const canvas={style:{},getContext(){return {imageSmoothingEnabled:false}}};
 const def={tiles:Array.from({length:11},()=>'.'.repeat(16)),name:'Test Meadow'};
 const sandbox={
  window:{innerWidth:800,innerHeight:600,matchMedia:()=>({matches:false}),addEventListener(type,fn){events[type]=fn}},
  document:{hidden:false,getElementById(){return canvas},createElement(){return {getContext:()=>({})}},addEventListener(type,fn){events[type]=fn}},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  getScreenDef:(map,sx,sy)=>map==='overworld'&&sx===2&&sy===2?def:null,
  rectSolid:()=>false,
  mapMusic:()=> 'overworld',
  AudioSys:{currentSong:()=> 'overworld',playSong(){}},
  Particles:{clear(){}},
  T:{DOOR_LOCK:2,DOOR_BOSS:3,DCRACK:4,CRACK:5,CAVE:6,DOOR_OPEN:7},
  CHAR_TILE:{'.':1},TILE:16,PF_W:256,PF_H:176,
  Player:class{constructor(){this.x=120;this.y=112;this.hx=3;this.hy=6;this.hw=10;this.hh=9}get cx(){return this.x+8}get cy(){return this.y+8}},
  console
 };
 const code=source.replace(original,'globalThis.__G=G;');
 vm.runInNewContext(code,sandbox,{timeout:2000,filename:'embervale-game.js'});
 const G=sandbox.__G;
 G.player=new sandbox.Player();
 G.state='play';
 G.map='overworld';G.sx=2;G.sy=2;
 return {G,saves:sandbox.window.EmbervaleSaves,storage,events,sandbox};
}

test('Embervale manual Save persists the actual location and inventory, and Continue restores it',()=>{
 const {G,saves,storage}=saveHarness();
 G.player.x=96;G.player.y=80;G.hp=2;G.gems=29;G.inv.sword=true;
 assert.equal(saves.saveNow(),true);
 const snapshot=JSON.parse(storage.get('embervale_save'));
 assert.equal(snapshot.version,2);
 assert.equal(snapshot.lastPos.px,6);
 assert.equal(snapshot.lastPos.py,5);
 assert.equal(snapshot.gems,29);
 assert.equal(snapshot.inv.sword,true);
 G.hp=1;G.gems=0;G.inv.sword=false;
 assert.equal(saves.resume(),true);
 assert.equal(G.hp,2);
 assert.equal(G.gems,29);
 assert.equal(G.inv.sword,true);
 assert.equal(G.player.x,96);
 assert.equal(G.player.y,80);
});

test('Embervale can export and import a valid backup without erasing progress for invalid files',()=>{
 const {G,saves,storage}=saveHarness();
 G.hp=2;G.gems=42;
 assert.ok(saves.saveNow());
 const original=saves.exportSave();
 G.hp=1;G.gems=2;
 assert.equal(saves.importSave(original),true);
 assert.equal(G.hp,2);
 assert.equal(G.gems,42);
 const saved=storage.get('embervale_save');
 assert.equal(saves.importSave('not-json'),false);
 assert.equal(saves.importSave(JSON.stringify({...JSON.parse(original),lastPos:{map:'unknown',sx:0,sy:0,px:0,py:0}})),false);
 assert.equal(saves.importSave('x'.repeat(250001)),false);
 assert.equal(storage.get('embervale_save'),saved,'A broken import must not erase the good save');
});

test('Embervale checkpoints on pagehide and keeps room transition saves at last safe position',()=>{
 const {G,saves,storage,events}=saveHarness();
 G.player.x=64;G.player.y=64;
 events.pagehide();
 assert.equal(JSON.parse(storage.get('embervale_save')).lastPos.px,4);
 G.lastPos={map:'overworld',sx:2,sy:2,px:3,py:3};
 G.loadRoom('overworld',2,2);
 assert.equal(JSON.parse(storage.get('embervale_save')).lastPos.px,3,'Room loading must not overwrite the transition checkpoint');
 G.state='title';
 assert.equal(saves.saveNow(),false,'Do not overwrite a real save from the title screen');
});

test('Embervale exposes accessible save, Continue, backup and restore controls on mobile',()=>{
 const html=r(dir+'index.html'),style=r(dir+'knightfall.css'),ui=r(dir+'js/knightfall-save-controls.js');
 for(const id of ['save-game','save-menu','continue-game','backup-save','restore-save','restore-save-file','save-status'])
  assert.match(html,new RegExp('id="'+id+'"'),id+' missing');
 assert.match(html,/id="save-status"[^>]*aria-live="polite"/);
 assert.ok(html.indexOf('js/knightfall-save-controls.js')>html.indexOf('js/game.js'));
 assert.match(ui,/saves\.saveNow\(\)/);
 assert.match(ui,/saves\.importSave\(text\)/);
 assert.match(ui,/URL\.createObjectURL\(blob\)/);
 assert.match(style,/#arcade-nav \.save-menu-panel/);
 assert.match(style,/@media \(max-width:600px\)/);
});
