#!/usr/bin/env node
// Cinderwild: deterministic smoke tests without browsers, credentials or private APIs.
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const local=name=>resolve(root,name);
const js=readFileSync(local("public/arcade/hosted/cinderwild/game.js"),"utf8");
const village=readFileSync(local("public/arcade/hosted/cinderwild/village-layout.js"),"utf8");
const html=readFileSync(local("public/arcade/hosted/cinderwild/index.html"),"utf8");
const css=readFileSync(local("public/arcade/hosted/cinderwild/style.css"),"utf8");
const catalog=JSON.parse(readFileSync(local("public/arcade/catalog.json"),"utf8"));
const arcade=readFileSync(local("public/chaos-cartridge.html"),"utf8");
const route="/arcade/hosted/cinderwild/index.html";
assert.equal(catalog.games.filter(g=>g.id==="cinderwild").length,1,"Only one Cinderwild catalog entry");
assert.equal(catalog.games.filter(g=>g.route===route).length,1,"Cinderwild has one canonical route");
assert.equal((arcade.match(/data-game-id="cinderwild"/g)||[]).length,1,"Exactly one Cinderwild card");
assert.equal(new Set(catalog.games.map(g=>g.route)).size,catalog.games.length,"No duplicate arcade routes");
assert.equal(catalog.games.find(g=>g.id==="cinderwild").collection,"games");
assert.equal(catalog.games.find(g=>g.id==="cinderwild").device,"touch");
assert.ok(existsSync(local("public/monster-mmo-sprite-atlas.js")),"Original sprite renderer available");
for(const id of ["world","controls","starter","starter-options","fight","battle-buttons","battle-items","battle-switch","menu","menu-body","location","party-summary","notice","journal"]){
 assert.ok(html.includes('id="'+id+'"'),"Required game element #"+id);
}
for(const link of ["./game.js","./style.css","/monster-mmo-sprite-atlas.js"])assert.ok(html.includes(link),"Missing asset "+link);
assert.ok(css.includes("@media(max-width:520px)"),"Small phone layout");
assert.ok(js.includes("localStorage.setItem(KEY"),"Local game save persists");
assert.ok(js.includes("data-capture"),"Battle capture interface exists");
assert.ok(js.includes("data-revive"),"Creature revives available");
assert.ok(js.includes("data-withdraw"),"Creature box supports withdrawals");
assert.ok(js.includes("data-starter"),"Starter selection available");
assert.ok(js.endsWith("})();\n"),"Executable game entrypoint intact");
assert.doesNotMatch(js+" "+html,/\b(Pikachu|Charmander|Bulbasaur|Squirtle|Nintendo|Game Freak)\b/i,"No protected franchise characters or credits implied");
const injected=js.replace(/initialize\(\);\s*\}\)\(\);\s*$/, "globalThis.__test = {SPECIES,GYMS,SHRINES,make,moves,tile,walkable,addXP,expreq,STRONG,fresh,hash,zone,rollDamage};\n})();");
assert.notEqual(injected,js,"Test injection matched the game bootstrap");
const context={window:{},Math,Date,Number,Object,Array,Set,JSON,Map,String,Boolean,console};
vm.runInNewContext(village,context);
vm.runInNewContext(injected,context,{timeout:2000,filename:"cinderwild-game.js"});
const g=context.__test;
assert.ok(g,"Game mechanics loaded in sandbox");
assert.equal(Object.keys(g.SPECIES).length,25,"Original 25 species");
assert.equal(g.GYMS.length,3,"Three Warden challenges");
assert.equal(g.SHRINES.length,3,"Three postgame legendary shrines");
for(const shrine of g.SHRINES){assert.ok(g.SPECIES[shrine.id],"Legendary species exists");assert.equal(g.walkable(shrine.x,shrine.y),true,"Shrine can be reached on foot");}
assert.equal(g.zone(8),"Cinder Town");
assert.equal(g.zone(24),"Bramble Trail");
assert.equal(g.zone(43),"Storm Marsh");
assert.equal(g.zone(57),"Eclipse Ridge");
assert.equal(g.walkable(8,18),true,"Starting location is passable");
assert.equal(g.walkable(6,17),false,"Clinic NPC blocks tile, enabling interaction");
assert.equal(g.tile(40,8),"water","Marsh lake is water");
assert.equal(g.walkable(40,8),false,"Cannot walk through water");
assert.equal(g.tile(25,18),"path","Main path connects the Bramble Trail");
assert.equal(g.tile(42,18),"path","Main path connects the Storm Marsh");
assert.equal(g.tile(58,18),"path","Main path connects Eclipse Ridge");
const frontier=[[8,18]], visited=new Set(["8,18"]);
for(let i=0;i<frontier.length;i++){
 const [col,row]=frontier[i];
 for(const [x,y] of [[col+1,row],[col-1,row],[col,row+1],[col,row-1]]){
  const key=x+","+y;
  if(x>=32||visited.has(key)||!g.walkable(x,y))continue;
  visited.add(key);
  frontier.push([x,y]);
 }
}
assert.ok(visited.has("8,38"),"Village entrance is reachable from Cinder Town before earning crests");
assert.ok(frontier.filter(([,y])=>y>=38).length>200,"Imported paths connect the village interior");
assert.equal(g.walkable(11,43),false,"Village ruins block movement");
const starter=g.make("mossbit",5);
assert.equal(starter.level,5);
assert.ok(starter.hp>0);
assert.ok(g.make("mossbit",12).maxHp>starter.maxHp,"Level growth");
assert.equal(g.moves(starter).length,4,"Four battle moves");
assert.equal(g.moves(starter)[2].type,"grass","Elemental moves unlock by level");
assert.equal(g.moves(g.make("embercub",5))[2].type,"fire");
assert.equal(g.moves(g.make("driftfin",5))[2].type,"water");
assert.ok(g.STRONG.grass.includes("water"),"Elemental strength matrix loaded");
const evolve=g.make("mossbit",11);
const message=g.addXP(evolve,g.expreq(11));
assert.equal(evolve.id,"mossreaper","Starter evolves after experience threshold");
assert.ok(message.includes("evolved"),"Evolution message emitted");
assert.ok(evolve.hp>0,"Evolution maintains health");
const raw=catalog.games.find(g=>g.id==="cinderwild");
assert.ok(raw.description.includes("25 creatures"));
// Headless interaction smoke: run real event handlers through the starter, wild capture,
// three chained Warden teams and the three postgame legendary encounters.
const ui=new Map();
const canvasContext={fillRect(){},strokeRect(){},clearRect(){},drawImage(){},fillText(){}};
const element=id=>{
 if(!ui.has(id))ui.set(id,{
  id,width:0,height:0,hidden:["starter","menu","fight"].includes(id),
  textContent:"",innerHTML:"",classList:{add(){},remove(){}},listeners:{},
  getContext(){return canvasContext},replaceChildren(){},addEventListener(event,fn){this.listeners[event]=fn}
 });
 return ui.get(id);
};
const browserDocument={
 getElementById:element,dispatchEvent(){},
 querySelectorAll(){return[];},
 createElement(tag){return{textContent:"",tagName:tag}},
 body:{classList:{contains(){return false}}}
};
const persisted=new Map();
const fakeStorage={getItem:key=>persisted.get(key)||null,setItem:(key,value)=>persisted.set(key,value),removeItem:key=>persisted.delete(key)};
const predictableMath=Object.create(Math);predictableMath.random=()=>0.01;
const runner=js.replace(/initialize\(\);\s*\}\)\(\);\s*$/, "globalThis.__run={state,startBattle,make,capture,interact,victory,step,getBattle:()=>battle,resetThrottle:()=>lastStep=0};initialize();})();");
assert.notEqual(runner,js,"Runtime test injects game hook at boot");
const scene={
 document:browserDocument,window:{addEventListener(){},HellOrbitSprites:null},
 CustomEvent:class {},localStorage:fakeStorage,Math:predictableMath,confirm:()=>true
};
vm.runInNewContext(village,scene);
vm.runInNewContext(runner,scene,{timeout:5000,filename:"cinderwild-playthrough.js"});
const run=scene.__run;
assert.equal(element("world").width,576,"Overworld canvas bootstraps");
element("starter-options").listeners.click({target:{closest:()=>({dataset:{starter:"embercub"}})}});
assert.equal(run.state.party[0].id,"embercub","Starter selection launches game");
run.startBattle(run.make("mossbit",2));
assert.ok(run.getBattle(),"Wild encounter launches");
run.capture("superOrbs");
assert.equal(run.state.party.length,2,"Wild capture joins party");
assert.ok(run.state.caught.includes("mossbit"),"Capture adds Bestiary record");
assert.equal(run.getBattle(),null,"Capture exits battle");
for(const [x,rounds,badge] of [[24,2,"bramble"],[43,2,"storm"],[57,3,"eclipse"]]){
 run.state.x=x;run.state.y=18;run.interact();
 assert.ok(run.getBattle(),badge+" Warden challenge launches");
 for(let i=0;i<rounds;i++)run.victory();
 assert.ok(run.state.badges.includes(badge),badge+" Warden crest awarded");
 assert.equal(run.getBattle(),null,badge+" Warden team fully defeated");
}
assert.equal(run.state.complete,true,"All crests unlock postgame");
for(const [x,id] of [[54,"minionmouse"],[59,"minivillain"],[62,"minieddie"]]){
 run.state.x=x-1;run.state.y=18;run.resetThrottle();run.step(1,0);
 assert.equal(run.getBattle()?.enemy.id,id,"Walking on shrine triggers "+id);
 run.capture("superOrbs");
 assert.ok(run.state.caught.includes(id),"Legendary "+id+" captured");
 assert.equal(run.getBattle(),null,"Legendary capture closes battle");
}
assert.ok(persisted.has("knightfall:cinderwild:save:v1"),"Full campaign progress persisted");

console.log("Cinderwild audit passed: playable route, 25 species, 3 crests, type moves, evolution, maps, responsive controls local saves and full interactive storyline.");
