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
  const messageSendQueues=new Map();
  const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
  const nameOf=c=>c?.kind==="group"?(c.group_name||"Group chat"):(c?.other_display_name||c?.other_username||"Conversation");
  const initialOf=c=>(nameOf(c).trim().charAt(0)||"✦").toUpperCase();
  function avatarUrl(c){
    const value=String(c?.other_avatar_url||"");
    if(c?.kind==="group"||value.length>200000)return "";
    return /^(https:\/\/|\/[^/])/i.test(value)||/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(value)?value:"";
  }
  function avatarContent(c){
    const holder=el("span","kf-chat-avatar-content");
    const fallback=el("span","kf-chat-photo-fallback",initialOf(c));
    const url=avatarUrl(c);
    if(url){
      const img=el("img","kf-chat-photo-img");
      img.src=url;img.alt="";img.loading="lazy";img.decoding="async";
      fallback.hidden=true;img.addEventListener("error",()=>{img.hidden=true;fallback.hidden=false;},{once:true});
      holder.append(img);
    }
    holder.append(fallback);return holder;
  }
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
  dock.innerHTML='<section class="kf-chat-panel" id="kf-chat-panel" aria-label="Conversation quick chat" hidden><header class="kf-chat-panel-header"><button id="kf-chat-back" type="button" aria-label="Back to recent conversations" hidden>←</button><div class="kf-chat-panel-title"><strong id="kf-chat-title">Recent conversations</strong><small id="kf-chat-subtitle">Message without leaving this page</small></div><a id="kf-chat-full" href="/messages.html">Inbox</a><button id="kf-chat-move" type="button" aria-label="Move chat with drag or arrow keys" title="Drag to move">⠿</button><button id="kf-chat-minimize" type="button" aria-label="Minimize chat">×</button></header><label id="kf-chat-search-wrap" class="kf-chat-search-wrap"><span class="kf-chat-sr">Find a conversation</span><input id="kf-chat-search" type="search" autocomplete="off" placeholder="Find a conversation…" aria-label="Find a conversation"></label><div id="kf-chat-list" class="kf-chat-recent"></div><div id="kf-chat-thread" class="kf-chat-thread" hidden></div><form id="kf-chat-compose" class="kf-chat-compose" hidden><label class="kf-chat-sr" for="kf-chat-input">Message</label><textarea id="kf-chat-input" maxlength="4000" rows="2" placeholder="Write a reply…" aria-label="Write a message"></textarea><button id="kf-chat-send" type="submit">Send</button></form><div id="kf-chat-status" class="kf-chat-status" role="status" aria-live="polite"></div><button id="kf-chat-resize" type="button" aria-label="Resize chat by dragging or arrow keys" title="Drag to resize">◢</button></section><div class="kf-chat-head-row" id="kf-chat-head-row"></div><button class="kf-chat-launcher" id="kf-chat-launcher" type="button" aria-label="Open conversations" aria-expanded="false" aria-controls="kf-chat-panel"><span aria-hidden="true">💬</span><b id="kf-chat-unread" hidden></b></button>';
  document.body.append(dock);
  function syncBubbleViewport(){
    const viewport=window.visualViewport,layoutHeight=window.innerHeight;
    const visibleHeight=viewport?.height||layoutHeight;
    const bottom=(viewport?.offsetTop||0)+visibleHeight;
    const keyboardInset=Math.max(0,layoutHeight-bottom);
    dock.style.setProperty("--kf-chat-keyboard-offset",keyboardInset+"px");
    dock.style.setProperty("--kf-chat-visible-height",visibleHeight+"px");
    dock.style.setProperty("--kf-chat-dock-base-bottom",visibleHeight<520?"12px":"80px");
  }
  syncBubbleViewport();
  window.addEventListener("resize",syncBubbleViewport,{passive:true});
  window.visualViewport?.addEventListener("resize",syncBubbleViewport,{passive:true});
  window.visualViewport?.addEventListener("scroll",syncBubbleViewport,{passive:true});
  const $=selector=>dock.querySelector(selector);
  const panel=$("#kf-chat-panel"),recent=$("#kf-chat-list"),thread=$("#kf-chat-thread"),composer=$("#kf-chat-compose"),input=$("#kf-chat-input"),status=$("#kf-chat-status");

  // Movable and resizable messenger, with per-account placement persistence.
  const layoutKey="kf-chat-layout-"+userId;
  const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
  let customPosition=null,preferredPosition=null,desiredSize=null;
  function bounds(){
    const v=window.visualViewport,l=v?.offsetLeft||0,t=v?.offsetTop||0;
    return {left:l,top:t,right:l+(v?.width||innerWidth),bottom:t+(v?.height||innerHeight)};
  }
  function setSize(w,h,remember=true){
    if(remember)desiredSize={width:w,height:h};
    const b=bounds(),maxW=Math.max(160,b.right-b.left-16),maxH=Math.max(130,b.bottom-b.top-95);
    panel.style.width=clamp(w,Math.min(260,maxW),maxW)+"px";
    panel.style.height=clamp(h,Math.min(180,maxH),maxH)+"px";
  }
  function placeDock(x,y,remember=true){
    if(remember)preferredPosition={x,y};
    const b=bounds();
    dock.classList.add("kf-chat-positioned");
    dock.style.setProperty("--kf-chat-left",x+"px");
    dock.style.setProperty("--kf-chat-top",y+"px");
    const r=dock.getBoundingClientRect();
    x=clamp(x,b.left+6,Math.max(b.left+6,b.right-r.width-6));
    y=clamp(y,b.top+6,Math.max(b.top+6,b.bottom-r.height-6));
    dock.style.setProperty("--kf-chat-left",x+"px");
    dock.style.setProperty("--kf-chat-top",y+"px");
    customPosition={x,y};
  }
  function saveLayout(){
    const r=panel.getBoundingClientRect();
    const width=r.width||parseFloat(panel.style.width)||375,height=r.height||parseFloat(panel.style.height)||480;
    try{localStorage.setItem(layoutKey,JSON.stringify({
      x:preferredPosition?.x??customPosition?.x??null,y:preferredPosition?.y??customPosition?.y??null,
      width:Math.round(desiredSize?.width??width),height:Math.round(desiredSize?.height??height)
    }));}catch{}
  }
  function fitDock(){
    if(desiredSize)setSize(desiredSize.width,desiredSize.height,false);
    else if(panel.style.width||panel.style.height){
      const r=panel.getBoundingClientRect();
      setSize(r.width||parseFloat(panel.style.width)||375,r.height||parseFloat(panel.style.height)||480,false);
    }
    if(preferredPosition||customPosition){
      const p=preferredPosition||customPosition;placeDock(p.x,p.y,false);
    }
  }
  function draggable(handle,ignoreControls=false){
    let drag=null,blockClickUntil=0;
    handle.addEventListener("pointerdown",e=>{
      if(e.button!==0||e.isPrimary===false||
         (ignoreControls&&e.target.closest("button,a,input,textarea,select")))return;
      const r=dock.getBoundingClientRect();
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};
      handle.setPointerCapture?.(e.pointerId);
    });
    handle.addEventListener("pointermove",e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!drag.moved&&Math.hypot(dx,dy)<7)return;
      drag.moved=true;e.preventDefault();
      placeDock(drag.left+dx,drag.top+dy);
    });
    const end=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      if(drag.moved){blockClickUntil=Date.now()+300;saveLayout();}
      drag=null;
    };
    handle.addEventListener("pointerup",end);
    handle.addEventListener("pointercancel",end);
    handle.addEventListener("click",e=>{
      if(Date.now()<blockClickUntil){e.preventDefault();e.stopImmediatePropagation();}
    },true);
  }
  try{
    const saved=JSON.parse(localStorage.getItem(layoutKey)||"null");
    if(saved&&Number.isFinite(saved.width)&&Number.isFinite(saved.height))
      setSize(saved.width,saved.height);
    if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))
      placeDock(saved.x,saved.y);
  }catch{}
  window.addEventListener("resize",fitDock,{passive:true});
  window.visualViewport?.addEventListener("resize",fitDock,{passive:true});
  window.visualViewport?.addEventListener("scroll",fitDock,{passive:true});
  const grip=$("#kf-chat-resize");
  let sizing=null;
  grip.addEventListener("pointerdown",e=>{
    if(e.button!==0||e.isPrimary===false)return;
    const r=panel.getBoundingClientRect(),d=dock.getBoundingClientRect();
    placeDock(d.left,d.top);
    sizing={id:e.pointerId,x:e.clientX,y:e.clientY,w:r.width,h:r.height};
    grip.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  grip.addEventListener("pointermove",e=>{
    if(!sizing||sizing.id!==e.pointerId)return;
    setSize(sizing.w-(e.clientX-sizing.x),sizing.h+(e.clientY-sizing.y));
    if(customPosition)placeDock(customPosition.x,customPosition.y,false);
    e.preventDefault();
  });
  const endSize=e=>{if(sizing&&sizing.id===e.pointerId){sizing=null;saveLayout();}};
  grip.addEventListener("pointerup",endSize);
  grip.addEventListener("pointercancel",endSize);
  grip.addEventListener("keydown",e=>{
    if(!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;
    e.preventDefault();const r=panel.getBoundingClientRect(),step=e.shiftKey?40:16;
    setSize(r.width+(e.key==="ArrowLeft"?step:e.key==="ArrowRight"?-step:0),
      r.height+(e.key==="ArrowDown"?step:e.key==="ArrowUp"?-step:0));
    fitDock();saveLayout();
  });
  draggable($("#kf-chat-launcher"));
  draggable($("#kf-chat-move"));
  draggable($("#kf-chat-panel .kf-chat-panel-header"),true);
  $("#kf-chat-move").addEventListener("keydown",e=>{
    if(!/^Arrow(Left|Right|Up|Down)$/.test(e.key))return;
    e.preventDefault();const r=dock.getBoundingClientRect(),step=e.shiftKey?40:16;
    placeDock(r.left+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0),
      r.top+(e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0));
    saveLayout();
  });
  function announce(message){status.textContent=message||"";}
  function saveHeads(){try{sessionStorage.setItem(storeKey,JSON.stringify(state.heads));}catch{}}
  function getConversation(id){return state.conversations.find(c=>Number(c.id)===id);}
  function inboxUrl(id){return "/messages.html"+(id?"?conversation="+id:"");}
  function setVisible(value){
    state.visible=!!value;
    const opening=!!value&&panel.hidden;
    panel.hidden=!state.visible;
    if(customPosition)requestAnimationFrame(fitDock);
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
      const open=el("button","kf-chat-head-open");open.append(avatarContent(c));
      open.type="button";open.setAttribute("aria-label","Chat with "+nameOf(c));open.title=nameOf(c);
      open.setAttribute("aria-pressed",String(state.visible&&state.active===id));
      if(Number(c.unread_count)>0){
        const badge=el("span","kf-chat-head-badge",String(Math.min(99,Number(c.unread_count))));
        open.append(badge);
      }
      draggable(open);
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
      const avatar=el("span","kf-chat-recent-avatar");avatar.append(avatarContent(c));
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
    $("#kf-chat-send").disabled=blocked;
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
      window.dispatchEvent(new Event("kf:notifications-changed"));
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
      // A temporarily truncated inbox list must not kick the user out of an
      // already open conversation after sending its first message.
      const selected=getConversation(state.active);
      state.conversations=data.conversations||[];
      if(selected&&!state.conversations.some(c=>Number(c.id)===Number(selected.id)))
        state.conversations.push(selected);
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
    if(!id||!body||Number(getConversation(id)?.messaging_blocked))return;
    // Accept consecutive sends immediately; the network can finish each in
    // order without locking the textarea or making the member reopen the chat.
    if(state.active===id&&input.value===original){
      input.value="";rememberDraft(id,"");
    }
    announce("Sending message…");
    const previous=messageSendQueues.get(id)||Promise.resolve();
    const queued=previous.catch(()=>{}).then(async()=>{
      state.sending=true;
      try{
        await api("/api/messages/conversations/"+id,{method:"POST",body:JSON.stringify({body})});
        announce("Message sent.");
        void (async()=>{
          try{
            if(state.active===id)await refreshThread();
            await refreshConversations({force:true});
          }catch(error){
            console.warn("floating_chat_post_send_refresh_failed",String(error));
          }
        })();
      }catch(error){
        const old=drafts.get(id)||"";
        if(state.active===id){
          input.value=input.value?original+"\n"+input.value:original;
          rememberDraft(id,input.value);
          input.focus({preventScroll:true});
        }else rememberDraft(id,old?original+"\n"+old:original);
        announce("Message not sent: "+error.message+" Draft restored.");
      }finally{
        state.sending=false;
        if(state.active===id&&state.visible){
          // Network refreshes may update conversation metadata, never close a
          // live chat or leave its composer disabled.
          renderPanel();
          composer.hidden=false;
          input.disabled=!!Number(getConversation(id)?.messaging_blocked);
          $("#kf-chat-send").disabled=!!Number(getConversation(id)?.messaging_blocked);
        }
      }
    });
    messageSendQueues.set(id,queued);
    void queued.finally(()=>{if(messageSendQueues.get(id)===queued)messageSendQueues.delete(id);});
    if(state.active===id&&state.visible&&!document.hidden)input.focus({preventScroll:true});
    return queued;
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
  let bubbleLiveDelay=0;
  if(window.KnightfallLive)window.KnightfallLive.subscribe(event=>{
    if(event.type==="status"){if(event.connected)tick().catch(()=>{});return;}
    if(event.type!=="message-event"||document.hidden)return;
    if(event.kind==="typing"||event.kind==="read")return;
    clearTimeout(bubbleLiveDelay);
    bubbleLiveDelay=setTimeout(async()=>{
      try{
        await refreshConversations({force:true});
        if(state.visible&&state.active===event.conversationId)await refreshThread();
      }catch(error){if(state.visible)announce("Live chat update failed. "+error.message);}
    },120);
  });
  tick();
  const timer=setInterval(()=>{if(!document.hidden&&!window.KnightfallLive?.connected)tick();},15000);
  window.addEventListener("pagehide",event=>{if(!event.persisted)clearInterval(timer);});
})();
