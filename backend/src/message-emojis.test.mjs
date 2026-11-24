import test from "node:test";
import assert from "node:assert/strict";
import {MESSAGE_REACTION_EMOJIS,isAllowedMessageReaction} from "./message-emojis.js";

test("the message API accepts the original set and every Knightfall emoji shortcode",()=>{
  for(const emoji of MESSAGE_REACTION_EMOJIS)assert.equal(isAllowedMessageReaction(emoji),true,emoji);
  for(const invalid of ["",":kf-not-real:","<svg>","🔥🔥",null,7])
    assert.equal(isAllowedMessageReaction(invalid),false,String(invalid));
});

test("reaction shortcode allowlist has no duplicates",()=>{
  assert.equal(new Set(MESSAGE_REACTION_EMOJIS).size,MESSAGE_REACTION_EMOJIS.length);
});
