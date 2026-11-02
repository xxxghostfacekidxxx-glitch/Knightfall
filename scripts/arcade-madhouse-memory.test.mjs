import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('public/arcade/hosted/crypt-pairs/engine.js','utf8');
const page=readFileSync('public/arcade/hosted/crypt-pairs/index.html','utf8');
const context={};runInNewContext(engine,context);const Game=context.ChaosMemory;
const pairFor=g=>{const a=g.cards.findIndex(c=>!c.found);return [a,g.cards.findIndex((c,i)=>i!==a&&!c.found&&c.value===g.cards[a].value)]};
for(const size of [6,8,12])test(size+' pairs: exact deck and a complete playable round',()=>{
 const g=new Game(size,()=>.37);assert.equal(g.cards.length,size*2);
 for(let v=0;v<size;v++)assert.equal(g.cards.filter(c=>c.value===v).length,2);
 for(let n=0;n<size;n++){const [a,b]=pairFor(g);assert.equal(g.pick(a),'first');assert.equal(g.pick(a),'ignored');assert.equal(g.pick(b),n===size-1?'won':'match');}
 assert.equal(g.moves,size);assert.equal(g.matched,size);assert.equal(g.done,true);assert.equal(g.pick(0),'ignored');assert.equal(g.peek(),false);assert.equal(g.score(0),size*200);
});
test('a mismatch locks other cards until both turn back over',()=>{
 const g=new Game(8,()=>.38),a=0,b=g.cards.findIndex(c=>c.value!==g.cards[a].value);
 g.pick(a);assert.equal(g.pick(b),'miss');assert.equal(g.moves,1);assert.equal(g.locked,true);
 assert.equal(g.pick(g.cards.findIndex((c,i)=>i!==a&&i!==b)),'ignored');assert.equal(g.peek(),false);
 assert.equal(g.resolveMismatch(),true);assert.equal(g.cards[a].up,false);assert.equal(g.cards[b].up,false);assert.equal(g.opened.length,0);assert.equal(g.locked,false);
});
test('peek is single use, blocks picks and costs points without granting matches',()=>{
 const g=new Game(6);assert.equal(g.peek(),true);assert.equal(g.pick(0),'ignored');assert.equal(g.matched,0);assert.equal(g.moves,0);g.endPeek();assert.equal(g.peek(),false);assert.equal(g.pick(0),'first');
 const partial=new Game(8);partial.pick(0);assert.equal(partial.peek(),false);assert.equal(partial.peekUsed,false);
 const clean=new Game(6),peeked=new Game(6);peeked.peek();assert.equal(clean.score(10)-peeked.score(10),250);
});
test('moves, time and peek penalize scores with a nonnegative floor',()=>{
 const g=new Game(8);const base=g.score(0);g.moves+=2;assert.equal(base-g.score(0),90);assert.equal(g.score(0)-g.score(20),40);g.moves=10000;assert.equal(g.score(100000),100);
});
function harness(){
 const timers=new Map(),nodes=new Map(),scores=[];let tid=0;
 const make=()=>({children:[],textContent:'',value:'',style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},querySelector(){return this.front??=make()},focus(){},get innerHTML(){return this.html||''},set innerHTML(s){this.html=s}});
 for(const id of [...page.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))nodes.set(id,make());
 nodes.get('difficulty').value='8';nodes.get('art').value='mascots';
 const storage=new Map(),sandbox={document:{getElementById:id=>nodes.get(id),createElement:make,querySelector:()=>make(),body:{style:{}},addEventListener(){},hidden:false},window:{AshFallArcade:{ready:Promise.resolve(),recordScore:(...a)=>scores.push(a)}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>{timers.set(++tid,fn);return tid},clearTimeout:id=>timers.delete(id),setInterval(){},console};
 runInNewContext(engine,sandbox);
 const ui=[...page.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('new ChaosMemory'));
 runInNewContext(ui.replace('reset();\n})();','reset();globalThis.testGame=()=>game;\n})();'),sandbox);
 return {nodes,timers,scores,game:()=>sandbox.testGame()};
}
test('restarting during mismatch or peek rejects stale callbacks',()=>{
 const h=harness(),g=h.game();h.nodes.get('board').children[0].onclick();const b=g.cards.findIndex(c=>c.value!==g.cards[0].value);h.nodes.get('board').children[b].onclick();const stale=[...h.timers.values()][0];assert.ok(stale);
 h.nodes.get('restart').onclick();stale();assert.equal(h.game().moves,0);assert.equal(h.game().cards.filter(c=>c.up).length,0);
 h.nodes.get('peek').onclick();const oldPeek=[...h.timers.values()][0];h.nodes.get('restart').onclick();h.nodes.get('board').children[0].onclick();oldPeek();assert.equal(h.game().opened.length,1);assert.equal(h.nodes.get('status').textContent,'One face up. Find its twin.');
});
test('a full UI round submits exactly one score and shows the final points',async()=>{
 const h=harness();while(!h.game().done){for(const i of pairFor(h.game()))h.nodes.get('board').children[i].onclick()}
 await new Promise(resolve=>setImmediate(resolve));assert.equal(h.scores.length,1);assert.equal(h.scores[0][0],'crypt-pairs');assert.match(h.nodes.get('status').textContent,/MIND RESTORED.*points/);
 h.nodes.get('board').children[0].onclick();await Promise.resolve();assert.equal(h.scores.length,1);
});
test('mascot artwork exists and legacy pages do not retain matching engines',()=>{
 for(const f of ['moxie','rattlepop','gravebyte','emberbun','crypt-koi','volt-imp','gutterkit','mini-eddie','zuzu','kiki','glim','bloop'])assert.ok(existsSync('public/arcade/hosted/crypt-pairs/sprites/'+f+'.svg'),f);
 for(const [file,old] of [['arcade-games.html','function resetMemory()'],['arcade-after-dark.html','function memoryNew()']]){const s=readFileSync('public/'+file,'utf8');assert.ok(!s.includes(old));assert.ok(s.includes('/arcade/hosted/crypt-pairs/index.html'));}
});
