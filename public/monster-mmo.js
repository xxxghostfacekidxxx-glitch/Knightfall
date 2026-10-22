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
    { id:"gloamlet", name:"Gloamlet", type:"ghost", icon:"☾", hp:10, attack:5, description:"A shy dusk spirit that seems to slip between shadows." },
    { id:"thornspit", name:"Thornspit", type:"thorn", icon:"✥", hp:18, attack:4, description:"A spiteful bramble brute that launches seed-spines when cornered." },
    { id:"zipfang", name:"Zipfang", type:"electric", icon:"ϟ", hp:11, attack:7, description:"A jittery alley-runner that crackles with stolen stormlight." },
    { id:"grubruckle", name:"Grubruckle", type:"stone", icon:"⬟", hp:22, attack:3, description:"A stubborn burrow tank with a shell like broken pavement." },
    { id:"mournwing", name:"Mournwing", type:"air", icon:"⌁", hp:13, attack:6, description:"A ragged dusk glider that rides the wind through abandoned places." }
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
    party:[{id:"embercub",name:"Embercub",type:"fire",icon:"✹",level:5,xp:0,hp:18,maxHp:18,attack:5}],
    bag:8
  };
  const API_BASE = window.ASH_FALL_API_BASE || "https://api.ash-fall.com";
  let cloudVersion = 0;
  let cloudEnabled = false;
  let cloudReady = false;
  let cloudQueue = Promise.resolve();
  let worldSocket = null;
  let worldConnected = false;
  let worldUserId = null;
  const remotePlayers = new Map();
  function snapshot(){return {x:state.x,y:state.y,steps:state.steps,encounters:state.encounters,caught:state.caught,badges:state.badges,party:state.party.map(c=>({id:c.id,level:c.level,xp:c.xp||0,hp:c.hp})),bag:state.bag};}
  function save(syncCloud=true){
    const local={...state,battle:null};
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(local)); } catch (_) {}
    if(!syncCloud||!cloudEnabled||!cloudReady)return Promise.resolve();
    const payload=snapshot();
    cloudQueue=cloudQueue.then(async()=>{
      const response=await fetch(API_BASE+"/api/game/save",{method:"PUT",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify({save:payload,expected_version:cloudVersion})});
      const data=await response.json().catch(()=>({}));
      if(response.status===409&&data.conflict){cloudEnabled=false;note("Cloud save conflict detected. This session stays local to protect the other session's progress.");setCloudStatus("SAVE CONFLICT");return;}
      if(!response.ok){if(response.status===401){cloudEnabled=false;setCloudStatus("LOCAL SAVE");}else note("Cloud save failed. Local progress is still safe in this browser.");return;}
      cloudVersion=Number(data.version)||cloudVersion;
      setCloudStatus("CLOUD SAVE · SYNCED");
    }).catch(()=>{note("Cloud sync is unavailable. Local progress remains saved.");setCloudStatus("LOCAL SAVE");});
    return cloudQueue;
  }
  async function cloudAction(action,payload={}){
    if(!cloudEnabled||!cloudReady)return null;
    cloudQueue=cloudQueue.then(async()=>{
      const response=await fetch(API_BASE+"/api/game/action",{method:"POST",credentials:"include",headers:{"content-type":"application/json"},body:JSON.stringify({action,expected_version:cloudVersion,...payload})});
      const data=await response.json().catch(()=>({}));
      if(response.status===409&&data.conflict){cloudEnabled=false;setCloudStatus("SAVE CONFLICT");note("Online save conflict detected. Reload cloud progress before continuing.");return null;}
      if(!response.ok){note(data.error||"Online action failed.");return null;}
      if(data.save){const remote=data.save;state.x=remote.x;state.y=remote.y;state.steps=remote.steps;state.encounters=remote.encounters;state.caught=remote.caught;state.badges=remote.badges;state.bag=remote.bag;state.party=remote.party.map(c=>{const base=creatures.find(item=>item.id===c.id);return {...base,level:c.level,xp:Number(c.xp)||0,hp:c.hp,maxHp:c.maxHp,attack:c.attack};});}
      state.battle=data.battle||null;
      if(action!=="status")cloudVersion=Number(data.version)||cloudVersion;
      try{localStorage.setItem(SAVE_KEY,JSON.stringify({...state,battle:null}));}catch(_){}
      if(data.message)note(data.message);
      if(state.battle){encounterPanel.hidden=false;const b=state.battle;document.getElementById("encounter-art").className="encounter-art "+b.type;setCreatureArt(b.id,b.name);document.getElementById("encounter-title").textContent="Wild "+b.name+"!";document.getElementById("encounter-description").textContent=b.description||"A wild creature blocks the path.";}
      else encounterPanel.hidden=true;
      document.getElementById("capture-btn").textContent="Capture · "+state.bag;
      render();renderBattle();setCloudStatus("CLOUD SAVE · SYNCED");
      return data;
    }).catch(()=>{note("The online game service is unavailable. Your last local save remains intact.");return null;});
    return cloudQueue;
  }
  function setCloudStatus(label){const node=document.getElementById("save-status");if(node)node.textContent=label;}
  async function syncCloudSave(){
    setCloudStatus("CHECKING ACCOUNT…");
    try{
      const response=await fetch(API_BASE+"/api/game/save",{method:"GET",credentials:"include",headers:{"accept":"application/json"}});
      if(response.status===401){cloudEnabled=false;cloudReady=true;setCloudStatus("LOCAL SAVE · SIGN IN TO SYNC");return;}
      if(!response.ok)throw new Error("Cloud save endpoint unavailable");
      const data=await response.json();
      cloudEnabled=true;cloudReady=true;cloudVersion=Number(data.version)||0;
      if(data.save){
        const remote=data.save;
        state.x=remote.x;state.y=remote.y;state.steps=remote.steps;state.encounters=remote.encounters;state.caught=remote.caught;state.badges=remote.badges;state.bag=remote.bag;
        state.party=remote.party.map(c=>{const base=creatures.find(s=>s.id===c.id);return {...base,level:c.level,xp:Number(c.xp)||0,hp:c.hp,maxHp:c.maxHp,attack:c.attack};});
        try{localStorage.setItem(SAVE_KEY,JSON.stringify({...state,battle:null}));}catch(_){}
        render();note("Your Ash-Fall cloud save has been loaded.");
        setCloudStatus("CLOUD SAVE · SYNCED");
      }else{
        setCloudStatus("CLOUD SAVE · NEW PROFILE");
        await save();
      }
    }catch(_){cloudEnabled=false;cloudReady=true;setCloudStatus("LOCAL SAVE · CLOUD OFFLINE");}
  }
  function load(){ try { const data=JSON.parse(localStorage.getItem(SAVE_KEY)||"null"); if(!data||!Array.isArray(data.party)||!data.party.length)return; state.x=Math.max(1,Math.min(W-2,Number(data.x)||4));state.y=Math.max(1,Math.min(H-2,Number(data.y)||4));state.steps=Number(data.steps)||0;state.encounters=Number(data.encounters)||0;state.caught=Number(data.caught)||0;state.badges=Number(data.badges)||0;state.party=data.party.slice(0,6).map(c=>({...c,xp:Number(c.xp)||0}));state.bag=Math.max(0,Number(data.bag)||0); } catch (_) {} }
  function note(message){const li=document.createElement("li");li.textContent=message;log.prepend(li);while(log.children.length>7)log.lastElementChild.remove();}
  function tileAt(x,y){if(y===0||y===H-1||x===0||x===W-1)return "tree";if((x===4||x===5)&&y>=2&&y<=6)return "path";if((x===6)&&y>=5&&y<=7)return "path";if((x===1||x===10)&&y===5)return "water";if(blocked.has(x+","+y))return "rock";return "grass";}
  function renderMap(){map.replaceChildren();for(let y=0;y<H;y++){for(let x=0;x<W;x++){const cell=document.createElement("div");cell.className="map-tile "+tileAt(x,y);cell.setAttribute("aria-hidden","true");for(const player of remotePlayers.values()){if(player.x===x&&player.y===y){const sprite=document.createElement("span");sprite.className="remote-player-sprite";sprite.title=player.username; sprite.setAttribute("aria-label",player.username);cell.append(sprite);}}if(x===state.x&&y===state.y){cell.classList.add("player-tile");const sprite=document.createElement("span");sprite.className="player-sprite";cell.append(sprite);}map.append(cell);}}document.getElementById("coordinates").textContent="X "+String(state.x+1).padStart(2,"0")+" / Y "+String(state.y+1).padStart(2,"0");}
  function renderParty(){const list=document.getElementById("party-list");list.replaceChildren();state.party.forEach((c,index)=>{const row=document.createElement("div");row.className="party-creature"+(index===0?" is-lead":"");const token=document.createElement("span");token.className="creature-token "+c.type;const sprite=document.createElement("img");sprite.src="/assets/monster-sprites/"+c.id+".svg";sprite.alt=c.name;sprite.loading="lazy";token.append(sprite);const info=document.createElement("div");info.className="creature-info";const name=document.createElement("strong");name.textContent=c.name;const small=document.createElement("small");small.textContent="HP "+c.hp+" / "+c.maxHp;const hp=document.createElement("div");hp.className="hp-mini";const bar=document.createElement("span");bar.style.width=Math.max(0,Math.min(100,c.hp/c.maxHp*100))+"%";hp.append(bar);const xpLabel=document.createElement("small");const xpNeed=Math.max(1,c.level*20);xpLabel.className="xp-label";xpLabel.textContent="XP "+(c.xp||0)+" / "+xpNeed;const xp=document.createElement("div");xp.className="xp-mini";const xpBar=document.createElement("span");xpBar.style.width=Math.max(0,Math.min(100,(c.xp||0)/xpNeed*100))+"%";xp.append(xpBar);info.append(name,small,hp,xpLabel,xp);const level=document.createElement("span");level.className="level-tag";level.textContent="Lv. "+c.level;const select=document.createElement("button");select.type="button";select.className="party-select";select.textContent=index===0?"LEAD":"SELECT";select.disabled=index===0||!!state.battle;select.setAttribute("aria-label","Make "+c.name+" the lead creature");select.addEventListener("click",()=>{if(cloudEnabled){cloudAction("party-lead",{index});return;}const active=state.party[0];state.party[0]=state.party[index];state.party[index]=active;note(state.party[0].name+" is now leading the party.");render();save();});row.append(token,info,level,select);list.append(row);});document.getElementById("party-count").textContent=state.party.length+" / 6";document.getElementById("trainer-catches").textContent=state.caught;}
  function render(){renderMap();renderParty();document.getElementById("trainer-badges").textContent=state.badges;document.getElementById("world-state").textContent=state.battle?"In battle":"Exploring";}
  function move(dir){if(state.battle)return;if(worldConnected&&worldSocket&&worldSocket.readyState===WebSocket.OPEN){worldSocket.send(JSON.stringify({type:"move",direction:dir}));return;}const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!delta)return;const nx=state.x+delta[0],ny=state.y+delta[1];if(nx<1||nx>W-2||ny<1||ny>H-2||tileAt(nx,ny)==="rock"||tileAt(nx,ny)==="tree"||tileAt(nx,ny)==="water"){note("The terrain blocks that route.");return;}state.x=nx;state.y=ny;state.steps++;render();if(tileAt(nx,ny)==="grass"&&Math.random()<.22)startEncounter();else if(state.steps%6===0)note("The route is quiet. Something rustles in the grass nearby.");save();}
  function startEncounter(){if(state.battle)return;if(cloudEnabled){cloudAction("start");return;}const base=creatures[Math.floor(Math.random()*creatures.length)];state.battle={...base,hp:base.hp,maxHp:base.hp};state.encounters++;encounterPanel.hidden=false;document.getElementById("encounter-art").className="encounter-art "+base.type;setCreatureArt(base.id,base.name);document.getElementById("encounter-title").textContent="Wild "+base.name+"!";document.getElementById("encounter-description").textContent=base.description;document.getElementById("capture-btn").textContent="Capture · "+state.bag;note("A wild "+base.name+" appeared in the grass!");renderBattle();render();}
  function setCreatureArt(id,name){const art=document.getElementById("encounter-art");art.replaceChildren();const sprite=document.createElement("img");sprite.src="/assets/monster-sprites/"+id+".svg";sprite.alt=name;sprite.className="encounter-sprite";sprite.loading="eager";art.append(sprite);}
  function renderBattle(){if(!state.battle)return;const b=state.battle,lead=state.party[0],multiplier=lead?typeMultiplier(lead.type,b.type):1,matchup=document.getElementById("type-matchup");document.getElementById("wild-hp-bar").style.width=Math.max(0,b.hp/b.maxHp*100)+"%";document.getElementById("wild-hp-text").textContent="HP "+b.hp+" / "+b.maxHp;if(matchup){matchup.className="type-matchup "+(multiplier>1?"effective":multiplier<1?"resisted":"neutral");matchup.textContent="Your "+(lead?.type||"unknown")+" vs "+b.type+": "+(multiplier>1?"SUPER EFFECTIVE":multiplier<1?"RESISTED":"NEUTRAL");}document.getElementById("capture-btn").disabled=state.bag<1;document.getElementById("capture-btn").style.opacity=state.bag<1?".5":"1";}
  function finishBattle(message){note(message);state.battle=null;encounterPanel.hidden=true;render();save();}
  const strongAgainst={fire:["grass","thorn"],water:["fire","stone"],grass:["water","stone"],electric:["water","air"],stone:["fire","electric"],air:["thorn"],thorn:["water"],ghost:["ghost"]};
  function typeMultiplier(attacker,defender){return strongAgainst[attacker]?.includes(defender)?1.5:(strongAgainst[defender]?.includes(attacker)?0.75:1);}
  function awardExperience(member,amount){member.xp=(member.xp||0)+amount;let levels=0;while(member.level<100&&member.xp>=member.level*20){member.xp-=member.level*20;member.level++;levels++;}if(levels){member.maxHp=Math.min(500,member.maxHp+levels*2);member.hp=member.maxHp;const base=creatures.find(c=>c.id===member.id);member.attack=Math.min(100,(base?.attack||member.attack)+Math.floor((member.level-1)/3));}return levels;}
  function attack(){const b=state.battle,lead=state.party[0];if(!b||!lead)return;if(cloudEnabled){cloudAction("attack");return;}const multiplier=typeMultiplier(lead.type,b.type),damage=Math.max(1,Math.round((lead.attack+Math.floor(Math.random()*4))*multiplier));b.hp=Math.max(0,b.hp-damage);note(lead.name+" dealt "+damage+" damage."+(multiplier>1?" It was super effective!":multiplier<1?" The attack was resisted.":""));if(b.hp<=0){const gained=Math.max(8,(b.level||1)*12),levels=awardExperience(lead,gained);finishBattle(b.name+" was defeated. "+lead.name+" gained "+gained+" XP"+(levels?" and reached level "+lead.level:"")+".");return;}const counter=Math.max(1,b.attack+Math.floor(Math.random()*3));lead.hp=Math.max(1,lead.hp-counter);note(b.name+" counterattacked for "+counter+" damage. Your lead creature hangs on.");render();renderBattle();save();}
  function capture(){const b=state.battle;if(!b||state.bag<1||state.party.length>=6)return;if(cloudEnabled){cloudAction("capture");return;}if(Math.random()<.42+(1-b.hp/b.maxHp)*.48){state.party.push({id:b.id,name:b.name,type:b.type,icon:b.icon,level:Math.max(2,Math.floor(Math.random()*4)+2),xp:0,hp:b.maxHp,maxHp:b.maxHp,attack:b.attack});state.caught++;state.bag--;finishBattle(b.name+" joined your party!");}else{state.bag--;note(b.name+" broke free. Capture supplies left: "+state.bag+".");renderBattle();save();}}
  function retreat(){if(!state.battle)return;if(cloudEnabled){cloudAction("flee");return;}finishBattle("You retreated safely. The route is still waiting.");}
  document.querySelectorAll("[data-move]").forEach(button=>button.addEventListener("click",()=>move(button.dataset.move)));
  document.getElementById("attack-btn").addEventListener("click",attack);
  document.getElementById("capture-btn").addEventListener("click",capture);
  document.getElementById("run-btn").addEventListener("click",retreat);
  document.getElementById("reset-save").addEventListener("click",()=>{if(!window.confirm("Reset this browser's local prototype progress?"))return;try{localStorage.removeItem(SAVE_KEY);}catch(_){}location.reload();});
  window.addEventListener("keydown",event=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(event.key)){if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement)return;event.preventDefault();const key=event.key.toLowerCase();move(({arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"})[key]);}});
  function connectWorld(){
    if(!cloudEnabled||worldSocket)return;
    setCloudStatus("CONNECTING TO SHARED WORLD…");
    try{
      worldSocket=new WebSocket("wss://api.ash-fall.com/api/game/world");
      worldSocket.addEventListener("open",()=>{setCloudStatus("WORLD CONNECTED");});
      worldSocket.addEventListener("message",event=>{
        let message;try{message=JSON.parse(event.data);}catch(_){return;}
        if(message.type==="world-ready"){
          worldConnected=true;worldUserId=Number(message.you.userId);state.x=message.you.x;state.y=message.you.y;remotePlayers.clear();
          for(const player of message.players||[])if(player.userId!==message.you.userId)remotePlayers.set(player.userId,player);
          render();note("Connected to Cinder Meadow. Other trainers are now visible.");setCloudStatus("SHARED WORLD · ONLINE");save(false);return;
        }
        if(message.type==="player-joined"){if(message.player&&message.player.userId!==undefined){remotePlayers.set(message.player.userId,message.player);renderMap();note(message.player.username+" entered Cinder Meadow.");}return;}
        if(message.type==="player-moved"){
          const player=message.player;if(!player)return;
          if(worldSocket&&player.userId===worldUserId){state.x=player.x;state.y=player.y;if(Number.isInteger(player.steps))state.steps=player.steps;if(Number.isInteger(player.version))cloudVersion=player.version;render();const checkEncounter=!state.battle&&tileAt(state.x,state.y)==="grass";save(false);if(checkEncounter){if(cloudEnabled)cloudAction("encounter-check");else if(Math.random()<.22)startEncounter();}}
          else if(player.userId!==undefined){remotePlayers.set(player.userId,player);renderMap();}
          return;
        }
        if(message.type==="world-save-required"){note("Create or sync a cloud save before entering the shared world.");worldConnected=false;return;}
        if(message.type==="world-save-conflict"){note("Your saved position changed in another session. Reconnecting to the latest cloud position.");worldConnected=false;try{worldSocket.close(4002,"Save position conflict");}catch(_){}syncCloudSave().then(()=>{if(cloudEnabled){cloudAction("status").then(()=>connectWorld());}});return;}
        if(message.type==="world-save-error"){note("The server could not persist that move. Your last saved position is safe.");return;}
        if(message.type==="player-left"){remotePlayers.delete(message.userId);renderMap();return;}
        if(message.type==="move-blocked")note("The world server blocked that route.");
      });
      worldSocket.addEventListener("close",()=>{worldConnected=false;worldSocket=null;remotePlayers.clear();renderMap();setCloudStatus("CLOUD SAVE · WORLD OFFLINE");note("Shared world disconnected. Local movement remains available.");});
      worldSocket.addEventListener("error",()=>{setCloudStatus("CLOUD SAVE · WORLD UNAVAILABLE");});
    }catch(_){worldSocket=null;setCloudStatus("CLOUD SAVE · WORLD UNAVAILABLE");}
  }
  function restAtCamp(){if(state.battle){note("You cannot rest during a wild battle.");return;}if(state.x!==4||state.y!==1){note("Return to the camp at X 04 / Y 01 to rest.");return;}if(cloudEnabled){cloudAction("rest");return;}state.party.forEach(member=>{member.hp=member.maxHp;});note("The campfire crackles. Your party is fully rested.");render();save();}
  document.getElementById("rest-btn").addEventListener("click",restAtCamp);
  load();render();note("Local prototype save loaded. Find tall grass to trigger an encounter.");syncCloudSave().then(()=>{if(cloudEnabled){cloudAction("status");connectWorld();}});
})();