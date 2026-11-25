import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const bubbles=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");
const styles=readFileSync(new URL("../public/chat-bubbles.css",import.meta.url),"utf8");
const ai=readFileSync(new URL("../public/miss-chaos-presence.js",import.meta.url),"utf8");
const navigation=readFileSync(new URL("../public/nav.js",import.meta.url),"utf8");
const inline=[...inbox.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(source=>source.includes("const conversationDrafts=new Map();")&&source.includes("async function startDirectMessage("));
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
  assert.match(inline,/async function startDirectMessage\(raw,trigger\)/);
  assert.match(inline,/createdId=id;[\s\S]*?await loadConversations\(\{openSelected:false\}\);[\s\S]*?await openConversation\(id\)/);
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
  assert.match(bubbles,/messageSendQueues\.set\(id,queued\)/);
  assert.match(bubbles,/Send not confirmed:/);
  assert.match(bubbles,/if\(state\.active===id\)/);
  assert.match(bubbles,/textContent=text/);
});
test("chat heads poll for incoming messages and avoid redundant thread redraws",()=>{
  assert.match(bubbles,/await refreshConversations\(\{force:true\}\)/);
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

test("floating attachment drafts survive reload and are account scoped",()=>{
 const start=bubbles.indexOf("const attachmentDrafts=new Map()"),end=bubbles.indexOf("const nameOf=c=>",start);
 const data=new Map();const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 function context(id){const c=vm.createContext({userId:id,sessionStorage:storage});vm.runInContext(bubbles.slice(start,end),c);return c;}
 const a=context(10);a.saveAttachmentDraft(42,[{id:12,filename:"photo.png"}]);
 assert.equal(vm.runInContext("attachmentDrafts.get(42)[0].id",context(10)),12);
 assert.equal(vm.runInContext("attachmentDrafts.size",context(11)),0);
 a.saveAttachmentDraft(42,[]);assert.equal(vm.runInContext("attachmentDrafts.size",context(10)),0);
});
test("floating file picker and removal are bound to the original conversation",()=>{
 assert.match(bubbles,/pickerConversation=state\.active;filePicker\.click/);
 assert.match(bubbles,/const id=pickerConversation,files=/);
 assert.match(bubbles,/uploadingConversations\.has\(id\)\|\|removingConversations\.has\(id\)/);
 assert.match(bubbles,/saveAttachmentDraft\(id,\[\.\.\.attachments,/);
});

test("Ascendant includes favorites, groups and draft filters with local account isolation",()=>{
 assert.match(inbox,/data-inbox-filter="favorites"/);assert.match(inbox,/data-inbox-filter="groups"/);assert.match(inbox,/data-inbox-filter="drafts"/);
 const start=inline.indexOf("const favoriteConversations=new Set()"),end=inline.indexOf("function updateFavoriteButton",start);
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const ctx=vm.createContext({currentUser:{id:10},window:{},localStorage:storage,conversationDrafts:new Map(),currentId:42,pendingAttachments:[],attachmentDrafts:new Map()});
 vm.runInContext(inline.slice(start,end),ctx);vm.runInContext("favoriteConversations.add(42);saveFavoriteConversations()",ctx);assert.equal(ctx.inboxFilterMatches({id:42},"favorites"),true);ctx.currentUser={id:11};ctx.loadFavoriteConversations();assert.equal(ctx.inboxFilterMatches({id:42},"favorites"),false);
 assert.equal(ctx.inboxFilterMatches({id:42,kind:"group"},"groups"),true);assert.equal(ctx.inboxFilterMatches({id:42,kind:"direct"},"groups"),false);
});
test("Ascendant preserves theme choices and date grouping across messenger surfaces",()=>{assert.match(inbox,/chaosphere-ascendant\.css/);assert.match(inline,/function updateTranscriptDates/);assert.match(bubbles,/allowedThemes=new Set/);assert.match(bubbles,/kf-chat-day-marker/);assert.match(styles,/#kf-chat-heads\[data-cs-theme="egypt"\]/);});

test("floating favorites use the same account-scoped key as the full inbox",()=>{assert.match(bubbles,/favoritesKey="kf-cs-favorites-"\+userId/);assert.match(bubbles,/data-kf-filter="favorites"/);assert.match(bubbles,/data-kf-filter="drafts"/);assert.match(bubbles,/data-kf-filter="groups"/);assert.match(bubbles,/favoriteIds\.has\(id\)/);assert.match(bubbles,/key===pendingRenderKey/);});
