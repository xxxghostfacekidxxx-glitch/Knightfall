import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const controller=readFileSync("public/arcade/hosted/cinderwild/cloud-sync.js","utf8");
const game=readFileSync("public/arcade/hosted/cinderwild/game.js","utf8");
const page=readFileSync("public/arcade/hosted/cinderwild/index.html","utf8");
const backend=readFileSync("backend/src/index.js","utf8");
const migration=readFileSync("backend/migrations/0019_arcade_progress.sql","utf8");
const copy=value=>JSON.parse(JSON.stringify(value));
const sample=(steps=5)=>({x:8,y:18,steps,party:[{id:"mossbit",level:5,hp:40}],box:[],items:{orbs:8,superOrbs:2,potions:5,revives:1},seen:["mossbit"],caught:["mossbit"],badges:[],defeated:[],coins:150,wins:0,story:[]});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture({local=sample(),remote=null,account={id:7,username:"tester"},saveError=null,identity=null}={}){
 let localSave=copy(local),cloudSave=remote?copy(remote):null;
 const events=new Map(),storage=new Map(),timers=new Map();
 const buttons=Object.fromEntries(["cloud-status","cloud-upload","cloud-restore","cloud-backup","cloud-pause","cloud-signin"]
   .map(id=>[id,{id,hidden:false,disabled:false,textContent:"",addEventListener(type,callback){this[type]=callback;}}]));
 const document={getElementById:id=>buttons[id]||null,addEventListener:(name,callback)=>events.set(name,callback)};
 const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 const calls=[];
 const api={
  user:account,ready:Promise.resolve(),
  request:async()=>({user:identity===null?account:identity}),
  loadProgress:async(gameKey,slot)=>{assert.equal(gameKey,"cinderwild");assert.equal(slot,"autosave");return cloudSave?copy(cloudSave):null;},
  saveProgress:async(gameKey,data,slot,version)=>{
   calls.push({gameKey,data:copy(data),slot,version});
   if(saveError)throw saveError;
   cloudSave=copy(data);
   return {revision:calls.length};
  }
 };
 const model={
  snapshot:()=>copy(localSave),
  isBusy:()=>false,
  restore:data=>{localSave=copy(data);events.get("cinderwild:local-save")?.();return true;}
 };
 let nextId=1;
 vm.runInNewContext(controller,{
  window:{AshFallArcade:api,CinderwildGame:model},document,localStorage,
  location:{pathname:"/arcade/hosted/cinderwild/index.html",search:""},
  confirm:()=>true,
  setTimeout:cb=>{const id=nextId++;timers.set(id,cb);return id;},
  clearTimeout:id=>timers.delete(id)
 },{timeout:2000});
 return {buttons,calls,storage,api,model,async settle(){await tick();await tick();},click(id){assert.equal(typeof buttons[id].click,"function",id);buttons[id].click();},localSave:()=>copy(localSave),
  updateLocal(data){localSave=copy(data);events.get("cinderwild:local-save")?.();},
  async flushTimers(){const callbacks=[...timers.values()];timers.clear();for(const cb of callbacks)cb();await tick();await tick();}
 };
}

test("account sync reuses current arcade endpoint, explicit allowlist and existing revisioned schema",()=>{
 assert.match(backend,/const arcadeGames = new Set\(\[[^\]]*"cinderwild"/);
 assert.match(backend,/SELECT revision FROM arcade_saves WHERE user_id=\? AND game_key=\? AND save_key=\?/);
 assert.doesNotMatch(backend,/SELECT id,revision FROM arcade_saves/);
 assert.match(migration,/PRIMARY KEY \(user_id, game_key, save_key\)/);
 assert.match(page,/src="\/arcade-save\.js" defer/);
 assert.match(page,/src="\.\/cloud-sync\.js\?v=20261115-cloud1" defer/);
 assert.match(game,/window\.CinderwildGame = Object\.freeze/);
 assert.match(game,/document\.dispatchEvent\(new CustomEvent\("cinderwild:local-save"\)\)/);
});
test("signed-out visitors keep offline gameplay and get a login link",async()=>{
 const f=fixture({account:null});await f.settle();
 assert.match(f.buttons["cloud-status"].textContent,/Playing offline/);
 assert.equal(f.buttons["cloud-signin"].hidden,false);
 assert.equal(f.calls.length,0);
});
test("different device and cloud saves never overwrite until explicit selection",async()=>{
 const f=fixture({local:sample(18),remote:sample(88)});await f.settle();
 assert.equal(f.calls.length,0);
 assert.equal(f.localSave().steps,18);
 assert.equal(f.buttons["cloud-restore"].hidden,false);
 assert.match(f.buttons["cloud-status"].textContent,/Neither version has been overwritten/);
 f.click("cloud-restore");await f.settle();
 assert.equal(f.localSave().steps,88);
 assert.equal(JSON.parse(f.storage.get("knightfall:cinderwild:pre-cloud:7")).steps,18);
 assert.equal(f.calls.length,0,"restoring cloud data must not write a new cloud save");
});
test("first upload enables debounced account autosave and uses the existing game slot",async()=>{
 const f=fixture({local:sample(16)});await f.settle();
 f.click("cloud-upload");await f.settle();
 assert.equal(f.calls.length,1);
 assert.deepEqual(f.calls[0].data,sample(16));
 assert.equal(f.calls[0].gameKey,"cinderwild");
 assert.equal(f.calls[0].slot,"autosave");
 f.updateLocal(sample(25));await f.flushTimers();
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[1].data.steps,25);
});
test("cloud revision conflicts disable autosave without deleting local progress",async()=>{
 const err=Object.assign(new Error("stale revision"),{status:409});
 const f=fixture({local:sample(30),remote:sample(80),saveError:err});await f.settle();
 f.click("cloud-upload");await f.settle();
 assert.equal(f.localSave().steps,30);
 assert.equal(f.buttons["cloud-pause"].hidden,true);
 assert.match(f.buttons["cloud-status"].textContent,/newer account save|Cloud progress changed/);
});
test("identity change blocks writes even if the browser still has an old account object",async()=>{
 const f=fixture({local:sample(18),identity:{id:81}});
 await f.settle();f.click("cloud-upload");await f.settle();
 assert.equal(f.calls.length,0);
 assert.match(f.buttons["cloud-status"].textContent,/identity changed|account changed/i);
});
test("the recovery button restores the device backup and leaves account autosave paused",async()=>{
 const f=fixture({local:sample(12),remote:sample(77)});
 await f.settle();f.click("cloud-restore");await f.settle();
 assert.equal(f.localSave().steps,77);
 f.click("cloud-backup");await f.settle();
 assert.equal(f.localSave().steps,12);
 assert.equal(f.buttons["cloud-pause"].hidden,true);
 assert.match(f.buttons["cloud-status"].textContent,/paused/);
});
