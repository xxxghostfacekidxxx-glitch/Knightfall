import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(p,'utf8');
test('Neon Surge is licensed and listed exactly once on both arcade shelves',()=>{
 const p='public/arcade/hosted/neon-surge/';
 const html=read(p+'index.html');
 assert.match(html,/<html lang="en">/);
 assert.match(html,/<script type="module">/);
 assert.match(html,/three@0\.186\.0/);
 assert.match(html,/OVERSEER/);
 assert.match(read(p+'LICENSE'),/MIT License/);
 assert.match(read(p+'SOURCE.md'),/nnnnnnnnnke/);
 const cat=JSON.parse(read('public/arcade/catalog.json'));
 assert.equal(cat.games.filter(g=>g.id==='neon-surge').length,1);
 const imports=JSON.parse(read('public/arcade/import-manifest.json'));
 assert.equal(imports.imports.find(g=>g.gameId==='cabinet-neon-surge').license,'MIT');
 for(const file of ['chaos-cartridge.html'])assert.equal((read('public/'+file).match(/data-game-id="neon-surge"/g)||[]).length,1);
});

test('Neon Surge title loop yields idle frames and keeps START clickable under WebGL load',()=>{
 const html=read('public/arcade/hosted/neon-surge/index.html');
 assert.match(html,/\.screen\.title #startBtn \{[^}]*pointer-events: auto; touch-action: manipulation;/);
 assert.match(html,/let launchQueued = false;/);
 assert.match(html,/if \(launchQueued \|\| G\.state !== 'title'\) return;/);
 assert.match(html,/setTimeout\(\(\) => \{\s*launchQueued = false;\s*if \(G\.state === 'title'\) startGame\(\);/);
 assert.match(html,/const idle = G\.state === 'title' \|\| G\.state === 'paused' \|\| G\.state === 'over';/);
 assert.match(html,/if \(idle\) \{ last = now; return; \}/);
 assert.match(html,/if \(!idle\) trackPerf\(rdt\);/);
 assert.match(html,/if \(!innerWidth \|\| !innerHeight \|\| document\.hidden\) \{ last = now; return; \}/);
 // Gameplay remains unconstrained by title-screen throttling.
 assert.match(html,/G\.state = 'playing';\s*showScreen\(null\)/);
});

 test('title, paused and game-over screens do not submit expensive WebGL frames',()=>{
 const html=read('public/arcade/hosted/neon-surge/index.html');
 const start=html.indexOf('function frame(now) {');const code=html.slice(start,html.indexOf('// ─── boot',start));
 let renders=0,updates=0;
 const c={G:{state:'title'},requestAnimationFrame(){},innerWidth:1280,innerHeight:720,document:{hidden:false},last:0,sizedW:1280,sizedH:720,trackPerf(){},onResize(){},update(){updates++},composer:{render(){renders++}}};
 vm.createContext(c);vm.runInContext(code,c);
 for(const state of ['title','paused','over']){c.G.state=state;c.frame(1000);}
 assert.equal(renders,0);assert.equal(updates,0);
 c.G.state='playing';c.frame(1016);assert.equal(renders,1);assert.equal(updates,1);
 c.document.hidden=true;c.frame(1032);assert.equal(renders,1);
 });
