(() => {
  "use strict";
  const API = "https://api.ash-fall.com";
  const partnerCompanion = document.body.dataset.chaosCompanion === "partner";
  // The URL selects a UI workspace, NOT an authorization level. The Worker verifies GOD.
  const ownerCompanion = !partnerCompanion && new URLSearchParams(location.search).get("companion") === "owner";
  const companionVariant = partnerCompanion ? "partner" : ownerCompanion ? "owner" : undefined;
  const $ = (selector) => document.querySelector(selector);
  const messagesEl = $("#chat-messages"), listEl = $("#conversation-list");
  const form = $("#chat-form"), input = $("#message-input"), sendButton = $("#send-button");
  const conversationSearch = $("#conversation-search");
  let conversationSearchTimer = null;
  const errorEl = $("#chat-error"), statusEl = $("#engine-status"), moodSelect = $("#mood");
  let activeConversation = null, busy = false, speakReplies = false, showDeleted = false, adminViewing = false, isAdmin = false;
  let conversationLoadVersion = 0, conversationListVersion = 0;
  const drafts = new Map();
  const jumpLatest=document.getElementById("mc-jump-latest"),focusToggle=document.getElementById("mc-focus-toggle");
  const nearBottom=()=>messagesEl.scrollHeight-messagesEl.scrollTop-messagesEl.clientHeight<150;
  function syncJump(){if(jumpLatest)jumpLatest.hidden=nearBottom();}
  messagesEl.addEventListener("scroll",syncJump,{passive:true});
  jumpLatest?.addEventListener("click",()=>{scrollToBottom();syncJump();});
  focusToggle?.addEventListener("click",()=>{const on=focusToggle.getAttribute("aria-pressed")!=="true";focusToggle.setAttribute("aria-pressed",String(on));focusToggle.textContent=on?"Exit focus":"Focus mode";document.querySelector(".chat-panel")?.classList.toggle("mc-focus-mode",on);});
  function setExpression(state){const portrait=document.querySelector(".chaos-avatar");if(portrait)portrait.dataset.mcExpression=state;}
  function setStreaming(value){messagesEl.setAttribute("aria-busy",String(value));setExpression(value?"thinking":"ready");}
  function saveDraft() { if (!adminViewing) drafts.set(activeConversation || "new", input.value); }
  function restoreDraft() { input.value = drafts.get(activeConversation || "new") || ""; input.dispatchEvent(new Event("input")); }
  // Task starters populate the existing composer; they do not claim access to unconfigured tools.
  const taskStarters = [
    ["Debug", "Help me debug a problem. Ask for the error and expected behavior, then propose a testable fix."],
    ["Plan", "Help me plan a project with milestones, dependencies, risks, and actionable next steps."],
    ["Write", "Help me draft or revise writing for a specific audience and purpose."],
    ["Research", "Help me research a topic. Clearly distinguish verified sources from your existing knowledge and do not invent citations."],
    ["Code", "Help me write code with clear setup instructions, tests, and failure handling."],
    ["GitHub", "Find open source GitHub repositories for "],
    ["Inspect JS", "Check JavaScript syntax:\n"],
    ["Inspect JSON", "Check JSON syntax:\n"],
    ["Inspect TS", "Check TypeScript syntax:\n"],
    ["Diff", "Compare code versions:\nOLD:\n\nNEW:\n"],
    ["JSON Shape", "Validate JSON schema:\nSCHEMA:\n{\"type\":\"object\"}\nDOCUMENT:\n{}"],
    ["Format JS", "Format JavaScript code:\n"],
    ["Flowchart", "Create flowchart: Idea -> Design -> Test -> Release"],
    ["Books", "Find books about "],
    ["Papers", "Search research papers about "],
    ["Patterns", "Draft a tote bag 16 x 18 x 4 inches with a 0.5 inch seam. Use fabric width 44 inches with 10% reserve. Give me a measured cut list, approximate fabric yardage and Chaos Forge design link."],
    ["Scale", "Scale a panel 12 x 16 inches by 125%"],
    ["Contrast", "Check contrast between #ff4f9a and #110d1c"],
    ["Yardage", "Help me estimate how much fabric to buy. Ask me for usable fabric width, measured cut piece dimensions, piece counts, grain direction and reserve percentage. Never invent missing sizes."],
    ["Inbox", "Show my recent Chaosphere conversations"],
    ["My Tasks", "Show our shared handoff task board and summarize the unfinished tasks. Only use tasks I have access to."],
    ["Bot Fleet", "Show my bot fleet and the owner-published bots available to me."],
    ["3D Assets", "Find free CC0 models on Poly Haven for "],
    ["Textures", "Find CC0 textures on Poly Haven for "],
    ["Museum", "Find historical costumes at The Met"],
    ["Wiki", "Search Wikipedia for "],
    ["Site Help", "Where can I find the Chaos Forge?"]
  ];
  const starterBar = document.createElement("div");
  starterBar.className = "chaos-task-starters";
  starterBar.setAttribute("aria-label", "Assistant task starters");
  starterBar.style.cssText = "display:flex;flex-wrap:wrap;gap:.45rem;padding:.55rem .75rem";
  const advancedBar = document.createElement("div");
  advancedBar.id = "chaos-advanced-starters";
  advancedBar.style.cssText = "display:none;flex-wrap:wrap;flex-basis:100%;gap:.45rem";
  const featuredStarters = new Set(["Debug","Research","Patterns","Inbox"]);
  for (const [name, prompt] of taskStarters) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.title = prompt;
    button.style.cssText = "border:1px solid #ff2f9270;background:#161019;color:#f8e8f4;border-radius:999px;padding:.4rem .7rem;cursor:pointer;font:inherit;font-size:.78rem";
    button.addEventListener("click", () => {
      if (input.disabled) return;
      input.value = prompt + (input.value.trim() ? "\n\n" + input.value.trim() : "");
      input.dispatchEvent(new Event("input", {bubbles:true}));
      input.focus();
    });
    (featuredStarters.has(name) ? starterBar : advancedBar).append(button);
  }
  const moreTools = document.createElement("button");
  moreTools.type = "button";
  moreTools.textContent = "More tools";
  moreTools.setAttribute("aria-controls", "chaos-advanced-starters");
  moreTools.setAttribute("aria-expanded", "false");
  moreTools.style.cssText = "border:1px solid #84e89c80;background:#151b19;color:#c7fbd7;border-radius:999px;padding:.4rem .7rem;cursor:pointer;font:inherit;font-size:.78rem";
  moreTools.addEventListener("click", () => {
    const open = moreTools.getAttribute("aria-expanded") !== "true";
    moreTools.setAttribute("aria-expanded", String(open));
    moreTools.textContent = open ? "Fewer tools" : "More tools";
    advancedBar.style.display = open ? "flex" : "none";
  });
  starterBar.append(moreTools, advancedBar);
  if (document.getElementById("mc-history-panel")) {
    const drawer=document.createElement("details");drawer.className="mc-tool-drawer";
    const summary=document.createElement("summary");summary.textContent="Creative & research tools";
    drawer.append(summary,starterBar);form.parentNode.insertBefore(drawer,form);
  } else form.parentNode.insertBefore(starterBar, form);
  const historyToggle=document.getElementById("mc-history-toggle");
  const historyPanel=document.getElementById("mc-history-panel");
  function setHistory(open){if(!historyToggle||!historyPanel)return;historyToggle.setAttribute("aria-expanded",String(open));historyToggle.textContent=open?"× Close chats & settings":"☰ Chats & settings";historyPanel.closest(".chaos-shell").dataset.historyOpen=String(open);}
  historyToggle?.addEventListener("click",()=>{const open=historyToggle.getAttribute("aria-expanded")!=="true";setHistory(open);if(open)historyPanel.scrollIntoView({block:"nearest"});});
  const welcomePrompts={talk:"Let's just talk. ",create:"Help me make something creative. ",laugh:"Entertain me with something weird and funny. ",help:"Help me work through something. ",study:"Teach me something interesting, with a small example I can try. ",explore:"Help me find something fun or useful on Knightfall, with actual page links. "};
  function stageDraft(value){if(input.disabled||busy||adminViewing)return false;const draft=input.value.trim(),next=draft?draft+"\n\n"+value:value;if(next.length>(input.maxLength||4000)){showError("Your current draft is too long to add this. Copy it first or shorten it.");return false;}input.value=next;input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();return true;}
  messagesEl.addEventListener("click",event=>{const b=event.target.closest("[data-mc-starter]");if(!b||input.disabled||busy||adminViewing)return;const prompt=welcomePrompts[b.dataset.mcStarter];if(!prompt)return;stageDraft(prompt);});
  const referenceButton=$("#chaos-reference-photo"),referenceInput=$("#chaos-reference-input"),referenceStatus=$("#chaos-reference-status");
   let chatPhoto=null;
   import("/chaos-chat-image-picker.mjs?v=20261119-photo-chat1").then(({mountChaosChatImage})=>{
     chatPhoto=mountChaosChatImage({form,composer:form.querySelector(".composer-actions"),
       status:$("#chaos-chat-image-status")});
   }).catch(()=>{const s=$("#chaos-chat-image-status");if(s){s.hidden=false;s.textContent="Image attachments could not load; text chat remains available.";}});
  let referenceBusy=false;
  const referenceMessage=text=>{referenceStatus.textContent=text;referenceStatus.hidden=!text;};
  referenceButton.addEventListener("click",()=>{
    if(busy||referenceBusy||adminViewing||input.disabled){
      referenceMessage("Finish the current response or open your own chat before analyzing a photo.");
      return;
    }
    referenceInput.click(); // Explicit opt-in; never start an upload automatically.
  });
  async function compressReferencePhoto(file){
    if(!file||!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024)
      throw Error("Choose a JPEG, PNG, or WebP photo under 8 MB.");
    const objectURL=URL.createObjectURL(file);
    try{
      const image=new Image();
      await new Promise((resolve,reject)=>{
        image.onload=resolve;
        image.onerror=()=>reject(Error("This image couldn't be opened. Try a different photo."));
        image.src=objectURL;
      });
      if(!image.naturalWidth||!image.naturalHeight||
         image.naturalWidth>6000||image.naturalHeight>6000||
         image.naturalWidth*image.naturalHeight>16000000)
        throw Error("Photo resolution exceeds 16 megapixels. Crop or resize it first.");
      const factor=Math.min(1,768/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(image.naturalWidth*factor));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*factor));
      const ctx=canvas.getContext("2d");
      if(!ctx)throw Error("Your browser can't resize the photo.");
      ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [.78,.62,.48]){
        const encoded=canvas.toDataURL("image/jpeg",quality);
        if(encoded.length<860000)return encoded;
      }
      throw Error("Photo is still too large after compression. Crop it first.");
    }finally{URL.revokeObjectURL(objectURL);}
  }
  referenceInput.addEventListener("change",async()=>{
    const file=referenceInput.files?.[0];
    if(!file||referenceBusy)return;
    if(adminViewing||busy||input.disabled){
      referenceMessage("Finish the current reply before analyzing another photo.");
      referenceInput.value="";
      return;
    }
    const original=input.value.trim();
    if(original.length>3200){
      referenceMessage("The message is too long to include photo analysis. Shorten it before uploading.");
      referenceInput.value="";
      return;
    }
    referenceBusy=true;referenceButton.disabled=true;sendButton.disabled=true;
    referenceMessage("Analyzing visible craft details. The reference photo is sent to Workers AI, not stored in chat…");
    try{
      const image=await compressReferencePhoto(file);
      // This existing authenticated, rate-limited endpoint handles at most one craft photo at a time.
      const response=await request("/api/chaos/forge/analyze",{
        method:"POST",body:JSON.stringify({kind:"craft",image,notes:"Describe clothing/craft construction, materials, seams, parts and missing measurements. No guessed physical size."})
      });
      const prefix="AI analysis of my clothing/craft reference photo (single-view estimate, original image not stored):\n";
      const tail="\n\nHelp me refine this into a practical design. Verify missing measurements before proposing final cut sizes.";
      const available=4000-original.length-(original?2:0)-prefix.length-tail.length;
      if(available<240)throw Error("Not enough room for the photo notes. Shorten the message.");
      const inspection=String(response.analysis||"").trim();
      if(!inspection)throw Error("Vision AI returned no usable information.");
      input.value=(original?original+"\n\n":"")+prefix+inspection.slice(0,Math.min(2600,available))+tail;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      referenceMessage("Photo analyzed. Review the draft below, edit it, and press Send when you're ready. Only the sent text is saved to chat.");
      input.focus();
    }catch(error){
      referenceMessage(error.message||"Photo analysis is unavailable. You can still use Chaos Forge for manual drafting.");
    }finally{
      referenceBusy=false;referenceButton.disabled=false;sendButton.disabled=busy||adminViewing;
      referenceInput.value="";
    }
  });
  const moodNames = {default:"Default",playful:"Playful",dark:"Dark",supportive:"Supportive",philosophical:"Philosophical",astrology:"Astrology",custom:"Custom"};

  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      credentials: "include", cache: "no-store",
      ...options,
      headers: {"content-type":"application/json", ...(options.headers || {})}
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        location.href = "/auth.html?next=" + encodeURIComponent("/miss-chaos.html");
      }
      throw new Error(payload.error || "Request failed (" + response.status + ").");
    }
    return payload;
  }
  function showError(message) { errorEl.textContent = message; errorEl.hidden = !message; }
  function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; syncJump(); }
  function renderReplyText(node, content) {
    if(globalThis.KnightfallChaosFormat){globalThis.KnightfallChaosFormat.render(node,content);return;}
    node.mcRaw=String(content);node.replaceChildren();
    // Link only our own site and trusted public catalogs. Text nodes prevent markup injection.
    const allowed = new Set(["ash-fall.com","www.ash-fall.com","openlibrary.org",
      "www.openlibrary.org","doi.org","www.doi.org","polyhaven.com",
      "www.polyhaven.com","www.wikidata.org","en.wikipedia.org","www.metmuseum.org"]);
    const links = /https:\/\/[^\s<>"']+/gi;
    let end = 0;
    for (const match of String(content).matchAll(links)) {
      const raw=match[0].replace(/[.,;:!?)}\]]+$/g,"");
      if(!raw)continue;
      let parsed;
      try{parsed=new URL(raw);}catch{continue;}
      if(parsed.protocol!=="https:"||!allowed.has(parsed.hostname))continue;
      const link=document.createElement("a");
      link.href=parsed.href;
      link.textContent=raw;
      if(parsed.hostname!=="ash-fall.com"&&parsed.hostname!=="www.ash-fall.com"){
        link.target="_blank";link.rel="noopener noreferrer";
      }
      node.append(content.slice(end,match.index),link);
      end=match.index+raw.length;
    }
    node.append(content.slice(end));
  }
  function addMessage(role, content, label) {
    const welcome = messagesEl.querySelector(".welcome-card");
    if (welcome) welcome.remove();
    const wasNearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 140;
    const article = document.createElement("article");
    article.className = "message " + (role === "user" ? "user" : "assistant");
    const heading = document.createElement("div");
    heading.className = "message-label";
    heading.textContent = label || (role === "user" ? "You" : "Miss Chaos");
    if(role!=="user"){const portrait=document.createElement("img");portrait.className="mc-reply-avatar";portrait.src="/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c";portrait.alt="";portrait.width=26;portrait.height=26;portrait.loading="lazy";heading.prepend(portrait);}
    const text = document.createElement("div");
    text.className = "message-content";
    if (role === "user") text.textContent = content;
    else renderReplyText(text,content);
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const copy = document.createElement("button");
    copy.type = "button"; copy.className = "message-copy";
    copy.textContent = "Copy"; copy.setAttribute("aria-label", "Copy " + (role === "user" ? "your" : "Miss Chaos") + " message");
    copy.addEventListener("click", async () => {
      try {
        if(typeof text.mcRaw==="string")await navigator.clipboard.writeText(text.mcRaw);else await navigator.clipboard.writeText(text.textContent);
        copy.textContent = "Copied";
        setTimeout(() => { if (copy.isConnected) copy.textContent = "Copy"; }, 1600);
      } catch { showError("Copy failed. Select the message text to copy it manually."); }
    });
    actions.append(copy);
    const follow=document.createElement("button");follow.type="button";follow.className="message-copy mc-follow-up";follow.textContent=role==="user"?"Use as draft":"Follow up";follow.setAttribute("aria-label",role==="user"?"Reuse this message in the composer":"Ask a follow-up about this reply");follow.addEventListener("click",()=>{const raw=typeof text.mcRaw==="string"?text.mcRaw:text.textContent;stageDraft(role==="user"?raw:"I have a follow-up about your reply: "+raw.slice(0,360)+"\n\nMy question: ");});actions.append(follow);
    if(role!=="user" && "speechSynthesis" in window){
      const listen=document.createElement("button");
      listen.type="button";listen.className="message-copy message-listen";
      listen.textContent="Listen";listen.setAttribute("aria-label","Read this Miss Chaos reply aloud");
      listen.addEventListener("click",()=>{
        const synth=window.speechSynthesis;
        if(synth.speaking){synth.cancel();if(listen.dataset.playing==="true"){listen.dataset.playing="false";listen.textContent="Listen";return;}}
        const utterance=new SpeechSynthesisUtterance(text.textContent);
        utterance.lang=navigator.language||"en-US";utterance.rate=1.02;
        listen.dataset.playing="true";listen.textContent="Stop";
        const reset=()=>{listen.dataset.playing="false";listen.textContent="Listen";};
        utterance.onend=reset;utterance.onerror=reset;synth.speak(utterance);
      });
      actions.append(listen);
    }
    article.append(heading, text, actions);
    messagesEl.append(article);
    if (wasNearBottom || role === "user") scrollToBottom(); else syncJump();
    return article;
  }
  function showWelcome() {
    messagesEl.innerHTML = "<div class=\"welcome-card\"><img class=\"mc-welcome-portrait\" src=\"/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c\" width=\"84\" height=\"84\" alt=\"\" decoding=\"async\"><p class=\"eyebrow\">YOUR LITTLE CORNER OF CHAOS</p><h2>Hey, trouble. 🖤</h2><p>Bring me the messy thoughts, wild ideas and questions nobody else gets. We can talk, create, laugh or figure things out together.</p><div class=\"mc-welcome-actions\" aria-label=\"Conversation ideas\"><button type=\"button\" data-mc-starter=\"talk\">♡ Just talk</button><button type=\"button\" data-mc-starter=\"create\">✦ Make something</button><button type=\"button\" data-mc-starter=\"laugh\">☾ Entertain me</button><button type=\"button\" data-mc-starter=\"help\">⚡ Help me figure it out</button><button type=\"button\" data-mc-starter=\"study\">✧ Learn something</button><button type=\"button\" data-mc-starter=\"explore\">☄ Explore Knightfall</button></div><p class=\"welcome-hint\">Your chats stay attached to your account. You choose what to save in memory.</p></div>";
  }
  function renderConversationList(items) {
    listEl.replaceChildren();
    if (!items.length) { const p=document.createElement("p");p.className="muted";p.textContent=showDeleted?"Nothing in Recently Deleted.":"No conversations yet. Make some trouble.";listEl.append(p);return; }
    for(const item of items){
      const row=document.createElement("div");row.className="conversation-row";
      const open=document.createElement("button");open.type="button";open.className="conversation-item"+(item.id===activeConversation?" active":"");open.textContent=item.title||"Untitled conversation";open.title=open.textContent;
      if(showDeleted){
        open.disabled=true;
        const restore=document.createElement("button");restore.type="button";restore.className="conversation-restore";restore.textContent="↶";restore.title="Restore conversation";
        restore.addEventListener("click",async()=>{restore.disabled=true;try{await request("/api/chaos/conversations/"+encodeURIComponent(item.id),{method:"PATCH",body:JSON.stringify({action:"restore"})});await refreshConversations();showError("");}catch(e){showError(e.message);restore.disabled=false;}});
        row.append(open,restore);
      }else{
        open.addEventListener("click",()=>openConversation(item.id));
        const rename=document.createElement("button");rename.type="button";rename.className="conversation-rename";rename.textContent="✎";rename.title="Rename conversation";rename.setAttribute("aria-label","Rename conversation: "+open.textContent);
        rename.addEventListener("click",async()=>{const title=window.prompt("Rename this conversation (up to 80 characters):",item.title||"");if(title===null)return;const next=title.trim();if(!next||next.length>80){showError("A conversation title must be between 1 and 80 characters.");return;}rename.disabled=true;try{await request("/api/chaos/conversations/"+encodeURIComponent(item.id),{method:"PATCH",body:JSON.stringify({action:"rename",title:next})});await refreshConversations();showError("");}catch(e){showError(e.message);rename.disabled=false;}});
        const del=document.createElement("button");del.type="button";del.className="conversation-delete";del.textContent="×";del.title="Move to Recently Deleted";del.setAttribute("aria-label","Delete conversation: "+open.textContent);
        del.addEventListener("click",async()=>{if(busy){showError("Wait until Miss Chaos finishes replying before deleting a conversation.");return;}if(!confirm("Move this conversation to Recently Deleted? You can restore it for 30 days before permanent deletion."))return;del.disabled=true;showError("");try{await request("/api/chaos/conversations/"+encodeURIComponent(item.id),{method:"DELETE"});const wasActive=activeConversation===item.id;if(wasActive){activeConversation=null;adminViewing=false;}const remaining=await refreshConversations();if(wasActive){if(remaining.length)await openConversation(remaining[0].id);else showWelcome();}}catch(e){showError(e.message);del.disabled=false;}});
        row.append(open,rename,del);
      }
      listEl.append(row);
    }
  }
  async function refreshConversations() {
    const params=new URLSearchParams();
    if(showDeleted)params.set("deleted","1");
    const query=conversationSearch?.value.trim();
    if(query)params.set("q",query);
    const suffix=params.toString()?"?"+params.toString():"";
    const version = ++conversationListVersion;
    const data = await request("/api/chaos/conversations" + suffix);
    if (version !== conversationListVersion) return data.conversations || [];
    renderConversationList(data.conversations || []);
    return data.conversations || [];
  }
  const memoryListEl = $("#memory-list"), memoryCountEl = $("#memory-count");
  const memoryForm = $("#memory-form"), memoryInput = $("#memory-input");
  const memoryCategory = $("#memory-category"), memoryStatus = $("#memory-status");
  const memoryCategoryNames = {personal:"Personal",preference:"Preference",project:"Project",other:"Other"};
  let memorySearchTimer;
  $("#memory-search")?.addEventListener("input",()=>{clearTimeout(memorySearchTimer);memorySearchTimer=setTimeout(()=>refreshMemories().catch(error=>showMemoryStatus(error.message,true)),200);});
  function showMemoryStatus(message, isError = false) {
    memoryStatus.textContent = message;
    memoryStatus.classList.toggle("error", isError);
    memoryStatus.hidden = !message;
  }
  async function refreshMemories() {
    const data = await request("/api/chaos/memories");
    const memories = data.memories || [];
    const search = ($("#memory-search")?.value || "").trim().toLowerCase();
    const filteredMemories=search?memories.filter(m=>String(m.memory).toLowerCase().includes(search)||String(m.category).toLowerCase().includes(search)):memories;
    memoryCountEl.textContent = memories.length + " / 100";
    memoryListEl.replaceChildren();
    if (!filteredMemories.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = search ? "No saved memories match your search." : "Nothing saved yet. Add a detail above when you want me to remember it.";
      memoryListEl.append(empty);
      return memories;
    }
    for (const memory of filteredMemories) {
      const card = document.createElement("article");
      card.className = "memory-card";
      const text = document.createElement("p");
      text.textContent = memory.memory;
      const meta = document.createElement("div");
      meta.className = "memory-meta";
      const category = document.createElement("span");
      category.textContent = memoryCategoryNames[memory.category] || "Other";
      const actions = document.createElement("div");
      actions.className = "memory-actions";
      const edit = document.createElement("button");
      edit.type = "button"; edit.textContent = "Edit";
      edit.addEventListener("click", async () => {
        const replacement = window.prompt("Edit this saved memory (up to 500 characters):", memory.memory);
        if (replacement === null) return;
        const next = replacement.trim();
        if (!next || next.length > 500) { showMemoryStatus("Memory must be between 1 and 500 characters.", true); return; }
        const nextCategory = window.prompt("Category: personal, preference, project, or other", memory.category);
        if (nextCategory === null) return;
        if (!["personal","preference","project","other"].includes(nextCategory.trim().toLowerCase())) {
          showMemoryStatus("Choose personal, preference, project, or other.", true); return;
        }
        try {
          await request("/api/chaos/memories/" + memory.id, {method:"PATCH",body:JSON.stringify({memory:next,category:nextCategory.trim().toLowerCase()})});
          showMemoryStatus("Memory updated.");
          await refreshMemories();
        } catch (error) { showMemoryStatus(error.message, true); }
      });
      const remove = document.createElement("button");
      remove.type = "button"; remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Delete this saved memory? Miss Chaos will no longer use it in future replies.")) return;
        try {
          await request("/api/chaos/memories/" + memory.id, {method:"DELETE"});
          showMemoryStatus("Memory deleted.");
          await refreshMemories();
        } catch (error) { showMemoryStatus(error.message, true); }
      });
      actions.append(edit, remove);
      meta.append(category, actions);
      card.append(text, meta);
      memoryListEl.append(card);
    }
    return memories;
  }
  async function openConversation(id) {
    if (busy) { showError("Wait for Miss Chaos to finish before switching chats."); return; }
    saveDraft();
    chatPhoto?.clear();
    const version = ++conversationLoadVersion;
    showError("");
    const data = await request("/api/chaos/conversations/" + encodeURIComponent(id) + "/messages");
    if (version !== conversationLoadVersion) return;
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;chatPhoto?.setBusy(false);
    activeConversation = id;
    messagesEl.replaceChildren();
    if (!(data.messages || []).length) showWelcome();
    else for (const message of data.messages) addMessage(message.role, message.content, message.role === "assistant" ? "Miss Chaos · " + (moodNames[message.mood] || "Default") : "You");
    restoreDraft();
    setHistory(false);
    await refreshConversations();
    scrollToBottom();
  }
  async function exportConversation() {
    if (busy || adminViewing) { showError("Export is available for your own conversations when no reply is in progress."); return; }
    if (!activeConversation) { showError("Open a saved conversation before exporting."); return; }
    const button = $("#export-chat");
    button.disabled = true;
    try {
      const data = await request("/api/chaos/conversations/" + encodeURIComponent(activeConversation) + "/messages");
      const lines = ["# Miss Chaos conversation", "", "Exported: " + new Date().toISOString(), "", ...(data.messages || []).flatMap(message => [
        "## " + (message.role === "user" ? "You" : "Miss Chaos"),
        "", String(message.content || ""), ""
      ])];
      const blob = new Blob([lines.join("\n")], {type:"text/markdown;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "miss-chaos-chat-" + new Date().toISOString().slice(0,10) + ".md";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      showError("");
    } catch (error) { showError("Export failed: " + error.message); }
    finally { button.disabled = false; }
  }
  $("#export-chat").addEventListener("click", exportConversation);
  async function newConversation() {
    if (busy) { showError("Wait for the current reply before starting another chat."); return; }
    saveDraft();
    chatPhoto?.clear();
    ++conversationLoadVersion;
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;chatPhoto?.setBusy(false);showError("");
    const data = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
    activeConversation = data.conversation.id;
    showWelcome();
    restoreDraft();
    setHistory(false);
    await refreshConversations();
    input.focus();
  }
  const adminSearch=$("#admin-chaos-search"),adminFilter=$("#admin-chaos-status"),adminList=$("#admin-chaos-list"),adminMessage=$("#admin-chaos-status-message");
  let adminOffset=0; const adminPageSize=100;
  function archiveStatus(text,error=false){adminMessage.textContent=text;adminMessage.classList.toggle("error",error);adminMessage.hidden=!text;}
  async function refreshAdminArchive(){
    if(!isAdmin)return [];
    archiveStatus("Loading archive…");
    try{
      const query=new URLSearchParams({status:adminFilter.value,q:adminSearch.value.trim(),offset:String(adminOffset),limit:String(adminPageSize)});
      const data=await request("/api/admin/chaos/conversations?"+query.toString()),items=data.conversations||[];
      adminList.replaceChildren();
      if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="No conversations match this filter.";adminList.append(p);}
      for(const item of items){
        const card=document.createElement("article");card.className="admin-chaos-card";
        const title=document.createElement("strong");title.textContent=item.title||"Untitled conversation";
        const meta=document.createElement("p");meta.className="admin-chaos-meta";meta.textContent="@"+item.username+" · "+item.message_count+" messages · "+(item.deleted_at?"Deleted "+new Date(item.deleted_at).toLocaleString():"Active");
        const actions=document.createElement("div");actions.className="admin-chaos-actions";
        const view=document.createElement("button");view.type="button";view.textContent="View";view.addEventListener("click",()=>adminOpenConversation(item.id));actions.append(view);
        function addAction(action,label,confirmText){
          const b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",async()=>{if(confirmText&&!confirm(confirmText))return;b.disabled=true;archiveStatus("");try{await request("/api/admin/chaos/conversations/"+encodeURIComponent(item.id),{method:"PATCH",body:JSON.stringify({action})});await refreshAdminArchive();}catch(e){archiveStatus(e.message||"Archive action failed.",true);b.disabled=false;}});actions.append(b);
        }
        if(item.deleted_at){addAction("restore","Restore");addAction("purge","Permanently delete","Permanently erase this conversation and all its messages? This cannot be undone.");}
        else addAction("delete","Move to Recently Deleted","Move this user's conversation to Recently Deleted for 30 days?");
        card.append(title,meta,actions);adminList.append(card);
      }
      const total=Number(data.total||0);$("#admin-chaos-page").textContent=total?("Showing "+(adminOffset+1)+"–"+Math.min(adminOffset+items.length,total)+" of "+total):"No results";$("#admin-chaos-prev").disabled=adminOffset===0;$("#admin-chaos-next").disabled=adminOffset+items.length>=total;archiveStatus(total+" conversation(s) found. Use Next to browse every result.");return items;
    }catch(e){archiveStatus(e.message||"Couldn't load the archive.",true);return [];}
  }
  async function adminOpenConversation(id){
    if (busy) { showError("Wait for the current reply before opening the archive."); return; }
    saveDraft(); chatPhoto?.clear(); ++conversationLoadVersion;
    chatPhoto?.setBusy(true);
    showError("");adminViewing=true;activeConversation=null;input.disabled=true;sendButton.disabled=true;
    try{
      const data=await request("/api/admin/chaos/conversations/"+encodeURIComponent(id)+"/messages");
      messagesEl.replaceChildren();
      const intro=document.createElement("div");intro.className="welcome-card";
      const eyebrow=document.createElement("p");eyebrow.className="eyebrow";eyebrow.textContent="ADMIN ARCHIVE · @"+data.conversation.username;
      const title=document.createElement("h2");title.textContent=data.conversation.title||"Untitled conversation";
      const note=document.createElement("p");note.textContent="Read-only administrator view. Sending messages is disabled.";
      intro.append(eyebrow,title,note);messagesEl.append(intro);
      for(const m of (data.messages||[]))addMessage(m.role,m.content,(m.role==="assistant"?"Miss Chaos":"User")+" · "+new Date(m.created_at).toLocaleString());
      scrollToBottom();
    }catch(e){showError(e.message||"Couldn't load this conversation.");}
  }
  async function init() {
    try {
      statusEl.textContent = "Checking connection…";
      const me = await request("/api/auth/me");
      if (!me.user) { location.href = "/auth.html?next=" + encodeURIComponent(location.pathname+location.search); return; }
       if(ownerCompanion){
         const scope=await request("/api/chaos/companion");
         if(scope.role!=="owner"){location.replace("/miss-chaos.html");return;}
         document.title="Osiris · Private Miss Chaos | Knightfall";
         const heading=$(".chaos-identity h1"),eyebrow=$(".chaos-identity .eyebrow");
         if(heading)heading.textContent="Osiris · Private Miss Chaos";
         if(eyebrow)eyebrow.textContent="𓂀 OSIRIS · VERIFIED OWNER WORKSPACE";
       }
      isAdmin = ["admin", "god"].includes(me.user.role);
      if(isAdmin&&!advancedBar.querySelector("[data-staff-source]")){
        for(const [label,prompt] of [
          ["Inspect File","Inspect public/miss-chaos.js lines 1-55"],
          ["CI Health","Check Knightfall CI health"]
        ]){
          const b=document.createElement("button");b.type="button";b.dataset.staffSource="true";
          b.textContent=label;b.title=prompt;
          b.style.cssText="border:1px solid #84e89c80;background:#12231d;color:#d9ffe9;border-radius:999px;padding:.4rem .7rem;cursor:pointer;font:inherit;font-size:.78rem";
          b.addEventListener("click",()=>{
            if(input.disabled)return;
            input.value=prompt+(input.value.trim()?"\n\n"+input.value.trim():"");
            input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();
          });
          advancedBar.append(b);
        }
      }
      // Unreported member AI chats are reviewed only in the God-only Eye of Horus.
      if (isAdmin) $("#admin-chaos-archive").hidden = true;
      const [health, conversations] = await Promise.all([
        fetch(API + "/health", {cache:"no-store"}).then(r => r.ok ? r.json() : null).catch(() => null),
        refreshConversations(),
        refreshMemories()
      ]);
      statusEl.textContent = health?.ok ? "Connected · AI model availability checked on send" : "API connection needs attention";
      if (conversations.length) await openConversation(conversations[0].id);
      else showWelcome();
      // Textract keeps all original files on device. The short excerpt only
      // enters the composer after an explicit handoff; sending remains manual.
      try {
        const raw=sessionStorage.getItem("knightfall:textract-draft");
        if(raw){
          sessionStorage.removeItem("knightfall:textract-draft");
          const staged=JSON.parse(raw);
          const value=String(staged?.text||"");
          if(Number.isFinite(staged?.at)&&Date.now()-staged.at<10*60*1000&&value.length>0&&value.length<=3900){
            const original=input.value.trim();
            const combined=original?original+"\n\n"+value:value;
            if(combined.length<=4000){
              input.value=combined;input.dispatchEvent(new Event("input",{bubbles:true}));
              statusEl.textContent="Textract excerpt staged. Review your message before pressing Send.";
              input.focus({preventScroll:true});
            }else showError("Textract excerpt did not fit alongside your existing draft. Return to Textract and copy a shorter section.");
          }
        }
      } catch(error){console.warn("Textract private handoff unavailable",error);}
      // A published or owner-authorized derived chart is transferred only by a click;
      // no raw birth date, UTC timestamp, or coordinates enter session storage.
      try {
        const transfer=sessionStorage.getItem("knightfall:cosmic-reading");
        if(transfer){
          sessionStorage.removeItem("knightfall:cosmic-reading");
          const payload=JSON.parse(transfer),chart=payload?.chart;
          if(chart?.bodies)prepareCosmicReading(chart,payload?.from==="member-profile"?"Published member chart loaded. Review the draft before sending.":"Your profile chart loaded. Review the draft before sending.",payload?.from==="member-profile"?"member":"me");
        }
      }catch(error){console.warn("Cosmic chart transfer unavailable",error);}
      // A profile comparison click only transfers the public username.
      // The user's own chart and the other member's published chart are
      // both fetched through the existing authenticated permissions on click.
      try{
        const pending=sessionStorage.getItem("knightfall:cosmic-compare-user");
        if(pending){
          sessionStorage.removeItem("knightfall:cosmic-compare-user");
          const member=String(pending).replace(/^@/,"").trim();
          if(/^[a-zA-Z0-9_.-]{2,40}$/.test(member)){
            $("#astro-compare-username").value=member;
            moodSelect.value="astrology";moodSelect.dispatchEvent(new Event("change"));
            $("#astro-chart-status").textContent="Ready to compare your natal chart with @"+member+"'s published chart. Choose Compare published member charts when you're ready.";
          }
        }
      }catch(error){console.warn("Profile comparison handoff unavailable",error);}
    } catch (error) {
      statusEl.textContent = "Connection unavailable";
      showError(error.message || "Couldn't load Miss Chaos. Please refresh and try again.");
    }
  }
  $("#new-chat").addEventListener("click", async () => { try { showDeleted=false; $("#show-deleted").setAttribute("aria-pressed","false"); $("#show-deleted").textContent="Recently Deleted"; await newConversation(); } catch (e) { showError(e.message); } });
  $("#show-deleted").addEventListener("click",async()=>{showDeleted=!showDeleted;$("#show-deleted").setAttribute("aria-pressed",String(showDeleted));$("#show-deleted").textContent=showDeleted?"← Back to conversations":"Recently Deleted";try{await refreshConversations();}catch(e){showError(e.message);}});
  conversationSearch?.addEventListener("input",()=>{clearTimeout(conversationSearchTimer);conversationSearchTimer=setTimeout(async()=>{try{await refreshConversations();}catch(e){showError(e.message);}},220);});
  $("#admin-chaos-refresh").addEventListener("click",()=>{adminOffset=0;refreshAdminArchive();});
  $("#admin-chaos-status").addEventListener("change",()=>{adminOffset=0;refreshAdminArchive();});
  $("#admin-chaos-prev").addEventListener("click",()=>{adminOffset=Math.max(0,adminOffset-adminPageSize);refreshAdminArchive();});
  $("#admin-chaos-next").addEventListener("click",()=>{adminOffset+=adminPageSize;refreshAdminArchive();});
  let archiveSearchTimer; $("#admin-chaos-search").addEventListener("input",()=>{clearTimeout(archiveSearchTimer);adminOffset=0;archiveSearchTimer=setTimeout(refreshAdminArchive,250);});
  const astroTools = $("#astrology-tools");
  const astrologyPrompts = {
    natal:"I would like an in-depth natal chart interpretation. Please tell me what birth details and calculated placements you need, explain tropical vs. sidereal if relevant, and do not guess planetary positions.",
    compatibility:"Help me explore astrological compatibility in depth. Tell me what chart details you need for both people and explain synastry, major aspects, and limitations without claiming fate is predetermined.",
    transits:"I would like an in-depth explanation of current transits and how to interpret them. Please distinguish general symbolism from exact planetary positions you cannot verify, and tell me what chart or ephemeris details you need.",
    placements:"I have chart placements I want interpreted in depth. Ask me to paste the signs, degrees, houses, and aspects. Explain the chart ruler, patterns, elements, modalities, and how the pieces fit together."
  };
  function updateAstrologyTools() { astroTools.hidden = moodSelect.value !== "astrology"; }
  const savedMood = localStorage.getItem("missChaosMood");
  moodSelect.value = [...moodSelect.options].some(option => option.value === savedMood) ? savedMood : "default";
  updateAstrologyTools();
  moodSelect.addEventListener("change", () => { localStorage.setItem("missChaosMood", moodSelect.value); updateAstrologyTools(); });
  let latestNatalUtc = null,latestSavedChart=null,latestTransitChart=null,latestChartSubject="me",astroCityVersion=0;
  const astroUnknown=$("#astro-time-unknown"),astroDateOnly=$("#astro-date-only");
  const syncUnknownAstroTime=()=>{
    $("#astro-date-only-label").hidden=!astroUnknown.checked;
    astroDateOnly.required=astroUnknown.checked;
    $("#astro-birth-time").required=!astroUnknown.checked;
    $("#astro-utc-offset").required=!astroUnknown.checked;
  };
  astroUnknown.addEventListener("change",syncUnknownAstroTime);
  syncUnknownAstroTime();
  window.KnightfallBirthTime?.populate("astro-timezone");
  const astroPreview=$("#astro-preview");
  function prepareCosmicReading(chart,message,subject="me"){
    if(!chart?.bodies||!window.KnightfallCosmic)throw Error("Chart visualization is unavailable. Refresh the page.");
    latestSavedChart=chart;latestTransitChart=null;latestChartSubject=subject;
    $("#astro-overlay").hidden=true;$("#astro-transit-only").hidden=true;$("#astro-natal-back").hidden=true;
    moodSelect.value="astrology";moodSelect.dispatchEvent(new Event("change"));
    astroPreview.hidden=false;window.KnightfallCosmic.render(astroPreview,chart);
    input.value=window.KnightfallCosmic.prompt(chart,subject);
    input.dispatchEvent(new Event("input"));
    $("#astro-chart-status").textContent=message;
    input.focus();
  }
  $("#astro-compare").addEventListener("click",async event=>{
    const button=event.currentTarget,status=$("#astro-chart-status");
    const username=$("#astro-compare-username").value.trim().replace(/^@/,"");
    if(!/^[a-zA-Z0-9_.-]{2,40}$/.test(username)){status.textContent="Enter a valid member username.";return;}
    button.disabled=true;status.textContent="Checking published member chart…";
    try{
      const own=await request("/api/profile/birth-chart");
      if(!own.chart)throw Error("Create your own profile birth chart before comparing.");
      latestSavedChart=own.chart;latestTransitChart=null;latestChartSubject="me";
      const member=await request("/api/users/"+encodeURIComponent(username));
      if(!member?.birth_chart?.bodies)throw Error("This member has no birth chart available to you. They may choose to publish one in Profile Studio.");
      const other=member.birth_chart;
      const aspects=window.KnightfallCosmic.synastry(latestSavedChart,other).slice(0,24);
      const top=aspects.map(a=>"My "+a.first+" "+a.type.toLowerCase()+" their "+a.second+" (orb "+a.orb+"°)").join("; ");
      const sharedThemes=window.KnightfallCosmicLexicon?.synastryBrief?.(latestSavedChart,other,aspects)||"";
      const describe=c=>"Sun "+(c.bodies?.Sun?.sign||"unknown")+", Moon "+(c.bodies?.Moon?.sign||"unknown")+", Rising "+(c.angles?.ascendant_sign||c.ascendant_sign||"unknown");
      moodSelect.value="astrology";moodSelect.dispatchEvent(new Event("change"));
      input.value=("Explore the traditional symbolic astrological compatibility between my chart and @"+username+"'s explicitly published profile chart. Do not predict relationship outcomes or prescribe decisions. Compare communication, emotional needs, attractions, tensions, and personal agency. My Big Three: "+describe(latestSavedChart)+". Their Big Three: "+describe(other)+". Exact chart-to-chart aspects: "+top+". "+sharedThemes+" Address missing information honestly.").slice(0,3900);
      input.dispatchEvent(new Event("input"));
      astroPreview.hidden=false;
      window.KnightfallCosmic.render(astroPreview,latestSavedChart,{kind:"synastry",comparisonChart:other,comparisonLabel:"@"+username+"'s published chart"});
      $("#astro-natal-back").hidden=false;
      $("#astro-overlay").hidden=true;$("#astro-transit-only").hidden=true;
      status.textContent="Comparing your chart with @"+username+"'s published chart: "+aspects.length+" calculated aspects. Explore both planet rings and review the draft before Send.";
      input.focus();
    }catch(error){status.textContent=error.message||"Unable to compare these charts.";}
    finally{button.disabled=false;}
  });
  $("#astro-saved-chart").addEventListener("click",async event=>{
    const button=event.currentTarget;button.disabled=true;
    $("#astro-chart-status").textContent="Loading your saved chart…";
    try{
      const data=await request("/api/profile/birth-chart");
      if(!data.chart)throw Error("No saved profile chart yet. Create one in Profile Studio.");
      latestNatalUtc=null;
      prepareCosmicReading(data.chart,"Your "+(data.visible?"published":"private")+" profile chart is ready. Review the interpretation draft before sending.");
    }catch(error){$("#astro-chart-status").textContent=error.message;}
    finally{button.disabled=false;}
  });
  const astroCityInput=$("#astro-city"),astroCitySearch=$("#astro-city-search"),astroCityResults=$("#astro-city-results"),astroCityStatus=$("#astro-city-status");
  function clearAstroCity(){
    astroCityVersion++;
    window.KnightfallGeoTimezone?.clearAuto($("#astro-timezone"));
    $("#astro-latitude").value="";$("#astro-longitude").value="";
    astroCityResults.replaceChildren(new Option("Search for a city first",""));astroCityResults.disabled=true;
  }
  astroCityInput.addEventListener("input",()=>{clearAstroCity();astroCityStatus.textContent="Search, then choose the correct city.";});
  astroCityResults.addEventListener("change",()=>{
    const place=astroCityResults.selectedOptions[0];
    $("#astro-latitude").value=place?.dataset.lat||"";
    $("#astro-longitude").value=place?.dataset.lon||"";
    if($("#astro-latitude").value&&$("#astro-longitude").value){
      const suggestion=window.KnightfallGeoTimezone?.setSuggestion($("#astro-timezone"),$("#astro-latitude").value,$("#astro-longitude").value);
      $("#astro-timezone-status").textContent=suggestion?.message||"Time-zone suggestion unavailable. Enter one manually.";
    }
    astroCityStatus.textContent=$("#astro-latitude").value?"Selected: "+place.textContent:"Choose a matching location.";
  });
  astroCitySearch.addEventListener("click",async()=>{
    const query=astroCityInput.value.trim();
    if(query.length<3){astroCityStatus.textContent="Enter a city and country, at least 3 characters.";return;}
    clearAstroCity();
    const version=astroCityVersion;astroCitySearch.disabled=true;
    astroCityStatus.textContent="Searching birthplaces…";
    try{
      const params=new URLSearchParams({q:query,format:"jsonv2",addressdetails:"1",limit:"8"});
      const response=await fetch("https://nominatim.openstreetmap.org/search?"+params,{headers:{Accept:"application/json"}});
      if(!response.ok)throw Error("City search is temporarily unavailable.");
      const results=await response.json();
      if(version!==astroCityVersion)return;
      astroCityResults.replaceChildren(new Option("Select your birth city",""));
      for(const result of Array.isArray(results)?results:[]){
        const lat=Number(result.lat),lon=Number(result.lon);
        if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>66||Math.abs(lon)>180)continue;
        const option=new Option(result.display_name,String(result.place_id));
        option.dataset.lat=String(lat);option.dataset.lon=String(lon);astroCityResults.add(option);
      }
      astroCityResults.disabled=astroCityResults.options.length<2;
      astroCityStatus.textContent=astroCityResults.disabled?"No supported city found; try a different spelling.":"Choose the correct city from the results.";
    }catch(error){if(version===astroCityVersion)astroCityStatus.textContent=error.message;}
    finally{astroCitySearch.disabled=false;}
  });
  $("#astro-chart-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("#astro-chart-status");
    const button = event.currentTarget.querySelector('button[type="submit"]');
    if(astroUnknown.checked){
      const date=astroDateOnly.value.trim();
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){status.textContent="Select a valid date for a provisional chart.";return;}
      const instant=new Date(date+"T12:00:00Z");
      if(!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)!==date||instant.getUTCFullYear()<1900||instant.getUTCFullYear()>2100){status.textContent="Enter a date between 1900 and 2100.";return;}
      button.disabled=true;status.textContent="Calculating provisional planetary positions at noon UTC…";
      try{
        const chart=await request("/api/chaos/astrology/chart",{method:"POST",body:JSON.stringify({utc:instant.toISOString()})});
        chart.time_precision="unknown";
        latestNatalUtc=null;latestSavedChart=chart;latestChartSubject="me";
        $("#astro-natal-back").hidden=true;
        prepareCosmicReading(chart,"Provisional chart calculated. Review before sending. Moon and any cusp signs may differ; Rising and houses are unavailable.");
      }catch(error){status.textContent=error.message||"Provisional calculation failed.";}
      finally{button.disabled=false;}
      return;
    }
    const local = $("#astro-birth-time").value;
    const offset = Number($("#astro-utc-offset").value);
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
    if (!parts || !Number.isFinite(offset) || offset < -12 || offset > 14) { status.textContent = "Enter a valid birth date, time, and historical UTC offset."; return; }
    const [year, month, day, hour, minute] = parts.slice(1).map(Number);
    const clock = new Date(Date.UTC(year, month - 1, day, hour, minute));
    if (clock.getUTCFullYear() !== year || clock.getUTCMonth() !== month - 1 || clock.getUTCDate() !== day || clock.getUTCHours() !== hour || clock.getUTCMinutes() !== minute) { status.textContent = "That calendar date or time is invalid."; return; }
    let utc = new Date(clock.getTime() - offset * 3600000).toISOString().replace(".000Z","Z");
    const timezone=$("#astro-timezone").value.trim();
    if(timezone){
      try{
        const resolved=window.KnightfallBirthTime.resolve(local,timezone,$("#astro-fold").value);
        utc=resolved.chosen.utc;
        $("#astro-utc-offset").value=resolved.chosen.offset;
      }catch(error){status.textContent=error.message;return;}
    }
    const latText = $("#astro-latitude").value.trim();
    const lonText = $("#astro-longitude").value.trim();
    if (Boolean(latText) !== Boolean(lonText)) { status.textContent = "Enter both birth coordinates or neither."; return; }
    const latitude = Number(latText), longitude = Number(lonText);
    if (latText && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -66 || latitude > 66 || longitude < -180 || longitude > 180)) { status.textContent = "Invalid birth coordinates."; return; }
    const house_system = $("#astro-house-system").value;
    const chartRequest = latText ? {utc,latitude,longitude,house_system} : {utc};
    button.disabled = true;
    status.textContent = "Calculating approximate planetary positions…";
    try {
      const chart = await request("/api/chaos/astrology/chart", {method:"POST",body:JSON.stringify(chartRequest)});
      latestNatalUtc = utc;
      latestSavedChart=chart;latestTransitChart=null;latestChartSubject="me";
      $("#astro-overlay").hidden=true;$("#astro-transit-only").hidden=true;$("#astro-natal-back").hidden=true;
      astroPreview.hidden=false;window.KnightfallCosmic?.render(astroPreview,chart);
      const placements = Object.entries(chart.bodies || {}).map(([name,p]) => name + ": " + p.sign + " " + p.degree_in_sign.toFixed(1) + "°" + (p.retrograde ? " (retrograde)" : "")).join("; ");
      const aspects = (chart.aspects || []).slice(0,18).map(a => a.a + " " + a.type + " " + a.b + " (orb " + a.orb + "°)").join("; ");
      const houseInfo = chart.angles ? " Ascendant: " + chart.angles.ascendant_sign + " " + (chart.angles.ascendant % 30).toFixed(1) + " degrees. Midheaven: " + chart.angles.midheaven_sign + " " + (chart.angles.midheaven % 30).toFixed(1) + " degrees. House system: " + chart.angles.house_system + ". Planetary houses: "  + Object.entries(chart.house_placements || {}).map(([name,house]) => name + " house " + house).join("; ") + "." : " Ascendant and houses unavailable without birth coordinates.";
      moodSelect.value = "astrology"; moodSelect.dispatchEvent(new Event("change"));
      input.value = window.KnightfallCosmic?.prompt(chart,"me") || ("Interpret this calculated tropical chart symbolically: "+placements+". Aspects: "+aspects+". "+houseInfo);
      input.dispatchEvent(new Event("input"));
      status.textContent = "Calculated " + Object.keys(chart.bodies || {}).length + " planetary positions and " + (chart.aspects || []).length + " major aspects. Reading prepared below; review and press Send.";
      input.focus();
    } catch (error) { status.textContent = error.message || "Chart calculation failed."; }
    finally { button.disabled = false; }
  });
  function showTransitView(view){
    if(!window.KnightfallCosmic||!latestTransitChart?.bodies)throw Error("Calculate transits before changing chart views.");
    if(view==="overlay"&&latestSavedChart?.bodies){
      window.KnightfallCosmic.render(astroPreview,latestSavedChart,{kind:"overlay",transitChart:latestTransitChart});
    }else if(view==="natal"&&latestSavedChart?.bodies){
      window.KnightfallCosmic.render(astroPreview,latestSavedChart);
    }else{
      window.KnightfallCosmic.render(astroPreview,latestTransitChart,{kind:"transit"});
      view="transit";
    }
    astroPreview.hidden=false;
    $("#astro-overlay").hidden=!latestSavedChart?.bodies||view==="overlay";
    $("#astro-transit-only").hidden=view==="transit"||!latestSavedChart?.bodies;
    $("#astro-natal-back").hidden=view==="natal"||!latestSavedChart?.bodies;
  }
  $("#astro-overlay").addEventListener("click",()=>{try{showTransitView("overlay");}catch(error){$("#astro-chart-status").textContent=error.message;}});
  $("#astro-transit-only").addEventListener("click",()=>{try{showTransitView("transit");}catch(error){$("#astro-chart-status").textContent=error.message;}});
  $("#astro-natal-back").addEventListener("click",()=>{
    if(!latestSavedChart?.bodies){$("#astro-chart-status").textContent="Calculate or load your natal chart first.";return;}
    if(latestTransitChart?.bodies)showTransitView("natal");
    else{
      window.KnightfallCosmic.render(astroPreview,latestSavedChart);
      $("#astro-natal-back").hidden=true;
    }
    $("#astro-chart-status").textContent="Natal wheel restored. Derived chart data stays in this browser session.";
  });
  $("#astro-transits").addEventListener("click", async event => {
    const button = event.currentTarget, status = $("#astro-chart-status");
    button.disabled = true; status.textContent = "Calculating current planetary transits…";
    try {
      const chosen=$("#astro-transit-day").value.trim();
      let utc=new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      if(chosen){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(chosen))throw Error("Choose a valid transit date.");
        const moment=new Date(chosen+"T12:00:00Z");
        if(!Number.isFinite(moment.getTime())||moment.toISOString().slice(0,10)!==chosen)throw Error("Transit date is invalid.");
        const year=moment.getUTCFullYear();
        if(year<1900||year>2100)throw Error("Transit dates must be between 1900 and 2100.");
        utc=moment.toISOString().replace(".000Z","Z");
      }
      const body = latestNatalUtc ? {utc,natal_utc:latestNatalUtc} : {utc};
      const chart = await request("/api/chaos/astrology/chart", {method:"POST",body:JSON.stringify(body)});
      const positions = chart.transit_bodies || chart.bodies || {};
      latestTransitChart={bodies:positions};
      if(window.KnightfallCosmic){
        showTransitView(latestSavedChart?.bodies?"overlay":"transit");
      }
      const placements = Object.entries(positions).map(([name,p]) => name + " " + p.sign + " " + p.degree_in_sign.toFixed(1) + "°" + (p.retrograde ? " Rx" : "")).join("; ");
      const links=chart.transit_aspects || (latestSavedChart&&window.KnightfallCosmic?window.KnightfallCosmic.transitAspects({bodies:positions},latestSavedChart):null);
      const aspects=(links||chart.aspects||[]).slice(0,22).map(a=>links?a.transit+" "+a.type+" natal "+a.natal+" (orb "+a.orb+"°)":a.a+" "+a.type+" "+a.b+" (orb "+a.orb+"°)").join("; ");
      const transitMeanings=latestSavedChart?.bodies&&Array.isArray(links)?window.KnightfallCosmicLexicon?.transitBrief?.(latestSavedChart,{bodies:positions},links)||"":".";
      moodSelect.value = "astrology"; moodSelect.dispatchEvent(new Event("change"));
      input.value = ("Interpret these calculated tropical transits symbolically, not as scientific predictions. "+(latestChartSubject==="member"?"These are transits to another member\u0027s publicly shared natal placements, not mine. ":"")+"UTC: "+utc+". Transit positions: "+placements+". "+(links?"Transit-to-natal aspects: ":"Current aspects: ")+aspects+". "+transitMeanings+" Discuss timing uncertainty and grounded reflection; do not claim fixed outcomes.").slice(0,3900);
      input.dispatchEvent(new Event("input"));
      status.textContent = (chosen?"Transit view for "+chosen+" at 12:00 UTC. ":"Live transit view. ")+(links?"Natal aspect overlay displayed in mint and pink. Review and Send.":"Load a natal chart to add overlay comparisons.");
      input.focus();
    } catch (error) { status.textContent = error.message || "Transit calculation failed."; }
    finally { button.disabled = false; }
  });
  astroTools.addEventListener("click", event => { const button = event.target.closest("[data-astro-prompt]"); if (!button || busy || adminViewing) return; const prompt = astrologyPrompts[button.dataset.astroPrompt]; if (!prompt) return; input.value = prompt; input.dispatchEvent(new Event("input")); input.focus(); });
  input.addEventListener("input", () => {
    $("#char-count").textContent = input.value.length + " / 4000";
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
    saveDraft();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  async function streamChaosReply(conversationId,message,mood,onDelta,image){
    const response=await fetch(API+"/api/chaos/chat",{method:"POST",credentials:"include",cache:"no-store",headers:{"content-type":"application/json","accept":"text/event-stream"},body:JSON.stringify({conversation_id:conversationId,message,mood,companion:companionVariant,stream:true,image:image||undefined})});
    if(!response.ok){const data=await response.json().catch(()=>({}));if(response.status===502&&data.error==="Streaming is temporarily unavailable. Try sending again.")return request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:conversationId,message,mood,companion:companionVariant,image:image||undefined})});throw Error(data.error||"Streaming request failed ("+response.status+").");}
    if(!response.body)throw Error("Your browser does not support streamed replies.");
    const reader=response.body.getReader(),decoder=new TextDecoder();
    let pending="",reply="",done=false;
    function handleEvent(block){
      const lines=block.split("\n"),type=(lines.find(line=>line.startsWith("event:"))||"").slice(6).trim();
      const raw=lines.filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trim()).join("\n");
      if(!raw)return;
      let payload;try{payload=JSON.parse(raw)}catch{return}
      if(type==="delta"){reply+=payload.text||"";onDelta(reply);}
      if(type==="error")throw Error(payload.error||"Stream interrupted.");
      if(type==="done")done=true;
    }
    try{
      while(true){
        const chunk=await reader.read();if(chunk.done)break;
        pending+=decoder.decode(chunk.value,{stream:true}).replaceAll("\r\n","\n");
        let index;while((index=pending.indexOf("\n\n"))>=0){const block=pending.slice(0,index);pending=pending.slice(index+2);handleEvent(block);}
      }
      pending+=decoder.decode();
      if(pending.trim())handleEvent(pending.trim());
      if(!done)throw Error("Connection closed before the reply was saved.");
      return {reply,mood};
    }finally{reader.releaseLock();}
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim() || (chatPhoto?.hasImage()?"Describe this image, noting what is visible and what is uncertain.":"");
    const sendingPhoto=chatPhoto?.hasImage()===true;
    if (adminViewing) { showError("Administrator archive is read-only. Open one of your own conversations to chat."); return; }
    if (!message || busy) return;
    busy = true; sendButton.disabled = true; chatPhoto?.setBusy(true); showError("");setStreaming(true);
    input.value = ""; input.dispatchEvent(new Event("input"));
    const displayed=message+(sendingPhoto?"\n📷 Image attached (original not saved)":"");
    addMessage("user",displayed,"You");
    const typing = document.createElement("div"); typing.className = "typing"; typing.setAttribute("role","status"); typing.textContent = "Miss Chaos is thinking…";const face=document.createElement("img");face.src="/assets/miss-chaos/miss-chaos-avatar.svg?v=20261027c";face.alt="";face.width=32;face.height=32;typing.prepend(face); messagesEl.append(typing); scrollToBottom();
    let streamedArticle=null;
    try {
      if (!activeConversation) {
        const created = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
        activeConversation = created.conversation.id;
      }
      const imageData=sendingPhoto?await chatPhoto.prepare():null;
      const result=await streamChaosReply(activeConversation,message,moodSelect.value,partial=>{
        const follow=nearBottom();
        if(!streamedArticle){typing.remove();streamedArticle=addMessage("assistant",partial,"Miss Chaos · "+(moodNames[moodSelect.value]||"Default"));}
        else streamedArticle.querySelector(".message-content").textContent=partial;
        if(follow)scrollToBottom();else syncJump();
      },imageData);
      chatPhoto?.clear();
      typing.remove();
      if(!streamedArticle)addMessage("assistant",result.reply,"Miss Chaos · "+(moodNames[result.mood]||"Default"));
      else {const follow=nearBottom();renderReplyText(streamedArticle.querySelector(".message-content"),result.reply);if(follow)scrollToBottom();else syncJump();}
      statusEl.textContent = "Connected · Miss Chaos is listening";
      if (speakReplies && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result.reply);
        utterance.rate = 1.02; window.speechSynthesis.speak(utterance);
      }
      await refreshConversations().catch(() => {});
    } catch (error) {
      typing.remove();
      if (streamedArticle) streamedArticle.remove();
      showError(error.message || "Miss Chaos couldn't answer just now.");
      statusEl.textContent = "Waiting for a working AI connection";
      // The server may have persisted the request even when the response failed.
      // Keep the unsent text recoverable without encouraging an accidental duplicate send.
      const optimistic = [...messagesEl.querySelectorAll(".message.user")].at(-1);
      if (optimistic?.querySelector(".message-content")?.textContent === displayed) optimistic.remove();
      const newerDraft=input.value;
      if(!newerDraft.trim()){input.value=message;input.dispatchEvent(new Event("input"));}
      showError((error.message || "Reply unavailable.") + " Check the conversation history before retrying, since the server may have saved the message.");
      if(newerDraft.trim()){const recover=document.createElement("button");recover.type="button";recover.className="message-copy";recover.textContent="Copy attempted message";recover.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(message);recover.textContent="Copied";}catch{recover.textContent="Copy unavailable";}});errorEl.append(document.createTextNode(" Your newer draft is unchanged. "),recover);}
    } finally { busy = false;setStreaming(false); sendButton.disabled = adminViewing; chatPhoto?.setBusy(false);syncJump(); }
  });
  try{speakReplies=localStorage.getItem("missChaosSpeakReplies")==="1";}catch{}
  $("#speak-toggle").setAttribute("aria-pressed",String(speakReplies));
  $("#speak-toggle").addEventListener("click", () => {
    speakReplies = !speakReplies;
    try{localStorage.setItem("missChaosSpeakReplies",speakReplies?"1":"0")}catch{}
    $("#speak-toggle").setAttribute("aria-pressed", String(speakReplies));
    $("#speak-toggle").title = speakReplies ? "Spoken replies on" : "Toggle spoken replies";
    if (!speakReplies && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (!("speechSynthesis" in window)) { speakReplies = false; showError("Spoken replies aren't supported by this browser."); }
  });
  let activeRecognition=null;
  $("#voice-input").addEventListener("click", () => {
    const button=$("#voice-input");
    if(activeRecognition){activeRecognition.stop();return;}
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { showError("Voice input isn't supported in this browser. You can still type messages."); return; }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    const baseText=input.value.trim();
    recognition.onresult = event => {
      let finalText="",interim="";
      for(let i=0;i<event.results.length;i++){
        const text=event.results[i][0]?.transcript||"";
        if(event.results[i].isFinal)finalText+=text+" ";
        else interim+=text;
      }
      input.value=[baseText,(finalText+interim).trim()].filter(Boolean).join(" ");
      input.dispatchEvent(new Event("input"));
    };
    recognition.onerror = event => {if(event.error!=="aborted")showError("Microphone: "+(event.error||"speech recognition failed")+". Check permission and try again.");};
    recognition.onend = () => {
      if(activeRecognition===recognition)activeRecognition=null;
      button.setAttribute("aria-pressed","false");
      button.setAttribute("aria-label","Dictate a message");
      button.title="Dictate a message";
      input.focus();
    };
    try{
      recognition.start();
      activeRecognition=recognition;
      button.setAttribute("aria-pressed","true");
      button.setAttribute("aria-label","Stop dictation");
      button.title="Stop dictation";
      showError("");
    }catch{activeRecognition=null;showError("Voice input couldn't start.");}
  });
  memoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const memory = memoryInput.value.trim();
    if (!memory || memory.length > 500) { showMemoryStatus("Memory must be between 1 and 500 characters.", true); return; }
    const submit = memoryForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    showMemoryStatus("");
    try {
      await request("/api/chaos/memories", {method:"POST",body:JSON.stringify({memory,category:memoryCategory.value})});
      memoryInput.value = "";
      showMemoryStatus("Saved. Miss Chaos can now use this in future conversations.");
      await refreshMemories();
    } catch (error) { showMemoryStatus(error.message, true); }
    finally { submit.disabled = false; }
  });
  init();
})();
