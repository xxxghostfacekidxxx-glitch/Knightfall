(() => {
  "use strict";
  const mount = () => {
  if (document.getElementById("miss-chaos-presence")) return;
  const API = "https://api.ash-fall.com";
  const AVATAR = "/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c";
  const css = document.createElement("link"); css.rel="stylesheet"; css.href="/miss-chaos-presence.css?v=20261119-popup2"; document.head.append(css);
  const photoCss=document.createElement("link");photoCss.rel="stylesheet";photoCss.href="/chaos-chat-image-picker.css?v=20261119-attach1";document.head.append(photoCss);
  const glitchCss = document.createElement("link"); glitchCss.rel="stylesheet"; glitchCss.href="/chaos-glitch.css?v=20261119-popup2"; document.head.append(glitchCss);
  const root=document.createElement("div"); root.id="miss-chaos-presence";
  root.innerHTML=`
    <section id="miss-chaos-window" aria-label="Chat with Miss Chaos" aria-hidden="true" hidden>
      <header class="mc-head"><span class="mc-portrait-frame"><img src="${AVATAR}" alt="Miss Chaos portrait"></span><div class="mc-head-copy"><strong>Miss Chaos</strong><small id="mc-presence-status"><span aria-hidden="true">● </span>Your chaos, one tap away</small></div><div class="mc-head-actions"><button type="button" id="mc-quick-memo" aria-label="Open Memo Pad" title="Memo Pad">📝</button><button type="button" id="mc-voice" aria-label="Enable spoken replies" aria-pressed="false" title="Spoken replies">♫</button><button type="button" id="mc-full-chat" aria-label="Open full Miss Chaos chat" title="Full chat">↗</button><button type="button" id="mc-close" aria-label="Close Miss Chaos" title="Close">×</button></div></header>
      <details id="mc-settings"><summary>Chat settings</summary><div class="mc-settings-body">
      <label id="mc-companion-label" class="mc-companion-control" for="mc-companion-mode" hidden>PRIVATE WORKSPACE
        <select id="mc-companion-mode" aria-label="Miss Chaos assistant workspace" disabled><option value="standard">Miss Chaos</option></select>
      </label>
      <nav id="mc-private-actions" class="mc-private-actions" aria-label="Private workspace links" hidden>
        <a href="/ai-handoff.html" id="mc-private-board">🔥 Between the Flames</a>
        <a href="/samantha-chaos.html" id="mc-private-dashboard">Open private desk ↗</a>
        <a href="/eye-of-chaos.html" id="mc-private-eye" hidden>𓂀 Eye of Chaos</a>
      </nav>
      <label for="mc-visual-theme">Miss Chaos theme
        <select id="mc-visual-theme"><option value="obsidian">Obsidian Neon</option><option value="hellfire">Hellfire</option><option value="egypt">Egyptian Eclipse</option><option value="mustafar">Mustafar</option><option value="korriban">Korriban</option><option value="vader">Dark Lord</option><option value="hex">Hex Signal · Cyan</option><option value="anarchy">Anarchy · Red/Black</option><option value="chaos">Chaos Star · Lime/Black</option><option value="blood">Blood &amp; Ink</option></select>
      </label>
      <a class="mc-realm-entry" href="/miss-chaos-realm.html">✦ Visit her realm · Tools &amp; creative workspaces</a>
      <label class="sr-only" for="mc-mood">Miss Chaos mood</label><select id="mc-mood"><option value="default">Mood: Default</option><option value="playful">Playful</option><option value="dark">Dark humor</option><option value="supportive">Supportive</option><option value="philosophical">Philosophical</option></select>
      <button type="button" id="mc-game-tips" hidden>🎮 Ask for game tips</button>
      </div></details>
      <div id="mc-messages" aria-live="polite"><div class="mc-bubble system">I'm here. Ask me something, throw me an idea, or let me help untangle the mess. 🖤</div></div><div id="mc-error" role="status" aria-live="polite"></div>
      <p id="mc-attachment-status" class="mc-attachment-status" aria-live="polite" role="status" hidden></p>
      <form id="mc-form"><label class="sr-only" for="mc-input">Message Miss Chaos</label><textarea id="mc-input" rows="1" maxlength="4000" placeholder="Message or photo question…" ></textarea><button id="mc-send" type="submit">Send ↗</button></form>
      <div class="mc-footer">Account chat · Saved to your Miss Chaos conversations. AI can make mistakes.</div>
    </section>
    <section id="mc-memo-panel" aria-label="Private Memo Pad" aria-hidden="true" hidden>
      <div class="mc-memo-head"><strong>📝 Memo Pad</strong><div><a href="/memo-pad.html" title="Open full Memo Pad" aria-label="Open full Memo Pad page">↗ Full page</a><button type="button" id="mc-memo-close" aria-label="Close Memo Pad">×</button></div></div>
      <div id="mc-memo-host" aria-live="off"></div>
    </section>
    <div id="mc-dock" role="group" aria-label="Miss Chaos floating tools">
      <button id="miss-chaos-launcher" type="button" aria-label="Chat with Miss Chaos" title="Chat with Miss Chaos" aria-expanded="false" aria-controls="miss-chaos-window"><span style="position:relative"><img src="/assets/knightfall/miss-chaos/hex-sigil.svg" class="mc-minimized-sigil" alt=""><i class="mc-status-dot" aria-hidden="true"></i></span><span class="mc-launch-copy"><strong>Miss Chaos</strong><small>Need me? I'm right here.</small></span></button>
      <a class="mc-realm-entry mc-realm-dock" href="/miss-chaos-realm.html" title="Visit Miss Chaos realm">✦ Her Realm</a>
      <button id="mc-private-switch" type="button" aria-label="Switch Miss Chaos between standard and private workspace" title="Switch private assistant" hidden>𓂀 Private</button>
      <button id="mc-memo-toggle" type="button" aria-label="Open Memo Pad" aria-expanded="false" aria-controls="mc-memo-panel" title="Open Memo Pad">📝</button>
      <button id="mc-move" type="button" aria-label="Move floating tools to another corner" title="Move floating tools">⠿</button>
      <button id="mc-minimize" type="button" aria-label="Minimize floating tools" title="Minimize floating tools">−</button>
      <button id="mc-restore" type="button" aria-label="Restore Miss Chaos tools" title="Restore Miss Chaos tools" hidden>✦</button>
    </div>`;
  document.body.append(root);
  // Dock placement evaluates visible controls and footers; no bottom offset that pushes a bubble over content.
  const $=s=>root.querySelector(s), panel=$("#miss-chaos-window"), launcher=$("#miss-chaos-launcher"), messages=$("#mc-messages"), input=$("#mc-input"), send=$("#mc-send"), error=$("#mc-error");
  const memoToggle=$("#mc-memo-toggle"),memoPanel=$("#mc-memo-panel");
  let memoMounted=false;
  const closeMemo=()=>{
    memoPanel.hidden=true;memoPanel.setAttribute("aria-hidden","true");
    memoToggle.setAttribute("aria-expanded","false");
    memoToggle.setAttribute("aria-label","Open Memo Pad");
  };
  async function openMemo(){
    // Keep one floating panel open at a time, so page controls stay accessible.
    close({restoreFocus:false});
    memoPanel.hidden=false;memoPanel.setAttribute("aria-hidden","false");
    window.dispatchEvent(new CustomEvent("kf:floating-panel-open",{detail:{panel:"memo-pad"}}));
    memoToggle.setAttribute("aria-expanded","true");
    memoToggle.setAttribute("aria-label","Close Memo Pad");
    if(!memoMounted){
      try{
        if(!document.querySelector('link[data-memo-pad-css]')){
          const style=document.createElement('link');style.rel='stylesheet';
          style.href='/memo-pad.css?v=20261119-memo-publish1';style.dataset.memoPadCss='true';document.head.append(style);
        }
        if(!window.KnightfallMemoPad){
          await new Promise((resolve,reject)=>{
            const script=document.createElement('script');
            script.src='/memo-pad.js?v=20261119-memo-publish1';script.onload=resolve;script.onerror=()=>reject(Error('Memo Pad could not load.'));
            document.head.append(script);
          });
        }
        if(!window.KnightfallMemoPad)throw Error('Memo Pad is unavailable.');
        window.KnightfallMemoPad.mount($("#mc-memo-host"),{compact:true});
        // Separate member chat and Memo Mail load only when this tool opens.
        if(!window.KnightfallMemoCommunications){
          await new Promise((resolve,reject)=>{
            const script=document.createElement('script');
            script.src='/memo-communications.js?v=20261103-mail-chat3';
            script.onload=resolve;script.onerror=()=>reject(Error('Member communication tools could not load.'));
            document.head.append(script);
          });
        }
        window.KnightfallMemoCommunications?.mount($("#mc-memo-host"));
        memoMounted=true;
      }catch(err){$("#mc-memo-host").textContent=err.message||'Memo Pad unavailable. Open the full page instead.'}
    }else{window.KnightfallMemoPad?.mount($("#mc-memo-host"),{compact:true});window.KnightfallMemoCommunications?.mount($("#mc-memo-host"));}
  }
  memoToggle.addEventListener('click',()=>memoPanel.hidden?openMemo():closeMemo());
  $("#mc-quick-memo").addEventListener('click',()=>{void openMemo()});
  $("#mc-memo-close").addEventListener('click',()=>{closeMemo();memoToggle.focus({preventScroll:true})});

  // Shared theme selection; visuals are client preferences, never purchase entitlements.
  const visualThemes=new Set(["obsidian","hellfire","egypt","mustafar","korriban","vader","hex","anarchy","chaos","blood"]);
  const themeKey="kf:miss-chaos-theme";
  const themeControl=root.querySelector("#mc-visual-theme");
  const themeArt={
    hex:"hex",anarchy:"anarchy",chaos:"chaos",blood:"blood",
    obsidian:"hex",hellfire:"anarchy",egypt:"hex",mustafar:"anarchy",korriban:"chaos",vader:"blood"
  };
  const setVisualTheme=value=>{
    const theme=visualThemes.has(value)?value:"obsidian";
    root.dataset.mcTheme=theme;
    const sigil=root.querySelector(".mc-minimized-sigil");if(sigil)sigil.src="/assets/knightfall/miss-chaos/"+themeArt[theme]+"-sigil.svg?v=20261121-art2";
    if(themeControl)themeControl.value=theme;
    try{localStorage.setItem(themeKey,theme)}catch{}
  };
  let savedVisualTheme="obsidian";
  try{savedVisualTheme=localStorage.getItem(themeKey)||savedVisualTheme}catch{}
  setVisualTheme(savedVisualTheme);
  themeControl?.addEventListener("change",()=>setVisualTheme(themeControl.value));
  window.addEventListener("storage",event=>{if(event.key===themeKey)setVisualTheme(event.newValue)});
  let userId=null, conversationId=null, busy=false, voiceEnabled=false;
  let assistantMode="standard",verifiedPermissions=null,availableModes=[{id:"standard",label:"Miss Chaos",full_chat:"/miss-chaos.html"}];
  const modeSelect=$("#mc-companion-mode"),modeLabel=$("#mc-companion-label"),fullChat=$("#mc-full-chat"),privateToggle=$("#mc-private-switch");
  let chatPhoto=null,fieldKit=null;
  import("/chaos-chat-image-picker.mjs?v=20261119-photo-chat1").then(({mountChaosChatImage})=>{
    chatPhoto=mountChaosChatImage({form:$("#mc-form"),composer:$("#mc-form"),
      status:$("#mc-attachment-status")});
  }).catch(()=>{error.textContent="The picture attachment tool could not load. Text chat remains available.";});
  const modeStorage=id=>"missChaosPresenceMode:"+String(id);
  const key=(id,mode="standard")=>"missChaosPresenceConversation:"+String(id)+(mode==="standard"?"":":"+mode);
  const draftKey=()=>assistantMode==="standard"?"missChaosPresenceDraft":"missChaosPresenceDraft:"+String(userId)+":"+assistantMode;
  const modeForDisplay=()=>availableModes.find(m=>m.id===assistantMode)||availableModes[0];
  function saveModeDraft(){try{sessionStorage.setItem(draftKey(),input.value);}catch(_){}}
  function showModeLabel(){
    const item=modeForDisplay();
    root.dataset.assistantMode=assistantMode;
    $(".mc-head-copy strong").textContent=item.label||"Miss Chaos";
    fullChat.title="Open "+(item.label||"Miss Chaos")+" full chat";
    fullChat.setAttribute("aria-label",fullChat.title);
    $("#mc-form").dataset.companion=assistantMode;
    const actions=$("#mc-private-actions"),dashboard=$("#mc-private-dashboard");
    actions.hidden=assistantMode==="standard";
    dashboard.href=assistantMode==="owner"?"/eye-of-chaos.html":"/samantha-chaos.html";
    dashboard.textContent=assistantMode==="owner"?"𓂀 Open Osiris Command":"𓂀 Open Isis Desk";
    $("#mc-private-eye").hidden=assistantMode!=="partner"||
      verifiedPermissions?.can_admin!==true||verifiedPermissions?.can_eye_of_chaos!==true;
    modeSelect.value=assistantMode;
    const privateMode=availableModes.find(m=>m.id==="owner"||m.id==="partner");
    privateToggle.hidden=!privateMode;
    privateToggle.disabled=!privateMode||busy;
    privateToggle.textContent=assistantMode==="standard"?
      (privateMode?.id==="owner"?"𓂀 Osiris":"𓂀 Isis"):"↩ Standard";
    privateToggle.title=assistantMode==="standard"?
      "Switch to "+(privateMode?.label||"private assistant"):"Return to standard Miss Chaos";
    privateToggle.setAttribute("aria-label",privateToggle.title);
    privateToggle.setAttribute("aria-pressed",String(assistantMode!=="standard"));
    fieldKit?.refresh();
  }
  async function swapMode(next,{restoreSaved=true}={}){
    if(busy||!availableModes.some(m=>m.id===next)){modeSelect.value=assistantMode;return;}
    saveModeDraft();
    // Never carry a selected image across owner/partner/standard boundaries.
    chatPhoto?.clear();
    assistantMode=next;
    conversationId=userId?(sessionStorage.getItem(key(userId,assistantMode))||""):"";
    try{sessionStorage.setItem(modeStorage(userId),assistantMode);}catch(_){}
    input.value=restoreSaved?(sessionStorage.getItem(draftKey())||""):"";
    input.dispatchEvent(new Event("input"));
    messages.replaceChildren();
    add("system",assistantMode==="owner"?
      "Osiris · Private Miss Chaos. Your owner command workspace. Account-owned chat history remains private.":
      assistantMode==="partner"?
      "Isis · Private Miss Chaos. Your own chats stay yours. Shared tasks require an explicit action.":
      "Standard Miss Chaos · Your normal account assistant.");
    error.textContent="";
    showModeLabel();
    if(conversationId){
      const selected=assistantMode,id=conversationId;
      try{
        const data=await request("/api/chaos/conversations/"+encodeURIComponent(id)+"/messages");
        if(selected!==assistantMode||id!==conversationId)return;
        for(const m of (data.messages||[]).slice(-16))
          if(m.role==="user"||m.role==="assistant")add(m.role,String(m.content||"").slice(0,4000));
      }catch(e){
        if(selected===assistantMode&&id===conversationId){
          conversationId="";try{sessionStorage.removeItem(key(userId,assistantMode));}catch(_){}
          add("system","This older private conversation could not be reopened. New messages will start a fresh thread.");
        }
      }
    }
  }
  modeSelect.addEventListener("change",()=>{void swapMode(modeSelect.value);});
  privateToggle.addEventListener("click",async()=>{
    if(busy)return;
    privateToggle.disabled=true;
    try{
      const ok=await ensureAccount(true);
      const privateMode=availableModes.find(m=>m.id==="owner"||m.id==="partner");
      if(!ok||!privateMode){error.textContent="A verified Osiris/Isis account is required for private mode.";return;}
      await swapMode(assistantMode==="standard"?privateMode.id:"standard");
      if(panel.hidden)open();
    }catch(err){error.textContent=err.message||"Private workspace could not be verified.";}
    finally{showModeLabel();}
  });
  const status=$("#mc-presence-status"), voiceButton=$("#mc-voice"), mood=$("#mc-mood");
  function setExpression(expression){root.dataset.expression=expression;const labels={default:"Your chaos, one tap away",playful:"Up to something",dark:"Professionally unhinged",supportive:"Here with you",philosophical:"Questioning reality",thinking:"Thinking up trouble…",speaking:"Speaking"};status.textContent="● "+(labels[expression]||labels.default);}
  function speak(text){if(!voiceEnabled||!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined")return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||""));utterance.rate=1.02;utterance.pitch=1.1;utterance.onstart=()=>setExpression("speaking");utterance.onend=()=>setExpression(mood.value);utterance.onerror=()=>setExpression(mood.value);window.speechSynthesis.speak(utterance);}

  try{input.value=sessionStorage.getItem(draftKey())||"";}catch(_){}
  function open(){closeMemo();panel.hidden=false;panel.setAttribute("aria-hidden","false");launcher.setAttribute("aria-expanded","true");window.dispatchEvent(new CustomEvent("kf:floating-panel-open",{detail:{panel:"miss-chaos"}}));
    if(matchMedia("(pointer: fine)").matches)input.focus({preventScroll:true});
    else $("#mc-close").focus({preventScroll:true});}
  function close({restoreFocus=true}={}){saveModeDraft(); panel.hidden=true;panel.setAttribute("aria-hidden","true");launcher.setAttribute("aria-expanded","false");if(restoreFocus)launcher.focus({preventScroll:true});}
  window.addEventListener("kf:floating-panel-open",event=>{
    if(event.detail?.panel==="member-chat"){
      if(!panel.hidden)close({restoreFocus:false});
      if(!memoPanel.hidden)closeMemo();
    }
  });
  function add(role,text){const el=document.createElement("div");el.className="mc-bubble "+role;el.textContent=text;messages.append(el);if(role==="assistant")fieldKit?.decorate(el,text);messages.scrollTop=messages.scrollHeight;return el;}
  async function request(path,options={}){const r=await fetch(API+path,{credentials:"include",cache:"no-store",...options,headers:{"content-type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok){const err=new Error(d.error||"Request failed ("+r.status+").");err.status=r.status;throw err;}return d;}
  async function ensureAccount(refresh=false){
    if(userId&&!refresh)return true;
    let d;
    try{d=await request("/api/auth/me");}
    catch(e){if(e.status!==401&&!/unauth|sign in|401/i.test(e.message))throw e;d={user:null};}
    if(!d.user){
      userId=null;conversationId=null;assistantMode="standard";verifiedPermissions=null;
      privateToggle.hidden=true;privateToggle.disabled=true;
      modeLabel.hidden=true;modeSelect.disabled=true;
      if(!messages.querySelector("[data-mc-signin]")){
        add("system","Sign in to save your conversations and unlock any private workspaces you can access.");
        const link=document.createElement("a");link.dataset.mcSignin="true";
        link.href="/auth.html?next="+encodeURIComponent(location.pathname+location.search);
        link.textContent=" Sign in to Knightfall ↗";messages.append(link);
      }
      return false;
    }
    const account=String(d.user.id||d.user.user_id||d.user.username);
    if(!account)throw Error("Could not verify your account.");
    const changed=String(userId||"")!==account;
    if(changed){
      userId=account;assistantMode="standard";conversationId=null;
      input.value="";messages.replaceChildren();
      try{input.value=sessionStorage.getItem(draftKey())||"";}catch(_){}
    }
    let list=[];
    verifiedPermissions=null;
    try{
      const catalog=await request("/api/chaos/modes");
      verifiedPermissions=catalog.permissions||null;
      list=Array.isArray(catalog.modes)?catalog.modes:[];
    }catch{
      // Never persist an old privileged option when the server cannot verify it.
      error.textContent="Private workspaces could not be verified. Standard chat is still available.";
    }
    availableModes=[{id:"standard",label:"Miss Chaos",full_chat:"/miss-chaos.html"},
      ...list.filter(m=>["owner","partner"].includes(m.id)&&typeof m.label==="string"&&typeof m.full_chat==="string")];
    modeSelect.replaceChildren();
    for(const m of availableModes){
      const option=document.createElement("option");option.value=m.id;
      option.textContent=m.label;modeSelect.append(option);
    }
    modeLabel.hidden=availableModes.length<2;modeSelect.disabled=availableModes.length<2;
    let preferred=assistantMode;
    if(changed)try{preferred=sessionStorage.getItem(modeStorage(userId))||"standard";}catch(_){}
    if(!availableModes.some(m=>m.id===preferred))preferred="standard";
    await swapMode(preferred);
    return true;
  }
  async function ensureConversation(){if(conversationId)return conversationId;const d=await request("/api/chaos/conversations",{method:"POST",body:"{}"});conversationId=d.conversation.id;sessionStorage.setItem(key(userId,assistantMode),String(conversationId));return conversationId;}
  launcher.addEventListener("click",async()=>{if(panel.hidden){open();try{await ensureAccount(true);}catch(e){error.textContent=e.message;}}else close();});
  $("#mc-close").addEventListener("click",close);$("#mc-full-chat").addEventListener("click",()=>{location.href=modeForDisplay().full_chat||"/miss-chaos.html";});
  voiceButton.addEventListener("click",()=>{if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){error.textContent="This browser does not support spoken replies.";return;}voiceEnabled=!voiceEnabled;voiceButton.setAttribute("aria-pressed",String(voiceEnabled));voiceButton.setAttribute("aria-label",voiceEnabled?"Disable spoken replies":"Enable spoken replies");voiceButton.title=voiceEnabled?"Turn spoken replies off":"Turn spoken replies on";if(voiceEnabled)speak("Spoken replies are on. Your ears have accepted the terms of chaos.");else{window.speechSynthesis.cancel();setExpression(mood.value);}});
  mood.addEventListener("change",()=>setExpression(mood.value));
  const gameTips=$("#mc-game-tips");
  if(/arcade|chaos-cartridge|game/i.test(location.pathname)){gameTips.hidden=false;gameTips.addEventListener("click",()=>{input.value="Give me tips for playing this game on Chaos Cartridge. Explain the controls, strategy, and any useful beginner tricks.";input.focus();input.dispatchEvent(new Event("input"));$("#mc-form").requestSubmit();});}
  document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!memoPanel.hidden){closeMemo();memoToggle.focus({preventScroll:true})}else if(!panel.hidden)close();});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#mc-form").requestSubmit();}});
  input.addEventListener("input",()=>{try{sessionStorage.setItem(draftKey(),input.value);}catch(_){} input.style.height="auto";input.style.height=Math.min(input.scrollHeight,110)+"px";});
  // Workbench-to-companion handoff: data stays in the draft, never auto-sent.
  // Do not discard a member's existing message or switch private workspaces.
  window.addEventListener("kf:miss-chaos:compose",event=>{
    const detail=event?.detail;
    if(!detail||typeof detail.text!=="string")return;
    const addition=detail.text.trim();
    if(!addition||addition.length>4000){detail.error="The brief is too long for chat. Shorten it before handing it off.";return;}
    if(busy){detail.error="Miss Chaos is replying. Keep your brief open and try after she finishes.";return;}
    const existing=input.value.trim();
    const next=existing?existing+"\n\n"+addition:addition;
    if(next.length>4000){detail.error="Your current chat draft plus this brief exceed 4,000 characters. Nothing was overwritten.";return;}
    input.value=next;
    input.dispatchEvent(new Event("input",{bubbles:true}));
    open();
    detail.handled=true;
  });

  $("#mc-form").addEventListener("submit",async e=>{e.preventDefault();const sendingPhoto=chatPhoto?.hasImage()===true;const message=input.value.trim()||(sendingPhoto?"Describe this image and explain what you can see.":"");if(!message||busy)return;error.textContent="";busy=true;send.disabled=true;modeSelect.disabled=true;privateToggle.disabled=true;chatPhoto?.setBusy(true);input.value="";try{sessionStorage.removeItem(draftKey());}catch(_){} input.style.height="auto";add("user",message+(sendingPhoto?"\n📷 Image attached (original not stored)":""));const typing=add("mc-typing","Miss Chaos is thinking…");typing.className="mc-typing";setExpression("thinking");
    try{if(!(await ensureAccount())){typing.remove();return;}const id=await ensureConversation();const imageData=sendingPhoto?await chatPhoto.prepare():null;let result;try{result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:id,message,mood:$("#mc-mood").value,companion:assistantMode==="standard"?undefined:assistantMode,image:imageData||undefined})});}catch(first){if(/conversation|not found|invalid/i.test(first.message)){conversationId="";sessionStorage.removeItem(key(userId,assistantMode));const fresh=await ensureConversation();result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:fresh,message,mood:$("#mc-mood").value,companion:assistantMode==="standard"?undefined:assistantMode,image:imageData||undefined})});}else throw first;}typing.remove();chatPhoto?.clear();const reply=result.reply||"I got a response-shaped mystery. Try me again.";add("assistant",reply);setExpression(mood.value);speak(reply);}
    catch(err){typing.remove();error.textContent=err.message||"I couldn't reach the backend. Try again in a moment.";input.value=message;try{sessionStorage.setItem(draftKey(),message);}catch(_){} }
    finally{busy=false;send.disabled=false;modeSelect.disabled=availableModes.length<2;chatPhoto?.setBusy(false);showModeLabel();input.focus({preventScroll:true});}
  });
  // Verify companion modes at startup; requiring an initial chat click hid
  // the Osiris/Isis switch despite an already authenticated session.
  void ensureAccount(true).catch(e=>{console.warn("Miss Chaos account mode discovery failed:",e.message);});
  // Local, free-first console: reusable draft prompts and explicit reply-to-memo.
  // Import failures cannot prevent Miss Chaos chat or her floating dock from loading.
  import("/miss-chaos-field-kit.mjs?v=20261120-textract1")
    .then(({mountMissChaosFieldKit})=>{
      fieldKit=mountMissChaosFieldKit({
        panel,messages,input,api:request,onOpenMemo:openMemo,getMode:()=>assistantMode
      });
      fieldKit?.refresh();
    })
    .catch(e=>console.warn("Miss Chaos field kit unavailable:",e.message));
  // Overlay placement and minimize controls are isolated from chat logic.
  const dockScript=document.createElement("script");
  dockScript.src="/miss-chaos-dock.js?v=20261119-overlay-recovery1";
  document.head.append(dockScript);
  };
  // This module may also load directly in the <head> on legacy routes.
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount, {once:true});
  else mount();
})();
