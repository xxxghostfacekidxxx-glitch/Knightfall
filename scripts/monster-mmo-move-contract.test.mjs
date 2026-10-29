import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const src=await readFile(new URL("../public/monster-mmo-move-contract.js",import.meta.url),"utf8");
const {normalizeMoveSlots,validateMoveSelection}=await import("data:text/javascript,"+encodeURIComponent(src));
test("four unique equipped moves and stable order",()=>{
 assert.deepEqual(normalizeMoveSlots(["a","b","c","d","e"],["c","c","a"]),["c","a","b","d"]);
});
test("reject unknown or duplicate-equipped move and invalid slots",()=>{
 assert.equal(validateMoveSelection(["a","b","c","d"],["a","b","c","d"],1,"c"),false);
 assert.equal(validateMoveSelection(["a","b","c","d"],["a","b","c","d"],1,"unknown"),false);
 assert.equal(validateMoveSelection(["a","b","c","d"],["a","b","c","d"],4,"a"),false);
 assert.equal(validateMoveSelection(["a","b","c","d"],["a","b","c","d"],2,"c"),true);
});
test("sanitize malformed and untrusted move identifiers",()=>{
 assert.deepEqual(normalizeMoveSlots(["a","<script>","b",null,"a"],[]),["a","b"]);
});
