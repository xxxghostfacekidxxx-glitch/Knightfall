/* Knightfall conversation bubbles: same inbox API, no second message store. */
(() => {
  "use strict";
  const script=document.currentScript;
  const userId=Number(script?.dataset?.userId);
  if(!Number.isSafeInteger(userId)||userId<1||document.getElementById("kf-chat-heads"))return;
  if(["/messages","/messages.html"].includes(location.pathname))return; // The full inbox already owns this route.
  const API="https://api.ash-fall.com";
  if(!window.ChaosphereSend)import("/chaosphere-send.js?v=20261125-apotheosis4").catch(()=>{});
  const organization=()=>{try{return window.ChaosphereOrganization?.read(localStorage,userId)||{pinned:[],archived:[]}}catch{return {pinned:[],archived:[]}}};
  window.addEventListener("storage",event=>{if(event.key==="kf-cs-organization-"+userId&&state.visible)renderPanel();});
  let customEmoji=window.KnightfallEmojis||null,optionalToolsPending=null;
  function loadOptionalChatTools(){
    if(optionalToolsPending)return optionalToolsPending;
    const jobs=[];
    if(!window.ChaosphereOrganization)jobs.push(import("/chaosphere-organization.js?v=20261125-apotheosis3"));
    if(!window.ChaosphereFormat)jobs.push(import("/chaosphere-format.js?v=20261125-apotheosis1"));
    if(!customEmoji)jobs.push(import("/knightfall-emojis.mjs?v=20261125-noir1").then(module=>{
      customEmoji=window.KnightfallEmojis||{render:module.renderKnightfallEmojiText,mount:module.mountKnightfallEmojiPicker};
      customEmoji.mount?.(dock);
    }));
    if(!jobs.length)return Promise.resolve();
    optionalToolsPending=Promise.allSettled(jobs).then(results=>{
      if(results.some(result=>result.status==="rejected"))console.warn("Optional Chaosphere tools unavailable; core chat remains active");
      state.lastThreadKey="";
      if(state.visible){renderPanel();if(state.active)void refreshThread().catch(()=>{});}
    }).finally(()=>{optionalToolsPending=null;});
    return optionalToolsPending;
  }
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
  const pendingDelivery=new Map();
  function updatePendingDelivery(id,delta){const count=Math.max(0,(pendingDelivery.get(id)||0)+delta);if(count)pendingDelivery.set(id,count);else pendingDelivery.delete(id);if(state.active===id){const node=$("#kf-chat-delivery");node.hidden=!count;node.textContent=count?count+" awaiting confirmation":"";}}
  const favoritesKey="kf-cs-favorites-"+userId;
  let recentFilter="all",favoriteIds=new Set();
  function loadFavorites(){try{const ids=JSON.parse(localStorage.getItem(favoritesKey)||"[]");favoriteIds=new Set(Array.isArray(ids)?ids.map(Number).filter(id=>Number.isSafeInteger(id)&&id>0).slice(-200):[]);}catch{}}
  function toggleFavorite(id){if(!getConversation(id))return;if(favoriteIds.has(id))favoriteIds.delete(id);else favoriteIds.add(id);try{localStorage.setItem(favoritesKey,JSON.stringify([...favoriteIds].slice(-200)))}catch{}renderPanel();}
  loadFavorites();window.addEventListener("storage",event=>{if(event.key===favoritesKey){loadFavorites();if(state.visible)renderPanel();}});
  const attachmentDrafts=new Map(),uploadingConversations=new Set(),removingConversations=new Set();
  const attachmentDraftKey="kf-chat-attachment-drafts-"+userId;
  let pickerConversation=null;
  // Invite content stays a local draft until its recipient deliberately sends it.
  let pendingShare="";
  const validId=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
  function loadAttachmentDrafts(){
    try{const entries=JSON.parse(sessionStorage.getItem(attachmentDraftKey)||"[]");if(!Array.isArray(entries))return;for(const entry of entries.slice(-20)){if(!Array.isArray(entry)||!validId(entry[0])||!Array.isArray(entry[1]))continue;const items=entry[1].filter(a=>a&&validId(a.id)).slice(0,10).map(a=>({id:Number(a.id),filename:String(a.filename||"Attachment").slice(0,180)}));if(items.length)attachmentDrafts.set(Number(entry[0]),items);}}catch{}
  }
  function saveAttachmentDraft(id,items){
    if(!validId(id))return;
    if(items.length)attachmentDrafts.set(id,items);else attachmentDrafts.delete(id);
    try{sessionStorage.setItem(attachmentDraftKey,JSON.stringify([...attachmentDrafts.entries()].slice(-20)));}catch{}
  }
  loadAttachmentDrafts();
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
 const controller=new AbortController(),external=opts.signal;
 const abort=()=>controller.abort();
 if(external?.aborted)abort();else external?.addEventListener("abort",abort,{once:true});
 const timer=setTimeout(abort,30000);
 try{
  const response=await fetch(API+path,{credentials:"include",cache:"no-store",...opts,signal:controller.signal,headers:{...(opts.body==null||opts.body instanceof FormData?{}:{"content-type":"application/json"}),...(opts.headers||{})}});
  const data=await response.json().catch(()=>null);
  if(!response.ok){const error=Error(data?.error||("Messaging API returned HTTP "+response.status));error.status=response.status;throw error;}
  if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid messaging response. Please retry.");
  return data;
 }catch(error){if(controller.signal.aborted)throw Error("Messaging request interrupted or timed out. Check the conversation before retrying a send.");throw error;}
 finally{clearTimeout(timer);external?.removeEventListener("abort",abort);}
}
  try{
    const saved=JSON.parse(sessionStorage.getItem(storeKey)||"[]");
    if(Array.isArray(saved))state.heads=[...new Set(saved.map(validId).filter(Boolean))].slice(0,3);
  }catch{}
  const dock=el("aside","kf-chat-dock");
  dock.id="kf-chat-heads";
  const themeKey="knightfall-chaosphere-theme",allowedThemes=new Set(["obsidian","hellfire","egypt","mustafar","korriban","vader"]);
  function syncTheme(value){let selected=value;try{if(!selected)selected=localStorage.getItem(themeKey)}catch{}dock.dataset.csTheme=allowedThemes.has(selected)?selected:"obsidian";}
  syncTheme();window.addEventListener("storage",event=>{if(event.key===themeKey)syncTheme(event.newValue)});window.addEventListener("kf:chaosphere-theme",event=>syncTheme(event.detail?.theme));
  dock.setAttribute("aria-label","Chaosphere conversations");
  dock.innerHTML='<section class="kf-chat-panel" id="kf-chat-panel" aria-label="Conversation quick chat" hidden><header class="kf-chat-panel-header"><button id="kf-chat-back" type="button" aria-label="Back to recent conversations" hidden>←</button><div class="kf-chat-panel-title"><strong id="kf-chat-title">Chaosphere · Chats</strong><small id="kf-chat-subtitle">Message without leaving this page</small><small id="kf-imp-inline" class="kf-imp-inline" aria-hidden="true" hidden></small></div><button id="kf-chat-favorite" type="button" aria-label="Favorite conversation" aria-pressed="false" hidden>☆</button><a id="kf-chat-full" href="/messages.html">Inbox</a><button id="kf-imp-quiet" class="kf-imp-quiet-button" type="button" aria-label="Turn off Chaosphere mascot reactions" aria-pressed="true" title="Silence the tiny demon">😈</button><button id="kf-chat-move" type="button" aria-label="Move chat with drag or arrow keys" title="Drag to move">⠿</button><button id="kf-chat-minimize" type="button" aria-label="Minimize chat">×</button></header><label id="kf-chat-search-wrap" class="kf-chat-search-wrap"><span class="kf-chat-sr">Find a conversation</span><input id="kf-chat-search" type="search" autocomplete="off" placeholder="Find a conversation…" aria-label="Find a conversation"></label><div id="kf-chat-filters" role="group" aria-label="Filter conversations"><button type="button" data-kf-filter="all" aria-pressed="true">All</button><button type="button" data-kf-filter="unread" aria-pressed="false">Unread</button><button type="button" data-kf-filter="favorites" aria-pressed="false">★ Favorites</button><button type="button" data-kf-filter="groups" aria-pressed="false">Groups</button><button type="button" data-kf-filter="drafts" aria-pressed="false">Drafts</button><button type="button" data-kf-filter="pinned" aria-pressed="false">Pinned</button><button type="button" data-kf-filter="online" aria-pressed="false">Active</button><button type="button" data-kf-filter="archived" aria-pressed="false">Archived</button></div><div id="kf-chat-list" class="kf-chat-recent"></div><div id="kf-chat-organization" class="kf-chat-organization" hidden><button type="button" id="kf-chat-pin">Pin</button><button type="button" id="kf-chat-archive">Archive</button></div><div id="kf-chat-thread" class="kf-chat-thread" hidden></div><form id="kf-chat-compose" class="kf-chat-compose" hidden><div class="kf-chat-emoji-tools"><button id="kf-chat-emoji-toggle" type="button" aria-expanded="false" aria-controls="kf-chat-emoji-tray" aria-label="Show Knightfall emojis">☻ Emoji</button><button id="kf-chat-attach" type="button" aria-label="Attach files">📎 Attach</button><button id="kf-chat-format" type="button" aria-expanded="false">Aa</button><div id="kf-chat-format-tools" class="kf-chat-format-tools" hidden><button type="button" data-kf-format="bold">Bold</button><button type="button" data-kf-format="italic">Italic</button><button type="button" data-kf-format="code">Code</button><button type="button" data-kf-format="spoiler">Spoiler</button></div><input id="kf-chat-file" type="file" accept="image/*,application/pdf,text/plain,.docx" multiple hidden><div id="kf-chat-pending" class="kf-chat-pending" hidden></div><div id="kf-chat-emoji-tray" class="kf-emoji-tray" aria-label="Knightfall custom emojis" hidden></div></div><label class="kf-chat-sr" for="kf-chat-input">Message</label><textarea id="kf-chat-input" maxlength="4000" rows="2" placeholder="Write a reply…" aria-label="Write a message"></textarea><button id="kf-chat-send" type="submit">Send</button></form><div id="kf-chat-delivery" class="kf-chat-delivery" role="status" hidden></div><div id="kf-chat-status" class="kf-chat-status" role="status" aria-live="polite"></div><button id="kf-chat-resize" type="button" aria-label="Resize chat by dragging or arrow keys" title="Drag to resize">◢</button></section><div class="kf-chat-head-row" id="kf-chat-head-row"></div><button class="kf-chat-launcher" id="kf-chat-launcher" type="button" aria-label="Open Chaosphere conversations" aria-expanded="false" aria-controls="kf-chat-panel"><img class="kf-chaosphere-demon" src="/icons/chaosphere.svg" alt="" aria-hidden="true" width="46" height="46"><b id="kf-chat-unread" hidden></b></button><span id="kf-imp-speech" class="kf-imp-speech" aria-hidden="true" hidden></span>';
  // Host outside the page body so transformed game/page wrappers cannot clip or resize chat.
  document.documentElement.append(dock);
  dock.querySelector("#kf-chat-emoji-tray").dataset.kfEmojiAccount=String(userId);
  customEmoji?.mount?.(dock);
  function syncBubbleViewport(){
    const viewport=window.visualViewport,layoutHeight=window.innerHeight;
    const visibleHeight=viewport?.height||layoutHeight;
    const bottom=(viewport?.offsetTop||0)+visibleHeight;
    const keyboardInset=Math.max(0,layoutHeight-bottom);
    dock.style.setProperty("--kf-chat-keyboard-offset",keyboardInset+"px");
    dock.style.setProperty("--kf-chat-visible-height",visibleHeight+"px");
    dock.style.setProperty("--kf-chat-dock-base-bottom",visibleHeight<520?"12px":"80px");
    // Android keyboards change the visual viewport without necessarily changing innerHeight.
    // Keep the open mobile conversation in its own viewport-sized layer, not in the
    // same layout box as the pinned heads and launcher.
    dock.style.setProperty("--kf-chat-viewport-left",(viewport?.offsetLeft||0)+"px");
    dock.style.setProperty("--kf-chat-viewport-top",(viewport?.offsetTop||0)+"px");
    dock.style.setProperty("--kf-chat-viewport-width",(viewport?.width||innerWidth)+"px");
    dock.style.setProperty("--kf-chat-viewport-height",visibleHeight+"px");
    dock.classList.toggle("kf-chat-expanded",state.visible&&window.matchMedia("(max-width:700px)").matches);
  }
  syncBubbleViewport();

  const $=selector=>dock.querySelector(selector);
  const panel=$("#kf-chat-panel"),recent=$("#kf-chat-list"),thread=$("#kf-chat-thread"),composer=$("#kf-chat-compose"),input=$("#kf-chat-input"),status=$("#kf-chat-status");
  // Progressive enhancement: a failed mascot load must never disable messaging.
  let imp=null;
  function attachImp(){try{if(!imp&&window.ChaosphereImp)imp=window.ChaosphereImp.mount(dock,userId);}catch(error){console.warn("Optional chat mascot failed",error);}}
  attachImp();
  window.addEventListener("kf:chaosphere-imp-ready",attachImp,{once:true});
  const impReact=kind=>{try{imp?.react?.(kind)}catch(error){console.warn("Optional mascot reaction failed",error)}};
  let unreadBaselineReady=false;
  let serverUnreadBaseline=[];


  // Movable and resizable messenger, with per-account placement persistence.
  const layoutKey="kf-chat-layout-recovery2-"+userId;
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
    // The expanded mobile sheet owns its geometry; saved desktop drag coordinates
    // must never push it offscreen or make the keyboard clip the composer.
    if(dock.classList.contains("kf-chat-expanded"))return;
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
      // Moving the dock only applies to the minimized/desktop bubble, never the
      // fullscreen mobile sheet. Otherwise a swipe changes saved dock position.
      if(dock.classList.contains("kf-chat-expanded"))return;
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
  let viewportFrame=null;
  function scheduleViewportFit(){
    if(viewportFrame!==null)return;
    viewportFrame=requestAnimationFrame(()=>{
      viewportFrame=null;
      syncBubbleViewport();
      fitDock();
    });
  }
  window.addEventListener("resize",scheduleViewportFit,{passive:true});
  window.visualViewport?.addEventListener("resize",scheduleViewportFit,{passive:true});
  window.visualViewport?.addEventListener("scroll",scheduleViewportFit,{passive:true});
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
    if(!state.visible)pendingShare="";
    dock.classList.toggle("kf-chat-open",state.visible);
    try{imp?.syncVisibility?.()}catch(error){console.warn("Optional mascot visibility failed",error)}
    const opening=!!value&&panel.hidden;
    panel.hidden=!state.visible;
    syncBubbleViewport();
    fitDock();
    if(customPosition&&!dock.classList.contains("kf-chat-expanded"))requestAnimationFrame(fitDock);
    $("#kf-chat-launcher").setAttribute("aria-expanded",String(state.visible));
    if(opening){window.dispatchEvent(new CustomEvent("kf:floating-panel-open",{detail:{panel:"member-chat"}}));impReact("wake");}
    if(state.visible){
      void loadOptionalChatTools();
      renderPanel();
      if(state.active){const id=state.active;refreshThread().catch(error=>{if(state.active===id&&state.visible){if(!thread.querySelector(".kf-chat-message"))thread.replaceChildren(el("p","kf-chat-empty","Could not load messages. Reopen this conversation to retry."));announce(error.message);}});}
      else refreshConversations({force:true}).catch(error=>announce(error.message));
    }
    window.dispatchEvent(new CustomEvent("kf:chat-visibility",{detail:{open:state.visible}}));
  }
  function showList(){
    loadFavorites();
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
    const existingDraft=drafts.get(id)||"";
    input.value=pendingShare?(existingDraft?existingDraft+"\n"+pendingShare:pendingShare):existingDraft;
    if(pendingShare){rememberDraft(id,input.value);pendingShare="";}
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
    const scroll=recent.scrollTop,focused=document.activeElement?.closest?.("[data-kf-recent-id]")?.dataset.kfRecentId;
    recent.replaceChildren();
    if(!state.conversations.length){
      recent.append(el("p","kf-chat-empty","No conversations yet. Start one from your inbox."));
      return;
    }
    const query=$("#kf-chat-search").value.trim().toLowerCase();
    const prefs=organization();const filtered=state.conversations.filter(c=>{if(window.ChaosphereOrganization&&!window.ChaosphereOrganization.matches(prefs,c,recentFilter))return false;const id=Number(c.id),matches=!query||(nameOf(c)+" "+String(c.other_username||"")+" "+String(c.group_name||"")+" "+String(c.last_body||"")).toLowerCase().includes(query);return matches&&(["all","pinned","online","archived"].includes(recentFilter)||recentFilter==="unread"&&Number(c.unread_count)>0||recentFilter==="favorites"&&favoriteIds.has(id)||recentFilter==="groups"&&c.kind==="group"||recentFilter==="drafts"&&(drafts.has(id)||!!attachmentDrafts.get(id)?.length));}).sort((a,b)=>(window.ChaosphereOrganization?.order(prefs,a,b)||0)||Number(favoriteIds.has(Number(b.id)))-Number(favoriteIds.has(Number(a.id))));
    if(!filtered.length){recent.append(el("p","kf-chat-empty","No matching conversations."));return;}
    for(const c of filtered.slice(0,25)){
      const button=el("button","kf-chat-recent-item");
      button.type="button";button.dataset.kfRecentId=String(c.id);
      const avatar=el("span","kf-chat-recent-avatar");avatar.append(avatarContent(c));
      const copy=el("span","kf-chat-recent-copy");
      const id=Number(c.id),draft=drafts.get(id);copy.append(el("strong","",(prefs.pinned.includes(id)?"◆ ":"")+(favoriteIds.has(id)?"★ ":"")+nameOf(c)),el("small","",draft?"Draft · "+draft.slice(0,90):attachmentDrafts.get(id)?.length?"Draft · attachments":String(c.last_body||"Open conversation").slice(0,105)));
      button.append(avatar,copy);
      if(Number(c.unread_count)>0)button.append(el("b","kf-chat-recent-count",String(Math.min(99,Number(c.unread_count)))));
      button.addEventListener("click",()=>openConversation(Number(c.id)));
      recent.append(button);
    }
    recent.scrollTop=scroll;if(focused&&/^\d+$/.test(focused))recent.querySelector('[data-kf-recent-id="'+focused+'"]')?.focus({preventScroll:true});
  }
  function renderPanel(){
    const c=getConversation(state.active);
    if(state.active&&!c)state.active=null;
    const selected=getConversation(state.active);
    $("#kf-chat-title").textContent=selected?nameOf(selected):"Chaosphere · Chats";
    $("#kf-chat-subtitle").textContent=selected?(selected.kind==="group"?"Group conversation":"Private messages"):"Message without leaving this page";
    $("#kf-chat-full").href=inboxUrl(state.active);
    $("#kf-chat-back").hidden=!selected;
    $("#kf-chat-search-wrap").hidden=!!selected;$("#kf-chat-filters").hidden=!!selected;
    const star=$("#kf-chat-favorite"),isFavorite=!!selected&&favoriteIds.has(Number(selected.id));star.hidden=!selected;star.textContent=isFavorite?"★":"☆";star.setAttribute("aria-pressed",String(isFavorite));star.setAttribute("aria-label",isFavorite?"Remove conversation from favorites":"Favorite conversation");
    recent.hidden=!!selected;thread.hidden=!selected;composer.hidden=!selected;$("#kf-chat-organization").hidden=!selected;const prefs=organization();$("#kf-chat-pin").textContent=prefs.pinned.includes(Number(selected?.id))?"Unpin":"Pin";$("#kf-chat-archive").textContent=prefs.archived.includes(Number(selected?.id))?"Restore":"Archive";
    if(!selected){$("#kf-chat-delivery").hidden=true;renderRecent();return;}
    const blocked=!!Number(selected.messaging_blocked);
    input.disabled=blocked;
    $("#kf-chat-send").disabled=blocked;
    drawAttachmentDraft();updatePendingDelivery(Number(selected.id),0);
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
    const fragment=document.createDocumentFragment();let previousDay="";
    for(const m of messages){
      const dateValue=new Date(m.created_at);if(m.created_at&&Number.isFinite(dateValue.getTime())&&dateValue.toDateString()!==previousDay){previousDay=dateValue.toDateString();fragment.append(el("div","kf-chat-day-marker",previousDay===new Date().toDateString()?"Today":dateValue.toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"})));}
      const mine=Number(m.sender_id)===userId;
      const item=el("div","kf-chat-message "+(mine?"mine":"theirs"));
      item.dataset.messageId=String(m.id);item.dataset.rawBody=String(m.deleted_at?"[Message deleted]":m.body||"");
      const meta=el("div","kf-chat-message-meta");
      meta.append(el("small","kf-chat-sender",mine?"You":(m.display_name||m.username||"Member")));
      const date=new Date(m.created_at);if(m.created_at&&Number.isFinite(date.getTime())){const time=el("time","kf-chat-message-time",date.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}));time.dateTime=date.toISOString();time.title=date.toLocaleString();meta.append(time);}
      item.append(meta);
      const body=el("p");
      if(m.deleted_at)body.textContent="[Message deleted]";
      else if(window.ChaosphereFormat)body.innerHTML=window.ChaosphereFormat.render(String(m.body||""),customEmoji?.render?value=>customEmoji.render(value,undefined,{lineBreaks:true}):undefined);
      else if(customEmoji?.render)body.innerHTML=customEmoji.render(String(m.body||""),undefined,{lineBreaks:true});
      else body.textContent=String(m.body||"");
      if(m.deleted_at||m.body) item.append(body);
      if(!m.deleted_at){const attachments=el("div","kf-chat-attachments");attachments.hidden=true;item.append(attachments);const row=el("div","kf-chat-reactions");const add=el("button","kf-chat-react-add","＋ React");add.type="button";add.dataset.reactionPicker=String(m.id);add.setAttribute("aria-expanded","false");const summary=el("span","kf-chat-reaction-summary");const quote=el("button","kf-chat-react-add","↶ Quote");quote.type="button";quote.dataset.quoteMessage=String(m.id);row.append(add,quote,summary);item.append(row);}
      fragment.append(item);
    }
    if(!messages.length)fragment.append(el("p","kf-chat-empty","No messages yet. Start the conversation."));
    thread.replaceChildren(fragment);
    if(nearBottom||oldScroll===0)thread.scrollTop=thread.scrollHeight;
    else thread.scrollTop=oldScroll;
    markLocalRead(conversationId);
  }
  function updateUnreadBadge(){
    state.unread=state.conversations.reduce((sum,c)=>sum+Math.max(0,Number(c.unread_count)||0),0);
    const badge=$("#kf-chat-unread");
    badge.hidden=!state.unread;
    badge.textContent=state.unread>99?"99+":String(state.unread);
    dock.classList.toggle("kf-chat-has-unread",state.unread>0);
    // Screen readers and mobile hover-help announce unread count without
    // placing another bubble or intrusive toast over a running arcade game.
    const launcher=$("#kf-chat-launcher");
    const count=state.unread;
    launcher.setAttribute("aria-label",count?"Open Chaosphere: "+count+" unread "+(count===1?"message":"messages"):"Open Chaosphere conversations");
    launcher.title=count?"Chaosphere: "+count+" unread":"Chaosphere · Enter the chaos";
  }
  function markLocalRead(id){
    const c=getConversation(id);
    if(c&&Number(c.unread_count)>0){
      c.unread_count=0;updateUnreadBadge();renderHeads();
      if(!state.active)renderRecent();
      window.dispatchEvent(new Event("kf:notifications-changed"));
    }
  }
  async function refreshThreadAttachments(id,token){
    const items=[...thread.querySelectorAll("[data-message-id]")];
    const ids=items.map(item=>validId(item.dataset.messageId)).filter(Boolean);
    if(!ids.length)return;
    const data=await api("/api/messages/conversations/"+id+"/attachments?message_ids="+ids.join(","));
    if(token!==state.threadToken||state.active!==id||!state.visible)return;
    if(!Array.isArray(data.attachments))throw Error("Invalid attachment response");
    const groups=new Map();
    for(const a of data.attachments){const messageId=validId(a.message_id),attachmentId=validId(a.id);if(!messageId||!attachmentId)continue;const list=groups.get(messageId)||[];list.push(a);groups.set(messageId,list);}
    for(const item of items){
      const box=item.querySelector(".kf-chat-attachments");if(!box)continue;
      const list=groups.get(Number(item.dataset.messageId))||[];
      const key=JSON.stringify(list.map(a=>[a.id,a.original_filename,a.content_type,a.byte_size]));
      if(box.dataset.attachmentKey===key)continue;
      box.dataset.attachmentKey=key;box.replaceChildren();box.hidden=!list.length;
      for(const a of list){
        const link=el("a","kf-chat-attachment");link.href=API+"/api/messages/attachments/"+Number(a.id);link.target="_blank";link.rel="noopener noreferrer";
        const name=String(a.original_filename||"Attachment");link.setAttribute("aria-label","Open "+name);
        if(/^image\/(jpeg|png|gif|webp)$/.test(String(a.content_type||""))){const image=el("img","kf-chat-attachment-image");image.src=link.href;image.alt=name;image.loading="lazy";image.decoding="async";image.referrerPolicy="no-referrer";image.addEventListener("error",()=>{image.hidden=true;},{once:true});link.append(image);}
        const label=el("span","kf-chat-attachment-label","📎 "+name);link.append(label);box.append(link);
      }
    }
  }
  const reactionPending=new Set();
  function reactionButton(messageId,emoji,count=0,mine=false){
    const button=el("button","kf-chat-reaction-chip");button.type="button";button.dataset.react=String(messageId);button.dataset.emoji=emoji;button.setAttribute("aria-pressed",String(mine));button.setAttribute("aria-label","React with "+emoji+(count?" ("+count+")":""));
    if(customEmoji?.render)button.innerHTML=customEmoji.render(emoji);else button.textContent=emoji;
    if(count)button.append(el("span","",String(count)));return button;
  }
  async function refreshThreadReactions(id,token){
    const items=[...thread.querySelectorAll("[data-message-id]")],ids=items.map(x=>validId(x.dataset.messageId)).filter(Boolean);if(!ids.length)return;
    const data=await api("/api/messages/conversations/"+id+"/reactions?ids="+ids.join(","));
    if(token!==state.threadToken||state.active!==id||!state.visible||!Array.isArray(data.reactions))return;
    for(const item of items){const summary=item.querySelector(".kf-chat-reaction-summary");if(!summary)continue;const rows=data.reactions.filter(r=>Number(r.message_id)===Number(item.dataset.messageId));const key=JSON.stringify(rows.map(r=>[r.emoji,r.count,r.reacted_by_me]));if(summary.dataset.reactionKey===key)continue;summary.dataset.reactionKey=key;summary.replaceChildren(...rows.filter(r=>typeof r.emoji==="string").map(r=>reactionButton(Number(item.dataset.messageId),r.emoji,Number(r.count)||0,!!Number(r.reacted_by_me))));}
  }
  thread.addEventListener("click",async event=>{
    const spoiler=event.target.closest(".cs-spoiler-toggle");if(spoiler){const content=spoiler.nextElementSibling;if(content){content.hidden=!content.hidden;spoiler.setAttribute("aria-expanded",String(!content.hidden));spoiler.textContent=content.hidden?"Reveal spoiler":"Hide spoiler";}return;}
    const quote=event.target.closest("[data-quote-message]");if(quote){if(input.disabled)return;const item=quote.closest("[data-message-id]");const raw=item?.dataset.rawBody||"",sender=item?.querySelector(".kf-chat-sender")?.textContent||"Member";if(!raw.trim())return;const prefix="↳ "+sender+": “"+Array.from(raw.replace(/\s+/g," ")).slice(0,165).join("")+"”\n";if(prefix.length+input.value.length>4000){announce("Quote would exceed the message limit.");return;}input.value=prefix+input.value;rememberDraft(state.active,input.value);input.focus({preventScroll:true});return;}
    const toggle=event.target.closest("[data-reaction-picker]"),reaction=event.target.closest("[data-react]");
    if(toggle){const row=toggle.closest(".kf-chat-reactions"),existing=row.querySelector(".kf-chat-reaction-picker");for(const other of thread.querySelectorAll(".kf-chat-reaction-picker"))other.remove();for(const other of thread.querySelectorAll("[data-reaction-picker]"))other.setAttribute("aria-expanded","false");if(existing)return;
      const picker=el("div","kf-chat-reaction-picker"),id=Number(toggle.dataset.reactionPicker);const search=el("input","kf-chat-reaction-search");search.type="search";search.placeholder="Find reaction…";search.setAttribute("aria-label","Find reaction");
      const choices=["👍","❤️","😂","😮","😢","😡","🔥","🎉",...(window.KnightfallEmojis?.items||[]).map(x=>x.code)];const buttons=choices.map(code=>reactionButton(id,code));
      search.addEventListener("input",()=>{const q=search.value.trim().toLowerCase();for(const btn of buttons){const code=btn.dataset.emoji,name=window.KnightfallEmojis?.items.find(x=>x.code===code)?.name||"";btn.hidden=!!q&&!(name+" "+code).toLowerCase().includes(q);}});picker.append(search,...buttons);row.append(picker);toggle.setAttribute("aria-expanded","true");return;
    }
    if(!reaction)return;const id=state.active,messageId=validId(reaction.dataset.react),emoji=reaction.dataset.emoji,key=id+":"+messageId+":"+emoji;if(!id||!messageId||reactionPending.has(key))return;reactionPending.add(key);reaction.disabled=true;
    try{await api("/api/messages/"+messageId+"/reactions",{method:"POST",body:JSON.stringify({emoji})});if(state.active===id)await refreshThreadReactions(id,state.threadToken);}
    catch(error){if(state.active===id)announce("Reaction could not be saved: "+error.message);}
    finally{reactionPending.delete(key);reaction.disabled=false;}
  });
  async function refreshThread(){
    const id=state.active,token=++state.threadToken;
    if(!id||!state.visible||document.hidden)return;
    const data=await api("/api/messages/conversations/"+id+"?limit=35");
    if(token!==state.threadToken||state.active!==id)return;
    if(!Array.isArray(data.messages))throw Error("Invalid conversation history");
    renderMessages(data.messages,id);
    await Promise.allSettled([refreshThreadAttachments(id,token),refreshThreadReactions(id,token)]);
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
      if(!Array.isArray(data.conversations))throw Error("Invalid conversation list");
      const fetched=data.conversations;
      // Initial fetch is just a baseline. Only a later increase is truly new.
      let newArrival=false;
      try{newArrival=unreadBaselineReady&&!!window.ChaosphereImp?.newUnread?.(serverUnreadBaseline,fetched);}catch(error){console.warn("Optional mascot unread check failed",error)}
      // Keep this immutable server snapshot separate from optimistic local read
      // markers. An old unread badge returning from an eventual consistency
      // delay is not a fresh message from another member.
      serverUnreadBaseline=fetched.map(c=>({id:c.id,unread_count:c.unread_count}));
      state.conversations=fetched;
      unreadBaselineReady=true;
      if(newArrival)impReact("incoming");
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
  $("#kf-chat-favorite").addEventListener("click",()=>toggleFavorite(state.active));
  for(const [selector,kind] of [["#kf-chat-pin","pinned"],["#kf-chat-archive","archived"]])$(selector).addEventListener("click",()=>{if(!state.active||!window.ChaosphereOrganization)return;window.ChaosphereOrganization.toggle(localStorage,userId,state.active,kind);renderPanel();announce(kind==="archived"?"Local archive updated.":"Pinned chats updated.");});
  $("#kf-chat-filters").addEventListener("click",event=>{const button=event.target.closest("[data-kf-filter]");if(!button)return;recentFilter=button.dataset.kfFilter;for(const item of $("#kf-chat-filters").querySelectorAll("button"))item.setAttribute("aria-pressed",String(item===button));renderRecent();});
  input.addEventListener("input",()=>{if(state.active)rememberDraft(state.active,input.value);});
  window.addEventListener("kf:floating-panel-open",event=>{
    if(event.detail?.panel!=="member-chat"&&state.visible)setVisible(false);
  });
  $("#kf-chat-minimize").addEventListener("click",()=>setVisible(false));
  // Dismiss the mobile backdrop without passing a touch into the game/page.
  dock.addEventListener("click",event=>{
    if(event.target===dock&&dock.classList.contains("kf-chat-expanded"))setVisible(false);
  });
  const attachButton=$("#kf-chat-attach"),filePicker=$("#kf-chat-file"),pendingBox=$("#kf-chat-pending");
  let photoLoader;
  function preparePhoto(file){
    if(window.KnightfallPhotoUpload?.prepareAttachment)return window.KnightfallPhotoUpload.prepareAttachment(file);
    if(!photoLoader)photoLoader=new Promise((resolve,reject)=>{
      const script=document.createElement("script");script.src="/photo-upload.js?v=1";
      script.onload=()=>resolve();script.onerror=()=>{photoLoader=null;script.remove();reject(Error("Photo preparation unavailable"));};
      document.head.append(script);
    });
    return photoLoader.then(()=>window.KnightfallPhotoUpload.prepareAttachment(file));
  }
  let pendingRenderKey="";
  function drawAttachmentDraft(){
    const id=state.active,items=attachmentDrafts.get(id)||[],busy=uploadingConversations.has(id)||removingConversations.has(id),blocked=!!Number(getConversation(id)?.messaging_blocked);
    attachButton.disabled=!id||busy||blocked;
    attachButton.textContent=busy?"Uploading…":"📎 Attach";
    const key=JSON.stringify([id,busy,blocked,items.map(a=>[a.id,a.filename])]);if(key===pendingRenderKey)return;pendingRenderKey=key;
    pendingBox.replaceChildren();pendingBox.hidden=!items.length;
    for(const a of items){
      const chip=el("span","kf-chat-pending-chip");
      chip.append(el("span","kf-chat-pending-name",String(a.filename||"Attachment")));
      const remove=el("button","kf-chat-pending-remove","×");remove.type="button";remove.disabled=busy||blocked;remove.setAttribute("aria-label","Remove "+String(a.filename||"attachment"));
      remove.addEventListener("click",async()=>{
        if(removingConversations.has(id)||uploadingConversations.has(id))return;
        removingConversations.add(id);if(state.active===id)drawAttachmentDraft();
        try{await api("/api/messages/attachments/"+Number(a.id),{method:"DELETE"});saveAttachmentDraft(id,(attachmentDrafts.get(id)||[]).filter(x=>Number(x.id)!==Number(a.id)));}
        catch(error){if(state.active===id)announce("Could not remove file: "+error.message);}
        finally{removingConversations.delete(id);if(state.active===id)drawAttachmentDraft();}
      });
      chip.append(remove);pendingBox.append(chip);
    }
  }
  attachButton.addEventListener("click",()=>{pickerConversation=state.active;filePicker.click();});
  filePicker.addEventListener("change",async()=>{
    const id=pickerConversation,files=Array.from(filePicker.files||[]);pickerConversation=null;filePicker.value="";
    if(!id||!files.length||uploadingConversations.has(id)||removingConversations.has(id)||!getConversation(id)||Number(getConversation(id)?.messaging_blocked))return;
    if((attachmentDrafts.get(id)||[]).length+files.length>10){announce("Attach at most 10 files per message.");return;}
    uploadingConversations.add(id);if(state.active===id)drawAttachmentDraft();const errors=[];
    try{
      for(const file of files){
        try{
          const prepared=await preparePhoto(file);
          if(!prepared.size||prepared.size>10485760)throw Error("Choose a file up to 10 MB.");
          const form=new FormData();form.append("file",prepared);
          const data=await api("/api/messages/conversations/"+id+"/attachments",{method:"POST",body:form});
          if(!validId(data.id))throw Error("Invalid upload response.");
          saveAttachmentDraft(id,[...(attachmentDrafts.get(id)||[]),data]);
          if(state.active===id)drawAttachmentDraft();
        }catch(error){errors.push(file.name+": "+error.message);}
      }
      if(state.active===id)announce(errors.join(" · ")||"Attachments ready to send.");
    }finally{uploadingConversations.delete(id);if(state.active===id)drawAttachmentDraft();}
  });
  composer.addEventListener("submit",async event=>{
    event.preventDefault();
    const id=state.active,original=input.value,body=(window.ChaosphereFormat?.command(original.trim())??original.trim());
    const attachments=attachmentDrafts.get(id)||[],attachment_ids=attachments.map(a=>Number(a.id));
    if(!id||(!body&&!attachment_ids.length)||Number(getConversation(id)?.messaging_blocked))return;
    if(uploadingConversations.has(id)||removingConversations.has(id)){announce("Finish managing attachments before sending.");return;}
    if(body.length>4000||attachment_ids.length>10){announce("Split this draft into smaller messages before sending.");return;}
    saveAttachmentDraft(id,[]);drawAttachmentDraft();
    // Accept consecutive sends immediately; the network can finish each in
    // order without locking the textarea or making the member reopen the chat.
    if(state.active===id&&input.value===original){
      input.value="";rememberDraft(id,"");
    }
    updatePendingDelivery(id,1);announce("Sending message…");
    impReact("sending");
    const previous=messageSendQueues.get(id)||Promise.resolve();
    const queued=previous.catch(()=>{}).then(async()=>{
      state.sending=true;
      try{
        if(window.ChaosphereSend)await window.ChaosphereSend.send(api,"/api/messages/conversations/"+id,{body,attachment_ids});else await api("/api/messages/conversations/"+id,{method:"POST",body:JSON.stringify({body,attachment_ids})});
        if(state.active===id)announce("Message sent.");
        impReact("sent");
        void (async()=>{
          try{
            if(state.active===id)await refreshThread();
            await refreshConversations({force:true});
          }catch(error){
            console.warn("floating_chat_post_send_refresh_failed",String(error));
          }
        })();
      }catch(error){
        saveAttachmentDraft(id,[...attachments,...(attachmentDrafts.get(id)||[])]);
        if(state.active===id)drawAttachmentDraft();
        const old=drafts.get(id)||"";
        if(state.active===id){
          input.value=input.value?original+"\n"+input.value:original;
          rememberDraft(id,input.value);
          if(state.visible&&!document.hidden&&document.activeElement===input)input.focus({preventScroll:true});
        }else rememberDraft(id,old?original+"\n"+old:original);
        announce(state.active===id?"Send not confirmed: "+error.message+" Draft restored.":"Send not confirmed in "+nameOf(getConversation(id))+". Draft saved.");
        impReact("failed");
      }finally{
        state.sending=false;updatePendingDelivery(id,-1);
        if(state.active===id&&state.visible){
          // Network refreshes may update conversation metadata, never close a
          // live chat or leave its composer disabled.
          renderPanel();
          composer.hidden=false;
          drawAttachmentDraft();
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
  const formatToggle=$("#kf-chat-format"),formatTools=$("#kf-chat-format-tools");
  formatToggle.addEventListener("click",()=>{formatTools.hidden=!formatTools.hidden;formatToggle.setAttribute("aria-expanded",String(!formatTools.hidden));});
  formatTools.addEventListener("click",event=>{const btn=event.target.closest("[data-kf-format]");if(!btn||input.disabled||!window.ChaosphereFormat)return;const spec={bold:["**","bold text"],italic:["*","italic text"],code:["`","code"],spoiler:["||","spoiler"]}[btn.dataset.kfFormat];if(!spec)return;const next=window.ChaosphereFormat.wrap(input.value,input.selectionStart,input.selectionEnd,...spec);if(!next){announce("Formatting would exceed the message limit.");return;}input.value=next.value;rememberDraft(state.active,input.value);input.focus({preventScroll:true});input.setSelectionRange(next.start,next.end);});
  const emojiToggle=$("#kf-chat-emoji-toggle"),emojiTray=$("#kf-chat-emoji-tray");
  emojiToggle.addEventListener("click",()=>{
    const opening=emojiTray.hidden;
    emojiTray.hidden=!opening;emojiToggle.setAttribute("aria-expanded",String(opening));
    if(opening)emojiTray.querySelector("input[type=search]")?.focus({preventScroll:true});
  });
  emojiTray.addEventListener("click",event=>{
    const button=event.target.closest("[data-insert-emoji]");
    if(!button)return;
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
    if(input.value.length-(end-start)+button.dataset.insertEmoji.length>4000){announce("This emoji would exceed the message limit.");return;}
    input.setRangeText(button.dataset.insertEmoji,start,end,"end");
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.focus({preventScroll:true});
  });
  input.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
      event.preventDefault();composer.requestSubmit();
    }
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&state.visible){if(!emojiTray.hidden){emojiTray.hidden=true;emojiToggle.setAttribute("aria-expanded","false");emojiToggle.focus();return;}if(!formatTools.hidden){formatTools.hidden=true;formatToggle.setAttribute("aria-expanded","false");formatToggle.focus();return;}setVisible(false);$("#kf-chat-launcher").focus();}
  });
  // Public, narrow interface for arcade headers to open the SAME authenticated
  // inbox, without inventing a second chat store or bypassing its permissions.
  window.KnightfallChat=Object.freeze({
    open(){showList();return true;},
    close(){setVisible(false);return true;},
    toggle(){if(state.visible)setVisible(false);else showList();return state.visible;},
    share(text){
      const draft=String(text||"").trim().slice(0,1500);
      if(!draft)return false;
      pendingShare=draft;showList();announce("Choose a conversation to share this invitation.");impReact("invite");
      return true;
    },
    isOpen(){return state.visible;}
  });
  window.dispatchEvent(new Event("kf:chat-ready"));
  // Native fullscreen sits above document siblings. Move the active chat DOM
  // inside a fullscreen game container so chat stays usable during gameplay.
  function syncFullscreenChat(){
    const fullscreen=document.fullscreenElement||document.webkitFullscreenElement;
    const canHost=fullscreen&&fullscreen!==dock&&!dock.contains(fullscreen)
      &&!["CANVAS","VIDEO","IMG"].includes(fullscreen.tagName);
    const host=canHost?fullscreen:document.documentElement;
    if(dock.parentElement!==host)host.append(dock);
    dock.hidden=false;
    dock.classList.toggle("kf-chat-in-fullscreen",!!canHost);
    syncBubbleViewport();fitDock();
  }
  document.addEventListener("fullscreenchange",syncFullscreenChat);
  document.addEventListener("webkitfullscreenchange",syncFullscreenChat);
  syncFullscreenChat();
  // A game listening for arrow keys, WASD or space must not intercept typed chat.
  dock.addEventListener("keydown",event=>{
    // Escape should close chat, NOT also pause/flee an arcade game.
    if(event.key==="Escape"&&state.visible){
      event.stopPropagation();setVisible(false);$("#kf-chat-launcher").focus();return;
    }
    if(event.target.closest("input,textarea,[contenteditable=true],select,button,a"))event.stopPropagation();
  });
  let tickRunning=false,tickQueued=false,lastTickStart=0;
  async function tick(){
    if(document.hidden||navigator.onLine===false)return;
    if(tickRunning){tickQueued=true;return;}
    tickRunning=true;
    lastTickStart=Date.now();
    try{
      await refreshConversations({force:true});
      if(state.active&&state.visible)await refreshThread();
    }catch(error){if(state.visible)announce("Chat could not refresh. "+error.message);}
    finally{tickRunning=false;if(tickQueued){tickQueued=false;if(!document.hidden)void tick();}}
  }
  let bubbleLiveDelay=0,liveBound=false,liveUnsubscribe=null;
  function bindLive(){
    if(liveBound||typeof window.KnightfallLive?.subscribe!=="function")return;
    liveBound=true;
    try{
      liveUnsubscribe=window.KnightfallLive.subscribe(event=>{
        if(event.type==="status"){if(event.connected)void tick();return;}
        if(event.type!=="message-event"||document.hidden||event.kind==="typing"||event.kind==="read")return;
        clearTimeout(bubbleLiveDelay);
        bubbleLiveDelay=setTimeout(()=>{void tick();},120);
      });
    }catch(error){liveBound=false;console.warn("Chat realtime unavailable; polling continues",error);}
  }
  bindLive();
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){bindLive();void tick();}});
  window.addEventListener("online",()=>{bindLive();void tick();});
  window.addEventListener("pageshow",event=>{if(event.persisted){bindLive();void tick();}});

  tick();
  // Realtime events refresh immediately. Polling remains a recovery mechanism.
  const timer=setInterval(()=>{
    if(document.hidden||navigator.onLine===false||tickRunning)return;
    bindLive();
    const interval=window.KnightfallLive?.connected?(state.visible?30000:60000):15000;
    if(Date.now()-lastTickStart>=interval)void tick();
  },15000);
  window.addEventListener("pagehide",event=>{if(!event.persisted){clearInterval(timer);clearTimeout(bubbleLiveDelay);if(typeof liveUnsubscribe==="function")liveUnsubscribe();}});
})();
