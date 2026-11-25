import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {KNIGHTFALL_EMOJIS,KNIGHTFALL_STICKERS,searchKnightfallEmojis,readEmojiPreferences,updateEmojiPreferences,renderKnightfallEmojiText,mountKnightfallEmojiPicker} from "../public/knightfall-emojis.mjs";
import {MESSAGE_REACTION_EMOJIS} from "../backend/src/message-emojis.js";
const messagesPage=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const emojiMigrations=["0213_knightfall_emoji_reactions.sql","0214_knightfall_emoji_family_two.sql","0217_knightfall_emoji_family_three.sql"]
  .map(name=>readFileSync(new URL("../backend/migrations/"+name,import.meta.url),"utf8")).join("\n");

test("original Knightfall emoji catalog points to authored vector artwork",()=>{
  assert.equal(KNIGHTFALL_EMOJIS.length,29);
  assert.equal(new Set(KNIGHTFALL_EMOJIS.map(item=>item.code)).size,29);
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
  assert.equal(mountKnightfallEmojiPicker(doc),70);
  assert.equal(mountKnightfallEmojiPicker(doc),0);
  assert.equal(tray.children.length,35);
  assert.equal(floatingTray.children.length,35);
  assert.deepEqual(tray.children.map(button=>button.dataset.insertEmoji),[...KNIGHTFALL_EMOJIS,...KNIGHTFALL_STICKERS].map(item=>item.code));
  assert.ok(tray.children.every(button=>button.attrs["aria-label"].startsWith("Insert ")&&button.children[0].tag==="img"));
});

test("picker, sent-message rendering, server allowlist and database check share the catalog",()=>{
  assert.match(messagesPage,/knightfall-emojis\.mjs\?v=20261125-noir1/);
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

test("original emoji search filters names, codes and packs",()=>{assert.equal(searchKnightfallEmojis("cackle")[0].code,":kf-cackle:");assert.equal(searchKnightfallEmojis("","faces").length,6);assert.equal(searchKnightfallEmojis("nonexistent").length,0);assert.equal(searchKnightfallEmojis().length,35);});

test("emoji favorites and recent history are account scoped, allowlisted and bounded",()=>{const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};updateEmojiPreferences(storage,1,"favorite",":kf-cackle:");assert.deepEqual(readEmojiPreferences(storage,1).favorites,[":kf-cackle:"]);assert.deepEqual(readEmojiPreferences(storage,2).favorites,[]);updateEmojiPreferences(storage,1,"favorite",":kf-cackle:");assert.deepEqual(readEmojiPreferences(storage,1).favorites,[]);for(const item of KNIGHTFALL_EMOJIS)updateEmojiPreferences(storage,1,"recent",item.code);assert.equal(readEmojiPreferences(storage,1).recent.length,12);assert.equal(readEmojiPreferences(storage,1).recent[0],KNIGHTFALL_EMOJIS.at(-1).code);updateEmojiPreferences(storage,1,"recent",":kf-fake:");assert.ok(!readEmojiPreferences(storage,1).recent.includes(":kf-fake:"));});

test("stickers are message-only and known emoji animation is bounded by CSS",()=>{assert.equal(KNIGHTFALL_STICKERS.length,6);for(const item of KNIGHTFALL_STICKERS){assert.ok(!MESSAGE_REACTION_EMOJIS.includes(item.code));assert.match(renderKnightfallEmojiText(item.code),/data-kf-sticker="true"/);assert.ok(readFileSync(new URL("../public/icons/emojis/"+item.file,import.meta.url),"utf8").includes(item.name));}assert.match(renderKnightfallEmojiText(":kf-cackle:"),/data-kf-jumbo="true"/);assert.match(renderKnightfallEmojiText(":kf-cackle:"),/data-kf-motion="bounce"/);});
