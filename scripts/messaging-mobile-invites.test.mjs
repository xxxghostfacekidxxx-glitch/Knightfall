import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("public/messages.html");
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).at(-1);
const bubbles=read("public/chat-bubbles.js");
const css=read("public/messages.css"),bubbleCss=read("public/chat-bubbles.css");
const cards=read("public/arcade/hosted/cards-against-chaos/online.js");
const cabinet=read("public/arcade/hosted/cards-against-chaos/cabinet.js");
const turns=read("public/arcade/async-play.js");
test("all changed browser controllers remain parseable",()=>{
 for(const src of [inline,bubbles,cards,cabinet,turns])assert.doesNotThrow(()=>new vm.Script(src));
});
test("avatars only accept image URLs and render a fallback",()=>{
 const start=inline.indexOf("function safeMessageAvatar(c){");
 const end=inline.indexOf("function conversationAvatar(c,",start);
 assert.ok(start>0&&end>start);
 const context=vm.createContext({});
 vm.runInContext(inline.slice(start,end),context);
 assert.equal(context.safeMessageAvatar({other_avatar_url:"javascript:alert(1)"}),"");
 assert.equal(context.safeMessageAvatar({other_avatar_url:"data:text/html;base64,PHNjcmlwdD4="}),"");
 assert.equal(context.safeMessageAvatar({other_avatar_url:"https://example.com/avatar.png"}),"https://example.com/avatar.png");
 assert.equal(context.safeMessageAvatar({other_avatar_url:"data:image/png;base64,aGVsbG8="}),"data:image/png;base64,aGVsbG8=");
 assert.match(inline,/conversationAvatar\(x\)/);
 assert.match(inline,/conversationAvatar\(c,"chat-avatar"\)/);
 assert.match(inline,/avatar-letter/);
 assert.match(bubbles,/open\.append\(avatarContent\(c\)\)/);
 assert.match(bubbles,/avatar\.append\(avatarContent\(c\)\)/);
 assert.match(bubbleCss,/\.kf-chat-photo-img/);
});
test("consecutive sends queue immediately without locking either composer",()=>{
 const send=inline.slice(inline.indexOf('$("#composer").onsubmit='),inline.indexOf("\nfunction drawPendingAttachments"));
 assert.match(send,/messageSendQueues.get\(conversationId\)/);
 assert.match(send,/messageSendQueues.set\(conversationId,queued\)/);
 assert.match(send,/if\(field.value===draft\)/);
 assert.match(send,/void sendTypingState\(false,conversationId\)/);
 assert.doesNotMatch(send,/if\(!currentId\|\|sendingConversation!==null/);
 const bubbleSend=bubbles.slice(bubbles.indexOf('composer.addEventListener("submit"'),bubbles.indexOf('input.addEventListener("keydown"'));
 assert.match(bubbleSend,/messageSendQueues.get\(id\)/);
 assert.match(bubbleSend,/messageSendQueues.set\(id,queued\)/);
 assert.match(bubbleSend,/input.value="";rememberDraft\(id,""\)/);
 assert.doesNotMatch(bubbleSend,/state.sending\)return/);
});
test("incoming game invitations route to existing matches, not new-game setup",()=>{
 assert.match(inline,/match\.can_accept&&Number\(match\.seats\?\.\[0\]\?\.id\)/);
 assert.match(inline,/cards-against-chaos\/index\.html\?match=/);
 assert.match(inline,/async-play\.html\?match=/);
 assert.match(inline,/cards-against-chaos\/index\.html\?challenge=/);
 assert.match(cabinet,/params\.has\("challenge"\)/);
 assert.ok(cards.indexOf('if(matchId)await openMatch(matchId)')<cards.indexOf('call("/api/friends")'),"open exact invitation before friend discovery");
 assert.ok(turns.indexOf("if(selectedId)await openMatch(selectedId)")<turns.indexOf("call('/api/friends')"),"Connect Four invite opens before friend discovery");
});
test("mobile chat stays inside the visual viewport with a scrollable transcript",()=>{
 assert.match(inline,/--messages-chat-height/);
 assert.match(inline,/visualViewport\?\.addEventListener\("resize"/);
 assert.match(css,/position:fixed!important/);
 assert.match(css,/height:var\(--messages-chat-height/);
 assert.match(css,/\.chat-panel>#jump-latest\{grid-row:3\}/);
 assert.match(css,/\.chat-panel>#messages\{grid-row:5/);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(bubbleCss,/max-height:max\(170px,calc\(100dvh - 155px\)\)/);
});


test("inbox keeps one adaptive transcript and secondary options in an overflow menu",()=>{
 assert.match(html,/id="chat-more" class="chat-more"/);
 assert.match(html,/class="chat-more-panel"/);
 assert.match(html,/id="mobile-inbox-back"/);
 assert.match(inline,/chatMore\.open=false/);
 assert.match(inline,/--messages-chat-height/);
 assert.match(css,/\.messages-shell \.message-layout\.show-chat \.chat-head\{/);
 assert.match(css,/grid-template-rows:auto auto auto auto minmax\(0,1fr\) auto auto!important/);
 assert.match(css,/\.messages-shell \.chat-more-panel/);
});
test("floating conversation heads can be moved and chat windows resized",()=>{
 assert.match(bubbles,/draggable\(\$\("#kf-chat-launcher"\)\)/);
 assert.match(bubbles,/draggable\(open\)/);
 assert.match(bubbles,/id="kf-chat-resize"/);
 assert.match(bubbles,/grip\.addEventListener\("pointermove"/);
 assert.match(bubbles,/grip\.addEventListener\("keydown"/);
 assert.match(bubbles,/localStorage\.setItem\(layoutKey/);
 assert.match(bubbles,/visualViewport\?\.addEventListener\("resize",fitDock/);
 assert.match(bubbleCss,/#kf-chat-heads\.kf-chat-positioned/);
 assert.match(bubbleCss,/#kf-chat-heads #kf-chat-resize/);
 assert.match(bubbleCss,/touch-action:none/);
});
