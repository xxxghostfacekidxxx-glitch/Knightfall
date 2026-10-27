(() => {
  "use strict";
  if (document.getElementById("miss-chaos-presence")) return;
  const API = "https://api.ash-fall.com";
  const AVATAR = "/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c";
  const css = document.createElement("link"); css.rel="stylesheet"; css.href="/miss-chaos-presence.css?v=20261026-presence6"; document.head.append(css);
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
    <button id="miss-chaos-launcher" type="button" aria-expanded="false" aria-controls="miss-chaos-window"><span style="position:relative"><img src="${AVATAR}" alt=""><i class="mc-status-dot" aria-hidden="true"></i></span><span class="mc-launch-copy"><strong>Miss Chaos</strong><small>Need me? I'm right here.</small></span></button>`;
  document.body.append(root);
  // Keep the floating companion clear of the support/shop footer while it is visible.
  // IntersectionObserver also handles mobile browser bars and changing viewport heights.
  const supportFooter = document.getElementById("ashfall-support-footer");
  if (supportFooter && "IntersectionObserver" in window) {
    const adjustForFooter = () => {
      const rect = supportFooter.getBoundingClientRect();
      const overlap = Math.max(0, window.innerHeight - Math.max(0, rect.top));
      root.style.setProperty("--mc-footer-clearance", Math.min(overlap, window.innerHeight * 0.5) + "px");
    };
    const observer = new IntersectionObserver(() => adjustForFooter(), {threshold:[0,0.01,0.5,1]});
    observer.observe(supportFooter);
    window.addEventListener("resize", adjustForFooter, {passive:true});
    window.addEventListener("scroll", adjustForFooter, {passive:true});
    adjustForFooter();
  }
  const $=s=>root.querySelector(s), panel=$("#miss-chaos-window"), launcher=$("#miss-chaos-launcher"), messages=$("#mc-messages"), input=$("#mc-input"), send=$("#mc-send"), error=$("#mc-error");
  let userId=null, conversationId=null, busy=false, voiceEnabled=false;
  const status=$("#mc-presence-status"), voiceButton=$("#mc-voice"), mood=$("#mc-mood");
  function setExpression(expression){root.dataset.expression=expression;const labels={default:"Your chaos, one tap away",playful:"Up to something",dark:"Professionally unhinged",supportive:"Here with you",philosophical:"Questioning reality",thinking:"Thinking up trouble…",speaking:"Speaking"};status.textContent="● "+(labels[expression]||labels.default);}
  function speak(text){if(!voiceEnabled||!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined")return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(String(text||""));utterance.rate=1.02;utterance.pitch=1.1;utterance.onstart=()=>setExpression("speaking");utterance.onend=()=>setExpression(mood.value);utterance.onerror=()=>setExpression(mood.value);window.speechSynthesis.speak(utterance);}
  const key=id=>"missChaosPresenceConversation:"+String(id);
  function open(){panel.hidden=false;panel.setAttribute("aria-hidden","false");launcher.setAttribute("aria-expanded","true");input.focus({preventScroll:true});}
  function close(){panel.hidden=true;panel.setAttribute("aria-hidden","true");launcher.setAttribute("aria-expanded","false");launcher.focus({preventScroll:true});}
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
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close();});
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#mc-form").requestSubmit();}});
  input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,110)+"px";});
  $("#mc-form").addEventListener("submit",async e=>{e.preventDefault();const message=input.value.trim();if(!message||busy)return;error.textContent="";busy=true;send.disabled=true;input.value="";input.style.height="auto";add("user",message);const typing=add("mc-typing","Miss Chaos is thinking…");typing.className="mc-typing";setExpression("thinking");
    try{if(!(await ensureAccount())){typing.remove();return;}const id=await ensureConversation();let result;try{result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:id,message,mood:$("#mc-mood").value})});}catch(first){if(/conversation|not found|invalid/i.test(first.message)){conversationId="";sessionStorage.removeItem(key(userId));const fresh=await ensureConversation();result=await request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:fresh,message,mood:$("#mc-mood").value})});}else throw first;}typing.remove();const reply=result.reply||"I got a response-shaped mystery. Try me again.";add("assistant",reply);setExpression(mood.value);speak(reply);}
    catch(err){typing.remove();error.textContent=err.message||"I couldn't reach the backend. Try again in a moment.";input.value=message;}
    finally{busy=false;send.disabled=false;input.focus({preventScroll:true});}
  });
})();