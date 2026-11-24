import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {KNIGHTFALL_EMOJIS,renderKnightfallEmojiText,mountKnightfallEmojiPicker} from "../public/knightfall-emojis.mjs";
import {MESSAGE_REACTION_EMOJIS} from "../backend/src/message-emojis.js";
const messagesPage=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const emojiMigrations=["0213_knightfall_emoji_reactions.sql","0214_knightfall_emoji_family_two.sql"]
  .map(name=>readFileSync(new URL("../backend/migrations/"+name,import.meta.url),"utf8")).join("\n");

test("original Knightfall emoji catalog points to authored vector artwork",()=>{
  assert.equal(KNIGHTFALL_EMOJIS.length,17);
  assert.equal(new Set(KNIGHTFALL_EMOJIS.map(item=>item.code)).size,17);
  for(const item of KNIGHTFALL_EMOJIS){
    assert.match(item.code,/^:kf-[a-z0-9-]+:$/);
    assert.ok(item.name&&item.file.endsWith(".svg"));
    const svg=readFileSync(new URL("../public/icons/emojis/"+item.file,import.meta.url),"utf8");
    assert.match(svg,/<svg[^>]+viewBox="0 0 (?:96|128) (?:96|128)"/);
    assert.ok(svg.includes('aria-label="'+item.name+'"')||svg.includes('<title id="t">'+item.name+'</title>'));
  }
});

test("message renderer only replaces known shortcodes and escapes member text",()=>{
  const rendered=renderKnightfallEmojiText('<script>alert(1)</script> :kf-imp: :kf-nope:\nhello',value=>
    value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])),
    {lineBreaks:true});
  assert.match(rendered,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(rendered,/<img class="kf-emoji"[^>]+chaos-imp\.svg/);
  assert.match(rendered,/:kf-nope:/);
  assert.match(rendered,/&lt;br&gt;|<br>hello/);
});

test("the composer mounts every custom emoji exactly once with accessible labels",()=>{
  const tray={dataset:{},children:[],append(...items){this.children.push(...items)}};
  const floatingTray={dataset:{},children:[],append(...items){this.children.push(...items)}};
  const doc={querySelectorAll:()=>[tray,floatingTray],createElement(tag){return {
    tag,dataset:{},attrs:{},children:[],setAttribute(key,value){this.attrs[key]=value},
    append(...items){this.children.push(...items)}
  }}};
  assert.equal(mountKnightfallEmojiPicker(doc),34);
  assert.equal(mountKnightfallEmojiPicker(doc),0);
  assert.equal(tray.children.length,17);
  assert.equal(floatingTray.children.length,17);
  assert.deepEqual(tray.children.map(button=>button.dataset.insertEmoji),KNIGHTFALL_EMOJIS.map(item=>item.code));
  assert.ok(tray.children.every(button=>button.attrs["aria-label"].startsWith("Insert ")&&button.children[0].tag==="img"));
});

test("picker, sent-message rendering, server allowlist and database check share the catalog",()=>{
  assert.match(messagesPage,/knightfall-emojis\.mjs\?v=20261124-original-emojis2/);
  assert.match(messagesPage,/window\.KnightfallEmojiReady/);
  assert.match(messagesPage,/customReactionButtons\(m\.id\)/);
  assert.match(messagesPage,/renderMessageText\(m\.deleted_at\?"\[Message deleted\]":m\.body\)/);
  const floatingChat=readFileSync(new URL("../public/chat-bubbles.js",import.meta.url),"utf8");
  assert.match(floatingChat,/kf-chat-emoji-tray/);
  assert.match(floatingChat,/customEmoji\.render/);
  const custom=KNIGHTFALL_EMOJIS.map(item=>item.code);
  for(const code of custom){
    assert.ok(MESSAGE_REACTION_EMOJIS.includes(code),"API allowlist missing "+code);
    assert.ok(emojiMigrations.includes("'"+code+"'"),"database migration missing "+code);
  }
});
