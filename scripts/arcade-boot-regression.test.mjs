import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
function boot(file){
 const html=readFileSync('public/'+file,'utf8'),nodes=new Map(),timers=new Map();let tid=0;
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:50})},{get:(o,k)=>k in o?o[k]:()=>{}});
 function node(id=''){return {id,textContent:'',innerHTML:'',value:'survival',hidden:false,style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],querySelectorAll:()=>[],querySelector:()=>node(),width:960,height:540,addEventListener(t,fn){this['on'+t]=fn},appendChild(n){this.children.push(n)},append(n){this.children.push(n)},setAttribute(){},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),focus(){}};}
 for(const m of html.matchAll(/\bid=["']([^"']+)/g))nodes.set(m[1],node(m[1]));
 const get=id=>nodes.get(id)||null;
 const doc={getElementById:get,querySelectorAll:()=>[],querySelector:s=>s==='canvas'?[...nodes.values()].find(n=>['game','run-canvas','screen'].includes(n.id)):null,addEventListener(){},dispatchEvent(){},createElement:()=>node(),hidden:false};
 const store=new Map(),frames=[];
 const sandbox={document:doc,window:{addEventListener(){},devicePixelRatio:1,matchMedia:()=>({matches:false})},Image:class{complete=false;naturalWidth=0},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},location:{pathname:'/'+file,href:'https://ash-fall.com/'+file},performance:{now:()=>0},requestAnimationFrame:fn=>{frames.push(fn);return frames.length},cancelAnimationFrame(){},setTimeout:fn=>{timers.set(++tid,fn);return tid},clearTimeout:id=>timers.delete(id),setInterval:fn=>{timers.set(++tid,fn);return tid},clearInterval:id=>timers.delete(id),CustomEvent:class{},Math:Object.create(Math),console,URLSearchParams,navigator:{},Date};
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[1].includes('src=')||m[1].includes('application/'))continue;runInNewContext(m[2],sandbox,{filename:file,timeout:1000});}
 return {nodes,get,timers,frames,sandbox};
}
for(const file of ['arcade/hosted/ash-circuit/index.html','arcade/hosted/cinder-dice/index.html','arcade-after-dark.html','arcade-fresh-meat.html','not-dead-yet.html'])test(file+' boots with real DOM IDs and no implicit browser globals',()=>{const h=boot(file);assert.ok(h.nodes.size>0);});
test('Cinder Dice rolls, banks, alternates turns, and cancels an old CPU after restart',()=>{
 const h=boot('arcade/hosted/cinder-dice/index.html');h.sandbox.Math.random=()=>.5;
 h.get('action').onclick();assert.match(h.get('readout').textContent,/Pot 4/);
 h.get('extra').onclick();assert.match(h.get('readout').textContent,/Cinder 4.*Void turn/);
 const oldCpu=[...h.timers.values()][0];assert.ok(oldCpu);
 h.get('restart').onclick();oldCpu();assert.match(h.get('readout').textContent,/Cinder 0.*Pot 0.*Cinder turn/);
 h.get('action').onclick();assert.match(h.get('readout').textContent,/Pot 4/);
});
test('Graveyard Shift starts, pauses and resumes while the other cabinets initialize',()=>{
 const h=boot('arcade-fresh-meat.html');assert.equal(typeof h.get('cir-start').onclick,'function');assert.equal(typeof h.get('dump-start').onclick,'function');
 h.get('run-start').onclick();assert.equal(h.get('run-pause').disabled,false);h.get('run-pause').onclick();assert.equal(h.get('run-pause').textContent,'RESUME SHIFT');h.get('run-pause').onclick();assert.equal(h.get('run-pause').textContent,'PAUSE SHIFT');
});
