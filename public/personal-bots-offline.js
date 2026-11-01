(() => {
"use strict";
const KEY = "knightfall-offline-personal-bots-v1";
const $ = id => document.getElementById(id);
let state = {bots: [], selected: ""};
const status = message => { $("status").textContent = message; };
const id = () => crypto.randomUUID();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.bots) && data.bots.length <= 100) state = data;
    }
  } catch { status("Could not read local storage."); }
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { status("Device storage is full or unavailable. Export your data."); return false; }
}
const current = () => state.bots.find(bot => bot.id === state.selected);
function render() {
  const selector = $("bots"); selector.replaceChildren();
  for (const bot of state.bots) {
    const option = document.createElement("option"); option.value = bot.id; option.textContent = bot.name; selector.append(option);
  }
  const bot = current();
  selector.value = bot?.id || "";
  $("name").value = bot?.name || "";
  $("persona").value = bot?.persona || "";
  const history = $("history"); history.replaceChildren();
  if (!bot) {
    const p = document.createElement("p"); p.textContent = "Create a local bot to start."; history.append(p);
  } else {
    for (const entry of bot.history || []) {
      const p = document.createElement("p"); p.textContent = (entry.role === "user" ? "You: " : bot.name + ": ") + entry.text; history.append(p);
    }
  }
  history.scrollTop = history.scrollHeight;
}
function reply(bot, message) {
  const text = message.toLowerCase();
  if (/\b(hello|hey|hi)\b/.test(text)) return "Hey. I'm " + bot.name + ". I'm here with you, even without a connection.";
  if (/\b(help|what can you do)\b/.test(text)) return "Offline I can keep our conversation and your notes on this device. I cannot search the web or reason like a full AI model yet.";
  if (/\b(thank|thanks)\b/.test(text)) return "You're welcome. I'm still here.";
  if (/\b(note|remember)\b/.test(text)) return "I saved that message in this device's conversation history. I can't reliably interpret or organize memories without a language model.";
  const persona = bot.persona.toLowerCase();
  const voice = /warm|gentle|supportive/.test(persona) ? "I'm listening. " : /sarcastic|witty|snark/.test(persona) ? "Well, that's a situation. " : /formal|precise/.test(persona) ? "Message recorded. " : "";
  return voice + "I hear you: " + message.slice(0, 120) + (message.length > 120 ? "…" : "") + "\n\nI'm running in basic offline mode. Your message is saved here for when you're ready to continue.";
}
$("save").addEventListener("click", () => {
  const name = $("name").value.trim().slice(0, 60);
  const persona = $("persona").value.trim().slice(0, 4000);
  if (!name) return status("Give your bot a name.");
  let bot = current();
  if (!bot) {
    if (state.bots.length >= 20) return status("This device's local bot limit is 20.");
    bot = {id:id(), name, persona, history:[]}; state.bots.push(bot); state.selected = bot.id;
  } else { bot.name = name; bot.persona = persona; }
  if (persist()) status("Saved locally on this device.");
  render();
});
$("bots").addEventListener("change", e => { state.selected = e.target.value; persist(); render(); });
$("delete").addEventListener("click", () => {
  if (!current() || !confirm("Permanently delete this device's copy of the bot and its chat?")) return;
  state.bots = state.bots.filter(bot => bot.id !== state.selected);
  state.selected = state.bots[0]?.id || ""; persist(); render(); status("Local bot deleted.");
});
$("chat").addEventListener("submit", event => {
  event.preventDefault();
  const bot = current(), message = $("message").value.trim();
  if (!bot) return status("Save a local bot first.");
  if (!message) return;
  bot.history.push({role:"user",text:message}, {role:"assistant",text:reply(bot,message)});
  bot.history = bot.history.slice(-200);
  if (persist()) { $("message").value = ""; status("Conversation saved locally."); }
  render();
});
$("clear").addEventListener("click", () => {
  const bot = current(); if (!bot || !confirm("Clear this bot's local conversation?")) return;
  bot.history = []; persist(); render();
});
$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({version:1,bots:state.bots},null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = "knightfall-offline-bots.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("import").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  if (file.size > 2_000_000) return status("Import exceeds the 2 MB limit.");
  try {
    const data = JSON.parse(await file.text());
    if (data.version !== 1 || !Array.isArray(data.bots) || data.bots.length > 20) throw Error("Unsupported backup.");
    const bots = data.bots.map(bot => {
      if (typeof bot.name !== "string" || typeof bot.persona !== "string" || !Array.isArray(bot.history)) throw Error("Invalid bot.");
      return {id:id(),name:bot.name.slice(0,60),persona:bot.persona.slice(0,4000),history:bot.history.slice(-200).map(entry => {
        if (!["user","assistant"].includes(entry.role) || typeof entry.text !== "string") throw Error("Invalid chat.");
        return {role:entry.role,text:entry.text.slice(0,3000)};
      })};
    });
    if (!confirm("Replace all locally saved bots with this backup?")) return;
    state = {bots,selected:bots[0]?.id || ""};persist();render();status("Imported local backup.");
  } catch (error) { status("Import failed: " + error.message); }
  finally { event.target.value = ""; }
});
load(); state.selected = state.bots.some(bot => bot.id === state.selected) ? state.selected : state.bots[0]?.id || ""; render();
})();
