import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const source=readFileSync("public/arcade/hosted/cinderwild/online-world.js","utf8");
const page=readFileSync("public/arcade/hosted/cinderwild/index.html","utf8");
class Element{
 constructor(id=""){this.id=id;this.hidden=false;this.disabled=false;this.textContent="";this.className="";this.listeners={};this.children=[];}
 addEventListener(type,handler){this.listeners[type]=handler;}
 replaceChildren(...children){this.children=children;}
 appendChild(child){this.children.push(child);}
 append(...children){this.children.push(...children);}
}
async function settle(){for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));}
function fixture({user={id:17,username:"Fieldwalker"},starter=true,joined=true,confirmJoin=true}={}){
 const ids=["online-world","online-status","online-join","online-leave","online-players","online-quests"];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
 const storage=new Map(),calls=[],peers=[],positions=[];
 const game={
  hasStarter:()=>starter,isBusy:()=>false,
  position:()=>positions.at(-1)||{x:8,y:18},
  snapshot:()=>({party:[{id:"mossbit"}],x:8,y:18}),
  syncOnlinePosition:pos=>{positions.push(pos);return true;},
  applyOnlineMove:(dx,dy,pos)=>{positions.push(pos);return true;},
  setOnlinePeers:players=>{peers.push(players);}
 };
 const api={
  user,ready:Promise.resolve(),
  request:async(path,options={})=>{
   calls.push({path,options});
   if(path.endsWith("/join"))return {ok:true,me:{x:8,y:18},quests:[{id:"first_steps",name:"Footsteps in the Ash",description:"Walk five steps",completed:false}]};
   if(path.endsWith("/leave"))return {ok:true};
   if(path.endsWith("/move"))return {ok:true,me:{x:9,y:18}};
   if(path.endsWith("/interact"))return {ok:true,quests:[]};
   if(path.endsWith("/heartbeat"))return {ok:true};
   return {ok:true,me:{zone:"Cinder Town"},players:[{id:2,username:"other",display_name:"<script>oops</script>",x:9,y:18}],quests:[],online_count:2};
  }
 };
 const context={document:{getElementById:id=>elements[id]||null,createElement:()=>new Element()},
  window:{CinderwildGame:game,AshFallArcade:api},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  confirm:()=>confirmJoin,Date,Promise,
  setTimeout:()=>1,clearTimeout:()=>{}
 };
 vm.runInNewContext(source,context,{timeout:2000});
 return {elements,game,api,context,calls,storage,peers,positions,click(id){elements[id].listeners.click();}};
}
test("the online alpha is linked after the shared account and game scripts",()=>{
 assert.match(page,/src="\/arcade-save\.js" defer/);
 assert.match(page,/src="\.\/game\.js\?v=[^"]+" defer/);
 assert.match(page,/src="\.\/online-world\.js\?v=20261115-online1" defer/);
 assert.ok(page.indexOf('./village-layout.js') < page.indexOf('./game.js'));
 assert.ok(page.indexOf('./world-renderer.js') < page.indexOf('./game.js'));
 assert.ok(page.indexOf('./game.js') < page.indexOf('./online-world.js'));
 assert.match(page,/id="online-players"/);
 assert.match(page,/id="online-quests"/);
});
test("signed-out trainers can continue offline and cannot join",async()=>{
 const f=fixture({user:null});await settle();
 f.click("online-join");await settle();
 assert.equal(f.context.window.CinderwildOnline.connected,false);
 assert.equal(f.calls.length,0);
 assert.match(f.elements["online-status"].textContent,/Sign into Knightfall/);
});
test("online join requires a starter and preserves local progress before repositioning",async()=>{
 const noStarter=fixture({starter:false});await settle();
 noStarter.click("online-join");await settle();
 assert.equal(noStarter.calls.length,0);
 const f=fixture();await settle();
 f.click("online-join");await settle();
 assert.equal(f.context.window.CinderwildOnline.connected,true);
 assert.equal(f.positions[0].x,8);
 assert.deepEqual(JSON.parse(f.storage.get("knightfall:cinderwild:before-online:17")),{party:[{id:"mossbit"}],x:8,y:18});
 assert.equal(f.peers.at(-1)[0].username,"other");
 assert.equal(f.elements["online-join"].hidden,true);
});
test("server move is requested by direction, not by client-supplied coordinate",async()=>{
 const f=fixture();await settle();f.click("online-join");await settle();
 await f.context.window.CinderwildOnline.requestMove(1,0);
 const move=f.calls.find(c=>c.path.endsWith("/move"));
 assert.deepEqual(JSON.parse(move.options.body),{direction:"right"});
 assert.equal(f.positions.at(-1).x,9);
});
test("online labels are rendered as text nodes, never unsafe player markup",async()=>{
 const f=fixture();await settle();f.click("online-join");await settle();
 const row=f.elements["online-players"].children[1].children[0];
 assert.match(row.textContent,/<script>oops<\/script>/);
 assert.equal(row.innerHTML,undefined);
});
test("leaving clears online state and stops returning server moves",async()=>{
 const f=fixture();await settle();f.click("online-join");await settle();
 f.click("online-leave");await settle();
 assert.equal(f.context.window.CinderwildOnline.connected,false);
 assert.equal(f.elements["online-join"].hidden,false);
 assert.equal(f.peers.at(-1).length,0);
});
