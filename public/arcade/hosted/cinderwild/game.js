(()=>{
"use strict";
const $=id=>document.getElementById(id), KEY="knightfall:cinderwild:save:v1";
const village=globalThis.CinderwildVillage, renderer=globalThis.CinderwildRenderer;
const W=64,H=village?village.y+village.height+1:38,S=32, VIEW_W=18,VIEW_H=12;
const SPECIES={
 mossbit:["Mossbit","grass",28,8,8,"mossreaper",12,1],
 mossreaper:["Mossreaper","grass",47,16,14,null,0,3],
 embercub:["Embercub","fire",26,10,7,"ashhorn",12,1],
 ashhorn:["Ashhorn","fire",45,18,12,null,0,3],
 driftfin:["Driftfin","water",30,8,9,"cryptfin",12,1],
 cryptfin:["Cryptfin","water",53,15,15,null,0,3],
 zipfang:["Zipfang","electric",26,11,7,"voltmaw",14,2],
 voltmaw:["Voltmaw","electric",46,20,12,null,0,3],
 gloamlet:["Gloamlet","ghost",29,10,9,"gloamshade",14,2],
 gloamshade:["Gloamshade","ghost",47,18,15,null,0,3],
 thornspit:["Thornspit","thorn",32,10,10,"thornmaw",15,2],
 thornmaw:["Thornmaw","thorn",55,17,17,null,0,3],
 grubruckle:["Grubruckle","stone",38,9,13,"gravruckle",15,2],
 gravruckle:["Gravruckle","stone",61,18,20,null,0,3],
 mournwing:["Mournwing","air",26,11,7,"doomwing",15,2],
 doomwing:["Doomwing","air",49,19,13,null,0,3],
 squibblex:["Squibblex","cosmic",30,11,8,"squibmarshal",16,3],
 squibmarshal:["Squibmarshal","cosmic",54,19,14,null,0,4],
 hexpup:["Hexpup","ghost",29,10,9,"hexhound",15,2],
 hexhound:["Hexhound","ghost",51,18,15,null,0,3],
 starjelly:["Starjelly","cosmic",31,10,10,"astraljelly",16,3],
 astraljelly:["Astraljelly","cosmic",55,18,17,null,0,4],
 minionmouse:["Minion Mouse","electric",68,24,20,null,0,5],
 minivillain:["Mini Villain","ghost",72,25,20,null,0,5],
 minieddie:["Mini Eddie","fire",75,26,21,null,0,5]
};
const BASE_MOVES=[
 {name:"Tackle",type:"normal",power:35,acc:97,pp:28},
 {name:"Quick Jab",type:"normal",power:27,acc:100,pp:25},
 {name:"Heavy Strike",type:"normal",power:55,acc:85,pp:15},
 {name:"Desperate Hit",type:"normal",power:25,acc:100,pp:99}
];
const SPECIAL={
 grass:[["Vine Lash",43,95],["Spore Burst",61,87]],
 fire:[["Cinder Spark",44,95],["Inferno Rush",65,85]],
 water:[["Tidal Slap",43,96],["Undertow",62,86]],
 electric:[["Static Bite",44,95],["Thunder Crash",66,84]],
 ghost:[["Shadow Claw",44,96],["Nightmare Veil",65,86]],
 thorn:[["Bramble Fang",45,94],["Thorn Storm",64,87]],
 stone:[["Rock Toss",43,96],["Grave Quake",65,85]],
 air:[["Gale Slash",44,97],["Cyclone",63,86]],
 cosmic:[["Star Pulse",45,95],["Orbit Break",64,86]]
};
const STRONG={grass:["water","stone"],water:["fire","stone"],fire:["grass","thorn"],electric:["water","air"],stone:["electric","fire"],air:["grass","thorn"],ghost:["cosmic"],cosmic:["ghost","stone"],thorn:["water","grass"]};
const GYMS=[
 {id:"bramble",x:24,y:19,name:"Warden Briar",badge:"Bramble Crest",team:[["thornspit",8],["mossreaper",10]],text:"The wilds answer only to those who persevere."},
 {id:"storm",x:43,y:19,name:"Captain Volt",badge:"Storm Crest",team:[["zipfang",14],["voltmaw",17]],text:"A spark is small. An electrical bill is not."},
 {id:"eclipse",x:57,y:19,name:"Oracle Nyx",badge:"Eclipse Crest",team:[["gloamshade",20],["squibmarshal",22],["minivillain",24]],text:"One last test before the sky opens."}
];
const NPCS=[{x:6,y:17,name:"Nurse Ember",kind:"heal"},{x:10,y:17,name:"Supply Keeper",kind:"shop"},...GYMS.map(g=>({x:g.x,y:g.y,name:g.name,kind:"gym",id:g.id}))];
const SHRINES=[{id:"minionmouse",x:54,y:18,level:25,name:"Spark Shrine"},{id:"minivillain",x:59,y:18,level:26,name:"Shadow Shrine"},{id:"minieddie",x:62,y:18,level:27,name:"Ember Shrine"}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.floor(Math.random()*a.length)],sp=id=>SPECIES[id],name=id=>sp(id)?.[0]||"Unknown";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fresh=()=>({x:8,y:18,steps:0,coins:150,party:[],box:[],seen:[],caught:[],items:{orbs:8,superOrbs:2,potions:5,revives:1},badges:[],defeated:[],wins:0,story:[],complete:false});
function load(rawSource){
 try{
  const raw=rawSource===undefined?JSON.parse(localStorage.getItem(KEY)):rawSource;if(!raw||!Number.isInteger(raw.x)||!Array.isArray(raw.party))return fresh();
  const t=fresh();
  for(const k of ["x","y","steps","coins","wins"])if(Number.isFinite(raw[k]))t[k]=clamp(Math.floor(raw[k]),0,k==="x"?W-1:k==="y"?H-1:10000000);
  for(const k of ["party","box"])t[k]=(Array.isArray(raw[k])?raw[k]:[]).slice(0,k==="party"?6:200).filter(c=>c&&sp(c.id)).map(c=>{
    const level=clamp(Number(c.level)||1,1,100),unit=make(c.id,level);
    unit.hp=clamp(Number(c.hp)||0,0,unit.maxHp);
    unit.xp=clamp(Number(c.xp)||0,0,99999);
    unit.status=["burn","poison",null].includes(c.status)?c.status:null;
    unit.pp=Array.isArray(c.pp)?[0,1,2,3].map(i=>clamp(Number(c.pp[i])||0,0,moves(unit)[i].pp)):moves(unit).map(m=>m.pp);
    return unit;
  });
  for(const k of ["seen","caught"])t[k]=[...new Set((Array.isArray(raw[k])?raw[k]:[]).filter(id=>sp(id)))];
  t.badges=GYMS.map(g=>g.id).filter(id=>raw.badges?.includes(id));
  t.defeated=[...new Set((Array.isArray(raw.defeated)?raw.defeated:[]).filter(id=>GYMS.some(g=>g.id===id)))];
  for(const k of Object.keys(t.items))t.items[k]=clamp(Number(raw.items?.[k])||0,0,999);
  t.complete=t.badges.length===3;
  return t;
 }catch{return fresh();}
}
let state=load(),battle=null,modal="",logLines=[],lastStep=0,onlinePeers=[],facing=0;
let viewWidth=VIEW_W,viewHeight=VIEW_H,motion=null;
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));document.dispatchEvent(new CustomEvent("cinderwild:local-save"));}catch{notify("Storage unavailable. Progress may not persist.");}}
function make(id,level=1){const s=sp(id);level=clamp(level,1,100);const maxHp=s[2]+(level-1)*3;const unit={id,level,hp:maxHp,maxHp,attack:s[3]+Math.floor(level*0.8),defense:s[4]+Math.floor(level*0.65),xp:0,pp:[],status:null};unit.pp=moves(unit).map(m=>m.pp);return unit;}
function moves(c){
 const type=sp(c.id)[1],pair=SPECIAL[type],lvl=c.level;
 return [
  {...BASE_MOVES[0]}, {...BASE_MOVES[1]},
  lvl>=5?{name:pair[0][0],type,power:pair[0][1],acc:pair[0][2],pp:15}:BASE_MOVES[2],
  lvl>=11?{name:pair[1][0],type,power:pair[1][1],acc:pair[1][2],pp:9}:BASE_MOVES[3]
 ];
}
function expreq(l){return 24+l*15;}
function addXP(c,amount){
 let m="";c.xp+=amount;
 while(c.level<100&&c.xp>=expreq(c.level)){
  c.xp-=expreq(c.level);c.level++;
  const delta=make(c.id,c.level),old=c.maxHp;
  c.maxHp=delta.maxHp;c.hp=clamp(c.hp+c.maxHp-old,0,c.maxHp);
  c.attack=delta.attack;c.defense=delta.defense;
  c.pp=moves(c).map((move,i)=>Math.min(Number(c.pp[i])||0,move.pp));
  m+=name(c.id)+" reached Lv."+c.level+"! ";
  const ev=sp(c.id);
  if(ev[5]&&c.level>=ev[6]){
   const before=c.id,life=c.hp/c.maxHp,oldXp=c.xp;
   Object.assign(c,make(ev[5],c.level));c.hp=Math.max(1,Math.round(c.maxHp*life));c.xp=oldXp;
   c.pp=moves(c).map(move=>move.pp);
   remember(c.id,true);
   m+=name(before)+" evolved into "+name(c.id)+"! ";
  }
 }
 return m;
}
function zone(x=state.x){return village&&state.y>=village.y?"Ashen Village":x<14?"Cinder Town":x<32?"Bramble Trail":x<51?"Storm Marsh":"Eclipse Ridge";}
function hash(x,y){let z=(x*374761393+y*668265263+93284)|0;z=Math.imul(z^(z>>>13),1274126177);return(z^(z>>>16))>>>0;}
function tile(x,y){
 if(x<0||x>=W||y<0||y>=H)return"wall";
 if(y===0||y===H-1||x===0||x===W-1)return"tree";
 const imported=village?.terrainAt(x,y);if(imported)return imported;
 if(x<14&&y>=12&&y<=23){
  if((x===4||x===11)&&y===14)return"roof";
  if((x===4||x===11)&&y===15)return"house";
  return (y>=17&&y<=19)?"path":"town";
 }
 if(y>=17&&y<=19)return"path";
 if(x>=36&&x<=44&&y>=5&&y<=12)return"water";
 if((x>=15&&x<31&&y<5)||(x>=51&&y<7))return"tree";
 const n=hash(x,y)%100;
 if(n<9&&Math.abs(y-18)>4)return"tree";
 return n<57?"grass":"field";
}
function walkable(x,y){
 const t=tile(x,y);
 if(["tree","water","house","roof","ruin","wall"].includes(t))return false;
 if(NPCS.some(n=>n.x===x&&n.y===y))return false;
 return true;
}
function notify(s){const e=$("notice");if(e)e.textContent=s;logLines.unshift(s);logLines=logLines.slice(0,6);const l=$("journal");if(l)l.replaceChildren(...logLines.map(t=>{const p=document.createElement("p");p.textContent=t;return p;}));}
function remember(id,caught=false){
 if(!state.seen.includes(id))state.seen.push(id);
 if(caught&&!state.caught.includes(id))state.caught.push(id);
}
function areaPool(){
 if(state.x<32)return["mossbit","embercub","driftfin","thornspit","gloamlet","grubruckle","mournwing"];
 if(state.x<51)return["driftfin","zipfang","grubruckle","mournwing","hexpup","starjelly","squibblex"];
 return["gloamlet","hexpup","thornspit","squibblex","starjelly","mournwing","zipfang"];
}
function generateWild(){
 let pool=areaPool();const level=clamp(3+Math.floor(state.x/6)+Math.floor(Math.random()*4),2,28);
 const id=pick(pool);return make(id,level);
}
function active(){return state.party.find(c=>c.hp>0)||null;}
function lead(){const c=active();if(c&&state.party[0]!==c){const i=state.party.indexOf(c);state.party.splice(i,1);state.party.unshift(c);}return c;}
function startBattle(enemy,trainer=null,roster=[]){
 if(!lead()){healAll();notify("Your party was revived at Cinder Town.");return;}
 const stage=document.querySelector?.(".battle-stage");
 if(stage)stage.dataset.biome=state.x>=51?"ridge":state.x>=32?"marsh":"forest";
 battle={enemy,trainer,roster,round:0,lines:[trainer?trainer.name+" sent out "+name(enemy.id)+"!":"A wild "+name(enemy.id)+" appeared!"],busy:false};
 remember(enemy.id);$("fight").hidden=false;$("world-wrap").classList.add("is-battling");renderBattle();save();
}
function battleLog(s){battle.lines=[s,...battle.lines].slice(0,3);notify(s);}
function rollDamage(a,b,m){
 const type=sp(a.id)[1],target=sp(b.id)[1],mult=m.type==="normal"?1:STRONG[m.type]?.includes(target)?1.6:STRONG[target]?.includes(m.type)?.7:1;
 const stab=m.type===type?1.18:1;
 const value=Math.max(1,Math.floor(((a.attack+5)*m.power)/(b.defense+12)/2.4*stab*mult*(.88+Math.random()*.18)));
 return {value,mult};
}
function strike(a,b,m,ppIndex){
 if(ppIndex!==undefined){a.pp[ppIndex]--;a.pp[ppIndex]=Math.max(0,a.pp[ppIndex]);}
 if(Math.random()*100>=m.acc)return name(a.id)+" used "+m.name+" but missed!";
 const hit=rollDamage(a,b,m);b.hp=Math.max(0,b.hp-hit.value);
 const target=$(b===battle?.enemy?"enemy-sprite":"ally-sprite");
 if(target?.animate&&!reducedMotion?.matches){
  for(const animation of target.getAnimations())animation.cancel();
  target.animate([{filter:"brightness(1.65)",translate:".4rem 0"},{translate:"-.22rem 0"},{translate:"0 0"}],{duration:250,easing:"steps(4, end)"});
 }
 let message=name(a.id)+" used "+m.name+"! -"+hit.value+" HP.";
 if(hit.mult>1)message+=" Super effective!";
 else if(hit.mult<1)message+=" Not very effective.";
 if(m.type!=="normal"&&!b.status&&b.hp>0&&Math.random()<.12){b.status=m.type==="fire"?"burn":m.type==="thorn"?"poison":null;if(b.status)message+=" "+name(b.id)+" is "+b.status+"ed!";}
 return message;
}
function tick(c){
 if(!c.status||c.hp<=0)return"";
 const dmg=Math.max(1,Math.floor(c.maxHp/12));c.hp=Math.max(0,c.hp-dmg);return name(c.id)+" took "+dmg+" "+c.status+" damage.";
}
function enemyTurn(){
 if(!battle||battle.enemy.hp<=0)return;
 const attacker=battle.enemy,hero=lead();if(!hero){blackout();return;}
 const options=moves(attacker).map((m,i)=>({m,i})).filter(x=>attacker.level>= (x.i===3?11:x.i===2?5:1));
 const choice=pick(options);
 battleLog(strike(attacker,hero,choice.m));
 const effect=tick(attacker);if(effect)battleLog(effect);
 if(attacker.hp<=0){victory();return;}
 if(hero.hp<=0){battleLog(name(hero.id)+" fainted!");if(!active())blackout();}
}
function endBattle(){
 battle=null;$("fight").hidden=true;$("world-wrap").classList.remove("is-battling");render();save();
}
function blackout(){
 if(!battle)return;state.coins=Math.max(0,state.coins-25);state.x=8;state.y=18;healAll();
 const sentence="Your party fainted. Nurse Ember rescued everyone. Lost up to 25 cinders.";
 endBattle();notify(sentence);
}
function victory(){
 const enemy=battle.enemy,trainer=battle.trainer;
 state.wins++;
 const who=lead();if(who){const xp=10+enemy.level*9;battleLog(name(who.id)+" gained "+xp+" XP. "+addXP(who,xp));}
 if(battle.roster.length){
  const next=battle.roster.shift();battle.enemy=make(next[0],next[1]);
  remember(battle.enemy.id);battleLog(battle.trainer.name+" sent out "+name(battle.enemy.id)+"!");renderBattle();save();return;
 }
 state.coins+=trainer?90+enemy.level*5:12+enemy.level*2;
 if(trainer&&!state.badges.includes(trainer.id)){
  state.badges.push(trainer.id);state.defeated.push(trainer.id);state.items.superOrbs+=2;
  battleLog("You earned the "+trainer.badge+" and 2 Prism Orbs!");
  if(state.badges.length===3){state.complete=true;notify("You are the Cinderwild Champion! The wilds remain open for collecting.");}
 }
 endBattle();notify("Victory! Cinders earned. Explore for the next challenge.");
}
function playerMove(index){
 if(!battle||!active())return;
 const hero=lead(),m=moves(hero)[index];
 if(!m||Math.min(hero.pp[index],m.pp)<=0){battleLog("That move is out of charges. Rest or choose another.");renderBattle();return;}
 battle.round++;
 battleLog(strike(hero,battle.enemy,m,index));
 if(battle.enemy.hp<=0){victory();if(battle)renderBattle();return;}
 const effect=tick(hero);if(effect)battleLog(effect);
 if(hero.hp<=0){battleLog(name(hero.id)+" fainted!");if(!active()){blackout();return;}}
 enemyTurn();if(battle)renderBattle();save();
}
function capture(kind){
 if(!battle||battle.trainer)return;
 if(state.party.length>=6&&state.box.length>=200){battleLog("Party and storage are full. Free a slot before capturing.");renderBattle();return;}
 if(state.items[kind]<=0){battleLog("No capture orbs left.");renderBattle();return;}
 state.items[kind]--;
 const b=battle.enemy,s=sp(b.id),health=1-b.hp/b.maxHp;
 const odds=clamp(.18+health*.66+(kind==="superOrbs"?.24:0)-s[7]*.065+Math.max(0,lead()?.level-b.level||0)*.012,.05,.94);
 if(Math.random()<odds){
  const entry=make(b.id,b.level);entry.hp=Math.max(1,b.hp);remember(b.id,true);
  if(state.party.length<6){state.party.push(entry);battleLog("Caught "+name(b.id)+"! Added to your party.");}
  else{state.box.push(entry);battleLog("Caught "+name(b.id)+"! Sent to your storage box.");}
  state.coins+=5;endBattle();notify("Creature added to your Field Bestiary.");return;
 }
 battleLog(name(b.id)+" broke free!");enemyTurn();if(battle)renderBattle();save();
}
function healAll(){
 for(const c of state.party){c.hp=c.maxHp;c.status=null;c.pp=moves(c).map(m=>m.pp);}
 save();
}
function usePotion(i,inBattle=false){
 const c=state.party[i];if(!c)return;
 if(state.items.potions<=0){notify("Out of potions.");return;}
 if(c.hp>=c.maxHp||c.hp<=0){notify("Use a revive for fainted creatures or heal someone injured.");return;}
 state.items.potions--;c.hp=Math.min(c.maxHp,c.hp+30);notify(name(c.id)+" recovered 30 HP.");
 if(inBattle){enemyTurn();if(battle)renderBattle();}else openMenu("party");
 save();
}
function useRevive(i,inBattle=false){
 const c=state.party[i];if(!c||c.hp>0)return;
 if(!state.items.revives){notify("No revives left.");return;}
 state.items.revives--;c.hp=Math.max(1,Math.floor(c.maxHp/2));c.status=null;
 notify(name(c.id)+" got back up!");if(inBattle){enemyTurn();if(battle)renderBattle();}else openMenu("party");save();
}
function flee(){
 if(!battle||battle.trainer)return;
 if(Math.random()<.82){endBattle();notify("Escaped safely.");}
 else{battleLog("Couldn't escape!");enemyTurn();if(battle)renderBattle();}
}
function changeLead(i,duringBattle=false){
 if(!Number.isInteger(i)||i<0||i>=state.party.length||state.party[i].hp<=0)return;
 if(duringBattle&&(!battle||i===0))return;
 const selected=state.party.splice(i,1)[0];state.party.unshift(selected);
 notify(name(selected.id)+" leads the team.");if(duringBattle){enemyTurn();if(battle)renderBattle();}else openMenu("party");save();
}
function buy(id,price){
 if(state.coins<price){notify("Not enough cinders.");return;}
 state.coins-=price;state.items[id]++;save();openMenu("shop");notify("Purchased one "+({orbs:"Capture Orb",superOrbs:"Prism Orb",potions:"Potion",revives:"Revive"}[id])+".");
}
function interact(){
 if(battle||modal)return;
 const npc=NPCS.find(n=>Math.abs(state.x-n.x)+Math.abs(state.y-n.y)<=2);
 if(!npc){notify("There's nobody to talk to here. Tall grass hides wild creatures.");return;}
 if(window.CinderwildOnline?.connected){
  const target=npc.kind==="heal"?"nurse_ember":npc.kind==="shop"?"supply_keeper":npc.id==="bramble"?"warden_briar":null;
  if(target)window.CinderwildOnline.recordNpc(target);
 }
 if(npc.kind==="heal"){healAll();notify("Nurse Ember restored your creatures and all move charges.");return;}
 if(npc.kind==="shop"){openMenu("shop");return;}
 const g=GYMS.find(x=>x.id===npc.id);if(!g)return;
 if(state.badges.includes(g.id)){notify(g.name+": You've already earned my crest. Keep exploring!");return;}
 const idx=GYMS.indexOf(g);
 if(idx>0&&!state.badges.includes(GYMS[idx-1].id)){notify(g.name+": Earn the previous crest before challenging me.");return;}
 if(!state.party.some(c=>c.hp>0)){notify("Heal your party before challenging a Warden.");return;}
 notify(g.name+": "+g.text);
 const roster=g.team.slice(1);
 startBattle(make(g.team[0][0],g.team[0][1]),g,roster);
}
function step(dx,dy,serverPosition=null){
 if(battle||modal||!state.party.length)return false;
 if(!serverPosition&&window.CinderwildOnline?.connected){
  if(village&&state.x+dx===village.entrance&&state.y+dy===village.y-1){
   notify("Leave the shared world to explore Ashen Village.");return false;
  }
  window.CinderwildOnline.requestMove(dx,dy);return true;
 }
 const now=Date.now();if(now-lastStep<90&&!serverPosition)return false;lastStep=now;
 const x=state.x+dx,y=state.y+dy;
 if(serverPosition&&(serverPosition.x!==x||serverPosition.y!==y)){
  state.x=serverPosition.x;state.y=serverPosition.y;save();render();return true;
 }
 if(!serverPosition&&x>=32&&!state.badges.includes("bramble")){notify("The Bramble Crest opens the Storm Marsh crossing.");return;}
 if(!serverPosition&&x>=51&&!state.badges.includes("storm")){notify("The Storm Crest opens the Eclipse Ridge crossing.");return;}
 if(!walkable(x,y)){const npc=NPCS.find(n=>n.x===x&&n.y===y);if(npc)interact();return;}
 facing=dx<0?2:dx>0?3:dy<0?1:0;
 if(renderer&&!reducedMotion?.matches)motion={x:state.x,y:state.y,targetX:x,targetY:y,time:performance.now()};
 state.x=x;state.y=y;state.steps++;
 if(village&&x===village.entrance&&y===village.y&&dy>0)notify("You discovered Ashen Village.");
 const shrine=SHRINES.find(s=>s.x===x&&s.y===y);
 if(shrine&&!state.caught.includes(shrine.id)){
  if(!state.complete)notify(shrine.name+" is sealed. Earn all three crests to awaken it.");
  else{notify("The "+shrine.name+" awakens!");startBattle(make(shrine.id,shrine.level));}
 }
 if(!shrine&&tile(x,y)==="grass"&&Math.random()<.13)startBattle(generateWild());
 if(state.steps%5===0||serverPosition)save();
 render();return true;
}
function resizeWorld(width,height){
 if(width<1||height<1)return;
 const tileSize=width<520?32:width<950?37:42;
 const columns=clamp(Math.round(width/tileSize),8,42);
 const rows=clamp(Math.round(height/tileSize),4,27);
 if(columns===viewWidth&&rows===viewHeight)return;
 viewWidth=columns;viewHeight=rows;
 $("world").width=columns*S;$("world").height=rows*S;
 draw();
}
function draw(now=globalThis.performance?.now()||0){
 const canvas=$("world"),ctx=canvas.getContext("2d");if(!ctx)return;
 ctx.imageSmoothingEnabled=false;const t=S;
 let playerX=state.x,playerY=state.y,walkFrame=0;
 if(motion&&motion.targetX===state.x&&motion.targetY===state.y&&!reducedMotion?.matches){
  const progress=clamp((now-motion.time)/100,0,1);
  playerX=motion.x+(state.x-motion.x)*progress;
  playerY=motion.y+(state.y-motion.y)*progress;
  walkFrame=progress<1?1+(state.steps%2)*2:0;
  if(progress===1)motion=null;
 }else motion=null;
 const snap=value=>Math.round(value*16)/16;
 const ox=snap(clamp(playerX-(viewWidth-1)/2,0,W-viewWidth)),oy=snap(clamp(playerY-(viewHeight-1)/2,0,H-viewHeight));
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 if(renderer)renderer.world(ctx,ox,oy,viewWidth,viewHeight,t,W,H,tile,hash,village,reducedMotion?.matches?0:now);
 else for(let row=0;row<viewHeight;row++)for(let col=0;col<viewWidth;col++){
  const colors={town:"#c7ae74",path:"#c29460",grass:"#82993f",field:"#8ea64d",tree:"#425e3b",water:"#36768a",house:"#917050",roof:"#6c5d45",ruin:"#646748"};
  rect(col*t,row*t,t,t,colors[tile(Math.floor(ox)+col,Math.floor(oy)+row)]||"#24362e");
 }
 for(const shrine of SHRINES){
  const px=(shrine.x-ox)*t,py=(shrine.y-oy)*t;if(px<0||py<0||px>=canvas.width||py>=canvas.height)continue;
  const cleared=state.caught.includes(shrine.id);rect(px+4,py+22,24,7,"#3f355d");rect(px+8,py+11,16,17,cleared?"#63737b":state.complete?"#ff8bca":"#61778a");rect(px+12,py+6,8,11,cleared?"#8e9a9e":"#c7f274");
 }
 for(const npc of NPCS){
  const px=(npc.x-ox)*t,py=(npc.y-oy)*t;if(px<0||py<0||px>=canvas.width||py>=canvas.height)continue;
  const gym=npc.kind==="gym";
  if(renderer?.actor(ctx,"warden",px,py,t)){rect(px+12,py+1,8,2,gym?"#ef93c2":"#ffdd81");continue;}
  rect(px+9,py+8,14,18,gym?"#302b60":"#e3e4a7");rect(px+9,py+2,14,12,gym?"#ff74c8":"#e8b787");
  rect(px+11,py+8,3,3,"#24313a");rect(px+19,py+8,3,3,"#24313a");
  rect(px+7,py,18,3,gym?"#d6fa67":"#f8d97e");
 }
 for(const visitor of onlinePeers){
  const px=(visitor.x-ox)*t,py=(visitor.y-oy)*t;
  if(px<0||py<0||px>=canvas.width||py>=canvas.height)continue;
  const direction=["down","up","left","right"].indexOf(visitor.facing);
  if(!renderer?.actor(ctx,"warden",px,py,t,Math.max(0,direction)))rect(px+9,py+7,14,19,"#78ccf2");
  ctx.font="bold 10px sans-serif";ctx.textAlign="center";
  const label=String(visitor.display_name||visitor.username||"Trainer").slice(0,13);
  const width=Math.min(118,Math.max(44,label.length*6+6));
  const tx=px+16,ty=py-5;
  rect(tx-width/2,Math.max(0,ty-13),width,13,"#142631e0");
  ctx.fillStyle="#e2f8ff";ctx.fillText(label,tx,Math.max(10,ty-3),width-4);
 }
 const px=(playerX-ox)*t,py=(playerY-oy)*t;
 if(renderer?.actor(ctx,"trainer",px,py,t,facing,walkFrame))return;
 rect(px+8,py+24,18,5,"#24342d66");rect(px+9,py+13,14,15,"#34354b");rect(px+10,py+7,12,12,"#f2c0a0");
 rect(px+7,py+4,18,7,"#de496e");rect(px+12,py+2,10,5,"#f2c2cb");rect(px+12,py+15,3,2,"#292638");rect(px+18,py+15,3,2,"#292638");
}
function drawFieldMap(){
 const canvas=$("field-map");if(!canvas)return;
 const ctx=canvas.getContext("2d");if(!ctx)return;
 const p=8;canvas.height=H*p;
 const colors={town:"#d7b995",path:"#d1ad82",grass:"#74b777",field:"#92c88c",tree:"#265f55",water:"#348dad",house:"#aa696b",roof:"#82516e",ruin:"#545440",wall:"#202f34"};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillStyle=colors[tile(x,y)]||colors.wall;ctx.fillRect(x*p,y*p,p,p);}
 for(const npc of NPCS){
  const cleared=npc.kind==="gym"&&state.badges.includes(npc.id);
  ctx.fillStyle=npc.kind==="gym"?(cleared?"#d1ecc4":"#f489ba"):"#f3d46e";
  ctx.fillRect(npc.x*p+1,npc.y*p+1,p-2,p-2);
 }
 for(const shrine of SHRINES){
  ctx.fillStyle=state.caught.includes(shrine.id)?"#d1ecc4":state.complete?"#b58bff":"#635276";
  ctx.fillRect(shrine.x*p+1,shrine.y*p+1,p-2,p-2);
 }
 ctx.fillStyle="#142431";ctx.fillRect(state.x*p-2,state.y*p-2,p+4,p+4);
 ctx.fillStyle="#fffaff";ctx.fillRect(state.x*p,state.y*p,p,p);
 ctx.fillStyle="#e14f8c";ctx.fillRect(state.x*p+2,state.y*p+2,p-4,p-4);
}
function filterBestiary(){
 const list=$("dex-entries"),count=$("dex-count");if(!list||!count)return;
 const query=($("dex-search")?.value||"").trim().toLowerCase().replace(/^#/,"");
 const filter=$("dex-status-filter")?.value||"all";
 let matching=0;
 for(const row of list.querySelectorAll("[data-dex-id]")){
  const id=row.dataset.dexId,seen=state.seen.includes(id)||state.caught.includes(id),caught=state.caught.includes(id);
  const byStatus=filter==="all"||(filter==="seen"&&seen)||(filter==="caught"&&caught)||(filter==="missing"&&!seen);
  const byName=!query||(seen&&name(id).toLowerCase().includes(query))||row.dataset.dexNumber.includes(query);
  row.hidden=!(byStatus&&byName);
  if(!row.hidden)matching++;
 }
 count.textContent=matching+" matching bestiary entries";
}
function hpbar(c){const ratio=clamp(c.hp/c.maxHp,0,1);return '<span class="health"><span style="width:'+(ratio*100)+'%;background:'+(ratio>.5?"#7ae4a0":ratio>.2?"#e9d575":"#ff737f")+'"></span></span>';}
function sprite(id,canvasId,frame=0){
 const cvs=$(canvasId);if(!cvs||!cvs.width)return;
 const ctx=cvs.getContext("2d");if(!ctx)return;
 ctx.clearRect(0,0,cvs.width,cvs.height);
 if(renderer?.creature(ctx,id,cvs.width,frame,canvasId==="ally-sprite"))return;
 if(window.HellOrbitSprites?.draw)window.HellOrbitSprites.draw(ctx,id,0,0,cvs.width,frame,canvasId==="ally-sprite");
 else{ctx.font="64px system-ui";ctx.fillText(sp(id)?.[0]?.[0]||"?",20,72);}
}
function renderBattle(){
 if(!battle)return;
 const b=battle.enemy,a=lead();if(!a){blackout();return;}
 const choices=moves(a),canCapture=!battle.trainer;
 $("fight-title").textContent=battle.trainer?battle.trainer.name+" challenges you":"Wild encounter";
 $("enemy-name").textContent=name(b.id)+" · Lv."+b.level;
 $("enemy-hp").innerHTML=hpbar(b)+"<small>"+b.hp+" / "+b.maxHp+" HP</small>";
 $("ally-name").textContent=name(a.id)+" · Lv."+a.level;
 $("ally-hp").innerHTML=hpbar(a)+"<small>"+a.hp+" / "+a.maxHp+" HP</small>";
 $("battle-notes").replaceChildren(...battle.lines.map(s=>{const p=document.createElement("p");p.textContent=s;return p;}));
 $("battle-buttons").innerHTML=choices.map((m,i)=>'<button data-move="'+i+'" '+(Math.min(a.pp[i],m.pp)<=0?"disabled":"")+'><strong>'+esc(m.name)+'</strong><span>'+esc(m.type.toUpperCase())+' · '+Math.min(a.pp[i],m.pp)+' PP</span></button>').join("");
 const healing=state.party.map((c,i)=>{
  const potion=c.hp>0&&c.hp<c.maxHp?'<button data-battle-heal="'+i+'" '+(!state.items.potions?"disabled":"")+'>Potion: '+esc(name(c.id))+' · '+c.hp+'/'+c.maxHp+' HP</button>':"";
  const revive=c.hp<=0?'<button data-battle-revive="'+i+'" '+(!state.items.revives?"disabled":"")+'>Revive: '+esc(name(c.id))+'</button>':"";
  return potion+revive;
 }).join("")||"<p>Everybody is healthy. Save your supplies.</p>";
 $("battle-items").innerHTML='<button data-capture="orbs" '+(!canCapture||!state.items.orbs?"disabled":"")+'>Capture Orb ('+state.items.orbs+')</button><button data-capture="superOrbs" '+(!canCapture||!state.items.superOrbs?"disabled":"")+'>Prism Orb ('+state.items.superOrbs+')</button><button data-flee '+(!canCapture?"disabled":"")+'>Run</button><details class="battle-healing"><summary>Healing · '+state.items.potions+' potions / '+state.items.revives+' revives</summary><div>'+healing+'</div></details>';
 $("battle-switch").innerHTML=state.party.map((c,i)=>'<button data-switch="'+i+'" '+(i===0||c.hp<=0?"disabled":"")+'>'+esc(name(c.id))+' Lv.'+c.level+' · '+c.hp+' HP</button>').join("");
 sprite(a.id,"ally-sprite");sprite(b.id,"enemy-sprite");
}
function render(){
 $("location").textContent=zone();$("coordinates").textContent=state.x+", "+state.y;
 $("money").textContent=state.coins;$("badges").textContent=state.badges.length+" / 3 Crests";
 $("party-summary").textContent=state.party.length?state.party.map(c=>name(c.id)+" Lv."+c.level+(c.hp?"":" ✕")).join(" · "):"Choose a starter to begin";
 $("progress").textContent="Seen "+state.seen.length+" / "+Object.keys(SPECIES).length+" · Captured "+state.caught.length;
 draw();
}
function openMenu(type){
 if(battle)return;
 modal=type;$("menu").hidden=false;$("menu-title").textContent={party:"Creature Party",box:"Storage Box",dex:"Field Bestiary",map:"World Map",shop:"Supply Shop",guide:"Adventure Journal"}[type]||"Menu";
 const area=$("menu-body");
 if(type==="party"){
  area.innerHTML=state.party.map((c,i)=>'<div class="creature-line"><strong>'+esc(name(c.id))+' · Lv.'+c.level+'</strong><small>'+esc(sp(c.id)[1])+' · '+c.hp+'/'+c.maxHp+' HP · XP '+c.xp+'/'+expreq(c.level)+'</small>'+hpbar(c)+'<div class="inline-actions"><button data-lead="'+i+'" '+(i===0||c.hp<=0?"disabled":"")+'>Lead</button><button data-potion="'+i+'" '+(!state.items.potions||c.hp===c.maxHp||c.hp===0?"disabled":"")+'>Potion</button><button data-revive="'+i+'" '+(!state.items.revives||c.hp?"disabled":"")+'>Revive</button><button data-store="'+i+'" '+(state.party.length<=1?"disabled":"")+'>Store</button></div></div>').join("")||"<p>No creatures yet.</p>";
  area.innerHTML+='<p>Potions: '+state.items.potions+' · Revives: '+state.items.revives+'</p>';
 }else if(type==="box"){
  area.innerHTML='<p>Stored '+state.box.length+' / 200 creatures. Captures overflow here when your six-member party is full. Legendary creatures cannot be released.</p>'+(state.box.map((c,i)=>'<div class="creature-line"><strong>'+esc(name(c.id))+' · Lv.'+c.level+'</strong><small>'+c.hp+'/'+c.maxHp+' HP</small><div class="inline-actions"><button data-withdraw="'+i+'" '+(state.party.length>=6?"disabled":"")+'>Add to party</button><button data-release="'+i+'" '+(SHRINES.some(shrine=>shrine.id===c.id)?"disabled":"")+'>Release</button></div></div>').join("")||"<p>Storage is empty.</p>");
 }else if(type==="dex"){
  area.innerHTML='<p>'+state.caught.length+' captured · '+state.seen.length+' seen of '+Object.keys(SPECIES).length+' original species.</p><div class="dex-controls"><label>Search known creatures<input id="dex-search" type="search" placeholder="Name or bestiary number" autocomplete="off"></label><label>Collection<select id="dex-status-filter"><option value="all">All creatures</option><option value="seen">Discovered</option><option value="caught">Captured</option><option value="missing">Undiscovered</option></select></label></div><p id="dex-count" role="status" aria-live="polite"></p><div id="dex-entries" class="dex-list">'+Object.keys(SPECIES).map((id,i)=>'<div data-dex-id="'+id+'" data-dex-number="'+String(i+1).padStart(3,"0")+'" class="'+(state.caught.includes(id)?"caught":state.seen.includes(id)?"seen":"unknown")+'"><span>#'+String(i+1).padStart(3,"0")+'</span><strong>'+esc(state.seen.includes(id)||state.caught.includes(id)?name(id):"????????")+'</strong><small>'+(state.caught.includes(id)?"Captured":state.seen.includes(id)?"Seen":"Unknown")+'</small></div>').join("")+'</div>';
 }else if(type==="shop"){
  const rows=[["orbs","Capture Orb",30],["superOrbs","Prism Orb",80],["potions","Potion",22],["revives","Revive",65]];
  area.innerHTML='<p>Cinders: '+state.coins+'</p>'+rows.map(row=>'<div class="shop-row"><span><strong>'+row[1]+'</strong> · owned '+state.items[row[0]]+'</span><button data-buy="'+row[0]+'" '+(state.coins<row[2]?"disabled":"")+'>Buy · '+row[2]+'</button></div>').join("");
 }else if(type==="map"){
  area.innerHTML='<p>Pixel map: white and pink = you, yellow = town services, pink = Wardens, purple = sealed or active legendary shrines.</p><canvas id="field-map" width="512" height="'+H*8+'" role="img" aria-label="Cinderwild region map with player location, Wardens and legendary shrines"></canvas><div class="area-list">'+["Cinder Town · Nurse & Shop","Bramble Trail · Warden Briar","Storm Marsh · Captain Volt","Eclipse Ridge · Oracle Nyx"].map((label,i)=>'<p>'+(i===0||state.badges.length>=i?"✓ ":"🔒 ")+esc(label)+'</p>').join("")+'</div><p>Current position: '+state.x+', '+state.y+'. Legend shrines: 54,18 · 59,18 · 62,18. Ashen Village entrance: 8,37 (offline).</p>';
 }else{
  area.innerHTML='<p>You are a field trainer. Choose one of three starter creatures, wander into tall grass for wild encounters, capture and train a party of six, challenge all three Wardens, and fill the Bestiary.</p><p>Controls: arrow keys or WASD to walk, E/Space to interact, M for menu, and touch controls on mobile.</p><p>Three crests: '+state.badges.map(id=>esc(GYMS.find(g=>g.id===id).badge)).join(", ")+'</p><p>Battle victories: '+state.wins+' · Steps: '+state.steps+'</p><div class="inline-actions"><button id="export-save">Export save</button><button id="reset-save">Erase local save</button></div><p class="hint">Offline save is stored only in this browser. Export a backup before clearing site data.</p>';
 }
 if(type==="map")drawFieldMap();
 if(type==="dex")filterBestiary();
}
function closeMenu(){modal="";$("menu").hidden=true;}
function firstRun(){
 if(state.party.length)return;
 $("starter").hidden=false;
 notify("Welcome to Cinderwild! Pick your first companion.");
}
function initialize(){
 $("world").width=VIEW_W*S;$("world").height=VIEW_H*S;
 const drawStarters=()=>{
  for(const id of ["mossbit","embercub","driftfin"])sprite(id,"starter-"+id);
 };
 renderer?.load(()=>{
  render();
  drawStarters();
  if(battle){
   const ally=active();
   if(ally)sprite(ally.id,"ally-sprite");
   sprite(battle.enemy.id,"enemy-sprite");
  }
 });
 if(typeof ResizeObserver==="function"){
  new ResizeObserver(([entry])=>resizeWorld(entry.contentRect.width,entry.contentRect.height)).observe($("world-wrap"));
 }
 if(renderer&&typeof requestAnimationFrame==="function"){
  let lastFrame=0;
  const frame=now=>{
   if(!document.hidden&&!reducedMotion?.matches){
    if(battle&&now-lastFrame>=160){
     const ally=active();
     if(ally)sprite(ally.id,"ally-sprite",Math.floor(now/180)%4);
     sprite(battle.enemy.id,"enemy-sprite",Math.floor(now/180)%4);
     lastFrame=now;
    }else if(!battle&&!modal&&(motion||now-lastFrame>=65)){
     draw(now);
     lastFrame=now;
    }
   }
   requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 }
 drawStarters();
 render();firstRun();
 $("controls").addEventListener("click",e=>{const b=e.target.closest("[data-direction]");if(b){const d=b.dataset.direction;step(d==="left"?-1:d==="right"?1:0,d==="up"?-1:d==="down"?1:0);}if(e.target.closest("#interact"))interact();});
 document.querySelectorAll("[data-menu]").forEach(b=>b.addEventListener("click",()=>openMenu(b.dataset.menu)));
 $("menu-close").addEventListener("click",closeMenu);
 $("starter-options").addEventListener("click",e=>{const b=e.target.closest("[data-starter]");if(!b)return;const id=b.dataset.starter;if(!["mossbit","embercub","driftfin"].includes(id))return;state.party=[make(id,5)];remember(id,true);state.items.orbs=8;$("starter").hidden=true;notify(name(id)+" joins your adventure!");save();render();});
 $("fight").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.move!==undefined)playerMove(Number(b.dataset.move));
  else if(b.dataset.capture)capture(b.dataset.capture);
  else if(b.hasAttribute("data-flee"))flee();
  else if(b.dataset.switch!==undefined)changeLead(Number(b.dataset.switch),true);
  else if(b.dataset.battleHeal!==undefined)usePotion(Number(b.dataset.battleHeal),true);
  else if(b.dataset.battleRevive!==undefined)useRevive(Number(b.dataset.battleRevive),true);
 });
 $("menu-body").addEventListener("input",e=>{if(e.target.id==="dex-search")filterBestiary();});
 $("menu-body").addEventListener("change",e=>{if(e.target.id==="dex-status-filter")filterBestiary();});
 $("menu").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  const val=k=>Number(b.dataset[k]);
  if(b.dataset.lead!==undefined)changeLead(val("lead"));
  else if(b.dataset.potion!==undefined)usePotion(val("potion"));
  else if(b.dataset.revive!==undefined)useRevive(val("revive"));
  else if(b.dataset.store!==undefined){
   const i=val("store");if(state.box.length>=200){notify("Storage is full. Withdraw or release a creature first.");return;}
   if(state.party.length>1&&state.party[i]){state.box.push(state.party.splice(i,1)[0]);save();openMenu("party");}
  }else if(b.dataset.withdraw!==undefined){
   const i=val("withdraw");if(state.party.length<6&&state.box[i]){state.party.push(state.box.splice(i,1)[0]);save();openMenu("box");}
  }else if(b.dataset.release!==undefined){
   const i=val("release"),creature=state.box[i];
   if(!creature||SHRINES.some(shrine=>shrine.id===creature.id))return;
   if(!confirm("Release "+name(creature.id)+" (Lv."+creature.level+") permanently? This cannot be undone."))return;
   state.box.splice(i,1);save();openMenu("box");notify(name(creature.id)+" was released back into the wild.");
  }else if(b.dataset.buy)buy(b.dataset.buy,{orbs:30,superOrbs:80,potions:22,revives:65}[b.dataset.buy]);
  else if(b.id==="export-save"){
   const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
   const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cinderwild-save.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }else if(b.id==="reset-save"){
   if(confirm("Erase your Cinderwild save from this browser? This cannot be undone.")){try{localStorage.removeItem(KEY);}catch{}state=fresh();closeMenu();render();firstRun();}
  }
 });
 window.addEventListener("keydown",e=>{
  if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
  if(e.key==="Escape"){if(modal){e.preventDefault();closeMenu();}return;}
  if($("starter").hidden===false)return;
  if(battle)return;
  if((e.key===" "||e.key==="Enter")&&["BUTTON","SUMMARY","A"].includes(document.activeElement?.tagName))return;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","w","a","s","d","e","m"].includes(e.key))e.preventDefault();
  const k=e.key.toLowerCase();
  if(k==="arrowup"||k==="w")step(0,-1);
  else if(k==="arrowdown"||k==="s")step(0,1);
  else if(k==="arrowleft"||k==="a")step(-1,0);
  else if(k==="arrowright"||k==="d")step(1,0);
  else if(k==="e"||k===" ")interact();
  else if(k==="m"){if(modal)closeMenu();else openMenu("guide");}
 });
 window.addEventListener("pagehide",save);
}
// Cloud progress is a backup of the local single-player save. It is not trusted PvP state.
window.CinderwildGame = Object.freeze({
 hasStarter(){return state.party.length>0;},
 position(){return {x:state.x,y:state.y};},
 setOnlinePeers(players){onlinePeers=Array.isArray(players)?players.slice(0,40).filter(p=>Number.isInteger(p?.x)&&Number.isInteger(p?.y)):[];render();},
 syncOnlinePosition(position){
  if(!position||!Number.isInteger(position.x)||!Number.isInteger(position.y)||!walkable(position.x,position.y)||battle||modal)return false;
  state.x=position.x;state.y=position.y;save();render();return true;
 },
 applyOnlineMove(dx,dy,position){return step(dx,dy,position);},
 snapshot(){return JSON.parse(JSON.stringify(state));},
 isBusy(){return Boolean(battle||modal);},
 restore(raw){
  if(battle||modal||!raw||typeof raw!=="object"||!Array.isArray(raw.party)||!Array.isArray(raw.box))return false;
  if(raw.party.some(c=>!c||!sp(c.id))||raw.box.some(c=>!c||!sp(c.id)))return false;
  if(raw.party.length>6||raw.box.length>200)return false;
  const restored=load(raw);
  if(restored.party.length!==raw.party.length||restored.box.length!==raw.box.length)return false;
  state=restored;
  $("starter").hidden=state.party.length>0;
  save();
  render();
  if(!state.party.length)firstRun();
  return true;
 }
});
initialize();
})();
