import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('public/arcade/hosted/reaction-ritual/engine.js','utf8');
const html=readFileSync('public/arcade/hosted/reaction-ritual/index.html','utf8');
const context={};runInNewContext(engine,context);const Game=context.ReactionRitual;
for(const rounds of [1,3])test(rounds+' rounds: timing, average, fastest and completion',()=>{
 const g=new Game(rounds);assert.equal(g.average,null);assert.equal(g.score,0);
 for(let i=0;i<rounds;i++){assert.equal(g.wait(),true);assert.equal(g.wait(),false);assert.equal(g.signal(1000),true);assert.equal(g.signal(1100),false);assert.equal(g.tap(1250+i*50),i===rounds-1?'done':'result')}
 assert.equal(g.average,rounds===1?250:300);assert.equal(g.fastest,250);assert.equal(g.score,rounds===1?750:9700);const before=JSON.stringify(g);assert.equal(g.tap(9999),'ignored');assert.equal(g.wait(),false);assert.equal(JSON.stringify(g),before);
});
test('early taps retry the current round, preserve results and incur a score penalty',()=>{
 const g=new Game(3);g.wait();g.signal(100);g.tap(350);g.wait();assert.equal(g.tap(400),'early');assert.equal(g.falseStarts,1);assert.equal(g.times.length,1);
 g.wait();g.signal(500);g.tap(750);g.wait();g.signal(1000);g.tap(1250);assert.equal(g.average,250);assert.equal(g.score,9500);
 const single=new Game(1);single.wait();single.tap(0);single.wait();single.signal(100);single.tap(350);assert.equal(single.score,725);
});
test('interruption cancels a waiting or live signal without recording time',()=>{
 for(const phase of ['waiting','ready']){const g=new Game(3);g.wait();if(phase==='ready')g.signal(100);assert.equal(g.interrupt(),true);assert.equal(g.tap(900),'ignored');assert.equal(g.signal(1000),false);assert.equal(g.times.length,0);assert.equal(g.falseStarts,0);assert.equal(g.wait(),true);g.signal(2000);g.tap(2250);assert.equal(g.average,250)}
});
test('invalid timestamps and unsupported modes cannot produce results',()=>{
 assert.throws(()=>new Game(2));const g=new Game(1);g.wait();assert.equal(g.signal(NaN),false);g.signal(1000);for(const now of [999,Infinity,NaN])assert.equal(g.tap(now),'ignored');assert.equal(g.times.length,0);g.tap(99999);assert.equal(g.score,0);
});
function harness(rounds=3,ready=Promise.resolve()){
 const nodes=new Map(),timers=new Map(),frames=new Map(),events=new Map(),scores=[];let tid=0,now=0,document;
 function make(id=''){return {id,tagName:'DIV',children:[],style:{},classList:{contains(){return false},add(){},remove(){}},textContent:'',setAttribute(){},append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},addEventListener(name,fn){events.set(id+':'+name,fn)},focus(){document.activeElement=this}}}
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))nodes.set(id,make(id));nodes.get('mode').value=String(rounds);nodes.get('pad').tagName='BUTTON';
 document={getElementById:id=>nodes.get(id),querySelector:()=>make(),createElement:()=>make(),body:{style:{}},activeElement:null,hidden:false,addEventListener:(name,fn)=>{const key='document:'+name,old=events.get(key);events.set(key,e=>{old?.(e);fn(e)})}};
 const sandbox={document,location:{search:''},URLSearchParams,performance:{now:()=>now},window:{addEventListener:(name,fn)=>events.set('window:'+name,fn),AshFallArcade:{ready,recordScore:(...args)=>scores.push(args)}},localStorage:{getItem:()=>null,setItem(){}},setTimeout:fn=>{timers.set(++tid,fn);return tid},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{frames.set(++tid,fn);return tid},cancelAnimationFrame:id=>frames.delete(id),console};
 runInNewContext(engine,sandbox);const ui=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('new ReactionRitual'));
 runInNewContext(ui.replace('reset();\n})();','reset();globalThis.testGame=()=>game;\n})();'),sandbox);
 const runFirst=map=>{const [id,fn]=map.entries().next().value||[];assert.ok(fn,'missing callback');map.delete(id);fn()};
 return {nodes,timers,frames,events,scores,document,game:()=>sandbox.testGame(),at(n){now=n},click(){events.get('pad:click')({detail:0})},signal(n){now=n;runFirst(timers);runFirst(frames)}};
}
test('pointer press starts once, its subsequent click does not cause a false start',()=>{
 const h=harness();h.events.get('pad:pointerdown')({button:0,isPrimary:true,preventDefault(){}});h.events.get('pad:click')({detail:1});assert.equal(h.game().phase,'waiting');assert.equal(h.game().falseStarts,0);assert.equal(h.timers.size,1);
});
test('restarting rejects both old delay and old animation-frame callbacks',()=>{
 const h=harness();h.click();const staleDelay=[...h.timers.values()][0];h.nodes.get('restart').onclick();staleDelay();assert.equal(h.frames.size,0);assert.equal(h.game().phase,'waiting');
 const [id,delay]=h.timers.entries().next().value;h.timers.delete(id);delay();const staleFrame=[...h.frames.values()][0];h.nodes.get('restart').onclick();staleFrame();assert.equal(h.game().phase,'waiting');assert.equal(h.game().times.length,0);
});
test('visibility changes invalidate a live signal and resume with a fresh wait',()=>{
 const h=harness();h.click();h.signal(1000);h.document.hidden=true;h.events.get('document:visibilitychange')();assert.equal(h.game().phase,'paused');assert.equal(h.game().times.length,0);h.document.hidden=false;h.click();assert.equal(h.game().phase,'waiting');h.signal(3000);h.at(3250);h.click();assert.equal(h.game().times[0],250);
});
test('mode changes invalidate pending signals and render the chosen number of trials',()=>{
 const h=harness();h.click();const stale=[...h.timers.values()][0];h.nodes.get('mode').value='1';h.nodes.get('mode').onchange();stale();assert.equal(h.game().rounds,1);assert.equal(h.game().phase,'idle');assert.equal(h.nodes.get('trials').children.length,1);assert.equal(h.frames.size,0);
});
test('held keyboard keys and clicks on unrelated controls do not submit reactions',()=>{
 const h=harness();h.click();h.signal(1000);h.at(1250);h.events.get('document:keydown')({key:' ',repeat:true});assert.equal(h.game().times.length,0);h.document.activeElement={tagName:'SELECT'};h.events.get('document:keydown')({key:'Enter',repeat:false});assert.equal(h.game().times.length,0);h.document.activeElement=h.nodes.get('pad');h.events.get('document:keydown')({key:' ',repeat:false,preventDefault(){}});assert.equal(h.game().times[0],250);
});
test('score submission snapshots completed results even if restarted before account readiness',async()=>{
 let release;const ready=new Promise(resolve=>{release=resolve});const h=harness(1,ready);h.click();h.signal(1000);h.at(1250);h.click();assert.equal(h.game().phase,'done');assert.match(h.nodes.get('status').textContent,/250 ms.*750 points/);h.nodes.get('restart').onclick();release();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.scores.length,1);assert.equal(h.scores[0][0],'reaction-ritual');assert.equal(h.scores[0][1],750);assert.equal(h.scores[0][2].averageMs,250);assert.deepEqual(Array.from(h.scores[0][2].reactionTimes),[250]);
});
test('catalog and legacy pages retain one engine with correct mode forwarding',()=>{
 const c=JSON.parse(readFileSync('public/arcade/catalog.json'));assert.ok(c.games.some(g=>g.id==='reaction-ritual'));for(const id of ['arcade-games-game-reaction','arcade-after-dark-reaction-ritual'])assert.ok(!c.games.some(g=>g.id===id));
 for(const [file,rounds,obsolete] of [['arcade-games.html',3,'function reactionReset()'],['arcade-after-dark.html',1,"let rState='idle'"]]){const s=readFileSync('public/'+file,'utf8');assert.ok(!s.includes(obsolete));assert.ok(s.includes('reaction-ritual/index.html?rounds='+rounds))}
});
