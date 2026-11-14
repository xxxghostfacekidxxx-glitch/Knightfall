import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BLACK,WHITE} from "../public/arcade/hosted/cards-against-chaos/base-deck.js";
import {MADHOUSE_BLACK,MADHOUSE_WHITE} from "../public/arcade/hosted/cards-against-chaos/expansion-packs.js";

const ROOT=new URL("../public/arcade/hosted/cards-against-chaos/",import.meta.url);
const source=readFileSync(new URL("base-deck.js",ROOT),"utf8");
const clean=value=>value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();

test("replacement-only release preserves all four deck sizes and nonempty text",()=>{
 for(const [name,cards,count] of [
  ["base prompts",BLACK,500],["base answers",WHITE,1500],
  ["After Hours prompts",MADHOUSE_BLACK,50],["After Hours answers",MADHOUSE_WHITE,150]
 ]){
  assert.equal(cards.length,count,name+" changed count");
  for(const card of cards){
   assert.equal(typeof card,"string",name+" contains non-text");
   assert.ok(card.trim().length>=10,name+" contains a partial card");
   assert.ok(card.length<=260,name+" is too long for mobile display: "+card);
   assert.doesNotMatch(card,/\{(?:scene|role|event|thing)\}/i,name+" has an unfilled template");
  }
 }
});
test("all decks reject exact and punctuation-only duplicate cards",()=>{
 for(const cards of [BLACK,WHITE,MADHOUSE_BLACK,MADHOUSE_WHITE]){
  assert.equal(new Set(cards).size,cards.length,"exact duplicate found");
  assert.equal(new Set(cards.map(clean)).size,cards.length,"near-identical normalized card found");
 }
});
test("generated prompt and answer groups each vary their joke structures",()=>{
 const generatedBlack=BLACK.slice(50);
 const generatedWhite=WHITE.slice(150);
 assert.equal(generatedBlack.length,450);
 assert.equal(generatedWhite.length,1350);
 // Three distinct setups per character rather than six identical scene rewrites.
 for(let i=0;i<270;i+=3){
  assert.equal(new Set(generatedBlack.slice(i,i+3)).size,3);
 }
 for(let i=270;i<450;i+=2){
  assert.notEqual(generatedBlack[i],generatedBlack[i+1]);
 }
 for(let i=0;i<1350;i+=5){
  assert.equal(new Set(generatedWhite.slice(i,i+5)).size,5);
  const sentencePatterns=generatedWhite.slice(i,i+5).map(card=>
   card.replace(/^(?:A|An|The) /i,"").split(" ").slice(-6).join(" "));
  assert.equal(new Set(sentencePatterns).size,5,"one seed repeats the same punchline");
 }
 assert.match(source,/const ROLE_BLACK_FRAMES=\[/);
 assert.match(source,/const EVENT_BLACK_FRAMES=\[/);
 assert.doesNotMatch(source,/const SCENES=\[/);
 assert.doesNotMatch(source,/const BLACK_FRAMES=\[/);
 assert.match(source,/const variedFrame=/);
});
test("normal and opt-in adult packs retain independent fixed source arrays",()=>{
 assert.equal(BLACK.length+WHITE.length,2000);
 assert.equal(MADHOUSE_BLACK.length+MADHOUSE_WHITE.length,200);
 assert.ok(BLACK.some(card=>/funeral|coroner|exorcism|divorce/i.test(card)));
 assert.ok(WHITE.some(card=>/goth|tattoo|priest|crematorium/i.test(card)));
 assert.ok(MADHOUSE_BLACK.some(card=>/safe word|strip club|sex therapist/i.test(card)));
 assert.ok(MADHOUSE_WHITE.some(card=>/gimp|dominatrix|swingers/i.test(card)));
});
