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
  const moodNames = {default:"Default",playful:"Playful",dark:"Dark",supportive:"Supportive",philosophical:"Philosophical",custom:"Custom"};

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
    const article = document.createElement("article");
    article.className = "message " + (role === "user" ? "user" : "assistant");
    const heading = document.createElement("div");
    heading.className = "message-label";
    heading.textContent = label || (role === "user" ? "You" : "Miss Chaos");
    const text = document.createElement("div");
    text.className = "message-content";
    text.textContent = content;
    article.append(heading, text);
    messagesEl.append(article);
    scrollToBottom();
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
    const data = await request("/api/chaos/conversations" + suffix);
    renderConversationList(data.conversations || []);
    return data.conversations || [];
  }
  const memoryListEl = $("#memory-list"), memoryCountEl = $("#memory-count");
  const memoryForm = $("#memory-form"), memoryInput = $("#memory-input");
  const memoryCategory = $("#memory-category"), memoryStatus = $("#memory-status");
  const memoryCategoryNames = {personal:"Personal",preference:"Preference",project:"Project",other:"Other"};
  function showMemoryStatus(message, isError = false) {
    memoryStatus.textContent = message;
    memoryStatus.classList.toggle("error", isError);
    memoryStatus.hidden = !message;
  }
  async function refreshMemories() {
    const data = await request("/api/chaos/memories");
    const memories = data.memories || [];
    memoryCountEl.textContent = memories.length + " / 100";
    memoryListEl.replaceChildren();
    if (!memories.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Nothing saved yet. Add a detail above when you want me to remember it.";
      memoryListEl.append(empty);
      return memories;
    }
    for (const memory of memories) {
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
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;showError("");
    const data = await request("/api/chaos/conversations/" + encodeURIComponent(id) + "/messages");
    activeConversation = id;
    messagesEl.replaceChildren();
    if (!(data.messages || []).length) showWelcome();
    else for (const message of data.messages) addMessage(message.role, message.content, message.role === "assistant" ? "Miss Chaos · " + (moodNames[message.mood] || "Default") : "You");
    await refreshConversations();
    scrollToBottom();
  }
  async function newConversation() {
    adminViewing=false;input.disabled=false;sendButton.disabled=busy;showError("");
    const data = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
    activeConversation = data.conversation.id;
    showWelcome();
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
  moodSelect.value = localStorage.getItem("missChaosMood") || "default";
  moodSelect.addEventListener("change", () => localStorage.setItem("missChaosMood", moodSelect.value));
  input.addEventListener("input", () => {
    $("#char-count").textContent = input.value.length + " / 4000";
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (adminViewing) { showError("Administrator archive is read-only. Open one of your own conversations to chat."); return; }
    if (!message || busy) return;
    busy = true; sendButton.disabled = true; showError("");
    input.value = ""; input.dispatchEvent(new Event("input"));
    addMessage("user", message, "You");
    const typing = document.createElement("div"); typing.className = "typing"; typing.textContent = "Miss Chaos is thinking…"; messagesEl.append(typing); scrollToBottom();
    try {
      if (!activeConversation) {
        const created = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
        activeConversation = created.conversation.id;
      }
      const result = await request("/api/chaos/chat", {method:"POST",body:JSON.stringify({
        conversation_id:activeConversation, message, mood:moodSelect.value
      })});
      typing.remove();
      addMessage("assistant", result.reply, "Miss Chaos · " + (moodNames[result.mood] || "Default"));
      statusEl.textContent = "Connected · Miss Chaos is listening";
      if (speakReplies && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(result.reply);
        utterance.rate = 1.02; window.speechSynthesis.speak(utterance);
      }
      await refreshConversations();
    } catch (error) {
      typing.remove();
      showError(error.message || "Miss Chaos couldn't answer just now.");
      statusEl.textContent = "Waiting for a working AI connection";
      input.value = message; input.dispatchEvent(new Event("input"));
    } finally { busy = false; sendButton.disabled = false; input.focus(); }
  });
  $("#speak-toggle").addEventListener("click", () => {
    speakReplies = !speakReplies;
    $("#speak-toggle").setAttribute("aria-pressed", String(speakReplies));
    $("#speak-toggle").title = speakReplies ? "Spoken replies on" : "Toggle spoken replies";
    if (!speakReplies && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (!("speechSynthesis" in window)) { speakReplies = false; showError("Spoken replies aren't supported by this browser."); }
  });
  $("#voice-input").addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { showError("Voice input isn't supported in this browser. You can still type messages."); return; }
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    $("#voice-input").disabled = true; showError("");
    recognition.onresult = (event) => { input.value = (input.value ? input.value + " " : "") + event.results[0][0].transcript; input.dispatchEvent(new Event("input")); input.focus(); };
    recognition.onerror = () => showError("Couldn't capture speech. Check microphone permission and try again.");
    recognition.onend = () => { $("#voice-input").disabled = false; };
    try { recognition.start(); } catch { $("#voice-input").disabled = false; showError("Voice input couldn't start."); }
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
