/* Knightfall conversation bubbles: same inbox API, no second message store. */
(() => {
  "use strict";
  const script=document.currentScript;
  const userId=Number(script?.dataset?.userId);
  if(!Number.isSafeInteger(userId)||userId<1||document.getElementById("kf-chat-heads"))return;
  if(location.pathname==="/messages.html")return; // The full inbox already owns this route.
  const API="https://api.ash-fall.com";
  const storeKey="kf-chat-heads-"+userId;
  const draftKey="kf-chat-drafts-"+userId;
  const drafts=new Map();
  try {
    const saved=JSON.parse(sessionStorage.getItem(draftKey)||"[]");
    if(Array.isArray(saved))for(const item of saved.slice(0,20)){
      if(!Array.isArray(item)||item.length!==2)continue;
      const id=Number(item[0]),value=String(item[1]||"").slice(0,4000);
      if(Number.isSafeInteger(id)&&id>0&&value)drafts.set(id,value);
    }
  }catch{}
  function rememberDraft(id,value){
    if(!Number.isSafeInteger(Number(id))||Number(id)<1)return;
    const text=String(value||"").slice(0,4000);
    if(text)drafts.set(Number(id),text);else drafts.delete(Number(id));
    try{sessionStorage.setItem(draftKey,JSON.stringify([...drafts.entries()].slice(-20)));}catch{}
  }
  const state={conversations:[],heads:[],active:null,visible:false,loading:false,sending:false,threadToken:0,unread:0,lastThreadKey:""};
  const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
  const nameOf=c=>c?.kind==="group"?(c.group_name||"Group chat"):(c?.other_display_name||c?.other_username||"Conversation");
  const initialOf=c=>(nameOf(c).trim().charAt(0)||"✦").toUpperCase();
  const el=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  async function api(path,opts={}){
    const response=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,headers:{"content-type":"application/json",...(opts.headers||{})}});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(body.error||"Request failed");
    return body;
  }
  try{
    const saved=JSON.parse(sessionStorage.getItem(storeKey)||"[]");
    if(Array.isArray(saved))state.heads=[...new Set(saved.map(validId).filter(Boolean))].slice(0,3);
  }catch{}
  const dock=el("aside","kf-chat-dock");
  dock.id="kf-chat-heads";
  dock.setAttribute("aria-label","Floating conversations");
  dock.innerHTML='<section class="kf-chat-panel" id="kf-chat-panel" aria-label="Conversation quick chat" hidden><header class="kf-chat-panel-header"><button id="kf-chat-back" type="button" aria-label="Back to recent conversations" hidden>←</button><div class="kf-chat-panel-title"><strong id="kf-chat-title">Recent conversations</strong><small id="kf-chat-subtitle">Message without leaving this page</small></div><a id="kf-chat-full" href="/messages.html">Inbox</a><button id="kf-chat-minimize" type="button" aria-label="Minimize chat">×</button></header><label id="kf-chat-search-wrap" class="kf-chat-search-wrap"><span class="kf-chat-sr">Find a conversation</span><input id="kf-chat-search" type="search" autocomplete="off" placeholder="Find a conversation…" aria-label="Find a conversation"></label><div id="kf-chat-list" class="kf-chat-recent"></div><div id="kf-chat-thread" class="kf-chat-thread" hidden></div><form id="kf-chat-compose" class="kf-chat-compose" hidden><label class="kf-chat-sr" for="kf-chat-input">Message</label><textarea id="kf-chat-input" maxlength="4000" rows="2" placeholder="Write a reply…" aria-label="Write a message"></textarea><button id="kf-chat-send" type="submit">Send</button></form><div id="kf-chat-status" class="kf-chat-status" role="status" aria-live="polite"></div></section><div class="kf-chat-head-row" id="kf-chat-head-row"></div><button class="kf-chat-launcher" id="kf-chat-launcher" type="button" aria-label="Open conversations" aria-expanded="false" aria-controls="kf-chat-panel"><span aria-hidden="true">💬</span><b id="kf-chat-unread" hidden></b></button>';
  document.body.append(dock);
  const $=selector=>dock.querySelector(selector);
  const panel=$("#kf-chat-panel"),recent=$("#kf-chat-list"),thread=$("#kf-chat-thread"),composer=$("#kf-chat-compose"),input=$("#kf-chat-input"),status=$("#kf-chat-status");
  function announce(message){status.textContent=message||"";}
  function saveHeads(){try{sessionStorage.setItem(storeKey,JSON.stringify(state.heads));}catch{}}
  function getConversation(id){return state.conversations.find(c=>Number(c.id)===id);}
  function inboxUrl(id){return "/messages.html"+(id?"?conversation="+id:"");}
  function setVisible(value){
    state.visible=!!value;
    const opening=!!value&&panel.hidden;
    panel.hidden=!state.visible;
    $("#kf-chat-launcher").setAttribute("aria-expanded",String(state.visible));
    if(opening)window.dispatchEvent(new CustomEvent("kf:floating-panel-open",{detail:{panel:"member-chat"}}));
    if(state.visible){
      renderPanel();
      if(state.active)refreshThread().catch(error=>announce(error.message));
      else if(!state.conversations.length)refreshConversations().catch(error=>announce(error.message));
    }
  }
  function showList(){
    if(state.active)rememberDraft(state.active,input.value);
    state.active=null;state.threadToken++;state.lastThreadKey="";
    announce("");
    setVisible(true);
    $("#kf-chat-search").focus({preventScroll:true});
  }
  function pin(id){
    if(!state.heads.includes(id))state.heads=[id,...state.heads].slice(0,3);
    saveHeads();renderHeads();
  }
  function openConversation(id){
    if(!getConversation(id))return;
    if(state.active)rememberDraft(state.active,input.value);
    state.active=id;state.threadToken++;state.lastThreadKey="";
    thread.replaceChildren(el("p","kf-chat-empty","Loading messages…"));
    pin(id);announce("");
    input.value=drafts.get(id)||"";
    setVisible(true);
    input.focus({preventScroll:true});
  }
  function renderHeads(){
    const row=$("#kf-chat-head-row");
    row.replaceChildren();
    for(const id of state.heads){
      const c=getConversation(id);if(!c)continue;
      const item=el("div","kf-chat-head");
      const open=el("button","kf-chat-head-open",initialOf(c));
      open.type="button";open.setAttribute("aria-label","Chat with "+nameOf(c));open.title=nameOf(c);
      open.setAttribute("aria-pressed",String(state.visible&&state.active===id));
      if(Number(c.unread_count)>0){
        const badge=el("span","kf-chat-head-badge",String(Math.min(99,Number(c.unread_count))));
        open.append(badge);
      }
      open.addEventListener("click",()=>{if(state.visible&&state.active===id)setVisible(false);else openConversation(id)});
      const close=el("button","kf-chat-head-close","×");
      close.type="button";close.setAttribute("aria-label","Unpin "+nameOf(c));
      close.addEventListener("click",()=>{
        state.heads=state.heads.filter(other=>other!==id);saveHeads();
        if(state.active===id)showList();renderHeads();
      });
      item.append(open,close);row.append(item);
    }
  }
  function renderRecent(){
    recent.replaceChildren();
    if(!state.conversations.length){
      recent.append(el("p","kf-chat-empty","No conversations yet. Start one from your inbox."));
      return;
    }
    const query=$("#kf-chat-search").value.trim().toLowerCase();
    const filtered=state.conversations.filter(c=>!query||(
      nameOf(c)+" "+String(c.other_username||"")+" "+String(c.group_name||"")
    ).toLowerCase().includes(query));
    if(!filtered.length){recent.append(el("p","kf-chat-empty","No matching conversations."));return;}
    for(const c of filtered.slice(0,25)){
      const button=el("button","kf-chat-recent-item");
      button.type="button";
      const avatar=el("span","kf-chat-recent-avatar",initialOf(c));
      const copy=el("span","kf-chat-recent-copy");
      copy.append(el("strong","",nameOf(c)),el("small","",String(c.last_body||"Open conversation").slice(0,105)));
      button.append(avatar,copy);
      if(Number(c.unread_count)>0)button.append(el("b","kf-chat-recent-count",String(Math.min(99,Number(c.unread_count)))));
      button.addEventListener("click",()=>openConversation(Number(c.id)));
      recent.append(button);
    }
  }
  function renderPanel(){
    const c=getConversation(state.active);
    if(state.active&&!c)state.active=null;
    const selected=getConversation(state.active);
    $("#kf-chat-title").textContent=selected?nameOf(selected):"Recent conversations";
    $("#kf-chat-subtitle").textContent=selected?(selected.kind==="group"?"Group conversation":"Private messages"):"Message without leaving this page";
    $("#kf-chat-full").href=inboxUrl(state.active);
    $("#kf-chat-back").hidden=!selected;
    $("#kf-chat-search-wrap").hidden=!!selected;
    recent.hidden=!!selected;thread.hidden=!selected;composer.hidden=!selected;
    if(!selected){renderRecent();return;}
    const blocked=!!Number(selected.messaging_blocked);
    input.disabled=blocked;
    $("#kf-chat-send").disabled=blocked||state.sending;
    if(blocked)announce("Messaging is unavailable in this conversation.");
  }
  function renderMessages(messages,conversationId){
    if(!state.visible||state.active!==conversationId)return;
    const fingerprint=conversationId+"|"+messages.map(m=>
      [m.id,m.deleted_at||"",m.edited_at||"",m.body||""].join(":")
    ).join(";");
    if(state.lastThreadKey===fingerprint){markLocalRead(conversationId);return;}
    state.lastThreadKey=fingerprint;
    const nearBottom=thread.scrollHeight-thread.scrollTop-thread.clientHeight<64;
    const oldScroll=thread.scrollTop;
    const fragment=document.createDocumentFragment();
    for(const m of messages){
      const mine=Number(m.sender_id)===userId;
      const item=el("div","kf-chat-message "+(mine?"mine":"theirs"));
      item.append(el("small","kf-chat-sender",mine?"You":(m.display_name||m.username||"Member")));
      item.append(el("p","",m.deleted_at?"[Message deleted]":String(m.body||"")));
      fragment.append(item);
    }
    thread.replaceChildren(fragment);
    if(nearBottom||oldScroll===0)thread.scrollTop=thread.scrollHeight;
    markLocalRead(conversationId);
  }
  function updateUnreadBadge(){
    state.unread=state.conversations.reduce((sum,c)=>sum+Math.max(0,Number(c.unread_count)||0),0);
    const badge=$("#kf-chat-unread");
    badge.hidden=!state.unread;
    badge.textContent=state.unread>99?"99+":String(state.unread);
  }
  function markLocalRead(id){
    const c=getConversation(id);
    if(c&&Number(c.unread_count)>0){
      c.unread_count=0;updateUnreadBadge();renderHeads();
      if(!state.active)renderRecent();
    }
  }
  async function refreshThread(){
    const id=state.active,token=++state.threadToken;
    if(!id||!state.visible||document.hidden)return;
    const data=await api("/api/messages/conversations/"+id+"?limit=35");
    if(token!==state.threadToken||state.active!==id)return;
    renderMessages(data.messages||[],id);
  }
  let lastListRefresh=0;
  async function refreshConversations({force=false}={}){
    if(state.loading||document.hidden)return;
    if(!force&&!state.visible&&Date.now()-lastListRefresh<60000)return;
    state.loading=true;
    try{
      const data=await api("/api/messages/conversations");
      state.conversations=data.conversations||[];
      lastListRefresh=Date.now();
      updateUnreadBadge();
      const valid=new Set(state.conversations.map(c=>Number(c.id)));
      state.heads=state.heads.filter(id=>valid.has(id));saveHeads();renderHeads();
      if(state.visible)renderPanel();
    }finally{state.loading=false;}
  }
  $("#kf-chat-launcher").addEventListener("click",()=>state.visible?setVisible(false):showList());
  $("#kf-chat-back").addEventListener("click",showList);
  $("#kf-chat-search").addEventListener("input",renderRecent);
  input.addEventListener("input",()=>{if(state.active)rememberDraft(state.active,input.value);});
  window.addEventListener("kf:floating-panel-open",event=>{
    if(event.detail?.panel!=="member-chat"&&state.visible)setVisible(false);
  });
  $("#kf-chat-minimize").addEventListener("click",()=>setVisible(false));
  composer.addEventListener("submit",async event=>{
    event.preventDefault();
    const id=state.active,original=input.value,body=original.trim();
    if(!id||!body||state.sending)return;
    state.sending=true;$("#kf-chat-send").disabled=true;announce("Sending…");
    let sent=false;
    try{
      await api("/api/messages/conversations/"+id,{method:"POST",body:JSON.stringify({body})});
      sent=true;
      if(drafts.get(id)===original)rememberDraft(id,"");
      if(state.active===id&&input.value===original){input.value="";rememberDraft(id,"");}
      try{
        if(state.active===id)await refreshThread();
        await refreshConversations({force:true});
        announce("Message sent.");
      }catch(error){announce("Message sent, but chat refresh failed. Reopen the conversation to update it.");}
    }catch(error){
      if(!sent)announce(error.message+" Your unsent reply has been kept.");
    }finally{
      state.sending=false;
      $("#kf-chat-send").disabled=!!Number(getConversation(state.active)?.messaging_blocked);
    }
  });
  input.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
      event.preventDefault();composer.requestSubmit();
    }
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&state.visible){setVisible(false);$("#kf-chat-launcher").focus();}
  });
  document.addEventListener("fullscreenchange",()=>{
    dock.hidden=!!document.fullscreenElement;
  });
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)tick().catch(()=>{});
  });
  async function tick(){
    try{
      await refreshConversations();
      if(state.active&&state.visible)await refreshThread();
    }catch(error){if(state.visible)announce("Chat could not refresh. "+error.message);}
  }
  tick();
  const timer=setInterval(()=>{if(!document.hidden)tick();},10000);
  window.addEventListener("pagehide",event=>{if(!event.persisted)clearInterval(timer);});
})();
