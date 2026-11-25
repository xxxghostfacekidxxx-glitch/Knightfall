import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,statSync} from "node:fs";
import {KNIGHTFALL_EMOJIS} from "../../public/knightfall-emojis.mjs";
import {MESSAGE_REACTION_EMOJIS,isAllowedMessageReaction} from "./message-emojis.js";

test("the message API accepts the original set and every Knightfall emoji shortcode",()=>{
  for(const emoji of MESSAGE_REACTION_EMOJIS)assert.equal(isAllowedMessageReaction(emoji),true,emoji);
  for(const invalid of ["",":kf-not-real:","<svg>","🔥🔥",null,7])
    assert.equal(isAllowedMessageReaction(invalid),false,String(invalid));
});

test("reaction shortcode allowlist has no duplicates",()=>{
  assert.equal(new Set(MESSAGE_REACTION_EMOJIS).size,MESSAGE_REACTION_EMOJIS.length);
});

test("every original emoji has a local accessible SVG and a matching database constraint",()=>{
  const migration=readFileSync(new URL("../migrations/0217_knightfall_emoji_family_three.sql",import.meta.url),"utf8");
  for(const emoji of KNIGHTFALL_EMOJIS){
    assert.equal(isAllowedMessageReaction(emoji.code),true,emoji.code);
    const icon=new URL("../../public/icons/emojis/"+emoji.file,import.meta.url);
    assert.ok(statSync(icon).size>300,emoji.file+" should contain hand-authored vector art");
    const svg=readFileSync(icon,"utf8");
    assert.ok(svg.includes('aria-label="'+emoji.name+'"')||svg.includes('<title id="t">'+emoji.name+'</title>'),emoji.file+" needs an accessible label");
    assert.ok(migration.includes("'"+emoji.code+"'"),emoji.code+" missing from D1 constraint");
  }
  assert.equal(KNIGHTFALL_EMOJIS.length,29);
});
