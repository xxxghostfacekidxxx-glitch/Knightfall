const $=id=>document.getElementById(id);
const species={mossbit:["Mossbit","✿","grass",14,3],embercub:["Embercub","✹","fire",12,4],driftfin:["Driftfin","◈","water",16,2],gloamlet:["Gloamlet","☾","ghost",10,5],thornspit:["Thornspit","✥","thorn",18,4],zipfang:["Zipfang","ϟ","electric",11,7],grubruckle:["Grubruckle","⬟","stone",22,3],mournwing:["Mournwing","⌁","air",13,6],squibblex:["Squibblex","☄","cosmic",12,5],glorpbot:["Glorpbot","⚙","electric",19,4],noodloid:["Noodloid","〰","cosmic",15,4],blipmoth:["Blipmoth","✧","air",11,6],ashhorn:["Ashhorn","♈","fire",21,7],mossreaper:["Mossreaper","❧","grass",26,6],cryptfin:["Cryptfin","◉","water",28,5],voltmaw:["Voltmaw","ϟ","electric",22,10],squibmarshal:["Squibmarshal","☄","cosmic",25,8],glorpcannon:["Glorpcannon","⚙","electric",34,7],hexpup:["Hexpup","✦","ghost",16,6],starjelly:["Starjelly","✺","cosmic",18,5],gloamshade:["Gloamshade","☽","ghost",23,9],thornmaw:["Thornmaw","✥","thorn",32,8],gravruckle:["Gravruckle","⬟","stone",39,7],doomwing:["Doomwing","⌁","air",27,10],noodlarch:["Noodlarch","〰","cosmic",31,9],bliporacle:["Bliporacle","✧","air",26,11],hexhound:["Hexhound","✦","ghost",30,10],astraljelly:["Astraljelly","✺","cosmic",33,9],minionmouse:["Minion Mouse","🐭","electric",34,11],minivillain:["Mini Villain","♛","ghost",38,12],minieddie:["Mini Eddie","★","fire",42,13]};
// Original chibi hellspawn: asymmetric antennae, crooked horns, oversized eyes,
// jagged little grins and neon infernal palettes. No third-party character art.
const infernalLooks={
 mossbit:["#baff43","#ff59ca",0,"Moss imp; sprouts from cursed graves"],
 embercub:["#ff6d65","#d8ff48",1,"Cinder imp; sneezes sparks"],
 driftfin:["#55d9ed","#ff66c8",2,"Abyssal tadpole demon"],
 gloamlet:["#ac79ff","#d9ff56",3,"Sleepy voidling; steals nightmares"],
 thornspit:["#f85ba5","#b5ff45",4,"Bramble devil; hugs with thorns"],
 zipfang:["#d4ff48","#ff4fba",5,"Static gremlin; bites lightning"],
 grubruckle:["#9b8ca6","#c4ff50",6,"Grave golem; all teeth and pebbles"],
 mournwing:["#8a6af6","#fc7da9",7,"Tiny winged wraith; dramatic screeches"],
 squibblex:["#7cff81","#fa57e6",8,"Alien scout; believes pigeons are Earth generals"],
 glorpbot:["#72dafa","#d7ff4e",9,"Alien vending-machine mech; fires expired coupons"],
 noodloid:["#f9a2ff","#80ffac",10,"Tentacled alien; official invasion accountant"],
 blipmoth:["#c0ff62","#a16cff",11,"Alien signal moth; broadcasts embarrassing secrets"],
 ashhorn:["#ff504a","#caff45",1,"Embercub evolution; horns burn with tax-free fire"],
 mossreaper:["#7ff545","#fa45ba",4,"Mossbit evolution; the cemetery has grown teeth"],
 cryptfin:["#40c7eb","#f46abf",2,"Driftfin evolution; swims through haunted plumbing"],
 voltmaw:["#f5ff45","#fc4ba5",5,"Zipfang evolution; eats power grids for breakfast"],
 squibmarshal:["#72f78b","#e945db",8,"Squibblex evolution; promoted by a pigeon"],
 glorpcannon:["#5bd7fc","#e4ff49",9,"Glorpbot evolution; launches high-velocity coupons"],
 hexpup:["#b385fa","#ff6ec7",3,"Small ghost dog that howls in hexadecimal"],
 starjelly:["#9affd5","#fa8df6",10,"Floating alien jellyfish with a suspicious diploma"],
 gloamshade:["#9665ff","#eaff68",3,"Evolved Gloamlet; steals the shadows of shadows"],
 thornmaw:["#e94ca1","#b6ff3c",4,"Evolved Thornspit; bramble armor and cursed teeth"],
 gravruckle:["#ad9cb8","#d7ff5a",6,"Evolved Grubruckle; a walking cemetery wall"],
 doomwing:["#8255f9","#ff91c3",7,"Evolved Mournwing; screams across dimensions"],
 noodlarch:["#f5a4ff","#70ffc1",10,"Evolved Noodloid; controls the alien paperwork galaxy"],
 bliporacle:["#d7ff65","#a16cff",11,"Evolved Blipmoth; broadcasts tomorrow's disasters"],
 hexhound:["#ba78ff","#ff6fd5",3,"Evolved Hexpup; guards the underworld firewall"],
 astraljelly:["#91ffe5","#f47aff",10,"Evolved Starjelly; floats between black holes"],
 minionmouse:["#a5ff53","#ff4fc8",12,"Tiny crown, enormous ears, and a talent for short-circuiting alien warships."],
 minivillain:["#d57aff","#adff3f",13,"A pocket-sized mastermind with a cape, a crown, and fourteen unnecessarily complicated plans."],
 minieddie:["#ff638e","#caff44",14,"The smallest legend with the biggest heart. His battle cry makes demons reconsider their life choices."]
};
function monsterPortrait(id,size="small"){
 const look=infernalLooks[id]||infernalLooks.gloamlet;
 const [skin,accent,shape]=look;
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.setAttribute("viewBox","0 0 120 120");svg.setAttribute("class","monster-portrait "+size);
 svg.setAttribute("role","img");svg.setAttribute("aria-label",(species[id]?.[0]||"Infernal creature")+" portrait");
 const ns="http://www.w3.org/2000/svg";
 const add=(tag,attrs,parent=svg)=>{const el=document.createElementNS(ns,tag);for(const [key,val] of Object.entries(attrs))el.setAttribute(key,String(val));parent.append(el);return el};
 add("ellipse",{cx:60,cy:108,rx:40,ry:6,fill:"#000",opacity:".35"});
 if([2,3,7,10,11].includes(shape)){add("path",{d:"M35 54 Q4 25 7 72 Q20 67 35 82 M85 54 Q116 25 113 72 Q99 67 85 82",fill:accent,stroke:"#14101c","stroke-width":4})}
 if([0,1,4,5,6].includes(shape)){add("path",{d:"M32 42 Q10 12 18 8 Q36 18 44 38 M76 38 Q91 4 107 11 Q106 31 89 48",fill:accent,stroke:"#17111c","stroke-width":4,"stroke-linejoin":"round"})}
 if(shape>=8){add("path",{d:"M44 36 L36 9 M76 36 L91 7",stroke:accent,"stroke-width":5,"stroke-linecap":"round"});add("circle",{cx:36,cy:9,r:7,fill:accent});add("circle",{cx:91,cy:7,r:7,fill:accent});if(shape===9)add("rect",{x:23,y:37,width:75,height:66,rx:18,fill:skin,stroke:"#17101d","stroke-width":4});if(shape===10)add("path",{d:"M32 85 Q6 92 17 109 M48 91 Q42 116 31 110 M80 89 Q109 119 105 91",fill:"none",stroke:accent,"stroke-width":8,"stroke-linecap":"round"});if(shape===11)add("path",{d:"M24 54 Q0 12 8 85 L30 79 M96 54 Q119 12 113 85 L91 79",fill:accent,stroke:"#17101d","stroke-width":3})}
 if(shape===5)add("path",{d:"M57 35 L66 3 L73 26 L86 12 L81 43",fill:accent,stroke:"#17111c","stroke-width":3});
 if(shape===0)add("path",{d:"M53 30 Q35 0 19 14 M65 29 Q80 1 100 18",fill:"none",stroke:accent,"stroke-width":7,"stroke-linecap":"round"});
 add("path",{d:shape===6?"M24 53 Q30 24 61 26 L90 41 L103 74 L88 99 L43 104 L18 80 Z":"M22 59 Q17 28 54 27 Q95 18 100 60 Q108 103 63 105 Q17 105 22 59Z",fill:skin,stroke:"#17101d","stroke-width":5,"stroke-linejoin":"round"});
 if(shape===12){add("circle",{cx:24,cy:32,r:21,fill:skin,stroke:accent,"stroke-width":4});add("circle",{cx:96,cy:32,r:21,fill:skin,stroke:accent,"stroke-width":4});add("path",{d:"M48 26 L56 10 L65 24 L75 9 L79 29 Z",fill:accent,stroke:"#17101d","stroke-width":3})}
 if(shape===13){add("path",{d:"M21 49 L4 97 L35 91 M99 49 L116 97 L86 91",fill:accent,stroke:"#17101d","stroke-width":4});add("path",{d:"M42 30 L49 9 L61 22 L75 5 L82 30 Z",fill:"#ffdf68",stroke:"#17101d","stroke-width":3})}
 if(shape===14){add("path",{d:"M30 46 Q15 9 37 19 L45 31 M88 43 Q105 4 111 24 L94 51",fill:accent,stroke:"#17101d","stroke-width":4});add("path",{d:"M42 28 Q60 7 78 28",fill:"none",stroke:"#ffdf68","stroke-width":6})}
 add("ellipse",{cx:45,cy:62,rx:17,ry:21,fill:"#faf5fa",stroke:"#1a1021","stroke-width":3});
 add("ellipse",{cx:79,cy:60,rx:12,ry:17,fill:"#faf5fa",stroke:"#1a1021","stroke-width":3});
 add("ellipse",{cx:49,cy:64,rx:6,ry:12,fill:"#17101d"});add("ellipse",{cx:82,cy:62,rx:5,ry:9,fill:"#17101d"});
 add("circle",{cx:51,cy:59,r:2.5,fill:accent});add("circle",{cx:83,cy:58,r:2,fill:accent});
 add("path",{d:"M45 87 Q61 96 84 81 L80 93 L73 89 L67 99 L58 91 L52 97 Z",fill:"#211321",stroke:"#211321","stroke-width":2});
 add("path",{d:"M30 80 L22 84 M94 76 L101 79",stroke:accent,"stroke-width":3,"stroke-linecap":"round"});
 return svg;
}
const evolutions={embercub:["ashhorn",5],mossbit:["mossreaper",5],driftfin:["cryptfin",5],zipfang:["voltmaw",6],squibblex:["squibmarshal",6],glorpbot:["glorpcannon",7],gloamlet:["gloamshade",5],thornspit:["thornmaw",6],grubruckle:["gravruckle",6],mournwing:["doomwing",6],noodloid:["noodlarch",7],blipmoth:["bliporacle",7],hexpup:["hexhound",7],starjelly:["astraljelly",8]};
const typeAdvantages={cosmic:["ghost","air"],fire:["grass","thorn"],water:["fire","stone"],grass:["water","stone"],electric:["water","air"],stone:["fire","electric"],air:["thorn"],thorn:["water"],ghost:["ghost"]};
function typeMultiplier(attacker,defender){return typeAdvantages[attacker]?.includes(defender)?1.5:typeAdvantages[defender]?.includes(attacker)?.75:1}
function evolveCreature(creature){
 const next=evolutions[creature.id];if(!next||creature.level<next[1])return "";
 const previous=creature.name,previousId=creature.id;const [name,icon,type,hp,attack]=species[next[0]];
 creature.id=next[0];creature.name=name;creature.icon=icon;creature.type=type;
 creature.maxHp=Math.max(creature.maxHp+8,hp+(creature.level-1)*2);
 creature.hp=creature.maxHp;creature.attack=Math.max(creature.attack+3,attack);
 seen.add(creature.id);
 document.dispatchEvent(new CustomEvent("hell-high-orbit:evolution",{detail:{from:previousId,to:creature.id,previous,name}}));
 return " "+previous+" EVOLVED into "+name+"!";
}
const specialMoves={fire:["Cinder Burst",1.65],grass:["Grave Bloom",1.55],water:["Abyss Jet",1.55],electric:["Voltage Bite",1.65],cosmic:["Orbital Glitch",1.7],ghost:["Nightmare Ping",1.6],air:["Void Gust",1.55],thorn:["Briar Hex",1.6],stone:["Gravestone Slam",1.6]};
function battleStrike(attacker,defender,special=false,quick=false,movePower=null){
 const multiplier=typeMultiplier(attacker.type,defender.type);
 const power=(attacker.attack+Math.floor(Math.random()*4))*(movePower??(special?(specialMoves[attacker.type]?.[1]||1.5):quick?.8:1));
 const damage=Math.max(1,Math.min(90,Math.round(power*multiplier)));
 defender.hp=Math.max(0,defender.hp-damage);
 return {damage,multiplier};
}
// Offline status rules and battle presentation; staging continues using its own server rules.

