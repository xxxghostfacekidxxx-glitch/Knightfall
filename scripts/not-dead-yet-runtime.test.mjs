import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const html=readFileSync('public/not-dead-yet.html','utf8');
const source=[...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)]
 .map(m=>m[1]).find(s=>s.includes('function startGame'));
function boot(){
 const listeners=new Map(),nodes=new Map(),saved=new Map(),frames=new Map(),noop=()=>{};let next=1;
 const gradient={addColorStop:noop};
 const context=new Proxy({
  createLinearGradient:()=>gradient,createRadialGradient:()=>gradient
 },{get(target,key){return key in target?target[key]:noop},set(target,key,value){target[key]=value;return true}});
 const get=id=>{
  if(!nodes.has(id)){
   const node={id,style:{},textContent:'',innerHTML:'',
    value:{mode:'survival',difficulty:'nightmare',survivor:'malpractice',weapon:'pistol'}[id]||'',
    hidden:false,disabled:false,complete:false,naturalWidth:0,
    classList:{contains:()=>false,add:noop,remove:noop,toggle:noop},
    addEventListener:(name,fn)=>listeners.set(id+':'+name,fn),
    setAttribute:noop,removeAttribute:noop,focus:noop,
    getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),
    querySelector:selector=>get(id+':'+selector),querySelectorAll:()=>[],
    append:noop,appendChild:noop,replaceChildren:noop,
   };
   if(id==='game')node.getContext=()=>context;
   nodes.set(id,node);
  }
  return nodes.get(id);
 };
 const document={
  getElementById:get,querySelectorAll:()=>[],querySelector:()=>get('query'),
  createElement:tag=>get('created:'+tag+':'+next++),
  addEventListener:(name,fn)=>listeners.set('document:'+name,fn),
  fullscreenElement:null,body:{classList:get('body').classList},hidden:false
 };
 const window={devicePixelRatio:1,matchMedia:()=>({matches:false}),
  addEventListener:(name,fn)=>listeners.set('window:'+name,fn),innerWidth:1360,innerHeight:920};
 const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,v)=>saved.set(key,String(v)),removeItem:key=>saved.delete(key)};
 const requestAnimationFrame=fn=>{const id=next++;frames.set(id,fn);return id};
 const cancelAnimationFrame=id=>frames.delete(id);
 const fetch=async()=>({ok:false,status:401,json:async()=>({error:'signed out'})});
 const Image=class{constructor(){this.complete=false;this.naturalWidth=0;}set src(value){this._src=value}};
 const sandbox={document,window,localStorage,Image,performance:{now:()=>1000},requestAnimationFrame,cancelAnimationFrame,
  fetch,navigator:{},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},console};
 runInNewContext(source,sandbox,{timeout:2500});
 return {get,listeners,frames,saved};
}
test('Not Dead Yet script boots, initializes the UI and mounts melee without errors',()=>{
 assert.ok(source&&source.length>40000);
 assert.doesNotThrow(()=>new Script(source));
 const {get,listeners,frames}=boot();
 assert.ok(frames.size>=1,'Controller poll loop initialized');
 assert.ok(listeners.has('touch-melee:pointerdown'));
 assert.ok(get('start').onclick);
});
test('Nightmare threat level affects HP, starts combat and cooldowns melee on demand',()=>{
 const {get,listeners,frames}=boot();
 get('start').onclick();
 assert.equal(get('difficulty').disabled,true);
 assert.equal(Number(get('health').textContent),83,'Nightmare must lower base HP');
 assert.match(get('combat-objective').textContent,/NIGHTMARE/);
 assert.ok(frames.size>=2,'Combat loop scheduled');
 listeners.get('touch-melee:pointerdown')({preventDefault(){}});
 assert.equal(get('melee-bar').style.width,'0%','Melee should have an actual cooldown');
 assert.match(get('status').textContent,/MELEE/);
 get('restart').onclick();
 assert.equal(get('melee-bar').style.width,'100%','Restart resets melee');
 assert.equal(get('difficulty').disabled,true,'Threat cannot change mid-run');
});
test('Existing progression IDs and campaign checkpoint buttons stay available',()=>{
 const {get,listeners}=boot();
 assert.ok(listeners.has('resume-checkpoint:click'));
 for(const id of ['cloud-save','cloud-load','buy-barrel','buy-guttermaw','buy-dredge','buy-health']){
  assert.ok(listeners.has(id+':click'),id+' handler missing');
 }
 get('mode').value='campaign';get('start').onclick();
 assert.match(get('combat-objective').textContent,/DISTRICT 1/);
 assert.equal(get('mode').disabled,true);
});
