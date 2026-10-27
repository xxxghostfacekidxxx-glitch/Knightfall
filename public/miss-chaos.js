(() => {
  "use strict";
  const API = "https://api.ash-fall.com";
  const $ = (selector) => document.querySelector(selector);
  const messagesEl = $("#chat-messages"), listEl = $("#conversation-list");
  const form = $("#chat-form"), input = $("#message-input"), sendButton = $("#send-button");
  const conversationSearch = $("#conversation-search");
  let conversationSearchTimer = null;
  const errorEl = $("#chat-error"), statusEl = $("#engine-status"), moodSelect = $("#mood");
  let activeConversation = null, busy = false, speakReplies = false, showDeleted = false, adminViewing = false, isAdmin = false;
  let conversationLoadVersion = 0, conversationListVersion = 0;
  const drafts = new Map();
  function saveDraft() { if (!adminViewing) drafts.set(activeConversation || "new", input.value); }
  function restoreDraft() { input.value = drafts.get(activeConversation || "new") || ""; input.dispatchEvent(new Event("input")); }
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
  function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
  function addMessage(role, content, label) {
    const welcome = messagesEl.querySelector(".welcome-card");
    if (welcome) welcome.remove();
    const wasNearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 140;
    const article = document.createElement("article");
    article.className = "message " + (role === "user" ? "user" : "assistant");
    const heading = document.createElement("div");
    heading.className = "message-label";
    heading.textContent = label || (role === "user" ? "You" : "Miss Chaos");
    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = content;
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const copy = document.createElement("button");
    copy.type = "button"; copy.className = "message-copy";
    copy.textContent = "Copy"; copy.setAttribute("aria-label", "Copy " + (role === "user" ? "your" : "Miss Chaos") + " message");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text.textContent);
        copy.textContent = "Copied";
        setTimeout(() => { if (copy.isConnected) copy.textContent = "Copy"; }, 1600);
      } catch { showError("Copy failed. Select the message text to copy it manually."); }
    });
    actions.append(copy);
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
    if (wasNearBottom || role === "user") scrollToBottom();
    return article;
  }
  function showWelcome() {
    messagesEl.innerHTML = '<div class="welcome-card"><div class="welcome-symbol">✦</div><p class="eyebrow">THE STATIC IS CLEARING</p><h2>Well, well. You found me.</h2><p>I\'m Miss Chaos. Bring me a question, a half-formed idea, a problem to untangle, or the weird thought keeping you awake. I can do sincere. I can do sarcastic. Sometimes both, because apparently that\'s useful.</p><p class="welcome-hint">Your first message starts a conversation. Your saved chats stay attached to your account.</p></div>';
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
    const version = ++conversationLoadVersion;
    showError("");
    const data = await request("/api/chaos/conversations/" + encodeURIComponent(id) + "/messages");
    if (version !== conversationLoadVersion) return;
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;
    activeConversation = id;
    messagesEl.replaceChildren();
    if (!(data.messages || []).length) showWelcome();
    else for (const message of data.messages) addMessage(message.role, message.content, message.role === "assistant" ? "Miss Chaos · " + (moodNames[message.mood] || "Default") : "You");
    restoreDraft();
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
    ++conversationLoadVersion;
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;showError("");
    const data = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
    activeConversation = data.conversation.id;
    showWelcome();
    restoreDraft();
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
    saveDraft(); ++conversationLoadVersion;
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
      if (!me.user) { location.href = "/auth.html?next=" + encodeURIComponent("/miss-chaos.html"); return; }
      isAdmin = me.user.role === "admin";
      if (isAdmin) { $("#admin-chaos-archive").hidden = false; await refreshAdminArchive(); }
      const [health, conversations] = await Promise.all([
        fetch(API + "/health", {cache:"no-store"}).then(r => r.ok ? r.json() : null).catch(() => null),
        refreshConversations(),
        refreshMemories()
      ]);
      statusEl.textContent = health?.ok ? "Connected · AI model availability checked on send" : "API connection needs attention";
      if (conversations.length) await openConversation(conversations[0].id);
      else showWelcome();
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
  let latestNatalUtc = null;
  $("#astro-chart-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = $("#astro-chart-status");
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const local = $("#astro-birth-time").value;
    const offset = Number($("#astro-utc-offset").value);
    const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
    if (!parts || !Number.isFinite(offset) || offset < -12 || offset > 14) { status.textContent = "Enter a valid birth date, time, and historical UTC offset."; return; }
    const [year, month, day, hour, minute] = parts.slice(1).map(Number);
    const clock = new Date(Date.UTC(year, month - 1, day, hour, minute));
    if (clock.getUTCFullYear() !== year || clock.getUTCMonth() !== month - 1 || clock.getUTCDate() !== day || clock.getUTCHours() !== hour || clock.getUTCMinutes() !== minute) { status.textContent = "That calendar date or time is invalid."; return; }
    const utc = new Date(clock.getTime() - offset * 3600000).toISOString().replace(".000Z","Z");
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
      const placements = Object.entries(chart.bodies || {}).map(([name,p]) => name + ": " + p.sign + " " + p.degree_in_sign.toFixed(1) + "°" + (p.retrograde ? " (retrograde)" : "")).join("; ");
      const aspects = (chart.aspects || []).slice(0,18).map(a => a.a + " " + a.type + " " + a.b + " (orb " + a.orb + "°)").join("; ");
      const houseInfo = chart.angles ? " Ascendant: " + chart.angles.ascendant_sign + " " + (chart.angles.ascendant % 30).toFixed(1) + " degrees. Midheaven: " + chart.angles.midheaven_sign + " " + (chart.angles.midheaven % 30).toFixed(1) + " degrees. House system: " + chart.angles.house_system + ". Planetary houses: "  + Object.entries(chart.house_placements || {}).map(([name,house]) => name + " house " + house).join("; ") + "." : " Ascendant and houses unavailable without birth coordinates.";
      moodSelect.value = "astrology"; moodSelect.dispatchEvent(new Event("change"));
      input.value = "Please interpret my approximate Western tropical birth chart in depth. UTC: " + chart.utc + ". Placements: " + placements + ". Major aspects (up to 4° orb): " + aspects + ". Explain strengths, challenges, patterns, and the chart as a whole. " + houseInfo + " Treat astrology as symbolic interpretation, and clearly state the limitations of these approximate calculations.";
      input.dispatchEvent(new Event("input"));
      status.textContent = "Calculated " + Object.keys(chart.bodies || {}).length + " planetary positions and " + (chart.aspects || []).length + " major aspects. Reading prepared below; review and press Send.";
      input.focus();
    } catch (error) { status.textContent = error.message || "Chart calculation failed."; }
    finally { button.disabled = false; }
  });
  $("#astro-transits").addEventListener("click", async event => {
    const button = event.currentTarget, status = $("#astro-chart-status");
    button.disabled = true; status.textContent = "Calculating current planetary transits…";
    try {
      const utc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
      const body = latestNatalUtc ? {utc,natal_utc:latestNatalUtc} : {utc};
      const chart = await request("/api/chaos/astrology/chart", {method:"POST",body:JSON.stringify(body)});
      const positions = chart.transit_bodies || chart.bodies || {};
      const placements = Object.entries(positions).map(([name,p]) => name + " " + p.sign + " " + p.degree_in_sign.toFixed(1) + "°" + (p.retrograde ? " Rx" : "")).join("; ");
      const aspects = (chart.transit_aspects || chart.aspects || []).slice(0,22).map(a => chart.transit_aspects ? a.transit + " " + a.type + " natal " + a.natal + " (orb " + a.orb + "°)" : a.a + " " + a.type + " " + a.b + " (orb " + a.orb + "°)").join("; ");
      moodSelect.value = "astrology"; moodSelect.dispatchEvent(new Event("change"));
      input.value = "Interpret these approximate planetary transits in depth as symbolic astrology, not scientific predictions. UTC: " + utc + ". Transit positions: " + placements + ". " + (latestNatalUtc ? "Birth UTC: " + latestNatalUtc + ". Transit-to-natal aspects: " : "Current planetary aspects: ") + aspects + ". Please explain themes, timing uncertainty, and practical reflection without making deterministic predictions or claiming exact ephemeris accuracy.";
      input.dispatchEvent(new Event("input"));
      status.textContent = latestNatalUtc ? "Natal transit comparison prepared. Review and Send." : "Current planetary transit reading prepared. Calculate your natal chart first for personal transit aspects.";
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
  async function streamChaosReply(conversationId,message,mood,onDelta){
    const response=await fetch(API+"/api/chaos/chat",{method:"POST",credentials:"include",cache:"no-store",headers:{"content-type":"application/json","accept":"text/event-stream"},body:JSON.stringify({conversation_id:conversationId,message,mood,stream:true})});
    if(!response.ok){const data=await response.json().catch(()=>({}));if(response.status===502&&data.error==="Streaming is temporarily unavailable. Try sending again.")return request("/api/chaos/chat",{method:"POST",body:JSON.stringify({conversation_id:conversationId,message,mood})});throw Error(data.error||"Streaming request failed ("+response.status+").");}
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
    const message = input.value.trim();
    if (adminViewing) { showError("Administrator archive is read-only. Open one of your own conversations to chat."); return; }
    if (!message || busy) return;
    busy = true; sendButton.disabled = true; showError("");
    input.value = ""; input.dispatchEvent(new Event("input"));
    addMessage("user", message, "You");
    const typing = document.createElement("div"); typing.className = "typing"; typing.setAttribute("role","status"); typing.textContent = "Miss Chaos is thinking…"; messagesEl.append(typing); scrollToBottom();
    let streamedArticle=null;
    try {
      if (!activeConversation) {
        const created = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
        activeConversation = created.conversation.id;
      }
      const result=await streamChaosReply(activeConversation,message,moodSelect.value,partial=>{
        if(!streamedArticle){typing.remove();streamedArticle=addMessage("assistant",partial,"Miss Chaos · "+(moodNames[moodSelect.value]||"Default"));}
        else streamedArticle.querySelector(".message-content").textContent=partial;
        if(messagesEl.scrollHeight-messagesEl.scrollTop-messagesEl.clientHeight<180)scrollToBottom();
      });
      typing.remove();
      if(!streamedArticle)addMessage("assistant",result.reply,"Miss Chaos · "+(moodNames[result.mood]||"Default"));
      else streamedArticle.querySelector(".message-content").textContent=result.reply;
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
      if (optimistic?.querySelector(".message-content")?.textContent === message) optimistic.remove();
      input.value = message; input.dispatchEvent(new Event("input"));
      showError((error.message || "Reply unavailable.") + " Check the conversation history before retrying, since the server may have saved the message.");
    } finally { busy = false; sendButton.disabled = adminViewing; if (!adminViewing) input.focus(); }
  });
  speakReplies=localStorage.getItem("missChaosSpeakReplies")==="1";
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
