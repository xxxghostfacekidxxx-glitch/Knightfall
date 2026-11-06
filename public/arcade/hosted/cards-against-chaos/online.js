/* Four-seat Cards Against Chaos. One to four real friends, AI fills every vacancy. */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const arcade=()=>window.AshFallArcade;
const root="/api/arcade/chaos-cards",params=new URLSearchParams(location.search);
let me=null,friends=[],matches=[],selected=null,busy=false;
const enc=value=>encodeURIComponent(String(value));
const display=player=>player?.display_name||player?.username||"Friend";
const text=(id,value)=>{$(id).textContent=String(value??"");};
const packTitles={"madhouse-after-hours":"Madhouse After Hours"};
const chosenPacks=()=>[...document.querySelectorAll('[data-card-pack-mode="online"]:checked')].map(input=>input.value);
function refreshAdultNotice(){
 $("online-adult-label").hidden=!chosenPacks().includes("madhouse-after-hours");
}
const labelPacks=ids=>(ids||[]).length?(ids||[]).map(id=>packTitles[id]||id).join(" + ")+" · 75% themed draws":"Base deck only";
const call=(path,options)=>arcade().request(path,options||{});
const status=message=>text("cards-online-status",message);
const button=(label,action,kind="secondary")=>{
 const element=document.createElement("button");
 element.type="button";element.textContent=label;element.className=kind;
 element.disabled=busy;element.addEventListener("click",action);
 return element;
};
const humanName=(match,index)=>match.seats[index]?.name||"Player";
function accountStatus(){
 const target=$("cards-online-account");target.replaceChildren();
 if(me){target.textContent="Signed in as "+display(me)+". Your hand stays private from the other human players.";return;}
 target.append("Sign in to create saved four-player tables. ");
 const a=document.createElement("a");a.href="/auth.html?next="+enc(location.pathname+location.search);a.textContent="Sign in";
 target.append(a);
}
function refreshFriendInputs(){
 const count=Number($("cards-online-human-count").value);
 for(let index=1;index<=3;index++){
  const box=$("cards-online-friend-wrap-"+index),select=$("cards-online-friend-"+index);
  const visible=index<count;box.hidden=!visible;select.disabled=!visible;select.required=visible;
 }
 const button=$("cards-online-challenge");
 button.textContent=count===1?"Start solo against 3 AI":count===2?"Invite 1 friend":`Invite ${count-1} friends`;
 button.disabled=!me||busy||(count>1&&friends.length<count-1);
 const preview=$("cards-online-preview");
 preview.textContent=count+" human "+(count===1?"player":"players")+" + "+(4-count)+" AI "+((4-count)===1?"player":"players")+" = four seats";
}
function fillFriendChoices(){
 for(let i=1;i<=3;i++){
  const select=$("cards-online-friend-"+i);select.replaceChildren(new Option("Choose an accepted friend",""));
  for(const friend of friends)select.add(new Option(display(friend)+" (@"+friend.username+")",String(friend.user_id)));
 }
 const invited=(params.get("invite")||"").toLowerCase();
 if(invited){
  const found=friends.find(friend=>(friend.username||"").toLowerCase()===invited);
  if(found){$("cards-online-human-count").value="2";$("cards-online-friend-1").value=String(found.user_id);}
 }
 refreshFriendInputs();
}
function turnNote(match){
 if(match.status==="lobby"){
  if(match.can_accept)return "You have an invitation. Accept it to replace an AI player.";
  if(match.can_start)return "Waiting for invited friends. Start whenever you're ready: anyone absent becomes AI.";
  return "Waiting for the host to start the four-player game.";
 }
 if(match.status==="cancelled")return "This invitation was cancelled.";
 if(match.phase==="finished")return "Four-player match finished. Final scores are saved.";
 if(match.phase==="results")return "Round finished. Deal a new round when you're ready.";
 if(match.can_judge)return "You're the judge. Select your favorite anonymous answer.";
 if(match.can_play)return "Choose one card from your private hand.";
 if(match.phase==="judge")return "Waiting for "+humanName(match,match.judge)+" to judge the answers.";
 return "Waiting for another human to finish their turn.";
}
function renderList(){
 const container=$("cards-online-list");container.replaceChildren();
 for(const match of matches){
  const humans=match.seats.filter(seat=>seat.kind==="human").map(seat=>seat.name);
  const label="🃏 "+humans.join(" + ")+" · "+(match.status==="lobby"?"INVITATION":
   match.status==="active"?"Round "+match.round:match.status)+
   ((match.active_packs||[]).length?" · 🌙 AFTER HOURS":"")+
   (match.needs_action?" · YOUR MOVE":"");
  const b=button(label,()=>openMatch(match.id),match.needs_action?"primary":"secondary");
  b.classList.add("cards-online-match");b.setAttribute("aria-current",selected?.id===match.id?"true":"false");
  container.append(b);
 }
 if(!matches.length)container.textContent="No saved tables yet. Start solo or invite up to three friends.";
}
function actionButton(label,action,options={},primary=false){
 return button(label,()=>mutate(action,options),primary?"primary":"secondary");
}
function renderMatch(){
 const panel=$("cards-online-table"),actions=$("cards-online-actions"),hand=$("cards-online-hand"),
  choices=$("cards-online-choices"),score=$("cards-online-scores");
 panel.hidden=!selected;if(!selected)return;
 $("cards-online-share").href=location.origin+"/arcade/hosted/cards-against-chaos/index.html?match="+enc(selected.id);
 actions.replaceChildren();hand.replaceChildren();choices.replaceChildren();score.replaceChildren();
 text("cards-online-round",selected.round||"Lobby");
 text("cards-online-prompt",selected.prompt||"The first prompt appears when the table begins.");
 text("cards-online-turn",turnNote(selected));
 text("cards-online-active-packs",labelPacks(selected.active_packs));
 selected.seats.forEach((seat,index)=>{
  const pill=document.createElement("span");pill.className="cards-online-score"+
   (index===selected.judge&&selected.status==="active"?" czar":"");
  if(seat.kind==="ai"){
   const image=document.createElement("img");
   image.src="/assets/devil-tools/neon-nuisances/portraits/"+
    (seat.id==="eddie"?"mini-eddie":seat.id)+".svg";
   image.alt="";image.loading="lazy";image.width=36;image.height=36;pill.append(image);
  }
  const name=document.createElement("span");
  name.textContent=(index===selected.judge&&selected.status==="active"?"★ ":"")+
   seat.name+(seat.kind==="ai"?" · AI":"")+" · "+selected.scores[index];
  pill.append(name);
  if(seat.pending_invite){const sub=document.createElement("small");sub.textContent="Invited: "+seat.pending_invite;pill.append(sub);}
  score.append(pill);
 });
 if(selected.status==="lobby"){
  if(selected.can_accept){
   if((selected.active_packs||[]).includes("madhouse-after-hours")){
    const consent=document.createElement("label");
    consent.className="cards-age-confirm";
    const check=document.createElement("input");check.type="checkbox";
    consent.append(check," I confirm I am 18 or older and agree to this After Hours table.");
    const join=actionButton("Join After Hours table","accept",{age_confirmed:true},true);
    join.disabled=true;
    check.addEventListener("change",()=>{join.disabled=!check.checked||busy;});
    actions.append(consent,join,actionButton("Decline","decline"));
   }else actions.append(actionButton("Join game","accept",{},true),actionButton("Decline","decline"));
  }
  if(selected.can_start){
   actions.append(actionButton("Start with current players","start",{},true),actionButton("Cancel table","cancel"));
  }
  text("cards-online-result","Always four seats. Any unclaimed seats become Lydibug, Butters or Eddie when the game starts.");
  return;
 }
 const result=selected.result;
 text("cards-online-result",result?
   "Round "+result.round+": "+humanName(selected,result.seat)+" won with “"+result.card+".”":
   selected.phase==="finished"?"Match complete.":"");
 if(selected.can_play){
  selected.hand.forEach((card,index)=>{
   const b=button(card,()=>mutate("play",{card_index:index}),"cards-online-answer");
   b.setAttribute("aria-label","Play card: "+card);hand.append(b);
  });
 }
 if(selected.can_judge){
  selected.choices.forEach(choice=>{
   const b=button(choice.card,()=>mutate("judge",{choice_index:choice.index}),"cards-online-answer");
   b.setAttribute("aria-label","Choose winning card: "+choice.card);choices.append(b);
  });
 }
 if(selected.can_next)actions.append(actionButton("Deal next round","next",{},true));
 if(selected.phase==="finished")actions.append(document.createTextNode("🏆 "+humanName(selected,selected.winner)+" wins!"));
}
async function openMatch(id){
 try{
  status("Loading saved four-player table…");
  const data=await call(root+"/"+enc(id));
  selected=data.match;
  history.replaceState(null,"",location.pathname+"?match="+enc(id));
  renderMatch();renderList();status("Table synced. Private hands stay private.");
 }catch(error){status(error.message||"Unable to open this card table.");}
}
async function refresh(openCurrent=true){
 if(!me)return;
 try{
  const data=await call(root);matches=data.matches||[];renderList();
  if(openCurrent&&selected)await openMatch(selected.id);
  else if(!selected&&new URLSearchParams(location.search).has("match"))
   await openMatch(new URLSearchParams(location.search).get("match"));
 }catch(error){status(error.message||"Unable to load saved card tables.");}
}
async function mutate(action,options={}){
 if(!selected||busy)return;
 busy=true;renderMatch();
 try{
  const data=await call(root+"/"+enc(selected.id)+"/"+action,{
   method:"POST",body:JSON.stringify({...options,version:selected.version})
  });
  if(data.match){selected=data.match;renderMatch();}
  else {selected=null;$("cards-online-table").hidden=true;history.replaceState(null,"",location.pathname);}
  await refresh(false);
  status(action==="decline"?"Invitation declined.":"Turn saved. All four seats are accounted for.");
 }catch(error){
  status(error.message||"Move not saved. Refresh before trying again.");
  if(error.status===409&&selected)await openMatch(selected.id);
 }finally{busy=false;renderMatch();}
}
async function create(event){
 event.preventDefault();if(busy||!me)return;
 const count=Number($("cards-online-human-count").value);
 const ids=[];
 for(let index=1;index<count;index++){
  const id=Number($("cards-online-friend-"+index).value);
  if(!Number.isSafeInteger(id)||id<1){status("Choose an accepted friend for each human seat.");return;}
  ids.push(id);
 }
 if(new Set(ids).size!==ids.length){status("Every human seat must belong to a different friend.");return;}
 const expansionIds=chosenPacks();
 if(expansionIds.length&&!$("cards-online-adult").checked){
  return status("Confirm you are 18 or older before starting an After Hours table.");
 }
 busy=true;refreshFriendInputs();
 try{
  const response=await call(root,{method:"POST",body:JSON.stringify({
   opponent_ids:ids,expansion_ids:expansionIds,age_confirmed:$("cards-online-adult").checked
  })});
  selected=response.match;
  history.replaceState(null,"",location.pathname+"?match="+enc(selected.id));
  renderMatch();await refresh(false);
  status(ids.length?"Invitations sent. Start when ready; unfilled seats become AI.":"Solo game started with three AI opponents.");
 }catch(error){status(error.message||"Unable to create a card table.");}
 finally{busy=false;refreshFriendInputs();}
}
async function boot(){
 if(!arcade())return status("Account tools did not load. Refresh this page.");
 try{
  await arcade().refreshUser();me=arcade().user;accountStatus();
  if(!me){refreshFriendInputs();return status("Sign in to play saved four-player card games.");}
  const response=await call("/api/friends");friends=response.friends||[];
  fillFriendChoices();await refresh();status("Ready: select one to four humans. The rest are AI.");
 }catch(error){status(error.message||"Could not load account or friends.");}
}
document.querySelectorAll('[data-card-pack-mode="online"]').forEach(input=>input.addEventListener("change",refreshAdultNotice));
refreshAdultNotice();
$("cards-online-human-count").addEventListener("change",refreshFriendInputs);
$("cards-online-form").addEventListener("submit",create);
$("cards-online-refresh").addEventListener("click",()=>refresh(true));
$("cards-online-close").addEventListener("click",()=>{
 selected=null;$("cards-online-table").hidden=true;
 history.replaceState(null,"",location.pathname);renderList();
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh(true);});
setInterval(()=>{if(!document.hidden&&!busy)refresh(!!selected);},30000);
boot();
})();