import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const bubbles=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");
const styles=readFileSync(new URL("../public/chat-bubbles.css",import.meta.url),"utf8");
const ai=readFileSync(new URL("../public/miss-chaos-presence.js",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../public/nav.js",import.meta.url),"utf8");
const inline=[...inbox.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean).pop();
assert.ok(inline,"Messages inline controller exists");
for(const source of [inline,bubbles,ai,navigation])new vm.Script(source);

test("inbox drafts survive a reload for the signed-in account",()=>{
  const start=inline.indexOf("const conversationDrafts=new Map();");
  const end=inline.indexOf("\nlet composerEpoch=",start);
  assert.ok(start>=0&&end>start,"draft helpers are defined");
  const keys=new Map();
  const storage={
    getItem:k=>keys.get(k)||null,
    setItem:(k,v)=>keys.set(k,v)
  };
  const ctx=vm.createContext({currentUser:{id:10},sessionStorage:storage});
  vm.runInContext(inline.slice(start,end),ctx);
  ctx.rememberConversationDraft(42,"Halfway through something important");
  assert.match(keys.get("kf-inbox-drafts-10"),/Halfway through/);
  ctx.loadConversationDrafts();
  assert.equal(vm.runInContext("conversationDrafts.get(42)",ctx),"Halfway through something important");
  ctx.rememberConversationDraft(42,"");
  assert.equal(vm.runInContext("conversationDrafts.has(42)",ctx),false);
  ctx.loadConversationDrafts();
  assert.equal(vm.runInContext("conversationDrafts.has(42)",ctx),false);
  ctx.rememberConversationDraft(44,"Private for account 10");
  ctx.currentUser={id:11};
  ctx.loadConversationDrafts();
  assert.equal(vm.runInContext("conversationDrafts.size",ctx),0,"other account cannot see earlier account drafts");
});
test("draft storage is bounded and keyed by conversation ID",()=>{
  const start=inline.indexOf("const conversationDrafts=new Map();");
  const end=inline.indexOf("\nlet composerEpoch=",start);
  let record="";
  const ctx=vm.createContext({currentUser:{id:1},sessionStorage:{getItem:()=>null,setItem:(_k,v)=>{record=v;}}});
  vm.runInContext(inline.slice(start,end),ctx);
  ctx.rememberConversationDraft(5,"x".repeat(10000));
  assert.equal(JSON.parse(record)[0][1].length,4000);
  ctx.rememberConversationDraft(0,"invalid");
  assert.equal(JSON.parse(record).length,1);
});
test("new-message creation no longer discards the previous active chat draft",()=>{
  assert.doesNotMatch(inline,/composeDialog\.close\(\);currentId=Number\(d\.id\)/);
  assert.match(inline,/const newId=Number\(d\.id\);await loadConversations\(\{openSelected:false\}\);await openConversation\(newId\)/);
  assert.match(inline,/rememberConversationDraft\(previousId,\$\("#body"\)\.value\)/);
  assert.match(inline,/!e\.isComposing/);
  assert.match(inline,/Draft · /);
});
test("chat heads expose recent-chat back navigation and searchable conversations",()=>{
  assert.match(bubbles,/id="kf-chat-back"/);
  assert.match(bubbles,/addEventListener\("click",showList\)/);
  assert.match(bubbles,/id="kf-chat-search"/);
  assert.match(bubbles,/addEventListener\("input",renderRecent\)/);
  assert.match(styles,/#kf-chat-heads #kf-chat-search/);
});
test("floating chats retain per-conversation drafts and do not overwrite newer edits",()=>{
  assert.match(bubbles,/const draftKey="kf-chat-drafts-"\+userId/);
  assert.match(bubbles,/if\(state\.active\)rememberDraft\(state\.active,input\.value\)/);
  assert.match(bubbles,/if\(state\.active===id&&input\.value===original\)/);
  assert.match(bubbles,/let sent=false/);
  assert.match(bubbles,/Message sent, but chat refresh failed/);
  assert.match(bubbles,/if\(state\.active===id\)/);
  assert.match(bubbles,/textContent=text/);
});
test("chat heads avoid unnecessary minimized polling and redundant thread redraws",()=>{
  assert.match(bubbles,/Date\.now\(\)-lastListRefresh<60000/);
  assert.match(bubbles,/if\(state\.lastThreadKey===fingerprint\)/);
  assert.match(bubbles,/window\.addEventListener\("pagehide",event=>\{if\(!event\.persisted\)/);
});
test("Miss Chaos, memo pad and member chats coordinate their floating panels",()=>{
  assert.match(bubbles,/detail:\{panel:"member-chat"\}/);
  assert.match(bubbles,/event\.detail\?\.panel!=="member-chat"/);
  assert.match(ai,/detail:\{panel:"miss-chaos"\}/);
  assert.match(ai,/detail:\{panel:"memo-pad"\}/);
  assert.match(ai,/close\(\{restoreFocus:false\}\)/);
});
