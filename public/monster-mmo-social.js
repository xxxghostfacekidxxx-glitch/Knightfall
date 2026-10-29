/* Hell & High Orbit: lightweight authenticated social controls. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll("[data-social-tab]")],panels=[...document.querySelectorAll("[data-social-panel]")];
const status=$("game-social-status"),feed=$("game-global-feed"),friends=$("game-friends-list"),requests=$("game-friend-requests");
let selected="global",inFlight=false,lastOrigin="",lastChatId=0,currentDmId=null,lastDmId=0;
function message(value){status.textContent=value||"";}
function connectedOrigin(){
 const raw=document.body.dataset.gameApiOrigin||"";
 if(!raw)return "";
 try{const url=new URL(raw);return url.protocol==="https:"||["localhost","127.0.0.1"].includes(url.hostname)?url.origin:""}catch{return ""}
}
async function api(path,options={}){
 const origin=connectedOrigin();if(!origin)throw Error("Connect to multiplayer staging in Settings first.");
 const response=await fetch(origin+path,{credentials:"include",cache:"no-store",...options,headers:{"content-type":"application/json",...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||"Request failed ("+response.status+")");
 return data;
}
function node(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el;}
function select(name){selected=name;tabs.forEach(b=>b.setAttribute("aria-selected",String(b.dataset.socialTab===name)));panels.forEach(p=>p.hidden=p.dataset.socialPanel!==name);refresh();}
tabs.forEach(b=>b.addEventListener("click",()=>select(b.dataset.socialTab)));
async function loadGlobal(){
 const data=await api("/api/game/global-chat");const messages=data.messages||[];
 if(!messages.length){feed.replaceChildren(node("p","","No transmissions yet. Be the first to complain about Earth."));return}
 const nearBottom=feed.scrollHeight-feed.scrollTop-feed.clientHeight<65;
 const last=messages.at(-1)?.id||0;
 if(last===lastChatId&&feed.querySelector(".social-entry"))return;
 lastChatId=last;feed.replaceChildren();
 for(const entry of messages){
  const line=node("div","social-entry");const author=node("strong","",entry.display_name||entry.username||"Trainer");
  const time=node("time","",entry.created_at?new Date(entry.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"");
  line.append(author,time,node("div","",entry.body||""));feed.append(line);
 }
 if(nearBottom)feed.scrollTop=feed.scrollHeight;
}
async function loadFriends(){
 const data=await api("/api/friends");friends.replaceChildren();requests.replaceChildren();
 const accepted=data.friends||[],incoming=data.incoming||[],outgoing=data.outgoing||[];
 if(!accepted.length)friends.append(node("p","","No friends yet. Send a request below."));
 for(const p of accepted){const line=node("div","social-entry");line.append(node("strong","",p.display_name||p.username),node("span","","@"+p.username+" "));const profile=node("a","","Profile");profile.href="/profile.html?user="+encodeURIComponent(p.username);profile.style.marginLeft="10px";profile.style.color="#caff45";line.append(profile);const dm=node("button","","Message");dm.type="button";dm.addEventListener("click",async()=>{try{const data=await api("/api/messages/conversations",{method:"POST",body:JSON.stringify({username:p.username})});currentDmId=data.id;select("inbox")}catch(e){message(e.message)}});line.append(dm);friends.append(line);}
 for(const p of incoming){const line=node("div","social-entry");line.append(node("span","","Request from @"+p.username+" "));for(const action of ["accept","decline"]){const btn=node("button","",action==="accept"?"Accept":"Decline");btn.type="button";btn.addEventListener("click",async()=>{try{await api("/api/friends/"+p.id,{method:"PATCH",body:JSON.stringify({action})});await loadFriends();message("Request "+action+"ed.")}catch(e){message(e.message)}});line.append(btn)}requests.append(line)}
 for(const p of outgoing){const line=node("div","social-entry");line.append(node("span","","Pending: @"+p.username+" "));const cancel=node("button","","Cancel");cancel.type="button";cancel.addEventListener("click",async()=>{try{await api("/api/friends/"+p.id,{method:"DELETE"});await loadFriends();message("Friend request cancelled.")}catch(e){message(e.message)}});line.append(cancel);requests.append(line)}
}
async function loadInbox(){
 const list=$("game-dm-list"),thread=$("game-dm-thread"),form=$("game-dm-form");
 const data=await api("/api/messages/conversations");
 const conversations=(data.conversations||[]).filter(c=>c.kind==="direct");
 list.replaceChildren();
 if(!conversations.length)list.append(node("p","","No private conversations. Open Friends to start one."));
 for(const c of conversations){
  const btn=node("button","social-dm-choice",(c.other_display_name||c.other_username||"Trainer")+(Number(c.unread_count)>0?" · "+c.unread_count+" new":""));
  btn.type="button";btn.setAttribute("aria-pressed",String(Number(c.id)===Number(currentDmId)));
  btn.addEventListener("click",()=>{currentDmId=Number(c.id);lastDmId=0;loadInbox().catch(e=>message(e.message))});list.append(btn);
 }
 if(!currentDmId&&conversations.length)currentDmId=Number(conversations[0].id);
 const chosen=conversations.find(c=>Number(c.id)===Number(currentDmId));
 if(!chosen){thread.textContent="Select a conversation.";form.querySelectorAll("input,button").forEach(el=>el.disabled=true);return}
 form.querySelectorAll("input,button").forEach(el=>el.disabled=false);
 const result=await api("/api/messages/conversations/"+currentDmId+"?limit=40");
 const entries=result.messages||[],last=entries.at(-1)?.id||0;
 if(last===lastDmId&&thread.querySelector(".social-entry"))return;
 lastDmId=last;thread.replaceChildren();
 if(!entries.length)thread.append(node("p","","No messages yet."));
 for(const m of entries){const line=node("div","social-entry");line.append(node("strong","",m.display_name||m.username||"Trainer"),node("div","",m.body||""));thread.append(line)}
 thread.scrollTop=thread.scrollHeight;
}
$("game-dm-form")?.addEventListener("submit",async e=>{
 e.preventDefault();if(!currentDmId)return;
 const input=$("game-dm-input"),body=input.value.trim();if(!body)return;
 try{await api("/api/messages/conversations/"+currentDmId,{method:"POST",body:JSON.stringify({body})});input.value="";lastDmId=0;await loadInbox();message("")}catch(error){message(error.message)}
});
async function refresh(){
 const menu=$("game-menu");if(!menu?.classList.contains("is-open")||!document.querySelector('[data-pause-section="social"]')?.classList.contains("pause-active")||!connectedOrigin()||inFlight)return;
 
 inFlight=true;try{if(selected==="global")await loadGlobal();else if(selected==="friends")await loadFriends();else await loadInbox();message("")}catch(e){message(e.message)}finally{inFlight=false}
}
$("game-global-form")?.addEventListener("submit",async e=>{e.preventDefault();const field=$("game-global-input"),body=field.value.trim();if(!body)return;try{await api("/api/game/global-chat",{method:"POST",body:JSON.stringify({body})});field.value="";lastChatId=0;await loadGlobal();message("")}catch(error){message(error.message)}});
$("game-friend-form")?.addEventListener("submit",async e=>{e.preventDefault();const field=$("game-friend-name"),username=field.value.trim();if(!username)return;try{await api("/api/friends/request",{method:"POST",body:JSON.stringify({username})});field.value="";await loadFriends();message("Friend request sent.")}catch(error){message(error.message)}});
const observer=new MutationObserver(()=>{const origin=connectedOrigin();if(origin!==lastOrigin){lastOrigin=origin;lastChatId=0;lastDmId=0;currentDmId=null;feed.textContent=origin?"Loading global chat…":"Connect to multiplayer in Settings to use global chat.";friends.textContent=origin?"Loading friends…":"Connect to multiplayer in Settings to see friends.";}refresh()});
const menu=$("game-menu");if(menu)observer.observe(menu,{attributes:true,attributeFilter:["class"]});
const socialSection=document.querySelector('[data-pause-section="social"]');if(socialSection)observer.observe(socialSection,{attributes:true,attributeFilter:["class"]});
observer.observe(document.body,{attributes:true,attributeFilter:["data-game-api-origin"]});
const connection=$("connection");if(connection)observer.observe(connection,{childList:true,characterData:true,subtree:true});
setInterval(()=>{if(!document.hidden)refresh()},8000);
})();