(() => {
  "use strict";
  if (document.getElementById("miss-chaos-presence")) return;
  const API = "https://api.ash-fall.com";
  const AVATAR = "/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c";
  const css = document.createElement("link"); css.rel="stylesheet"; css.href="/miss-chaos-presence.css?v=20261103-memo-dock1"; document.head.append(css);
  const glitchCss = document.createElement("link"); glitchCss.rel="stylesheet"; glitchCss.href="/chaos-glitch.css?v=20261026-glitch2"; document.head.append(glitchCss);
  const root=document.createElement("div"); root.id="miss-chaos-presence";
  root.innerHTML=`
    <section id="miss-chaos-window" aria-label="Chat with Miss Chaos" aria-hidden="true" hidden>
      <header class="mc-head"><img src="${AVATAR}" alt="Miss Chaos portrait"><div class="mc-head-copy"><strong>Miss Chaos</strong><small id="mc-presence-status"><span aria-hidden="true">● </span>Your chaos, one tap away</small></div><div class="mc-head-actions"><button type="button" id="mc-voice" aria-label="Enable spoken replies" aria-pressed="false" title="Spoken replies">♫</button><button type="button" id="mc-full-chat" aria-label="Open full Miss Chaos chat" title="Full chat">↗</button><button type="button" id="mc-close" aria-label="Close Miss Chaos" title="Close">×</button></div></header>
      <label class="sr-only" for="mc-mood">Miss Chaos mood</label><select id="mc-mood"><option value="default">Mood: Default</option><option value="playful">Playful</option><option value="dark">Dark humor</option><option value="supportive">Supportive</option><option value="philosophical">Philosophical</option></select>
      <button type="button" id="mc-game-tips" hidden>🎮 Ask for game tips</button>
      <div id="mc-messages" aria-live="polite"><div class="mc-bubble system">I'm here. Ask me something, throw me an idea, or let me help untangle the mess. 🖤</div></div><div id="mc-error" role="status" aria-live="polite"></div>
      <form id="mc-form"><label class="sr-only" for="mc-input">Message Miss Chaos</label><textarea id="mc-input" rows="1" maxlength="4000" placeholder="Tell me what's going on…" required></textarea><button id="mc-send" type="submit">Send ↗</button></form>
      <div class="mc-footer">Account chat · Saved to your Miss Chaos conversations. AI can make mistakes.</div>
    </section>
    <section id="mc-memo-panel" aria-label="Private Memo Pad" aria-hidden="true" hidden>
      <div class="mc-memo-head"><strong>📝 Memo Pad</strong><div><a href="/memo-pad.html" title="Open full Memo Pad" aria-label="Open full Memo Pad page">↗ Full page</a><button type="button" id="mc-memo-close" aria-label="Close Memo Pad">×</button></div></div>
      <div id="mc-memo-host" aria-live="off"></div>
    </section>
    <div id="mc-dock" role="group" aria-label="Miss Chaos floating tools">
      <button id="miss-chaos-launcher" type="button" aria-label="Chat with Miss Chaos" title="Chat with Miss Chaos" aria-expanded="false" aria-controls="miss-chaos-window"><span style="position:relative"><img src="${AVATAR}" alt=""><i class="mc-status-dot" aria-hidden="true"></i></span><span class="mc-launch-copy"><strong>Miss Chaos</strong><small>Need me? I'm right here.</small></span></button>
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
    close();
    memoPanel.hidden=false;memoPanel.setAttribute("aria-hidden","false");
    memoToggle.setAttribute("aria-expanded","true");
    memoToggle.setAttribute("aria-label","Close Memo Pad");
    if(!memoMounted){
      try{
        if(!document.querySelector('link[data-memo-pad-css]')){
          const style=document.createElement('link');style.rel='stylesheet';
          style.href='/memo-pad.css?v=20261103-memo1';style.dataset.memoPadCss='true';document.head.append(style);
        }
        if(!window.KnightfallMemoPad){
          await new Promise((resolve,reject)=>{
            const script=document.createElement('script');
            script.src='/memo-pad.js?v=20261103-memo1';script.onload=resolve;script.onerror=()=>reject(Error('Memo Pad could not load.'));
            document.head.append(script);
          });
        }
        if(!window.KnightfallMemoPad)throw Error('Memo Pad is unavailable.');
        window.KnightfallMemoPad.mount($("#mc-memo-host"),{compact:true});
        memoMounted=true;
      }catch(err){$("#mc-memo-host").textContent=err.message||'Memo Pad unavailable. Open the full page instead.'}
    }else window.KnightfallMemoPad?.mount($("#mc-memo-host"),{compact:true});
  }
  memoToggle.addEventListener('click',()=>memoPanel.hidden?openMemo():closeMemo());
  $("#mc-memo-close").addEventListener('click',()=>{closeMemo();memoToggle.focus({preventScroll:true})});

  let userId=null, conversationId=null, busy=false, voiceEnabled=false;
  const status=$("#mc-presence-status"), voiceButton=$("#mc-voice"), mood=$("#mc-mood");
  function setExpression(expression){root.dataset.expression=expression;const labels={default:"Your chaos, one tap away",playful:"Up to something",dark:"Professionally unhinged",supportive:"Here with you",philosophical:"Questioning reality",thinking:"Thinking up trouble…",speaking:"Speaking"};status.textContent="● "+(labels[expression]||labels.default);}
  function speak(text){if(!voiceEnabled||!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined")return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||""));utterance.rate=1.02;utterance.pitch=1.1;utterance.onstart=()=>setExpression("speaking");utterance.onend=()=>setExpression(mood.value);utterance.onerror=()=>setExpression(mood.value);window.speechSynthesis.speak(utterance);}
  const key=id=>"missChaosPresenceConversation:"+String(id);
  const draftKey="missChaosPresenceDraft";
  try{input.value=sessionStorage.getItem(draftKey)||"";}catch(_){}
  function open(){closeMemo();panel.hidden=false;panel.setAttribute("aria-hidden","false");launcher.setAttribute("aria-expanded","true");input.focus({preventScroll:true});}
  function close(){try{sessionStorage.setItem(draftKey,input.value);}catch(_){} panel.hidden=true;panel.setAttribute("aria-hidden","true");launcher.setAttribute("aria-expanded","false");launcher.focus({preventScroll:true});}
  function add(role,text){const el=document.createElement("div");el.className="mc-bubble "+role;el.textContent=text;messages.append(el);messages.scrollTop=messages.scrollHeight;return el;}
  async function request(path,options={}){const r=await fetch(API+path,{credentials:"include",cache:"no-store",...options,headers:{"content-type":"application/json",...(options.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok){const err=new Error(d.error||"Request failed ("+r.status+").");err.status=r.status;throw err;}return d;}
  async function ensureAccount(){if(userId)return true;let d;try{d=await request("/api/auth/me");}catch(e){if(e.status!==401&&!/unauth|sign in|401/i.test(e.message))throw e;d={user:null};}if(!d.user){if(!messages.querySelector("[data-mc-signin]")){add("system","Sign in to save your conversations and chat with me.");const link=document.createElement("a");link.dataset.mcSignin="true";link.href="/auth.html?next="+encodeURIComponent(location.pathname+location.search);link.textContent=" Sign in to Ash-Fall ↗";messages.append(link);messages.scrollTop=messages.scrollHeight;}return false;}userId=d.user.id||d.user.user_id||d.user.username||"member";conversationId=sessionStorage.getItem(key(userId))||"";return true;}
  async function ensureConversation(){if(conversationId)return conversationId;const d=await request("/api/chaos/conversations",{method:"POST",body:"{}"});conversationId=d.conversation.id;sessionStorage.setItem(key(userId),String(conversationId));return conversationId;}
  launcher.addEventListener("click",async()=>{if(panel.hidden){open();try{await ensureAccount();}catch(e){error.textContent=e.message;}}else close();});
  $("#mc-close").addEventListener("click",close);$("#mc-full-chat").addEventListener("click",()=>location.href="/miss-chaos.html");
  voiceButton.addEventListener("click",()=>{if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){error.textContent="This browser does not support spoken replies.";return;}voiceEnabled=!voiceEnabled;voiceButton.setAttribute("aria-pressed",String(voiceEnabled));voiceButton.setAttribute("aria-label",voiceEnabled?"Disable spoken replies":"Enable spoken replies");voiceButton.title=voiceEnabled?"Turn spoken replies off":"Turn spoken replies on";if(voiceEnabled)speak("Spoken replies are on. Your ears have accepted the terms of chaos.");else{window.speechSynthesis.cancel();setExpression(mood.value);}});
  mood.addEventListener("change",()=>setExpression(mood.value));
  const gameTips=$("#mc-game-tips");
  if(/arcade|chaos-cartridge|game/i.test(location.pathname)){gameTips.hidden=false;gameTips.addEventListener("click",()=>{input.value="Give me tips for playing this game on Chaos Cartridge. Explain the controls, strategy, and any useful beginner tricks.";input.focus();input.dispatchEvent(new Event("input"));$("#mc-form").requestSubmit();});}
  document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!memoPanel.hidden){closeMemo();memoToggle.focus({preventScroll:true})}else if(!panel.hidden)close();});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#mc-form").requestSubmit();}});
  input.addEventListener("input",()=>{try{sessionStorage.setItem(draftKey,input.value);}catch(_){} input.style.height="auto";input.style.height=Math.min(input.scrollHeight,110)+"px";});
  $("#mc-form").addEventListener("submit",async e=>{e.preventDefault();const message=input.value.trim();if(!message||busy)return;error.textContent="";busy=true;send.disabled=true;input.value="";try{sessionStorage.removeItem(draftKey);}catch(_){} input.style.height="auto";add("user",message);const typing=add("mc-typing","Miss Chaos is thinking…");typing.className="mc-typing";setExpression("thinking");
    try{if(!(await ensureAccount())){typing.remove();return;}const id=await ensureConversation();let result;try{result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:id,message,mood:$("#mc-mood").value})});}catch(first){if(/conversation|not found|invalid/i.test(first.message)){conversationId="";sessionStorage.removeItem(key(userId));const fresh=await ensureConversation();result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:fresh,message,mood:$("#mc-mood").value})});}else throw first;}typing.remove();const reply=result.reply||"I got a response-shaped mystery. Try me again.";add("assistant",reply);setExpression(mood.value);speak(reply);}
    catch(err){typing.remove();error.textContent=err.message||"I couldn't reach the backend. Try again in a moment.";input.value=message;try{sessionStorage.setItem(draftKey,message);}catch(_){} }
    finally{busy=false;send.disabled=false;input.focus({preventScroll:true});}
  });
  // Overlay placement and minimize controls are isolated from chat logic.
  const dockScript=document.createElement("script");
  dockScript.src="/miss-chaos-dock.js?v=20261103-memo-dock1";
  document.head.append(dockScript);
})();
