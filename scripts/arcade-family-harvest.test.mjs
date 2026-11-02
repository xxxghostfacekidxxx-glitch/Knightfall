import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const base='public/arcade/hosted/';
function loadClass(slug,name){const ctx={};runInNewContext(readFileSync(base+slug+'/engine.js','utf8'),ctx);return ctx[name]}
const Slide=loadClass('ash-tiles','AshSlide'),Lights=loadClass('lights-out-afterburn','AfterburnLights'),Circuit=loadClass('cursed-circuit','CircuitSequence');
test('Ash Tiles scrambles stay solvable, avoid solved starts and support legal undo',()=>{
 for(let i=0;i<60;i++){let seed=i+1;const g=new Slide(()=>{seed=seed*16807%2147483647;return seed/2147483647});g.shuffle();assert.ok(Slide.valid(g.cells));assert.equal(g.solved,false);const before=JSON.stringify(g.cells),blank=g.cells.indexOf(0);assert.equal(g.pick(blank),false);assert.equal(g.pick(g.neighbors(blank)[0]),true);assert.equal(g.moves,1);g.undo();assert.equal(JSON.stringify(g.cells),before);assert.equal(g.moves,0)}
 const invalid=Array.from({length:16},(_,i)=>(i+1)%16);[invalid[0],invalid[1]]=[invalid[1],invalid[0]];assert.equal(Slide.valid(invalid),false);assert.equal(new Slide().restore({cells:invalid,moves:0}),false);
});
test('Afterburn generation always has a valid solution, hints finish, undo restores and corrupt saves fail',()=>{
 for(let i=0;i<30;i++){let seed=i+3;const g=new Lights(()=>{seed=seed*16807%2147483647;return seed/2147483647});g.reset();assert.equal(g.solved,false);const data={cells:[...g.cells],solution:[...g.solution],moves:g.moves,hints:g.hints};const restored=new Lights();assert.equal(restored.restore(data),true);g.hint();assert.equal(g.hints,1);g.undo();assert.deepEqual(Array.from(g.cells),Array.from(data.cells));for(let n=0;n<25&&!g.solved;n++)g.hint();assert.equal(g.solved,true)}
 const bad=new Lights();bad.reset();const data={cells:[...bad.cells],solution:Array(25).fill(0),moves:0,hints:0};assert.equal(new Lights().restore(data),false);
});
test('Cursed Circuit retains fourth-round reversals and Classic retains forward input',()=>{
 for(const mode of ['cursed','classic']){let r=0;const g=new Circuit(mode,()=>((r++%4)+.1)/4);for(let round=1;round<=4;round++){g.next();assert.equal(g.pick(0),'ignored');assert.deepEqual(Array.from(g.expected),Array.from(mode==='cursed'&&round===4?[...g.sequence].reverse():g.sequence));g.ready();const expected=[...g.expected];for(const n of expected)g.pick(n);assert.equal(g.cleared,round);assert.equal(g.phase,'cleared')}g.next();g.ready();assert.equal(g.pick((g.expected[0]+1)%4),'wrong');assert.equal(g.cleared,4);assert.equal(g.phase,'ended')}
});
const hooks={
 'cursed-circuit':'{get:()=>game,start,press,paused:()=>paused}',
 'ash-tiles':'{get:()=>game,preview:()=>preview}',
 'lights-out-afterburn':'{get:()=>game}',
 'cinder-merge':'{get:()=>({cells:[...cells],score,chain,ended,won}),move,reset,restore,snapshot}',
 'crypt-words':'{grade,input,get:()=>({target,guesses:[...guesses],current,finished,wins,streak,open})}',
 'afterburn-breakout':'{start,checkpoint,validCheckpoint,importCheckpoint,get:()=>({score,wave,lives,paused,running})}',
 'cinder-crossing':'{start,move,get:()=>({challenge,targetCrossings,lives,active,paused,player:{...player},score,crossings}),setPlayer:p=>player=p,clearCars:()=>cars=[],cooldown:()=>moveCooldown=0}'
};
function harness(slug,initial={}){
 const html=readFileSync(slug==='originals-root'?'public/arcade-originals.html':base+slug+'/index.html','utf8'),nodes=new Map(),timeouts=new Map(),intervals=new Map(),frames=new Map(),events=new Map(),scores=[],store=new Map(Object.entries(initial));let tid=0,now=0,document;
 const gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:60})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function element(id=''){const classes=new Set();return {id,tagName:'DIV',children:[],dataset:{},style:{setProperty(){}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,v){if(v??!classes.has(x))classes.add(x);else classes.delete(x)}},get className(){return [...classes].join(' ')},set className(v){classes.clear();String(v).split(/\s+/).forEach(x=>classes.add(x))},get innerHTML(){return this.html||''},set innerHTML(v){this.html=v;this.children=[]},textContent:'',value:'',width:800,height:600,append(...xs){this.children.push(...xs)},appendChild(x){this.children.push(x)},replaceChildren(...xs){this.children=xs},setAttribute(){},addEventListener(name,fn){addEvent(id+':'+name,fn)},click(){this.onclick?.({target:this,preventDefault(){}});events.get(id+':click')?.({target:this,preventDefault(){}})},matches:()=>false,closest:()=>null,focus(){document.activeElement=this},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:720,height:540})}}
 function addEvent(key,fn){const old=events.get(key);events.set(key,e=>{old?.(e);fn(e)})}
 for(const m of html.matchAll(/\bid="([^"]+)"/g))nodes.set(m[1],element(m[1]));const main=element('main');nodes.get('mode')&&(nodes.get('mode').value='cursed');nodes.get('speed')&&(nodes.get('speed').value='400');nodes.get('challenge')&&(nodes.get('challenge').value='city');nodes.get('vocabulary')&&(nodes.get('vocabulary').value='strict');
 document={getElementById:id=>nodes.get(id)||null,querySelector:s=>s==='main'?main:s==='canvas'?nodes.get('game'):element(s),querySelectorAll:()=>[],createElement:()=>element(),activeElement:{tagName:'BODY'},hidden:false,body:{style:{}},addEventListener:(name,fn)=>addEvent('document:'+name,fn)};
 const math=Object.create(Math);math.random=()=>.27;
 const api={ready:Promise.resolve(),user:null,recordScore:(...args)=>{scores.push(args);return Promise.resolve({saved:false})},saveProgress:async()=>({revision:2}),loadProgress:async()=>null};
 const sandbox={document,window:{AshFallArcade:api,addEventListener:(name,fn)=>addEvent('window:'+name,fn)},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},Math:math,Date,Number,Set,Map,URLSearchParams,location:{pathname:'/arcade/hosted/'+slug+'/index.html',search:'',href:'https://ash-fall.com/'},performance:{now:()=>now},setTimeout:fn=>{timeouts.set(++tid,fn);return tid},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{intervals.set(++tid,fn);return tid},clearInterval:id=>intervals.delete(id),requestAnimationFrame:fn=>{frames.set(++tid,fn);return tid},cancelAnimationFrame:id=>frames.delete(id),console};
 if(html.includes('/arcade/family-cabinet.js'))runInNewContext(readFileSync('public/arcade/family-cabinet.js','utf8'),sandbox);
 if(existsSync(base+slug+'/engine.js'))runInNewContext(readFileSync(base+slug+'/engine.js','utf8'),sandbox);
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[1].includes('src=')||!m[2].trim())continue;const code=m[2].replace(/\}\)\(\);?\s*$/, ';globalThis.__harvest='+(hooks[slug]||'{}')+';})();');runInNewContext(code,sandbox,{filename:slug,timeout:5000})}
 return {nodes,timeouts,frames,events,scores,store,api,hooks:sandbox.__harvest,window:sandbox.window,document,step(){const [id,fn]=timeouts.entries().next().value||[];assert.ok(fn,'missing timer');timeouts.delete(id);fn()},frame(ms=40){now+=ms;const [id,fn]=frames.entries().next().value||[];assert.ok(fn,'missing frame');frames.delete(id);fn(now)}};
}
for(const slug of Object.keys(hooks))test(slug+' boots with its real DOM IDs',()=>{const h=harness(slug);assert.ok(h.hooks)});
test('Cursed Circuit rejects stale playback and paused input',()=>{
 const h=harness('cursed-circuit');h.nodes.get('start').onclick();const stale=[...h.timeouts.values()][0];h.nodes.get('start').onclick();stale();assert.equal(h.hooks.get().sequence.length,1);for(let i=0;i<20&&h.hooks.get().phase!=='input';i++)h.step();assert.equal(h.hooks.get().phase,'input');h.nodes.get('pause').onclick();h.hooks.press(h.hooks.get().expected[0]);assert.equal(h.hooks.get().cursor,0);h.nodes.get('pause').onclick();for(let i=0;i<20&&h.hooks.get().phase!=='input';i++)h.step();const expected=[...h.hooks.get().expected];expected.forEach(h.hooks.press);assert.equal(h.hooks.get().cleared,1);
});
test('Ash Tiles goal preview does not mutate or award a solved puzzle',async()=>{
 const cells=Array.from({length:16},(_,i)=>(i+1)%16);[cells[14],cells[15]]=[cells[15],cells[14]];const h=harness('ash-tiles',{'ashfall:ash-tiles:progress:v1':JSON.stringify({cells,moves:0})});h.nodes.get('goal').onclick();assert.equal(h.hooks.preview(),true);assert.deepEqual(Array.from(h.hooks.get().cells),cells);assert.equal(h.scores.length,0);h.nodes.get('goal').onclick();h.nodes.get('board').children.find(b=>Number(b.dataset.value)===15).onclick();await new Promise(r=>setImmediate(r));assert.equal(h.hooks.get().solved,true);assert.equal(h.scores.length,1);assert.equal(h.scores[0][0],'ash-tiles');h.nodes.get('undo').onclick();assert.equal(h.hooks.get().solved,false);
});
test('Cinder Merge carries Cascade bonuses through undo, rejects odd tiles and ignores no-op moves',()=>{
 const h=harness('cinder-merge'),cells=Array(16).fill(0);cells[0]=8;cells[1]=8;assert.equal(h.hooks.restore({cells,score:12,chain:2,ended:false,won:false}),true);h.hooks.move('left');assert.equal(h.hooks.get().chain,3);assert.equal(h.hooks.get().score,103);h.nodes.get('undo').click();assert.equal(h.hooks.get().chain,2);assert.equal(h.hooks.get().score,12);const single=Array(16).fill(0);single[0]=2;h.hooks.restore({cells:single,score:0,chain:2});h.hooks.move('left');assert.equal(h.hooks.get().chain,2);h.hooks.move('right');assert.equal(h.hooks.get().chain,0);assert.equal(h.hooks.restore({cells:Array(16).fill(3),score:0}),false);
});
test('Cinder Merge cloud loading cannot overwrite a newer run',async()=>{
 const h=harness('cinder-merge');let release;h.api.user={id:1};h.api.loadProgress=()=>new Promise(r=>{release=r});const pending=h.nodes.get('load').onclick();h.hooks.reset();const cells=Array(16).fill(0);cells[0]=1024;release({cells,score:999,chain:0});await pending;assert.notEqual(h.hooks.get().score,999);assert.match(h.nodes.get('message').textContent,/changed while loading/);
});
test('Crypt Words preserves duplicate-letter grading and imports the old Wordlee format',()=>{
 const h=harness('crypt-words');assert.equal(h.window.importSaveState({serialized:{answer:'EERIE',guesses:[],guess:'',row:0}}),true);assert.deepEqual(Array.from(h.hooks.grade('eeeee')),['exact','exact','absent','absent','exact']);for(const k of 'EEEEE')h.hooks.input(k);h.hooks.input('ENTER');assert.equal(h.hooks.get().guesses[0],'eeeee');assert.equal(h.hooks.get().finished,false);assert.equal(h.window.importSaveState({answer:42,guesses:[]}),false);assert.equal(h.window.importSaveState({target:'robot',guesses:[],current:'',open:false}),true);
});
test('Shatterpocalypse resumes validated checkpoints and cancels old frame loops',()=>{
 const h=harness('afterburn-breakout');h.hooks.start();const stale=[...h.frames.values()][0];h.hooks.start();const queued=h.frames.size;stale(999);assert.equal(h.frames.size,queued);const d=h.hooks.checkpoint();d.score=1234;d.wave=2;assert.equal(h.hooks.importCheckpoint(d),true);assert.equal(h.hooks.get().score,1234);assert.equal(h.hooks.get().paused,true);const bad={...d,pad:{...d.pad,w:999}};assert.equal(h.hooks.importCheckpoint(bad),false);assert.equal(h.hooks.get().score,1234);h.nodes.get('pause').onclick();assert.equal(h.hooks.get().paused,false);
});
test('Cinder Crossing retains gate-only scoring and gains the six-crossing one-life challenge',()=>{
 const h=harness('cinder-crossing');h.nodes.get('challenge').value='escape';h.hooks.start();h.hooks.clearCars();assert.equal(h.hooks.get().lives,1);assert.equal(h.hooks.get().targetCrossings,6);h.hooks.setPlayer({col:5,row:2});h.hooks.move('up');assert.equal(h.hooks.get().score,0);for(let i=0;i<6;i++){h.hooks.setPlayer({col:5,row:1});h.hooks.cooldown();h.hooks.move('up')}assert.equal(h.hooks.get().crossings,6);assert.equal(h.hooks.get().score,600);assert.equal(h.hooks.get().active,false);assert.match(h.nodes.get('overlay-copy').textContent,/6\/6/);
});
test('Cinder Crossing edge taps and center taps share movement controls',()=>{
 const h=harness('cinder-crossing');h.hooks.start();h.hooks.clearCars();h.events.get('game:pointerdown')({clientX:10,clientY:100});h.events.get('game:pointerup')({clientX:10,clientY:100});assert.equal(h.hooks.get().player.col,4);h.events.get('game:pointerdown')({clientX:360,clientY:100});h.events.get('game:pointerup')({clientX:360,clientY:100});assert.equal(h.hooks.get().player.row,7);
});
test('retired implementations are deleted and all seven chosen survivors are cataloged',()=>{
 const catalog=JSON.parse(readFileSync('public/arcade/catalog.json'));for(const id of ['afterburn-breakout','cursed-circuit','cinder-merge','ash-tiles','lights-out-afterburn','crypt-words','cinder-crossing'])assert.ok(catalog.games.some(g=>g.id===id),id);const redirects=readFileSync('public/_redirects','utf8');for(const slug of ['ball-and-wall','ember-echo','void-sequence','fifteen-puzzle','void-lanterns','wordlee','crossy-road']){assert.equal(existsSync(base+slug+'/index.html'),false);assert.ok(redirects.includes('/'+slug+'/index.html '),slug)}for(const slug of ['cursed-circuit','ash-tiles','lights-out-afterburn'])assert.doesNotThrow(()=>new Script(readFileSync(base+slug+'/engine.js','utf8')));
});

test('the surviving Ashes of the Void cabinet still boots after embedded 2048 removal',()=>{const h=harness('originals-root');assert.ok(h.events.has('void-start:click'));assert.ok(h.nodes.get('void-canvas'));});
