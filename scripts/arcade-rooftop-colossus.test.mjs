import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
for(const id of ["colossus-clash"]){
 const html=readFileSync("public/arcade/hosted/"+id+"/index.html","utf8");
 const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function start()"));
 test(id+" parses and cancels stale animation frames",()=>{
  assert.ok(source);assert.doesNotThrow(()=>new Script(source));
  const nodes=new Map(),frames=[],events=[],listeners=new Map();
  const node=k=>{if(!nodes.has(k))nodes.set(k,{textContent:"",hidden:false,style:{},addEventListener:(name,fn)=>listeners.set(k+":"+name,fn)});return nodes.get(k)};
  const ctx={clearRect(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},save(){},restore(){},translate(){},rotate(){},ellipse(){},roundRect(){},createLinearGradient(){return{addColorStop(){}}}};
  node("game").getContext=()=>ctx;
  const document={getElementById:node,querySelector:()=>null,addEventListener:(name,fn)=>listeners.set("document:"+name,fn),dispatchEvent:e=>events.push(e)};
  const sandbox={document,window:{},Image:class{constructor(){this.complete=false;this.naturalWidth=0}set src(v){this._src=v}},localStorage:{getItem:()=>null,setItem(){}},location:{href:"https://ash-fall.com",pathname:"/arcade"},performance:{now:()=>0},Math,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail}},requestAnimationFrame:fn=>frames.push(fn)};
  runInNewContext(source,sandbox,{timeout:1000});
  node("start").onclick();
  const old=frames.shift();
  node("start").onclick();
  const pending=frames.length;
  old(16);
  assert.equal(frames.length,pending,"old loop must not reschedule after restart");
  assert.equal(events.filter(e=>e.type==="ashfall:arcade-started").length,2);
  if(id==="rooftop-riot"){
   assert.ok(html.includes('data-score-selector="#shards"'),"leaderboard must read collected shards");
   assert.ok(source.includes("ashfall:arcade-finished"));
  }
 });
}


const roofBase="public/arcade/hosted/rooftop-riot/";
const roofHtml=readFileSync(roofBase+"index.html","utf8");
const roofEngine=readFileSync(roofBase+"engine.js","utf8");
const roofView=readFileSync(roofBase+"view.js","utf8");
function newRoof(seed=991){
 const sandbox={};runInNewContext(roofEngine,sandbox,{timeout:1000});
 return new sandbox.RooftopRiotEngine.Game({seed});
}
test("Rooftop Riot 2.0 is a real standalone engine with reusable sprites and arcade account bridge",()=>{
 assert.doesNotThrow(()=>new Script(roofEngine));
 assert.doesNotThrow(()=>new Script(roofView));
 assert.match(roofHtml,/src="\.\/engine\.js\?v=20261103-rooftop2"/);
 assert.match(roofHtml,/src="\.\/view\.js\?v=20261103-rooftop2"/);
 assert.match(roofHtml,/data-score-selector="#shards"/);
 for(const id of ["overlay","pause-overlay","game","left","right","jump","dash","fullscreen","pause","restart","shards"]){
  assert.ok(roofHtml.includes('id="'+id+'"'),"Missing "+id);
 }
 assert.match(roofView,/ashfall:arcade-started/);
 assert.match(roofView,/ashfall:arcade-finished/);
 assert.match(roofView,/cancelAnimationFrame\(frameId\)/);
});
test("Rooftop rooftops are deterministic, have real playable gaps and all four districts",()=>{
 const g=newRoof(),a=g.world.roofs;
 assert.equal(a.length,46);assert.equal(g.world.districts.length,4);
 assert.ok(g.world.shards.length>=45&&g.world.drones.length>=6&&g.world.vents.length>=6);
 assert.equal(a[0].x,0);assert.ok(a.at(-1).exit);
 for(let i=1;i<a.length;i++){
  const gap=a[i].x-a[i-1].x-a[i-1].w;
  assert.ok(gap>=75&&gap<=150,"Gap must be meaningful but reachable: "+i+" "+gap);
  assert.ok(Math.abs(a[i].y-a[i-1].y)<62,"Roof rise should be jumpable "+i);
 }
 const twin=newRoof();
 assert.deepEqual(a.map(x=>[x.x,x.y,x.w]),twin.world.roofs.map(x=>[x.x,x.y,x.w]));
});
test("Rooftop physics supports jump buffering, dash limits, landing and checkpoints",()=>{
 const g=newRoof();g.start();
 assert.equal(g.state,"running");
 g.pressJump();g.tick(.03);assert.ok(g.player.vy<0,"Buffered jump should lift player");
 assert.equal(g.pressDash(),true);
 assert.equal(g.pressDash(),false,"Dash should not spam in the air");
 for(let i=0;i<90;i++)g.tick(.016);
 assert.equal(g.player.grounded,true,"Player should land on starting roof");
 assert.equal(g.player.dashReady,true,"Landing refreshes dash");
 const roof=g.world.roofs[9],p=g.player;
 p.x=roof.x+42;p.y=roof.y-p.h-2;p.vy=160;p.grounded=false;
 g.tick(.035);assert.equal(g.checkpoint,9);
 g.recover();assert.equal(g.falls,1);assert.ok(Math.abs(g.player.x-(roof.x+36))<1);
});
test("Rooftop hazard damage, fall limit, extraction and score snapshots",()=>{
 const g=newRoof();g.start();const hp=g.hp;
 assert.equal(g.hurt("security"),true);assert.equal(g.hp,hp-1);
 assert.equal(g.hurt("security"),false,"Invulnerability prevents duplicate hits");
 g.player.inv=0;const shard=g.world.shards[0];
 g.player.x=shard.x-15;g.player.y=shard.y-22;g.player.vy=0;g.tick(.015);
 assert.ok(g.shards>=1,"Crystals should be collectible");
 assert.ok(g.score>=100,"Crystals award score");
 const last=g.world.roofs.at(-1),p=g.player;
 p.x=last.x+last.w*.7;p.y=last.y-p.h-3;p.vy=200;p.inv=0;
 g.tick(.035);assert.equal(g.state,"won","Landing near exit completes campaign");
 assert.ok(g.score>g.shards*100,"Extraction adds bonus score");
 g.start();g.recover();g.recover();g.recover();
 assert.equal(g.falls,3);assert.equal(g.state,"lost");
});