// Shared display learnsets. Multiplayer independently validates slots, level and charge on the server.
const moveLearnsets={
 fire:["Cinder Jab","Spark Rush","Inferno Spit","Meteor Meltdown"],
 grass:["Root Tap","Vine Lash","Grave Bloom","Cemetery Collapse"],
 water:["Bubble Bite","Tidal Flick","Abyss Jet","Drowned Moon"],
 electric:["Static Nip","Volt Dash","Voltage Bite","Blackout Storm"],
 cosmic:["Orbit Bop","Star Skip","Orbital Glitch","Galactic Eviction"],
 ghost:["Shadow Poke","Haunt Dash","Nightmare Ping","Eternal Hex"],
 air:["Gust Peck","Sky Dash","Void Gust","Screaming Cyclone"],
 thorn:["Briar Jab","Thorn Rush","Briar Hex","Thousand Needles"],
 stone:["Pebble Bash","Rock Rush","Gravestone Slam","Faultline Fury"]
};
const moveUnlockLevels=[1,1,3,6];
function learnedMoves(creature){
 const names=moveLearnsets[creature?.type]||moveLearnsets.cosmic;
 return names.map((name,index)=>({name:index===3?(speciesMoves[creature?.id]||name):name,level:moveUnlockLevels[index],unlocked:(creature?.level||1)>=moveUnlockLevels[index],charge:index>=2?2:0,power:[1,.8,1.55,1.9][index]}));
}
const speciesMoves={embercub:"Ember Tantrum",ashhorn:"Tax-Free Inferno",mossbit:"Grave Sprout",mossreaper:"Cemetery Bloom",driftfin:"Drainpipe Jet",cryptfin:"Haunted Undertow",zipfang:"Outlet Chomp",voltmaw:"Blackout Bite",squibblex:"Pigeon Protocol",squibmarshal:"Admiral's Override",glorpbot:"Expired Coupon",glorpcannon:"Coupon Barrage",hexpup:"Hexadecimal Howl",starjelly:"Nebula Slap",gloamlet:"Sleep Debt",gloamshade:"Eclipse Debt",thornspit:"Needle Tax",thornmaw:"Briar Execution",grubruckle:"Pebble Audit",gravruckle:"Tombstone Stampede",mournwing:"Dramatic Shriek",doomwing:"Apocalypse Screech",noodloid:"Tentacle Invoice",noodlarch:"Galaxy Garnishment",blipmoth:"Signal Spam",bliporacle:"Future Leak",hexhound:"Firewall Howl",astraljelly:"Black Hole Hug",minionmouse:"Royal Short Circuit",minivillain:"Pocket-Sized Doom",minieddie:"Heartfire Nova"};
function statusName(target){return target.status==="burn"?"BURNED":target.status==="shock"?"SHOCKED":target.status==="poison"?"CURSED":"CLEAR"}
function inflictStatus(attacker,defender){
 if(defender.status||Math.random()>=.3)return "";
 const status={fire:"burn",electric:"shock",ghost:"poison",thorn:"poison"}[attacker.type];
 if(!status)return "";
 defender.status=status;return " "+defender.name+" is "+statusName(defender)+"!";
}
function statusTick(target){
 if(!target.status||target.hp<=0)return "";
 if(target.status==="shock"&&Math.random()<.25)return target.name+" was stunned by static!";
 const amount=Math.max(1,Math.ceil(target.maxHp/12));
 target.hp=Math.max(0,target.hp-amount);
 return target.name+" suffered "+amount+" "+target.status+" damage.";
}
let battleVisual=null;
function showBattleEffect(kind,message,combat={}){
 battleVisual={kind,message};
 document.dispatchEvent(new CustomEvent("hell-high-orbit:effect",{detail:{kind,message,type:save.party?.[0]?.type||"cosmic",species:save.party?.[0]?.id||"",moveIndex:kind==="special"?3:0,...combat}}));
 const panel=$("battle-panel");panel.classList.remove("battle-impact","battle-special","battle-evolution");
 void panel.offsetWidth;panel.classList.add(kind==="evolution"?"battle-evolution":kind==="special"?"battle-special":"battle-impact");
 const effect=$("battle-effect");if(effect){effect.textContent=message;effect.hidden=false}
}
const xpRequired=level=>Math.min(1200,16+Math.max(1,level)*7);
const experienceReward=enemy=>Math.max(8,Math.round((enemy.level||1)*12*(enemy.legendaryId?1.75:enemy.bossId?1.4:1)));
function awardExperience(creature,amount){
 creature.xp=(creature.xp||0)+amount;let result="";
 while(creature.level<100&&creature.xp>=xpRequired(creature.level)){
  creature.xp-=xpRequired(creature.level);creature.level++;creature.maxHp+=2;creature.hp=creature.maxHp;creature.attack++;
  result+=" Level "+creature.level+"!"+evolveCreature(creature);
 }
 return result;
}
const make=(id,level=1)=>{const [name,icon,type,hp,attack]=species[id];return{id,name,icon,type,level,hp:hp+(level-1)*2,maxHp:hp+(level-1)*2,attack,xp:0}};
const obstacles=new Set(["2,2","9,2","2,7","9,7","12,5","15,8","5,10","11,11"]);
const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const walkable=(x,y)=>x>=1&&x<=16&&y>=1&&y<=12&&!obstacles.has(x+","+y)&&!((x===1||x===16)&&y===5);
const grass=(x,y)=>walkable(x,y)&&!((x===4||x===5)&&y>=2&&y<=6)&&!(x===6&&y>=5&&y<=7);
const worldLandmarks=[
 {id:"dish",x:14,y:3,name:"GALACTIC SAUCER PARKING",icon:"🛸",reward:2,report:"The aliens have been fined for parking a mothership across fourteen dimensions. You stole two capture supplies from the glovebox."},
 {id:"tax",x:3,y:10,name:"INFERNAL TAX CATHEDRAL",icon:"🔥",reward:2,report:"A demon accountant mistakes your Appendix 404 for a tax exemption. You receive two capture supplies and an aggressive audit notice."},
 {id:"border",x:13,y:10,name:"FUTURE TREATY BORDER",icon:"⚖",reward:3,report:"You discover the proposed border is a zigzag drawn on a pizza box. Both sides approve it. You salvage three capture supplies."}
];
// Original settlement NPCs: dialogue, exploration errands, and one-time rewards.
const settlementNPCs=[
 {id:"mox",x:6,y:3,name:"MOX THE UNLICENSED MAYOR",faction:"HUMAN RESISTANCE",icon:"📢",target:"dish",reward:3,intro:"My town charter was eaten by a space slug. Bring back evidence of the illegal saucer parking lot!",thanks:"Excellent. We shall file a complaint with the invaders. In triplicate.",done:"The complaint is still pending. The space slug has been promoted."},
 {id:"vex",x:4,y:11,name:"VEX THE INFERNAL CLERK",faction:"HELL'S TAX OFFICE",icon:"😈",target:"tax",reward:3,intro:"Visit our cathedral and verify that Hell is not paying Earth property taxes. This is extremely urgent.",thanks:"The exemption is approved. I am now legally your problem.",done:"Tax season has been extended to eternity. Again."},
 {id:"quibble",x:15,y:10,name:"AMBASSADOR QUIBBLE",faction:"ALIEN TREATY OFFICE",icon:"👽",target:"border",reward:4,intro:"Inspect the future border! Our legal department drew it with a greasy pizza slice.",thanks:"You confirmed the border exists. The treaty is now three percent more official.",done:"Human objections have been filed in the circular recycling chamber."}
];
function npcAt(x,y){return settlementNPCs.find(n=>n.x===x&&n.y===y)}
function speakToNPC(id){
 if(busy||battle)return;
 if(connected){action("npc",{id});return}
 const npc=settlementNPCs.find(n=>n.id===id);
 if(!npc||Math.abs(npc.x-save.x)+Math.abs(npc.y-save.y)>1)return;
 if(!Array.isArray(save.npcIntroductions))save.npcIntroductions=[];
 if(!Array.isArray(save.npcQuestsDone))save.npcQuestsDone=[];
 if(save.npcQuestsDone.includes(id)){log(npc.name+": "+npc.done);return}
 if((save.visitedLandmarks||[]).includes(npc.target)){
  save.npcQuestsDone.push(id);save.bag=(save.bag||0)+npc.reward;
  log(npc.name+": "+npc.thanks+" +"+npc.reward+" capture supplies.");
 }else{
  if(!save.npcIntroductions.includes(id))save.npcIntroductions.push(id);
  log(npc.name+": "+npc.intro);
 }
 persist();render();
}
// Unique legendary encounters: one capture per save, never in ordinary grass rolls.
const legendaryCreatures=[{"id":"minionmouse","name":"Minion Mouse","x":8,"y":8,"steps":25,"level":9,"description":"Tiny crown, enormous ears, and a talent for short-circuiting alien warships."},{"id":"minivillain","name":"Mini Villain","x":14,"y":7,"steps":40,"level":11,"description":"A pocket-sized mastermind with a cape, a crown, and fourteen unnecessarily complicated plans."},{"id":"minieddie","name":"Mini Eddie","x":9,"y":11,"steps":55,"level":13,"description":"The smallest legend with the biggest heart. His battle cry makes demons reconsider their life choices."}];
const legendaryIds=new Set(legendaryCreatures.map(l=>l.id));
function summonLegendary(id){
 if(busy||battle)return;
 if(connected){action("legendary",{id});return}
 const legend=legendaryCreatures.find(l=>l.id===id);
 if(!legend||save.steps<legend.steps||Math.abs(save.x-legend.x)+Math.abs(save.y-legend.y)>1||(save.capturedLegendaries||[]).includes(id)||!save.party.some(p=>p.hp>0))return;
 battle={...make(id,legend.level),legendaryId:id};seen.add(id);save.encounters++;persist();log("LEGENDARY AWAKENED: "+legend.name+"!");render();
}
function renderLegendaries(){
 const board=$("legendary-creatures");if(!board)return;board.replaceChildren();
 for(const legend of legendaryCreatures){
  const row=document.createElement("article");row.className="commander-card legendary-card";
  const detail=document.createElement("div");const name=document.createElement("strong");name.textContent="✦ "+legend.name+" · LEGENDARY";
  const lore=document.createElement("p");lore.textContent=legend.description;
  const btn=document.createElement("button");const caught=(save.capturedLegendaries||[]).includes(legend.id);
  btn.textContent=caught?"CAPTURED ✓":save.steps<legend.steps?"UNLOCKS AT "+legend.steps+" STEPS":"CHALLENGE AT "+legend.x+","+legend.y;
  btn.disabled=busy||!!battle||caught||save.steps<legend.steps||Math.abs(save.x-legend.x)+Math.abs(save.y-legend.y)>1||!save.party.some(p=>p.hp>0);
  btn.addEventListener("click",()=>summonLegendary(legend.id));
  detail.append(name,lore,btn);row.append(monsterPortrait(legend.id,"small"),detail);board.append(row);
 }
 $("legendary-status").textContent=(save.capturedLegendaries||[]).length+"/3 legends captured · Reach their shrines and weaken them before capture";
}
function renderSettlements(){
 const panel=$("settlement-npcs");panel.replaceChildren();
 const completed=save.npcQuestsDone||[];
 for(const npc of settlementNPCs){
  const row=document.createElement("article");row.className="settlement-npc";
  const text=document.createElement("div");const title=document.createElement("strong");title.textContent=npc.icon+" "+npc.name;
  const faction=document.createElement("small");faction.textContent=npc.faction+" · "+npc.x+","+npc.y;
  const status=document.createElement("p");status.textContent=completed.includes(npc.id)?"MISSION COMPLETE":(save.visitedLandmarks||[]).includes(npc.target)?"REPORT READY":npc.intro;
  const button=document.createElement("button");button.textContent=completed.includes(npc.id)?"TALK AGAIN":"TALK / REPORT";
  button.disabled=busy||!!battle||Math.abs(npc.x-save.x)+Math.abs(npc.y-save.y)>1;
  button.addEventListener("click",()=>speakToNPC(npc.id));
  text.append(title,faction,status,button);row.append(text);panel.append(row);
 }
 $("settlement-status").textContent=completed.length+"/"+settlementNPCs.length+" errands completed · Stand next to an NPC to talk";
}
function territory(x,y){
 if(x>=11&&y<=8)return {name:"Galactic Occupation Zone",type:"alien",icon:"☄"};
 if(y>=9&&x<=10)return {name:"Infernal Revenue District",type:"demon",icon:"♨"};
 if(x>=11&&y>=9)return {name:"Disputed Treaty Wasteland",type:"mixed",icon:"⚖"};
 return {name:"Earth · Contested Territory",type:"mixed",icon:"♣"};
}
function visitLandmark(x,y){
 const site=worldLandmarks.find(p=>p.x===x&&p.y===y);
 if(!site)return "";
 if(!Array.isArray(save.visitedLandmarks))save.visitedLandmarks=[];
 if(save.visitedLandmarks.includes(site.id))return "Returned to "+site.name+". The paperwork has multiplied.";
 save.visitedLandmarks.push(site.id);save.bag=(save.bag||0)+site.reward;
 return site.report;
}

