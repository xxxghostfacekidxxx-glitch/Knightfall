import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('public/arcade/hosted/crypt-smash/engine.js','utf8');
const html=readFileSync('public/arcade/hosted/crypt-smash/index.html','utf8');
const context={};runInNewContext(engine,context);const Game=context.ChaosWhack;
for(const [mode,duration] of Object.entries({classic:20,panic:30,crypt:45,chase:30,hunt:45}))test(mode+': starts once, accepts hits, ends at its duration and rejects further scoring',()=>{
 const g=new Game(mode,()=>.8);assert.equal(g.tap(1).kind,'ignored');assert.equal(g.start(),true);assert.equal(g.start(),false);assert.equal(g.remaining,duration*1000);
 const id=g.targets[0].id;assert.equal(g.tap(id).kind,'hit');const points=g.score;assert.ok(points>0);g.tap(id);assert.equal(g.score,points);
 g.advance(duration*1000);assert.equal(g.phase,'ended');assert.equal(g.targets.length,0);assert.equal(g.tap(123).kind,'ignored');assert.equal(g.score,points);
});
test('Crypt Smash decoys subtract points, cannot go negative, and break combos',()=>{
 const g=new Game('crypt',()=>.8);g.start();g.tap(g.targets[0].id);assert.equal(g.score,50);
 g.random=()=>.1;g.advance(720);assert.equal(g.targets[0].kind,'friend');assert.equal(g.tap(g.targets[0].id).kind,'friend');assert.equal(g.score,25);assert.equal(g.combo,0);assert.equal(g.friendlyHits,1);
 for(let i=0;i<3;i++){g.advance(720);g.tap(g.targets[0].id)}assert.equal(g.score,0);
});
test('combos raise the multiplier, escaped targets and empty taps reset it',()=>{
 const g=new Game('chase',()=>.8);g.start();for(let i=0;i<5;i++)g.tap(g.targets[0].id);assert.equal(g.multiplier,2);assert.equal(g.score,60);assert.equal(g.bestCombo,5);
 g.tap(-1);assert.equal(g.combo,0);g.tap(g.targets[0].id);g.advance(850);assert.equal(g.combo,0);assert.equal(g.escaped,1);
});
test('Ember Chase relocates immediately after every successful hit',()=>{
 const g=new Game('chase',()=>.4);g.start();const before=g.targets[0].id;g.tap(before);assert.equal(g.targets.length,1);assert.notEqual(g.targets[0].id,before);assert.equal(g.targets[0].kind,'ember');
});
test('Exterminator keeps overlapping bugs, bounds them inside the arena, and penalizes empty taps by one second',()=>{
 const g=new Game('hunt',()=>.4);g.start();g.advance(650);assert.equal(g.targets.length,2);for(const t of g.targets){assert.ok(t.x>=12&&t.x<=88&&t.y>=12&&t.y<=88)}
 const before=g.remaining;g.tap(-1);assert.equal(g.remaining,before-1000);g.remaining=500;g.tap(-1);assert.equal(g.phase,'ended');assert.equal(g.remaining,0);
});
test('pause freezes targets and time, resume continues without hidden scoring',()=>{
 const g=new Game('classic',()=>.4);g.start();g.pause();const snapshot=JSON.stringify(g);g.advance(9000);assert.equal(g.tap(g.targets[0].id).kind,'ignored');assert.equal(JSON.stringify(g),snapshot);g.resume();g.advance(100);assert.equal(g.remaining,19900);
});
function harness(mode='crypt'){
 const nodes=new Map(),intervals=new Map(),timeouts=new Map(),events=new Map(),scores=[];let now=0,tid=0;
 const make=()=>{const classes=new Set();return {children:[],style:{setProperty(){}},dataset:new Proxy({},{set(o,k,v){o[k]=String(v);return true}}),classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,v){const on=v??!classes.has(x);if(on)classes.add(x);else classes.delete(x)}},setAttribute(){},append(...xs){for(const x of xs){x.parent=this;this.children.push(x)}},replaceChildren(...xs){this.children=[];this.append(...xs)},remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)},getBoundingClientRect:()=>({left:0,top:0,width:600,height:600}),value:'',textContent:''}};
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))nodes.set(id,make());nodes.get('mode').value=mode;const main=make();
 const document={getElementById:id=>nodes.get(id),querySelector:()=>main,createElement:make,body:{style:{}},hidden:false,addEventListener:(name,fn)=>events.set(name,fn)};
 const sandbox={document,location:{search:''},URLSearchParams,performance:{now:()=>now},window:{AshFallArcade:{ready:Promise.resolve(),recordScore:(...args)=>scores.push(args)}},localStorage:{getItem:()=>null,setItem(){}},setInterval:fn=>{intervals.set(++tid,fn);return tid},clearInterval:id=>intervals.delete(id),setTimeout:fn=>{timeouts.set(++tid,fn);return tid},console};
 runInNewContext(engine,sandbox);const ui=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('new ChaosWhack'));
 runInNewContext(ui.replace('fresh();\n})();','fresh();globalThis.testGame=()=>game;\n})();'),sandbox);
 return {nodes,intervals,events,scores,document,game:()=>sandbox.testGame(),advance(ms){now+=ms;for(const fn of [...intervals.values()])fn()}};
}
test('UI restart rejects an old timer and starts only one clock',()=>{
 const h=harness();h.nodes.get('start').onclick();const stale=[...h.intervals.values()][0];h.nodes.get('start').onclick();assert.equal(h.intervals.size,1);const before=h.game().remaining;stale();assert.equal(h.game().remaining,before);assert.equal(h.game().score,0);
});
test('UI mode switching, pause, visibility and completion preserve one submission',async()=>{
 const h=harness('chase');h.nodes.get('start').onclick();h.advance(1000);h.nodes.get('pause').onclick();const remaining=h.game().remaining;h.advance(5000);assert.equal(h.game().remaining,remaining);
 h.nodes.get('pause').onclick();h.advance(100);assert.equal(h.game().remaining,remaining-100);h.document.hidden=true;h.events.get('visibilitychange')();assert.equal(h.game().paused,true);h.advance(2000);h.document.hidden=false;h.nodes.get('pause').onclick();h.advance(50000);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.scores.length,1);assert.equal(h.scores[0][0],'crypt-smash');assert.equal(h.scores[0][2].mode,'chase');assert.equal(h.intervals.size,0);
 h.nodes.get('mode').value='hunt';h.nodes.get('mode').onchange();assert.equal(h.game().mode,'hunt');assert.equal(h.game().phase,'ready');assert.equal(h.game().score,0);
});
test('Crypt Smash is the sole tap-target cabinet and retired copies are removed',()=>{
 const c=JSON.parse(readFileSync('public/arcade/catalog.json'));assert.equal(c.games.find(g=>g.id==='crypt-smash').title,'Crypt Smash');for(const id of ['cinder-taps','whack-a-bug','arcade-games-game-whack','arcade-after-dark-whack-a-glitch-panic-room'])assert.ok(!c.games.some(g=>g.id===id));
 for(const slug of ['cinder-taps','whack-a-bug'])assert.equal(existsSync('public/arcade/hosted/'+slug+'/index.html'),false,'duplicate route remains: '+slug);
 for(const name of ['glitch.svg','friend.svg','ember-target.svg','bug.svg','void-wisp.svg'])assert.ok(existsSync('public/arcade/hosted/crypt-smash/sprites/'+name));
});
