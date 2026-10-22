(() => {
  "use strict";
  const SAVE_KEY = "ashfall.monster-mmo.prototype.v1";
  const W = 12;
  const H = 10;
  const map = document.getElementById("world-map");
  const log = document.getElementById("event-log");
  const encounterPanel = document.getElementById("encounter-panel");
  const creatures = [
    { id:"mossbit", name:"Mossbit", type:"grass", icon:"✿", hp:14, attack:3, description:"A curious little sprout with a stubborn streak." },
    { id:"embercub", name:"Embercub", type:"fire", icon:"✹", hp:12, attack:4, description:"A warm-furred cub with sparks dancing along its ears." },
    { id:"driftfin", name:"Driftfin", type:"water", icon:"◈", hp:16, attack:2, description:"A glassy-eyed creek dweller that moves like a ripple." },
    { id:"gloamlet", name:"Gloamlet", type:"ghost", icon:"☾", hp:10, attack:5, description:"A shy dusk spirit that seems to slip between shadows." }
  ];
  const terrain = [
    "tttttttttttt",
    "tgggggggggt t".replaceAll(" ",""),
    "tgggppgggggt",
    "tgggppgggggt",
    "tgggppgggggt",
    "tggggppggggt",
    "tggggppggggt",
    "tggggggggggt",
    "tggggggggggt",
    "tttttttttttt"
  ];
  const blocked = new Set(["0,0","11,0","0,9","11,9","2,2","9,2","2,7","9,7"]);
  const state = {
    x:4,y:4,steps:0,encounters:0,caught:0,badges:0,battle:null,
    party:[{id:"embercub",name:"Embercub",type:"fire",icon:"✹",level:5,hp:18,maxHp:18,attack:5}],
    bag:8
  };
  function save(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify({...state,battle:null})); } catch (_) {} }
  function load(){ try { const data=JSON.parse(localStorage.getItem(SAVE_KEY)||"null"); if(!data||!Array.isArray(data.party)||!data.party.length)return; state.x=Math.max(1,Math.min(W-2,Number(data.x)||4));state.y=Math.max(1,Math.min(H-2,Number(data.y)||4));state.steps=Number(data.steps)||0;state.encounters=Number(data.encounters)||0;state.caught=Number(data.caught)||0;state.badges=Number(data.badges)||0;state.party=data.party.slice(0,6);state.bag=Math.max(0,Number(data.bag)||0); } catch (_) {} }
  function note(message){const li=document.createElement("li");li.textContent=message;log.prepend(li);while(log.children.length>7)log.lastElementChild.remove();}
  function tileAt(x,y){if(y===0||y===H-1||x===0||x===W-1)return "tree";if((x===4||x===5)&&y>=2&&y<=6)return "path";if((x===6)&&y>=5&&y<=7)return "path";if((x===1||x===10)&&y===5)return "water";if(blocked.has(x+","+y))return "rock";return "grass";}
  function renderMap(){map.replaceChildren();for(let y=0;y<H;y++){for(let x=0;x<W;x++){const cell=document.createElement("div");cell.className="map-tile "+tileAt(x,y);cell.setAttribute("aria-hidden","true");if(x===state.x&&y===state.y){cell.classList.add("player-tile");const sprite=document.createElement("span");sprite.className="player-sprite";cell.append(sprite);}map.append(cell);}}document.getElementById("coordinates").textContent="X "+String(state.x+1).padStart(2,"0")+" / Y "+String(state.y+1).padStart(2,"0");}
  function renderParty(){const list=document.getElementById("party-list");list.replaceChildren();state.party.forEach(c=>{const row=document.createElement("div");row.className="party-creature";const token=document.createElement("span");token.className="creature-token "+c.type;token.textContent=c.icon;const info=document.createElement("div");info.className="creature-info";const name=document.createElement("strong");name.textContent=c.name;const small=document.createElement("small");small.textContent="HP "+c.hp+" / "+c.maxHp;const hp=document.createElement("div");hp.className="hp-mini";const bar=document.createElement("span");bar.style.width=Math.max(0,Math.min(100,c.hp/c.maxHp*100))+"%";hp.append(bar);info.append(name,small,hp);const level=document.createElement("span");level.className="level-tag";level.textContent="Lv. "+c.level;row.append(token,info,level);list.append(row);});document.getElementById("party-count").textContent=state.party.length+" / 6";document.getElementById("trainer-catches").textContent=state.caught;}
  function render(){renderMap();renderParty();document.getElementById("trainer-badges").textContent=state.badges;document.getElementById("world-state").textContent=state.battle?"In battle":"Exploring";}
  function move(dir){if(state.battle)return;const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!delta)return;const nx=state.x+delta[0],ny=state.y+delta[1];if(nx<1||nx>W-2||ny<1||ny>H-2||tileAt(nx,ny)==="rock"||tileAt(nx,ny)==="tree"||tileAt(nx,ny)==="water"){note("The terrain blocks that route.");return;}state.x=nx;state.y=ny;state.steps++;render();if(tileAt(nx,ny)==="grass"&&Math.random()<.22)startEncounter();else if(state.steps%6===0)note("The route is quiet. Something rustles in the grass nearby.");save();}
  function startEncounter(){if(state.battle)return;const base=creatures[Math.floor(Math.random()*creatures.length)];state.battle={...base,hp:base.hp,maxHp:base.hp};state.encounters++;encounterPanel.hidden=false;document.getElementById("encounter-art").className="encounter-art "+base.type;document.getElementById("encounter-art").textContent=base.icon;document.getElementById("encounter-title").textContent="Wild "+base.name+"!";document.getElementById("encounter-description").textContent=base.description;document.getElementById("capture-btn").textContent="Capture · "+state.bag;note("A wild "+base.name+" appeared in the grass!");renderBattle();render();}
  function renderBattle(){if(!state.battle)return;const b=state.battle;document.getElementById("wild-hp-bar").style.width=Math.max(0,b.hp/b.maxHp*100)+"%";document.getElementById("wild-hp-text").textContent="HP "+b.hp+" / "+b.maxHp;document.getElementById("capture-btn").disabled=state.bag<1;document.getElementById("capture-btn").style.opacity=state.bag<1?".5":"1";}
  function finishBattle(message){note(message);state.battle=null;encounterPanel.hidden=true;render();save();}
  function attack(){const b=state.battle,lead=state.party[0];if(!b||!lead)return;const damage=Math.max(1,lead.attack+Math.floor(Math.random()*4));b.hp=Math.max(0,b.hp-damage);note(lead.name+" dealt "+damage+" damage.");if(b.hp<=0){lead.level+=1;lead.maxHp+=2;lead.hp=lead.maxHp;finishBattle(b.name+" fled after the knockout. "+lead.name+" reached level "+lead.level+".");return;}const counter=Math.max(1,b.attack+Math.floor(Math.random()*3));lead.hp=Math.max(1,lead.hp-counter);note(b.name+" counterattacked for "+counter+" damage. Your lead creature hangs on.");render();renderBattle();save();}
  function capture(){const b=state.battle;if(!b||state.bag<1||state.party.length>=6)return;if(Math.random()<.42+(1-b.hp/b.maxHp)*.48){state.party.push({id:b.id,name:b.name,type:b.type,icon:b.icon,level:Math.max(2,Math.floor(Math.random()*4)+2),hp:b.maxHp,maxHp:b.maxHp,attack:b.attack});state.caught++;state.bag--;finishBattle(b.name+" joined your party!");}else{state.bag--;note(b.name+" broke free. Capture supplies left: "+state.bag+".");renderBattle();save();}}
  function retreat(){if(!state.battle)return;finishBattle("You retreated safely. The route is still waiting.");}
  document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>move(button.dataset.move)));
  document.getElementById("attack-btn").addEventListener("click",attack);
  document.getElementById("capture-btn").addEventListener("click",capture);
  document.getElementById("run-btn").addEventListener("click",retreat);
  document.getElementById("reset-save").addEventListener("click",()=>{if(!window.confirm("Reset this browser's local prototype progress?"))return;try{localStorage.removeItem(SAVE_KEY);}catch(_){}location.reload();});
  window.addEventListener("keydown",event=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(event.key)){if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;event.preventDefault();const key=event.key.toLowerCase();move(({arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"})[key]);}});
  load();render();note("Local prototype save loaded. Find tall grass to trigger an encounter.");
})();