const initial=(starter="embercub")=>({x:4,y:4,steps:0,encounters:0,caught:0,badges:0,bag:8,party:[make(starter)]});
let save=initial(),battle=null,version=0,api="",socket=null,connected=false,busy=false,players=new Map(),selfId=null,offlineSave=null,offlineSeen=null,movePending=false,seen=new Set();
try{const cached=JSON.parse(localStorage.getItem("ashfall:cinder-meadow:demo")||"null");if(cached&&walkable(cached.x,cached.y)&&Array.isArray(cached.party)&&cached.party.length&&cached.party.length<=6&&cached.party.every(p=>species[p.id]))save=cached;const savedSeen=JSON.parse(localStorage.getItem("ashfall:cinder-meadow:seen")||"[]");if(Array.isArray(savedSeen))seen=new Set(savedSeen.filter(id=>species[id]))}catch{}
function log(message){$("log").textContent=message;document.dispatchEvent(new CustomEvent("hell-high-orbit:log",{detail:{message}}))}
// Canon: 10% of humans carry the Appendix 404, a cosmic firmware mistake.
// The signal pairs with both demonic sigils and alien command receivers.
const controllerLore={
 title:"THE TEN PERCENT · APPENDIX 404",
 text:"In Year 7½ of the 43rd Yesterday, on Tuesday 92 of Month -3 (fiscal era A.B.C.: After Before Coupons), a galactic firmware update collided with Earth's microwave ovens. Exactly ten percent of humans developed an Appendix 404: a useless-looking organ that broadcasts the universe's default pairing code whenever its owner gets mildly annoyed. Aliens hear an executive override. Demons hear an ancient summoning command. You can order both around, which makes you the most dangerous unpaid intern in the apocalypse.",
 note:"CLASSIFICATION: Dual-Signal Handler · Alien and demon units can join the same party."
};
// The Galactic Bureau of Chronological Misconduct abolished linear time.
// Every five steps advance a day, but the year moves backwards on alternate weeks.
const absurdWeekdays=["Tuesday","Second Tuesday","Pre-Friday","Unlicensed Sunday","Thursday Again","Yesterday","Taxday"];
const absurdMonths=["-3","0","13","Pickle","February II","NULL","8½"];
function nonsenseDate(steps=0){
 const day=Math.floor(Math.max(0,steps)/5);
 const year=7-(Math.floor(day/7)%4)+(Math.floor(day/28)%2?"½":"");
 const weekday=absurdWeekdays[day%absurdWeekdays.length];
 const month=absurdMonths[Math.floor(day/3)%absurdMonths.length];
 return "YEAR "+year+" OF THE 43RD YESTERDAY · "+weekday.toUpperCase()+" "+(92+day)+" · MONTH "+month+" · A.B.C.";
}
const invasionChapters=[
 ["EPISODE 0 · THE APOCALYPSE HAS PAPERWORK","An alien armada arrives to conquer Earth, but its navigation AI mistakes a fast-food drive-through for the United Nations. The invasion fleet demands all dipping sauces. You discover you are one of the ten percent of humans born with an Appendix 404, a biological universal remote that commands BOTH aliens and demons. Unfortunately, nobody installed an off switch."],
 ["EPISODE 1 · HELL HAS ENTERED THE CHAT","Earth's demons refuse to let extraterrestrial weirdos destroy their favorite planet. Their reasons: the pizza, the heavy metal, and a legally binding lease on the moon."],
 ["EPISODE 2 · OPERATION SCREAMING TOASTER","The aliens deploy a planet-sized toaster to turn the oceans into soup. The demon resistance must recruit tiny hellspawn and steal the toaster's power cord."],
 ["EPISODE 3 · THE PIGEON SUPREMACY","Alien commander Squibblex discovers pigeons and assumes they run Earth. The resistance must intercept a peace treaty addressed to a birdbath."],
 ["EPISODE 4 · DEMONS, DOOM AND DISCOUNT COUPONS","A malfunctioning Glorpbot army offers 30% off annihilation. Hell's finest idiots must save Earth before the invasion's quarterly performance review. Neither army intends to return Earth to humanity. The only question is who gets the keys."],
 ["FINAL EPISODE · THE GREAT GALACTIC DIVORCE OF EARTH","After a spectacularly pointless war, demons and aliens sign the Treaty of Two Extremely Bad Landlords. They divide Earth into alien and infernal territories. Hell is welcomed into intergalactic society with full membership, diplomatic immunity, and access to the buffet. Humanity is officially classified as moderately intelligent livestock with excellent snack-making capabilities. No human was invited to negotiate. Both armies call this a victory for peace."]
];
const warBroadcasts=[
 "EARTH NEWS: The alien fleet has declared the moon a parking violation.",
 "HELL PUBLIC RELATIONS: We are not invading. We are conducting an extremely aggressive rescue.",
 "HUMANITY: Please stop using our cities as chess pieces.",
 "ALIEN COMMAND: All humans must report to the nearest condiment processing center.",
 "DEMON COMMAND: The planet is under new management. The screams remain complimentary.",
 "BREAKING: The United Nations has been replaced with three raccoons and a fax machine.",
 "ALIEN SCIENCE: Earth has been classified as a moderately haunted sandwich.",
 "INFERNAL LEGAL NOTICE: Saving Earth does not transfer ownership back to humans.",
 "GALACTIC BREAKING NEWS: Demons and aliens agree to split Earth fifty-fifty. Humanity was not consulted.",
 "TREATY OFFICE: Hell has joined intergalactic society. Humans are now moderately intelligent livestock with excellent snack-making capabilities."
];
// Bureau contracts are intentionally local to the offline preview. Cloud staging is read-only.
const bureauContracts=[
 {id:"microwave",title:"RECALL THE SENTIENT MICROWAVES",issuer:"Galactic Bureau of Chronological Misconduct",need:8,reward:2,brief:"Eight steps of field inspection. Do not make eye contact with the appliances."},
 {id:"pigeons",title:"NEGOTIATE WITH THE PIGEON SENATE",issuer:"Alien Diplomatic Disaster Office",need:20,reward:3,brief:"Find evidence that pigeons do not possess nuclear launch codes."},
 {id:"toaster",title:"AUDIT THE PLANET-SIZED TOASTER",issuer:"Infernal Consumer Protection",need:35,reward:3,brief:"Check the warranty before somebody boils the Pacific."},
 {id:"treaty",title:"FILE HUMANITY'S UNSOLICITED COMPLAINT",issuer:"Intergalactic Property Registry",need:60,reward:5,brief:"Deliver the objection after the treaty is already legally binding."}
];
function renderBureau(){
 const board=$("bureau-contracts");board.replaceChildren();
 const claimed=Array.isArray(save.claimedContracts)?save.claimedContracts:[];
 for(const contract of bureauContracts){
  const card=document.createElement("article");card.className="bureau-contract";
  const heading=document.createElement("strong");heading.textContent=contract.title;
  const issuer=document.createElement("small");issuer.textContent=contract.issuer;
  const brief=document.createElement("p");brief.textContent=contract.brief;
  const button=document.createElement("button");const done=claimed.includes(contract.id),ready=save.steps>=contract.need;
  button.textContent=done?"FILED ✓":ready?"CLAIM "+contract.reward+" CAPTURE SUPPLIES":"UNLOCKS AT "+contract.need+" STEPS";
  button.disabled=busy||!!battle||!ready||done;
  button.addEventListener("click",()=>claimContract(contract.id));
  card.append(heading,issuer,brief,button);board.append(card);
 }
 $("bureau-status").textContent=claimed.length+"/"+bureauContracts.length+" contracts filed · "+(save.bag||0)+" capture supplies available";
}
function claimContract(id){
 if(busy||battle)return;
 if(connected){action("contract",{id});return}
 const contract=bureauContracts.find(c=>c.id===id);
 if(!contract||save.steps<contract.need)return;
 if(!Array.isArray(save.claimedContracts))save.claimedContracts=[];
 if(save.claimedContracts.includes(id))return;
 save.claimedContracts.push(id);save.bag=(save.bag||0)+contract.reward;
 persist();log("BUREAU APPROVED: "+contract.title+". Received "+contract.reward+" capture supplies. No refunds.");render();
}
// Offline-only faction commanders. Each defeated boss is recorded once in the save.
const factionCommanders=[
 {id:"squibblex-prime",species:"squibblex",name:"ADMIRAL SQUIBBLEX PRIME",faction:"GALACTIC INVASION",steps:15,level:5,reward:3,brief:"Insists every pigeon is a decorated enemy admiral."},
 {id:"ember-auditor",species:"embercub",name:"INFERNAL AUDITOR EMBER-9",faction:"HELL'S MIDDLE MANAGEMENT",steps:30,level:7,reward:4,brief:"Will repossess your soul over an incorrectly filed receipt."},
 {id:"glorp-collector",species:"glorpbot",name:"COLLECTOR GLORPBOT 9000",faction:"GALACTIC PROPERTY REGISTRY",steps:45,level:9,reward:5,brief:"Has already sold the Moon to a vending machine."}
];
function renderCommanders(){
 const board=$("faction-commanders");board.replaceChildren();
 const defeated=Array.isArray(save.defeatedCommanders)?save.defeatedCommanders:[];
 for(const boss of factionCommanders){
  const card=document.createElement("article");card.className="commander-card";
  const portrait=monsterPortrait(boss.species,"small");
  const details=document.createElement("div");
  const title=document.createElement("strong");title.textContent=boss.name;
  const faction=document.createElement("small");faction.textContent=boss.faction+" · LV "+boss.level;
  const description=document.createElement("p");description.textContent=boss.brief;
  const button=document.createElement("button");const won=defeated.includes(boss.id);
  button.textContent=won?"DEFEATED ✓":save.steps<boss.steps?"UNLOCKS AT "+boss.steps+" STEPS":"CHALLENGE · +"+boss.reward+" SUPPLIES";
  button.disabled=busy||!!battle||won||save.steps<boss.steps||!save.party.some(p=>p.hp>0);
  button.addEventListener("click",()=>challengeCommander(boss.id));
  details.append(title,faction,description,button);card.append(portrait,details);board.append(card);
 }
 $("commander-status").textContent=defeated.length+"/"+factionCommanders.length+" commanders defeated";
}
function challengeCommander(id){
 if(busy||battle||!save.party.some(p=>p.hp>0))return;
 if(connected){action("commander",{id});return}
 const boss=factionCommanders.find(c=>c.id===id);
 if(!boss||save.steps<boss.steps||(save.defeatedCommanders||[]).includes(id))return;
 battle={...make(boss.species,boss.level),bossId:id,name:boss.name};battleVisual=null;
 seen.add(boss.species);save.encounters++;persist();
 log("COMMANDER CHALLENGE: "+boss.name+" demands a battle. No refunds, no diplomatic immunity.");
 render();
}
function defeatCommander(id){
 const boss=factionCommanders.find(c=>c.id===id);
 if(!boss||connected)return "";
 if(!Array.isArray(save.defeatedCommanders))save.defeatedCommanders=[];
 if(save.defeatedCommanders.includes(id))return "";
 save.defeatedCommanders.push(id);save.bag=(save.bag||0)+boss.reward;
 return " Commander "+boss.name+" defeated! +"+boss.reward+" capture supplies.";
}
function warBroadcast(){return warBroadcasts[Math.floor((save.steps||0)/5)%warBroadcasts.length]}
function currentChapter(){return Math.min(invasionChapters.length-1,Math.floor((save.steps||0)/12))}
function renderStory(){$("absurd-date").textContent=nonsenseDate(save.steps);$("controller-title").textContent=controllerLore.title;$("controller-text").textContent=controllerLore.text;$("controller-note").textContent=controllerLore.note;$("war-broadcast").textContent=warBroadcast();const chapter=invasionChapters[currentChapter()];$("story-title").textContent=chapter[0];$("story-text").textContent=chapter[1];$("story-progress").textContent=currentChapter()===invasionChapters.length-1?"FINAL TRANSMISSION · Treaty signed. Earth partitioned. Humanity reclassified.":"Episode "+(currentChapter()+1)+"/"+invasionChapters.length+" · Walk "+Math.max(0,(currentChapter()+1)*12-(save.steps||0))+" more tiles for the next transmission (offline preview).";}
function persist(){if(connected)return;try{localStorage.setItem("ashfall:cinder-meadow:demo",JSON.stringify(save));localStorage.setItem("ashfall:cinder-meadow:seen",JSON.stringify([...seen]))}catch{}}
function render(){renderStory();renderBureau();renderCommanders();renderSettlements();renderLegendaries();const map=$("world");map.replaceChildren();const width=16,height=12;map.style.gridTemplateColumns="repeat("+width+",minmax(0,1fr))";map.style.aspectRatio=width+"/"+height;for(let y=1;y<=height;y++)for(let x=1;x<=width;x++){const cell=document.createElement("div");const isCamp=x===4&&y===1;cell.className="tile "+(obstacles.has(x+","+y)?"rock":!walkable(x,y)?"wall":isCamp?"camp":grass(x,y)?"grass":"path");cell.setAttribute("role","gridcell");cell.setAttribute("aria-label",x+","+y+(isCamp?" camp":""));const landmark=worldLandmarks.find(p=>p.x===x&&p.y===y);const npc=npcAt(x,y);const zone=territory(x,y);cell.classList.add("zone-"+zone.type);if(landmark){cell.classList.add("landmark");cell.title=landmark.name}if(npc){cell.classList.add("npc");cell.title=npc.name}let icon=isCamp?"⛺":npc?npc.icon:landmark?landmark.icon:obstacles.has(x+","+y)?"◆":grass(x,y)?"♣":"";const other=[...players.values()].find(p=>p.x===x&&p.y===y&&p.userId!==selfId);if(other){cell.classList.add("other");icon="◉";cell.title=other.username}if(save.x===x&&save.y===y){cell.classList.add("player");icon="♟"}const span=document.createElement("span");span.textContent=icon;cell.append(span);map.append(cell)}
 const interact=$("world-interact");if(interact){const nearby=settlementNPCs.find(n=>Math.abs(n.x-save.x)+Math.abs(n.y-save.y)<=1);const atStation=save.x===4&&save.y===1;const atSite=worldLandmarks.find(p=>p.x===save.x&&p.y===save.y);interact.hidden=(!nearby&&!atStation&&!atSite)||!!battle;interact.disabled=busy||!!battle;interact.textContent=atStation?"⌂ Enter field station":atSite?"⌂ Enter "+atSite.name:nearby?"✦ Talk to "+nearby.name:"✦ Talk";interact.dataset.npc=atStation||atSite?"":nearby?.id||"";interact.dataset.action=atStation?"rest":atSite?"site":nearby?"talk":"";interact.dataset.site=atSite?.id||"";}
 $("position").textContent=String(save.x).padStart(2,"0")+", "+String(save.y).padStart(2,"0");$("zone").textContent=territory(save.x,save.y).name;$("territory-status").textContent=territory(save.x,save.y).icon+" "+territory(save.x,save.y).name+" · "+(save.visitedLandmarks||[]).length+"/"+worldLandmarks.length+" landmarks discovered";
 const journal=$("journal");journal.replaceChildren();for(const [id,details] of Object.entries(species)){const item=document.createElement("div");item.className="journal-entry";const owned=save.party.some(p=>p.id===id),discovered=seen.has(id)||owned;item.textContent=(discovered?details[0]:"Unknown hellspawn")+" · "+(owned?"In party":discovered?"Seen":"Undiscovered");if(discovered){item.prepend(monsterPortrait(id,"tiny"));item.title=(infernalLooks[id][2]>=8?"ALIEN · ":"DEMON · ")+infernalLooks[id][3]}journal.append(item)}
 const quest=$("quests");quest.replaceChildren();for(const [label,done] of [["Explore 20 tiles",save.steps>=20],["Discover 3 species",new Set([...seen,...save.party.map(p=>p.id)]).size>=3],["Capture 2 creatures",save.caught>=2],["Visit the camp",save.x===4&&save.y===1],["Pair your Appendix 404 with an alien",save.party.some(p=>infernalLooks[p.id]?.[2]>=8)],["Survive the alien arrival",save.steps>=12],["Intercept the pigeon treaty",save.steps>=36],["Sabotage the cosmic toaster",save.steps>=48],["Witness the Treaty of Two Extremely Bad Landlords",save.steps>=60]]){const item=document.createElement("p");item.className="milestone";item.textContent=(done?"✓ ":"○ ")+label;quest.append(item)}
 $("starter-select").hidden=connected||busy||save.steps!==0||save.encounters!==0||save.caught!==0;$("trainer").textContent="Steps "+save.steps+" · Captured "+save.caught+" · Supplies "+save.bag;
 const party=$("party");party.replaceChildren();const battleParty=$("battle-party");if(battleParty)battleParty.replaceChildren();save.party.forEach((p,i)=>{const line=document.createElement("div");line.className="creature";const label=document.createElement("div");const strong=document.createElement("strong");strong.textContent=p.name+(i===0?" ★":"");label.append(monsterPortrait(p.id));const small=document.createElement("small");small.textContent="Lv "+p.level+" · "+p.type+" · HP "+p.hp+"/"+p.maxHp+" · "+statusName(p)+" · Charge "+(p.energy||0)+"/4 · XP "+(p.xp||0)+"/"+xpRequired(p.level||1)+(evolutions[p.id]?" · Evolves Lv "+evolutions[p.id][1]:"");label.append(strong,small);line.append(label);if(i>0){const btn=document.createElement("button");btn.textContent=battle?"Switch":"Lead";btn.disabled=busy||p.hp<=0;btn.addEventListener("click",()=>battle?action("switch",{index:i}):changeLead(i));line.append(btn);if(battle&&battleParty){const swap=document.createElement("button");swap.type="button";swap.className="battle-switch";swap.disabled=busy||p.hp<=0;swap.textContent=p.name+" · Lv "+p.level+" · HP "+p.hp+"/"+p.maxHp+(p.hp<=0?" · FAINTED":"");swap.addEventListener("click",()=>action("switch",{index:i}));battleParty.append(swap)}}party.append(line)});
 $("battle-panel").hidden=!battle;document.dispatchEvent(new CustomEvent("hell-high-orbit:battle",{detail:battle?{enemy:{id:battle.id,name:battle.name,type:battle.type,level:battle.level,hp:battle.hp,maxHp:battle.maxHp},lead:save.party[0]?{id:save.party[0].id,name:save.party[0].name,type:save.party[0].type,level:save.party[0].level,hp:save.party[0].hp,maxHp:save.party[0].maxHp}:null}:null}));if(!battle&&battleVisual?.kind!=="evolution"){$("battle-effect").hidden=true;}if(battle){$("battle").replaceChildren(monsterPortrait(battle.id,"large"),document.createTextNode(battle.name+" · Lv "+battle.level+" · HP "+battle.hp+"/"+battle.maxHp+" · "+statusName(battle)+" · Your charge "+(save.party[0]?.energy||0)+"/4"));}document.querySelectorAll("[data-action]").forEach(b=>{
 const index=Number(b.dataset.moveSlot);
 if(Number.isInteger(index)&&index>=0&&index<4){
  const move=learnedMoves(save.party[0])[index];
  b.textContent=move.name+(move.unlocked?(move.charge?" · "+move.charge+" charge":""):" · Lv "+move.level);
  b.disabled=busy||!battle||save.party[0]?.hp<=0||!move.unlocked||(save.party[0]?.energy||0)<move.charge;
 }else{
  const names={attack:"Attack · +1 charge",quick:"Quick Strike · +2 charge",special:"Special · 2 charge",guard:"Guard"};
  if(names[b.dataset.action])b.textContent=names[b.dataset.action];
  b.disabled=busy||!battle||(save.party[0]?.hp<=0&&!["flee"].includes(b.dataset.action))||(["special","mend"].includes(b.dataset.action)&&(save.party[0]?.energy||0)<2);
 }
});$("encounter").disabled=busy||!!battle||!grass(save.x,save.y);$("rest").disabled=busy||!!battle||save.x!==4||save.y!==1;$("connection").textContent=connected?"Staging online":"Offline preview";document.body.dataset.gameApiOrigin=connected?api:"";$("players").textContent=connected?"Trainers in meadow: "+(players.size+1):"No live multiplayer connection"}
async function request(path,method="GET",body){const response=await fetch(api+path,{method,credentials:"include",headers:{"content-type":"application/json"},body:body?JSON.stringify(body):undefined});let data;try{data=await response.json()}catch{throw Error("Unexpected server response ("+response.status+")")}if(!response.ok)throw Error(data.error||"Request failed ("+response.status+")");return data}
async function action(name,extra={}){if(busy)return;busy=true;render();try{if(connected){const previousLead=save.party?.[0]?{id:save.party[0].id,name:save.party[0].name}:null;const previousBattle=battle?{id:battle.id,hp:battle.hp,status:battle.status}:null;const data=await request("/api/game/action","POST",{action:name,expected_version:version,...extra});save=data.save;version=data.version;battle=data.battle;if(previousLead&&save.party?.[0]&&previousLead.id!==save.party[0].id&&name!=="switch"){document.dispatchEvent(new CustomEvent("hell-high-orbit:evolution",{detail:{from:previousLead.id,to:save.party[0].id,previous:previousLead.name,name:save.party[0].name}}));}if(battle?.id)seen.add(battle.id);if(data.message?.includes("evolved into"))showBattleEffect("evolution",data.message);else if(["attack","special","quick","move"].includes(name))showBattleEffect(name==="special"||(name==="move"&&extra.index>=2)?"special":"attack",data.message||"Battle action completed",{damage:previousBattle&&(!battle||battle.id===previousBattle.id)?Math.max(0,previousBattle.hp-(battle?.hp??0)):null,target:"enemy",fainted:!!previousBattle&&!battle,status:battle?.status||null});log(data.message||"Action completed")}else offlineAction(name,extra)}catch(e){log(e.message);if(connected&&/version|conflict|session/i.test(e.message))await sync().catch(()=>{})}finally{busy=false;persist();render()}}
function offlineAction(name,extra){const lead=save.party[0];if(name==="rest"){if(save.x!==4||save.y!==1||battle)return;save.party.forEach(p=>{p.hp=p.maxHp;p.status=null;p.energy=0});log("Your party rested at the campfire.");return}if(name==="switch"){const index=extra.index;if(!battle||!Number.isInteger(index)||index<1||index>=save.party.length||save.party[index].hp<=0)return;[save.party[0],save.party[index]]=[save.party[index],save.party[0]];if(lead.hp<=0){log(save.party[0].name+" enters the battle!");return}const counter=Math.max(1,battle.attack+Math.floor(Math.random()*3));save.party[0].hp=Math.max(0,save.party[0].hp-counter);log(save.party[0].name+" switched in and took "+counter+" damage.");if(!save.party.some(p=>p.hp>0)){battle=null;log("Your party fainted.")}return}if(name==="party-lead"){if(battle||save.party[extra.index]?.hp<=0)return;const [p]=save.party.splice(extra.index,1);save.party.unshift(p);log(p.name+" now leads your party.");return}if(name==="start"||name==="encounter-check"){if(battle||!grass(save.x,save.y)||lead.hp<=0)return;if(name==="encounter-check"&&Math.random()>.22)return;const zone=territory(save.x,save.y).type;const wildIds=Object.keys(species).filter(k=>!legendaryIds.has(k));const keys=zone==="alien"?wildIds.filter(k=>infernalLooks[k][2]>=8):zone==="demon"?wildIds.filter(k=>infernalLooks[k][2]<8):wildIds,id=keys[Math.floor(Math.random()*keys.length)],level=1+Math.floor(Math.random()*4);battle=make(id,level);battleVisual=null;seen.add(id);save.encounters++;log((infernalLooks[id][2]>=8?"ALIEN INVASION! ":"HELLSPAWN ALERT! ")+"A wild "+battle.name+" appeared!");return}if(!battle)return;if(name==="flee"){battle=null;log("You retreated safely.");return}if(name==="capture"){if(battle.bossId){log("Commanders are contractually uncatchable. Defeat them instead.");return}if(save.bag<1||save.party.length>=6){log("You need capture supplies and an open party slot.");return}save.bag--;if(Math.random()<Math.min(battle.legendaryId?.35:.9,(battle.legendaryId?.08:.35)+(1-battle.hp/battle.maxHp)*(battle.legendaryId?.3:.55))){if(battle.legendaryId){save.capturedLegendaries||=[];save.capturedLegendaries.push(battle.legendaryId)}save.party.push({...battle,legendaryId:undefined});save.caught++;log(battle.name+" joined your party!");battle=null}else log("The creature broke free.");return}if(name==="move"){
 const index=extra.index;
 const chosen=Number.isInteger(index)&&index>=0&&index<4?learnedMoves(lead)[index]:null;
 if(!Number.isInteger(index)||index<0||index>3||!chosen||!chosen.unlocked){log("That move is not unlocked yet.");return}
 name=index===0?"attack":index===1?"quick":"special";
 extra.moveName=chosen.name;extra.movePower=chosen.power;
}
if(["attack","special","guard","quick","mend"].includes(name)){if(lead.hp<=0){log("Your lead creature has fainted.");return}const guarding=name==="guard",quick=name==="quick",mending=name==="mend";const charged=name==="special";if(charged){if((lead.energy||0)<2){log("Not enough charge. Attack twice to power a special move.");return}lead.energy-=2}else if(!guarding&&!mending)lead.energy=Math.min(4,(lead.energy||0)+(quick?2:1));if(mending){if((lead.energy||0)<2){log("Recovery needs two charge.");return}lead.energy-=2;const healed=Math.min(lead.maxHp-lead.hp,Math.max(3,Math.ceil(lead.maxHp*.3)));lead.hp+=healed;lead.status=null;log(lead.name+" used Second Wind and healed "+healed+" HP.");}const {damage,multiplier}=guarding||mending?{damage:0,multiplier:1}:battleStrike(lead,battle,charged,quick,extra.movePower??null);const effect=charged?inflictStatus(lead,battle):"";if(!guarding&&!mending)showBattleEffect(charged?"special":"attack",(extra.moveName||(charged?(speciesMoves[lead.id]||specialMoves[lead.type]?.[0]||"Special"):quick?"QUICK STRIKE":"ATTACK"))+" · "+damage+" DAMAGE"+effect,{damage,multiplier,target:"enemy",fainted:battle.hp===0,status:battle.status||null});if(battle.hp===0){const evolutionMessage=awardExperience(lead,experienceReward(battle));const commanderReward=battle.bossId?defeatCommander(battle.bossId):"";if(evolutionMessage.includes("EVOLVED"))showBattleEffect("evolution",evolutionMessage.trim());log("Victory! "+lead.name+" earned experience."+evolutionMessage+commanderReward);battle=null}else{const enemyStatus=statusTick(battle);if(battle.hp<=0){const evolutionMessage=awardExperience(lead,battle.level*12);const commanderReward=battle.bossId?defeatCommander(battle.bossId):"";if(evolutionMessage.includes("EVOLVED"))showBattleEffect("evolution",evolutionMessage.trim());log("Victory by status damage!"+evolutionMessage+commanderReward);battle=null;return}const counter=Math.max(1,Math.ceil((battle.attack+Math.floor(Math.random()*3))*(guarding?.35:1)));lead.hp=Math.max(0,lead.hp-counter);const playerStatus=statusTick(lead);if(!lead.hp){if(save.party.some((p,i)=>i>0&&p.hp>0))log(lead.name+" fainted! Choose a healthy creature below to continue.");else{log("All your creatures fainted. Return to camp.");battle=null}}else log(guarding?lead.name+" guarded! Incoming damage reduced to "+counter+".":lead.name+" used "+(charged?specialMoves[lead.type]?.[0]||"Special":"Attack")+" for "+damage+" damage."+(multiplier>1?" Super effective!":multiplier<1?" Resisted.":"")+" Enemy dealt "+counter+". "+enemyStatus+" "+playerStatus)}}}
async function sync(){const data=await request("/api/game/save");if(data.save){save=data.save;version=data.version}else{const created=await request("/api/game/save","PUT",{expected_version:0,save:initial()});save=created.save;version=created.version}const status=await request("/api/game/action","POST",{action:"status",expected_version:version});battle=status.battle;save=status.save;version=status.version;if(battle?.id)seen.add(battle.id);render()}
async function move(direction){if(busy||battle||document.body.classList.contains("pause-open")||document.body.classList.contains("dialogue-open")||document.body.classList.contains("interior-open"))return;const delta=dirs[direction];if(!delta)return;const x=save.x+delta[0],y=save.y+delta[1];if(!walkable(x,y)){log("The path is blocked.");return}if(connected){if(movePending)return;if(!socket||socket.readyState!==WebSocket.OPEN){log("Multiplayer connection lost. Reconnect before moving.");return}movePending=true;socket.send(JSON.stringify({type:"move",direction}));setTimeout(()=>{movePending=false},350);return}save.x=x;save.y=y;save.steps++;const discovery=visitLandmark(x,y);persist();render();if(discovery){log(discovery);return}const nearby=settlementNPCs.find(n=>Math.abs(n.x-x)+Math.abs(n.y-y)===1);if(nearby){log("Nearby: "+nearby.name+". Tap Talk to speak.");return}if(grass(x,y))await action("encounter-check");else log(x===4&&y===1?"Campfire reached. Rest your creatures here.":"Exploring "+territory(x,y).name+".")}
async function changeLead(index){await action("party-lead",{index})}
function disconnect(){connected=false;const old=socket;socket=null;if(old)old.close();players.clear();selfId=null;api="";battle=null;version=0;movePending=false;if(offlineSave){save=offlineSave;offlineSave=null}if(offlineSeen){seen=offlineSeen;offlineSeen=null}log("Offline preview. Cloud progress stays on staging.");render()}
async function connect(){if(busy||connected)return;let url;try{url=new URL($("endpoint").value.trim());if(url.protocol!=="https:"&&!["localhost","127.0.0.1"].includes(url.hostname))throw Error("Use HTTPS for staging");if(url.pathname!=="/")throw Error("Enter only the API origin");}catch(e){log("Enter a valid HTTPS staging API origin.");return}busy=true;offlineSave=structuredClone(save);offlineSeen=new Set(seen);api=url.origin;render();try{await sync();const wsUrl=api.replace(/^http/,"ws")+"/api/game/world";const ws=new WebSocket(wsUrl);socket=ws;ws.addEventListener("open",()=>{connected=true;log("Connected to Hell & High Orbit staging.");render()});ws.addEventListener("message",async event=>{let data;try{data=JSON.parse(event.data)}catch{return}if(data.type==="world-ready"){movePending=false;selfId=data.you.userId;save.x=data.you.x;save.y=data.you.y;save.steps=data.you.steps;version=data.you.version;players=new Map((data.players||[]).map(p=>[p.userId,p]));render()}else if(data.type==="player-moved"){if(data.player.userId===selfId){movePending=false;save.x=data.player.x;save.y=data.player.y;save.steps=data.player.steps;version=data.player.version;save.bag=data.player.bag??save.bag;save.visitedLandmarks=data.player.visitedLandmarks||save.visitedLandmarks;if(data.player.discovery)log("Landmark discovered! +"+data.player.discovery.reward+" capture supplies.");if(grass(save.x,save.y))await action("encounter-check")}else players.set(data.player.userId,data.player);render()}else if(data.type==="player-joined"){players.set(data.player.userId,data.player);render()}else if(data.type==="player-left"){players.delete(data.userId);render()}else if(data.type==="world-save-conflict"){log("Cloud progress changed. Reloading.");await sync().catch(e=>log(e.message))}else if(data.type==="move-blocked"){movePending=false;log("That path is blocked.")}});ws.addEventListener("close",()=>{if(socket===ws){connected=false;players.clear();movePending=false;version=0;api="";battle=null;if(offlineSave){save=offlineSave;offlineSave=null}if(offlineSeen){seen=offlineSeen;offlineSeen=null}log("Staging world disconnected. Offline preview restored.");render()}});ws.addEventListener("error",()=>log("Staging WebSocket failed. Check account, allowed origin, and deployment."))}catch(e){api="";if(offlineSave){save=offlineSave;offlineSave=null}if(offlineSeen){seen=offlineSeen;offlineSeen=null}log("Staging connection failed: "+e.message)}finally{busy=false;render()}}
document.querySelectorAll("[data-starter]").forEach(b=>b.addEventListener("click",()=>{if(connected||busy||save.steps!==0||save.encounters!==0||save.caught!==0)return;save=initial(b.dataset.starter);seen=new Set([b.dataset.starter]);persist();render();log("Your journey begins with "+save.party[0].name+".")}));
$("reset-preview").addEventListener("click",()=>{if(connected||busy){log("Disconnect from staging before resetting your offline preview.");return}if(!confirm("Reset offline creature progress and journal? This cannot be undone."))return;save=initial();seen=new Set();battle=null;persist();render();log("Offline preview reset.");});
$("world-interact")?.addEventListener("click",()=>{const button=$("world-interact");if(document.body.classList.contains("pause-open")||document.body.classList.contains("dialogue-open"))return;if(button.dataset.action==="rest")document.dispatchEvent(new CustomEvent("hell-high-orbit:enter-station",{detail:{kind:"station"}}));else if(button.dataset.action==="site"&&button.dataset.site)document.dispatchEvent(new CustomEvent("hell-high-orbit:enter-station",{detail:{kind:button.dataset.site}}));else if(button.dataset.npc)speakToNPC(button.dataset.npc)});document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("click",()=>move(b.dataset.move)));document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>b.dataset.moveSlot!==undefined?action("move",{index:Number(b.dataset.moveSlot)}):action(b.dataset.action)));$("rest").addEventListener("click",()=>action("rest"));
document.addEventListener("hell-high-orbit:station-heal",()=>{if(save.x===4&&save.y===1&&!battle)action("rest")});$("encounter").addEventListener("click",()=>action("start"));$("connect").addEventListener("click",connect);$("disconnect").addEventListener("click",disconnect);
document.addEventListener("keydown",e=>{if(e.altKey||e.ctrlKey||e.metaKey||document.body.classList.contains("pause-open")||document.body.classList.contains("dialogue-open")||document.body.classList.contains("interior-open")||["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;const key={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",s:"down",a:"left",d:"right",W:"up",S:"down",A:"left",D:"right"}[e.key];if(key){e.preventDefault();move(key)}});
/* Touchscreen exploration: one tile per swipe, without accidental page scrolling. */
const gameScreen=document.querySelector(".game-screen");
if(gameScreen){
 let swipe=null;
 gameScreen.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"||battle||document.body.classList.contains("pause-open")||document.body.classList.contains("dialogue-open"))return;
  swipe={x:e.clientX,y:e.clientY,id:e.pointerId};
 },{passive:true});
 gameScreen.addEventListener("pointerup",e=>{
  if(!swipe||swipe.id!==e.pointerId)return;
  const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  move(Math.abs(dx)>Math.abs(dy)?dx>0?"right":"left":dy>0?"down":"up");
 },{passive:true});
 gameScreen.addEventListener("pointercancel",()=>{swipe=null});
}
render();