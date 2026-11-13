import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../public/messages.css",import.meta.url),"utf8");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).pop();
new vm.Script(inline);

function extract(a,b) {
 const start=inline.indexOf(a),end=inline.indexOf(b,start);
 assert.ok(start>=0&&end>start,"source contains "+a+" before "+b);
 return inline.slice(start,end);
}
test("history viewing pauses live latest-message redraws",async()=>{
 const ctx=vm.createContext({currentId:42,historyPinnedConversationId:42,loading:false,loadingOlder:false});
 vm.runInContext(extract("async function refreshCurrent(){","\n$(\"#composer\").onsubmit="),ctx);
 await ctx.refreshCurrent();
 assert.equal(ctx.currentId,42);
 assert.match(inline,/historyPinnedConversationId===Number\(currentId\)\)return/);
});
test("search result and external permalink both open the exact message",async()=>{
 const calls=[];
 const ctx=vm.createContext({
  location:{search:"?conversation=712&message=33"},
  currentId:null,historyPinnedConversationId:null,
  URLSearchParams,Number,conversations:[],
  loadConversations:async()=>{},
  api:async path=>{calls.push(path);return{conversation:{id:712,other_username:"crew22"}}},
  drawConversations:()=>{},
  openConversation:async(id,options)=>{calls.push({id,options})},
  focusNotificationReply:()=>{},
  status:()=>{}
 });
 vm.runInContext(extract("async function followNotificationConversation","\nif(\"serviceWorker\" in navigator)"),ctx);
 await ctx.followNotificationConversation();
 assert.equal(calls[0],"/api/messages/conversations/712/summary");
 assert.equal(calls[1].id,712);
 assert.equal(calls[1].options.highlightMessageId,33);
 assert.equal(calls[1].options.beforeMessageId,33);
});
test("deep link metadata lookup cannot silently bypass membership checks",()=>{
 assert.match(inline,/\/api\/messages\/conversations\/"\+id\+"\/summary/);
 assert.match(inline,/found\.conversation\.fromSearch=true/);
 assert.match(inline,/if\(selected&&!conversations\.some/);
 assert.match(inline,/historyPinnedConversationId=beforeMessageId\?Number\(id\):null/);
});
test("jump-to-latest clears the historical anchor and refreshes the main thread",()=>{
 assert.match(inline,/if\(highlightMessageId\)u\.searchParams\.set\("message"/);
 assert.match(inline,/else u\.searchParams\.delete\("message"\)/);
 assert.match(inline,/if\(historyPinnedConversationId===conversationId\)await openConversation\(conversationId\)/);
 assert.match(inline,/jump-latest/);
 assert.match(inline,/New activity · Jump to latest/);
});
test("member message actions offer copy text and a shareable deep link",()=>{
 assert.match(inline,/data-copy-message/);
 assert.match(inline,/data-link-message/);
 assert.match(inline,/navigator\.clipboard\.writeText\(value\)/);
 assert.match(inline,/\/messages\.html\?conversation=/);
 assert.match(inline,/&message=/);
 assert.match(css,/\[data-copy-message\]/);
});
test("image attachments preview only known safe raster types",()=>{
 assert.ok(inline.includes("image\\/(jpeg|png|gif|webp)"));
 assert.match(inline,/class="message-image-thumb"/);
 assert.match(inline,/loading="lazy" decoding="async"/);
 assert.match(inline,/referrerpolicy="no-referrer"/);
 assert.match(inline,/name=esc\(a\.original_filename/);
 assert.match(css,/\.message-attachment\.image-preview/);
 assert.match(css,/object-fit:contain/);
});
test("search keyboard shortcut and closing dialog cancel stale results",()=>{
 assert.match(inline,/event\.ctrlKey\|\|event\.metaKey/);
 assert.match(inline,/historyDialog\.addEventListener\("close",\(\)=>\{clearTimeout\(historyDelay\);historyEpoch\+\+;/);
 assert.match(inline,/if\(token!==historyEpoch\)return/);
});

test("initial inbox load preserves a message permalink until its exact target opens",async()=>{
 const calls=[];
 const ctx=vm.createContext({
  inboxLoadToken:0,currentId:null,conversations:[],historyPinnedConversationId:null,
  api:async()=>({conversations:[{id:712}]}),
  location:{search:"?conversation=712&message=33"},URLSearchParams,Number,
  maybeNotifyUnread(){},drawConversations(){},updatePresenceLabel(){},
  openConversation:async(id)=>calls.push(id)
 });
 vm.runInContext(extract("async function loadConversations","\nasync function openConversation"),ctx);
 await ctx.loadConversations();
 assert.equal(calls.length,0,"do not delete message=33 by opening the default recent thread first");
 ctx.location.search="?conversation=712";
 await ctx.loadConversations();
 assert.deepEqual(calls,[712],"normal inbox links still open their conversation");
});
test("push notification routing clears stale message permalinks",()=>{
 assert.match(inline,/url\.searchParams\.delete\("message"\); \/\/ New notifications/);
 assert.match(inline,/KF_OPEN_CONVERSATION/);
});
