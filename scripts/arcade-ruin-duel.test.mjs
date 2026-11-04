import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engine=readFileSync('public/arcade/hosted/ember-clash/engine.js','utf8');
const html=readFileSync('public/arcade/hosted/ember-clash/index.html','utf8');
const context={};runInNewContext(engine,context);const Game=context.RuinDuel;
for(const mode of ['classic','infernal','ruin'])test(mode+': every matchup has a consistent reverse and self-draw',()=>{
 const g=new Game(mode);for(const a of g.rules.names)for(const b of g.rules.names){const r=g.outcome(a,b);assert.equal(g.outcome(b,a),r==='tie'?'tie':r==='win'?'loss':'win');if(a===b)assert.equal(r,'tie')}
 assert.equal(g.outcome('invalid',g.rules.names[0]),null);
});
test('Classic is first to five; draws do not award points or end the match',()=>{
 const g=new Game('classic',()=>0);for(let i=0;i<3;i++)g.play('rock');assert.equal(g.ties,3);assert.equal(g.done,false);for(let i=0;i<5;i++)g.play('paper');assert.equal(g.done,true);assert.equal(g.you,5);assert.equal(g.total,8);assert.equal(g.winner,'player');assert.equal(g.score,600);const before=JSON.stringify(g.export());assert.equal(g.play('paper'),null);assert.equal(JSON.stringify(g.export()),before);
});
test('Infernal preserves its three-sigil cycle, first-to-three rule and original scores',()=>{
 const g=new Game('infernal',()=>0);for(let i=0;i<3;i++)g.play('shield');assert.equal(g.you,3);assert.equal(g.score,500);
 const losing=new Game('infernal',()=>0);for(let i=0;i<3;i++)losing.play('blade');assert.equal(losing.winner,'cpu');assert.equal(losing.score,25);
});
test('Ruin preserves all four choices and five rounds including draws',()=>{
 const g=new Game('ruin',()=>0);assert.equal(g.outcome('ruin','rock'),'win');assert.equal(g.outcome('paper','ruin'),'win');assert.equal(g.outcome('scissors','ruin'),'win');assert.equal(g.outcome('ruin','paper'),'loss');for(let i=0;i<3;i++)g.play('paper');assert.equal(g.done,false);g.play('rock');g.play('rock');assert.equal(g.done,true);assert.equal(g.total,5);assert.equal(g.ties,2);assert.equal(g.score,400);
 const draw=new Game('ruin',()=>0);for(let i=0;i<5;i++)draw.play('rock');assert.equal(draw.winner,'tie');assert.equal(draw.score,0);
});
test('CPU randomness is independent of the selected move; invalid picks do nothing',()=>{
 const a=new Game('classic',()=>.6),b=new Game('classic',()=>.6);assert.equal(a.play('rock').cpu,b.play('paper').cpu);const before=JSON.stringify(a.export());assert.equal(a.play('ruin'),null);assert.equal(JSON.stringify(a.export()),before);
});
test('save restoration verifies history, tallies, match limits and completion order',()=>{
 const g=new Game('infernal',()=>0);g.play('shield');g.play('ember');assert.deepEqual(JSON.parse(JSON.stringify(Game.restore(g.export()).export())),JSON.parse(JSON.stringify(g.export())));
 const bad=JSON.parse(JSON.stringify(g.export()));bad.you=2;assert.equal(Game.restore(bad),null);bad.total=3;assert.equal(Game.restore(bad),null);
 const ended=new Game('infernal',()=>0);for(let i=0;i<3;i++)ended.play('shield');const data=ended.export();data.ties++;data.total++;data.history.push({player:'ember',cpu:'ember',outcome:'tie'});assert.equal(Game.restore(data),null);
 const forged=g.export();forged.history[0].player='missing';assert.equal(Game.restore(forged),null);assert.equal(Game.restore({schema:1,mode:'invalid'}),null);
});
test('long draw streaks retain bounded history and resume without losing totals',()=>{
 const g=new Game('classic',()=>0);for(let i=0;i<61;i++)g.play('rock');g.play('paper');assert.equal(g.history.length,50);const loaded=Game.restore(g.export(),()=>0);assert.ok(loaded);assert.equal(loaded.total,62);assert.equal(loaded.you,1);assert.equal(loaded.ties,61);loaded.play('paper');assert.equal(loaded.you,2);
});
function harness(initial={},ready=Promise.resolve()){
 const nodes=new Map(),timers=new Map(),events=new Map(),scores=[],storage=new Map(Object.entries(initial));let tid=0;
 function make(){return {children:[],dataset:new Proxy({},{set(o,k,v){o[k]=String(v);return true}}),style:{setProperty(){}},classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},append(...xs){this.children.push(...xs)},replaceChildren(...xs){this.children=xs},textContent:'',value:''}}
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]))nodes.set(id,make());nodes.get('mode').value='classic';const math=Object.create(Math);math.random=()=>0;
 const sandbox={document:{getElementById:id=>nodes.get(id),querySelector:()=>make(),createElement:make,body:{style:{}},addEventListener:(name,fn)=>events.set(name,fn)},window:{AshFallArcade:{ready,recordScore:(...args)=>scores.push(args)}},Math:math,URLSearchParams,location:{search:''},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout:fn=>{timers.set(++tid,fn);return tid},clearTimeout:id=>timers.delete(id),console};runInNewContext(engine,sandbox);const ui=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('new RuinDuel'));
 runInNewContext(ui.replace('select();\n})();','select();globalThis.testGame=()=>game;\n})();'),sandbox);
 return {nodes,timers,scores,storage,game:()=>sandbox.testGame(),pick(name){const b=nodes.get('choices').children.find(b=>b.dataset.pick===name);assert.ok(b);b.onclick()},flush(){const [id,fn]=timers.entries().next().value||[];assert.ok(fn);timers.delete(id);fn()}};
}
test('reveal animation blocks rapid duplicate moves, restart rejects its old callback',()=>{
 const h=harness();h.pick('paper');const stale=[...h.timers.values()][0];h.pick('paper');assert.equal(h.game().total,1);assert.equal(h.nodes.get('choices').children[0].disabled,true);h.nodes.get('restart').onclick();stale();assert.equal(h.game().total,0);assert.equal(h.game().you,0);assert.equal(h.timers.size,0);
});
test('mode switching resumes separate matches and changes the visible choices',()=>{
 const h=harness();h.pick('paper');h.flush();h.nodes.get('mode').value='ruin';h.nodes.get('mode').onchange();assert.equal(h.nodes.get('choices').children.length,4);h.pick('ruin');h.flush();assert.equal(h.game().you,1);h.nodes.get('mode').value='classic';h.nodes.get('mode').onchange();assert.equal(h.game().you,1);assert.equal(h.game().total,1);assert.equal(h.nodes.get('choices').children.length,3);
});
test('valid legacy Ember Clash saves migrate with their win count',()=>{
 const legacy={you:1,chaos:0,ties:1,wins:2,ended:false,rounds:[{player:'shield',cpu:'ember'},{player:'blade',cpu:'blade'}]};const h=harness({'ashfall:ember-clash:v1':JSON.stringify(legacy)});assert.equal(h.game().mode,'infernal');assert.equal(h.game().you,1);assert.equal(h.game().ties,1);assert.equal(h.nodes.get('wins').textContent,2);h.nodes.get('restart').onclick();assert.equal(h.game().you,0);assert.equal(h.nodes.get('wins').textContent,2);
});
test('completed matches submit once with a stable snapshot and are not resubmitted after reload',async()=>{
 let release;const ready=new Promise(resolve=>{release=resolve});const h=harness({},ready);for(let i=0;i<4;i++){h.pick('paper');h.flush()}h.pick('paper');assert.equal(h.game().done,true);const saved=Object.fromEntries(h.storage);h.nodes.get('restart').onclick();release();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.scores.length,1);assert.equal(h.scores[0][0],'ember-clash');assert.equal(h.scores[0][1],600);assert.equal(h.scores[0][2].playerWins,5);const restored=harness(saved);assert.equal(restored.game().done,true);assert.equal(restored.nodes.get('wins').textContent,1);assert.ok(restored.nodes.get('choices').children.every(b=>b.disabled));await new Promise(resolve=>setImmediate(resolve));assert.equal(restored.scores.length,0);
});
test('Ember Clash is the sole RPS cabinet and owns the classic and Ruin modes',()=>{
 const c=JSON.parse(readFileSync('public/arcade/catalog.json'));assert.equal(c.games.find(g=>g.id==='ember-clash').title,'Rock, Paper, Ruin');for(const id of ['rock-paper-scissors','arcade-games-game-rps'])assert.ok(!c.games.some(g=>g.id===id));assert.equal(existsSync('public/arcade/hosted/rock-paper-scissors/index.html'),false,'duplicate route remains');assert.ok(c.games.find(g=>g.id==='ember-clash').route==='/arcade/hosted/ember-clash/index.html');const old=readFileSync('public/arcade-games.html','utf8');assert.ok(old.includes('ember-clash/index.html?mode=ruin'));assert.ok(!old.includes('function resetRps()'));
});

test('all fighter artwork resolves before and after reveals in each mode',()=>{
 const h=harness();for(const mode of ['classic','infernal','ruin']){h.nodes.get('mode').value=mode;h.nodes.get('mode').onchange();for(const id of ['player-art','cpu-art'])assert.ok(existsSync('public/arcade/hosted/ember-clash/'+h.nodes.get(id).src.replace('./','')),mode+' '+id);h.pick(h.game().rules.names[0]);h.flush();for(const id of ['player-art','cpu-art'])assert.ok(existsSync('public/arcade/hosted/ember-clash/'+h.nodes.get(id).src.replace('./','')),mode+' '+id)}
});
