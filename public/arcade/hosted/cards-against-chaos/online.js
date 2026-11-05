/* Cards Against Chaos · two real Ash-Fall friends + three locally scripted bot seats.
 * All game mutations go through the signed-in Knightfall Worker. */
(()=>{
"use strict";
const $=id=>document.getElementById(id),api=()=>window.AshFallArcade;
const params=new URLSearchParams(location.search);
let me=null,friends=[],matches=[],selected=null,busy=false;
const root="/api/arcade/chaos-cards";
const name=seat=>seat?.name||"Player";
const escapeURL=value=>encodeURIComponent(String(value));
const text=(id,value)=>{$(id).textContent=String(value||"")};
const call=(path,options)=>api().request(path,options||{});
const status=(message)=>text("cards-online-status",message);
const button=(label,act,kind="")=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.className=kind;b.disabled=busy;b.addEventListener("click",act);return b;};
function signInNote(){
 const s=$("cards-online-account");s.replaceChildren();
 if(me){s.textContent="Signed in as "+(me.display_name||me.username)+". Your hand remains private from your friend.";return;}
 s.append("Sign in to challenge a friend. ");
 const a=document.createElement("a");a.href="/auth.html?next="+escapeURL(location.pathname+location.search);a.textContent="Sign in";s.append(a);
}
function seatName(match,i){return name(match.seats?.[i]);}
function turnNote(match){
 if(match.status==="pending")return match.viewer_seat===1?"Your friend challenged you. Accept to deal the first hand.":"Challenge sent. Waiting for your friend.";
 if(match.status==="declined")return "Challenge declined.";
 if(match.status==="cancelled")return "Invitation cancelled.";
 if(match.phase==="finished")return "Match finished. The score is final.";
 if(match.phase==="results")return "Round complete. One of you can deal the next hand.";
 if(match.can_judge)return "You are Card Czar. Pick the funniest anonymous answer.";
 if(match.can_play)return "Your turn: choose one card from your private hand.";
 if(match.phase==="judge")return "Waiting for "+seatName(match,match.judge)+" to judge the answers.";
 return "Waiting for your friend to choose a card.";
}
function renderList(){
 const host=$("cards-online-list");host.replaceChildren();
 for(const match of matches){
  const opponent=seatName(match,1-match.viewer_seat);
  const b=button("🃏 "+opponent+" · "+(match.status==="pending"?"invitation":match.status==="active"?"round "+match.round:match.status)+(match.needs_action?" · YOUR MOVE":""),()=>openMatch(match.id),match.needs_action?"primary":"secondary");
  b.classList.add("cards-online-match");b.setAttribute("aria-current",selected?.id===match.id?"true":"false");host.append(b);
 }
 if(!matches.length)host.textContent="No tables yet. Pick a friend to invite.";
}
function makeControl(label,action,body={},primary=false){
 return button(label,()=>mutate(action,body),primary?"primary":"secondary");
}
function renderMatch(){
 const panel=$("cards-online-table"),box=$("cards-online-actions"),hand=$("cards-online-hand"),votes=$("cards-online-choices"),score=$("cards-online-scores");
 panel.hidden=!selected;if(!selected)return;
 const link=$("cards-online-share");
 link.href=location.origin+"/arcade/hosted/cards-against-chaos/index.html?match="+escapeURL(selected.id);
 box.replaceChildren();hand.replaceChildren();votes.replaceChildren();score.replaceChildren();
 text("cards-online-round",selected.round||"Invitation");
 text("cards-online-prompt",selected.prompt||"Your original prompt appears when the invitation is accepted.");
 text("cards-online-turn",turnNote(selected));
 selected.seats.forEach((seat,i)=>{
  const el=document.createElement("span");el.className="cards-online-score"+(i===selected.judge&&selected.status==="active"?" czar":"");
  if(seat.kind==="ai"){
   const avatar=document.createElement("img");
   const petId=seat.id==="eddie"?"mini-eddie":seat.id;
   avatar.src="/assets/devil-tools/neon-nuisances/portraits/"+petId+".svg";
   avatar.alt="";avatar.loading="lazy";avatar.width=36;avatar.height=36;
   el.append(avatar);
  }
  const label=document.createElement("span");
  label.textContent=(i===selected.judge&&selected.status==="active"?"★ ":"")+seat.name+(seat.kind==="ai"?" · AI":"")+" · "+selected.scores[i];
  el.append(label);score.append(el);
 });
 const other=selected.seats[1-selected.viewer_seat];
 if(selected.status==="pending"){
  if(selected.viewer_seat===1){box.append(makeControl("Accept challenge","accept",{},true),makeControl("Decline","decline"));}
  else box.append(makeControl("Cancel invitation","cancel"));
  text("cards-online-result","Two human players, three AI players. The bots play automatically when their seats come up.");
  return;
 }
 const result=selected.result;
 text("cards-online-result",result?"Round "+result.round+": "+seatName(selected,result.seat)+" won with “"+result.card+".”":
  selected.phase==="finished"?"Table finished.":"");
 if(selected.can_play){
  selected.hand.forEach((card,index)=>{
   const b=button(card,()=>mutate("play",{card_index:index}),"cards-online-answer");b.setAttribute("aria-label","Play card: "+card);hand.append(b);
  });
 }
 if(selected.can_judge){
  selected.choices.forEach(choice=>{
   const b=button(choice.card,()=>mutate("judge",{choice_index:choice.index}),"cards-online-answer");b.setAttribute("aria-label","Award round to answer: "+choice.card);votes.append(b);
  });
 }
 if(selected.can_next)box.append(makeControl("Deal the next round","next",{},true));
 if(selected.phase==="finished")box.append(document.createTextNode("🏆 "+seatName(selected,selected.winner)+" wins the table."));

}
async function openMatch(id){
 try{status("Loading card table…");const data=await call(root+"/"+escapeURL(id));
 selected=data.match;history.replaceState(null,"",location.pathname+"?match="+escapeURL(id));
 renderMatch();renderList();status("Table synced. Your hand never appears on your friend's screen.");
 }catch(e){status(e.message||"Could not open card table.");}
}
async function refresh(openCurrent=true){
 if(!me)return;
 try{const data=await call(root);matches=data.matches||[];renderList();if(openCurrent&&selected)await openMatch(selected.id);
 else if(!selected&&new URLSearchParams(location.search).has("match"))await openMatch(new URLSearchParams(location.search).get("match"));
 }catch(error){status(error.message||"Could not load saved tables.");}
}
async function mutate(action,body={}){
 if(!selected||busy)return;busy=true;renderMatch();
 try{
  const data=await call(root+"/"+escapeURL(selected.id)+"/"+action,{method:"POST",body:JSON.stringify({...body,version:selected.version})});
  selected=data.match;renderMatch();await refresh(false);status("Move saved. The table is ready for its next turn.");
 }catch(error){
  status(error.message||"That move could not be saved. Refresh to try again.");
  if(/updated|changed|refresh|version/i.test(String(error.message)))await openMatch(selected.id);
 }finally{busy=false;renderMatch();}
}
async function create(event){
 event.preventDefault();if(busy||!me)return;
 const id=Number($("cards-online-friend").value);
 if(!Number.isSafeInteger(id)||id<1){status("Choose an accepted friend.");return;}
 busy=true;$("cards-online-challenge").disabled=true;
 try{
  const data=await call(root,{method:"POST",body:JSON.stringify({opponent_id:id})});
  selected=data.match;renderMatch();await refresh(false);
  history.replaceState(null,"",location.pathname+"?match="+escapeURL(selected.id));
  status("Invitation sent! Your friend can accept from their notifications or this table.");
 }catch(error){
  status(error.message||"Could not send the invitation.");
  if(error.match_id)await openMatch(error.match_id);
 }finally{busy=false;$("cards-online-challenge").disabled=!friends.length;}
}
async function boot(){
 if(!api())return status("Account tools unavailable. Refresh to reconnect.");
 try{
  await api().refreshUser();me=api().user;signInNote();
  if(!me){$("cards-online-challenge").disabled=true;status("Sign in to challenge a friend.");return;}
  const response=await call("/api/friends");friends=response.friends||[];
  const select=$("cards-online-friend");select.replaceChildren(new Option(friends.length?"Choose a friend":"Add an accepted friend first",""));
  friends.forEach(f=>select.add(new Option((f.display_name||f.username)+" (@"+f.username+")",String(f.user_id))));
  const invited=(params.get("invite")||"").toLowerCase();
  if(invited){const friend=friends.find(f=>(f.username||"").toLowerCase()===invited);if(friend)select.value=String(friend.user_id);}
  $("cards-online-challenge").disabled=!friends.length;
  await refresh();status("Ready. Invite a friend or reopen a saved match.");
 }catch(error){status(error.message||"Could not load account and friend list.");}
}
$("cards-online-form").addEventListener("submit",create);
$("cards-online-refresh").addEventListener("click",()=>refresh(true));
$("cards-online-close").addEventListener("click",()=>{selected=null;$("cards-online-table").hidden=true;history.replaceState(null,"",location.pathname);renderList();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh(true);});
setInterval(()=>{if(!document.hidden&&!busy)refresh(!!selected);},30000);
boot();
})();
