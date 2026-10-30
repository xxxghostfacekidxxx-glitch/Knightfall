import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const engines={
 'ashfall-original-vector.js':['prism-panic','neon-vector'],
 'ashfall-original-matching.js':['bubble-pop','candy-crush'],
 'ashfall-original-trio.js':['balance-stack','stack-tower','whack-a-bug'],
 'ashfall-original-action.js':['doodle-jump','alien-battle','survivor'],
 'ashfall-original-runner.js':['rusty-sky','slush-rush'],
 'ashfall-original-driving.js':['car-race','two-cars','crossy-road']
};
for(const [file,ids] of Object.entries(engines))for(const id of ids)test(id+' restores native state and invalidates old first-frame callbacks',()=>{
 const nodes=new Map(),frames=[];const ctx=new Proxy({},{get:()=>()=>{}});
 const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:'',addEventListener(t,fn){this['on'+t]=fn},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:640,height:500})});return nodes.get(k)};
 const sandbox={document:{getElementById:node,querySelector:()=>node('canvas'),addEventListener(){},dispatchEvent(){}},location:{pathname:'/arcade/hosted/'+id+'/index.html'},localStorage:{getItem:()=>null,setItem(){}},CustomEvent:class{},performance:{now:()=>0},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},Math,Number,Set,console};
 runInNewContext(readFileSync('public/arcade/hosted/'+file,'utf8'),sandbox,{timeout:1000});
 assert.equal(sandbox.exportSaveState(),null,'ready screen must not overwrite an existing save');
 node('restart').onclick();const oldFirst=frames.shift();node('restart').onclick();
 if(oldFirst){const queued=frames.length;oldFirst(16);assert.equal(frames.length,queued,'first callback from old run must not schedule another loop');}
 const save=sandbox.exportSaveState();assert.ok(save);assert.equal(save.game,id);save.score=123;save.best=150;
 assert.equal(sandbox.importSaveState(save),true);assert.equal(node('score').textContent,123);assert.equal(sandbox.exportSaveState().score,123);
 assert.equal(sandbox.importSaveState({...save,game:'another-game'}),false);
 assert.equal(sandbox.importSaveState({...save,schema:2}),false);
 assert.equal(sandbox.importSaveState({...save,score:-1}),false);
 assert.equal(sandbox.importSaveState({...save,score:NaN}),false);
 assert.equal(sandbox.importSaveState({score:20,player:{x:10,y:20}}),false,'legacy foreign shape must not corrupt a new engine');
 if(id==='balance-stack'){const longRun=JSON.parse(JSON.stringify(save));longRun.state.blocks=Array.from({length:101},()=>({x:320}));assert.equal(sandbox.importSaveState(longRun),true,'legitimate long stack must remain resumable');longRun.state.blocks=Array.from({length:2001},()=>({x:320}));assert.equal(sandbox.importSaveState(longRun),false,'oversized stack must be rejected');}
 const mutated=JSON.parse(JSON.stringify(save));if(mutated.board)mutated.board[0]=[];else if(mutated.world)mutated.world.life=0;else if(mutated.ship)mutated.ship.hp=0;else if(mutated.state)mutated.state={};else mutated.player=-1;
 assert.equal(sandbox.importSaveState(mutated),false,'malformed state must be rejected before rendering');
 save.score=999;assert.equal(sandbox.exportSaveState().score,123,'import must own a copy of the snapshot');
});
