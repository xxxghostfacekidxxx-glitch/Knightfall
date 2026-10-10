(() => {
  "use strict";
  const API = "https://api.ash-fall.com";
  const $ = (selector) => document.querySelector(selector);
  const messagesEl = $("#chat-messages"), listEl = $("#conversation-list");
  const form = $("#chat-form"), input = $("#message-input"), sendButton = $("#send-button");
  const errorEl = $("#chat-error"), statusEl = $("#engine-status"), moodSelect = $("#mood");
  let activeConversation = null, busy = false, speakReplies = false;
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
    if (!items.length) {
      const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No conversations yet. Make some trouble."; listEl.append(empty); return;
    }
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "conversation-row";
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "conversation-item" + (item.id === activeConversation ? " active" : "");
      openButton.textContent = item.title || "Untitled conversation";
      openButton.title = openButton.textContent;
      openButton.addEventListener("click", () => openConversation(item.id));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "conversation-delete";
      deleteButton.textContent = "×";
      deleteButton.title = "Delete conversation";
      deleteButton.setAttribute("aria-label", "Delete conversation: " + openButton.textContent);
      deleteButton.addEventListener("click", async () => {
        if (busy) { showError("Wait until Miss Chaos finishes replying before deleting a conversation."); return; }
        if (!window.confirm("Permanently delete this conversation and its messages? This cannot be undone.")) return;
        deleteButton.disabled = true;
        showError("");
        try {
          await request("/api/chaos/conversations/" + encodeURIComponent(item.id), {method:"DELETE"});
          const wasActive = activeConversation === item.id;
          if (wasActive) activeConversation = null;
          const remaining = await refreshConversations();
          if (wasActive) {
            if (remaining.length) await openConversation(remaining[0].id);
            else showWelcome();
          }
        } catch (error) {
          showError(error.message || "Couldn't delete this conversation.");
          deleteButton.disabled = false;
        }
      });
      row.append(openButton, deleteButton);
      listEl.append(row);
    }
  }
  async function refreshConversations() {
    const data = await request("/api/chaos/conversations");
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
    showError("");
    const data = await request("/api/chaos/conversations/" + encodeURIComponent(id) + "/messages");
    activeConversation = id;
    messagesEl.replaceChildren();
    if (!(data.messages || []).length) showWelcome();
    else for (const message of data.messages) addMessage(message.role, message.content, message.role === "assistant" ? "Miss Chaos · " + (moodNames[message.mood] || "Default") : "You");
    const items = await request("/api/chaos/conversations");
    renderConversationList(items.conversations || []);
    scrollToBottom();
  }
  async function newConversation() {
    showError("");
    const data = await request("/api/chaos/conversations", {method:"POST",body:"{}"});
    activeConversation = data.conversation.id;
    showWelcome();
    await refreshConversations();
    input.focus();
  }
  async function init() {
    try {
      statusEl.textContent = "Checking connection…";
      const me = await request("/api/auth/me");
      if (!me.user) { location.href = "/auth.html?next=" + encodeURIComponent("/miss-chaos.html"); return; }
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
  $("#new-chat").addEventListener("click", async () => { try { await newConversation(); } catch (e) { showError(e.message); } });
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
