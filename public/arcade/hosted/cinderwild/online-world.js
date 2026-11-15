/* Optional online world. Offline Cinderwild play and local saves remain intact.
   Only the server decides shared-world coordinates; local battles are not trusted PvP. */
(()=>{
"use strict";
const game=window.CinderwildGame,api=window.AshFallArcade;
const root=document.getElementById("online-world");
if(!root||!game||!api)return;
const $=id=>document.getElementById(id);
const status=$("online-status"),joinButton=$("online-join"),leaveButton=$("online-leave"),
 roster=$("online-players"),questList=$("online-quests"),BASE="/api/cinderwild/world";
let connected=false,loading=false,moving=false,epoch=0,lastMove=0,pollTimer=null,heartbeatTimer=null,quests=[];
const directions={"0,-1":"up","0,1":"down","-1,0":"left","1,0":"right"};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function report(message){status.textContent=message;}
function buttons(){joinButton.hidden=connected;leaveButton.hidden=!connected;joinButton.disabled=loading||moving;leaveButton.disabled=loading;}
function renderPlayers(players=[]){
 roster.replaceChildren();
 const count=document.createElement("strong");
 count.textContent="Trainers nearby: "+players.length;
 roster.appendChild(count);
 const list=document.createElement("ul");
 for(const player of players){
  const item=document.createElement("li");
  item.textContent=String(player.display_name||player.username||"Trainer").slice(0,32)+" · "+player.x+","+player.y;
  list.appendChild(item);
 }
 if(!players.length){const empty=document.createElement("p");empty.textContent="No other trainers in range yet.";roster.appendChild(empty);}
 else roster.appendChild(list);
 game.setOnlinePeers(players);
}
function renderQuests(items){
 quests=Array.isArray(items)?items:quests;
 questList.replaceChildren();
 for(const q of quests){
  const entry=document.createElement("li");
  const title=document.createElement("strong"),detail=document.createElement("small");
  title.textContent=(q.completed?"✓ ":"○ ")+String(q.name||"Field Quest");
  detail.textContent=String(q.description||"");
  entry.className=q.completed?"quest-done":"";
  entry.append(title,detail);questList.append(entry);
 }
}
async function requestAction(action,payload={}){
 return api.request(BASE+"/"+action,{method:"POST",body:JSON.stringify(payload)});
}
function stopTimers(){
 if(pollTimer!==null)clearTimeout(pollTimer);
 if(heartbeatTimer!==null)clearTimeout(heartbeatTimer);
 pollTimer=null;heartbeatTimer=null;
}
function disconnect(message){
 epoch++;connected=false;loading=false;moving=false;stopTimers();renderPlayers([]);
 buttons();if(message)report(message);
}
async function poll(myEpoch){
 if(!connected||myEpoch!==epoch)return;
 try{
  const result=await api.request(BASE);
  if(myEpoch!==epoch)return;
  if(result.needs_join){disconnect("Online session expired. Join again to resume.");return;}
  if(result.ok){
   // Reconcile lost/missed move responses and local battle blackouts against the server.
   const current=game.position();
   if(!game.isBusy()&&result.me&&(current.x!==result.me.x||current.y!==result.me.y))game.syncOnlinePosition(result.me);
   renderPlayers(result.players||[]);
   renderQuests(result.quests||[]);
   report("● Connected to the shared world · "+result.me.zone+" · "+(result.online_count||1)+" nearby incl. you");
  }
 }catch(error){
  if(myEpoch!==epoch)return;
  if(error.status===401){disconnect("Your session expired. Sign in again to join the online world.");return;}
  report("Online connection interrupted: "+error.message+". Retrying; local play remains saved.");
 }finally{
  if(connected&&myEpoch===epoch)pollTimer=setTimeout(()=>{void poll(myEpoch);},3200);
 }
}
async function heartbeat(myEpoch){
 if(!connected||myEpoch!==epoch)return;
 try{await requestAction("heartbeat");}
 catch(error){if(error.status===401||error.status===409){disconnect("Session ended. Rejoin the online world.");return;}}
 if(connected&&myEpoch===epoch)heartbeatTimer=setTimeout(()=>{void heartbeat(myEpoch);},12000);
}
async function join(){
 if(loading||connected)return;
 if(!api.user){report("Sign into Knightfall to see other players. Your offline save remains playable.");return;}
 if(!game.hasStarter()){report("Choose a starter creature before entering the online world.");return;}
 if(game.isBusy()){report("Finish your battle or close the trainer menu before joining.");return;}
 if(!confirm("Join the shared Cinderwild world? Your character will use its server checkpoint (starting in Cinder Town), while your creatures and device progress remain saved locally. Online crest rewards and PvP are not available yet."))return;
 loading=true;buttons();report("Connecting to the world…");
 const backupKey="knightfall:cinderwild:before-online:"+String(api.user.id);
 try{
  if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,JSON.stringify(game.snapshot()));
  const data=await requestAction("join");
  if(!game.syncOnlinePosition(data.me))throw new Error("Finish your current action before joining.");
  connected=true;epoch++;const current=epoch;
  renderQuests(data.quests||[]);
  report("● Shared world joined. Walking now uses server-checked positions.");
  void poll(current);
  heartbeatTimer=setTimeout(()=>{void heartbeat(current);},12000);
 }catch(error){
  report("Unable to enter online world: "+error.message+". You can keep playing offline.");
 }finally{loading=false;buttons();}
}
async function leave(){
 if(!connected||loading)return;
 disconnect("Offline exploration restored. Your creature party is still saved locally.");
 try{await requestAction("leave");}
 catch{report("You left the online view. Your public marker will disappear when presence expires.");}
}
async function requestMove(dx,dy){
 if(!connected||moving||game.isBusy())return;
 const direction=directions[dx+","+dy];
 if(!direction)return;
 const now=Date.now();
 if(now-lastMove<150)return;
 lastMove=now;moving=true;const current=epoch;
 try{
  const data=await requestAction("move",{direction});
  if(current!==epoch||!connected)return;
  if(!game.applyOnlineMove(dx,dy,data.me))game.syncOnlinePosition(data.me);
 }catch(error){
  if(current!==epoch||!connected)return;
  if(error.status===401){disconnect("Sign in again to keep playing online.");return;}
  if(error.data?.me)game.syncOnlinePosition(error.data.me);
  if(error.data?.needs_join){disconnect("Online world session expired. Join again.");return;}
  if(error.status!==429)report("Route blocked: "+String(error.message).replace(/_/g," ").toLowerCase());
 }finally{moving=false;}
}
async function recordNpc(target){
 if(!connected||!["nurse_ember","supply_keeper","warden_briar"].includes(target))return;
 const current=epoch;
 try{
  const result=await requestAction("interact",{target});
  if(current===epoch&&connected)renderQuests(result.quests);
 }catch{/* The local NPC interaction is independent of the online quest service. */}
}
window.CinderwildOnline=Object.freeze({
 get connected(){return connected;},
 requestMove,recordNpc
});
joinButton.addEventListener("click",()=>{void join();});
leaveButton.addEventListener("click",()=>{void leave();});
api.ready.then(()=>{
 if(api.user)report("Signed in as "+String(api.user.display_name||api.user.username)+". Join to meet trainers on the shared map.");
 else report("Offline mode. Sign in to Knightfall and join the shared world.");
}).catch(()=>report("Online sign-in service is unavailable. Offline play still works."));
buttons();
})();
