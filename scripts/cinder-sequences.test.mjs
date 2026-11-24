import test from "node:test";
import assert from "node:assert/strict";
import {createDeck,newGame,validSequence,move,chooseBotMove} from "../public/arcade/cinder-sequences.mjs";
test("unique deck and legal sequences",()=>{
 const deck=createDeck();assert.equal(deck.length,36);assert.equal(new Set(deck.map(c=>c.id)).size,36);
 assert.equal(validSequence(deck.slice(0,3)),true);
 assert.equal(validSequence([deck[0],deck[1],deck[9]]),false);
 assert.equal(validSequence([deck[0],deck[0],deck[1]]),false);
});
test("turn ownership, draw, meld, discard and scoring",()=>{
 const s=newGame(2,()=>.5);
 s.hands[0]=createDeck().slice(0,5);
 assert.equal(move(s,1,{type:"draw",from:"deck"}),false);
 assert.equal(move(s,0,{type:"draw",from:"deck"}),true);
 assert.equal(move(s,0,{type:"draw",from:"deck"}),false);
 assert.equal(move(s,0,{type:"meld",ids:["ash-1","ash-2","ash-3"]}),true);
 assert.equal(s.scores[0],1);
 assert.equal(move(s,0,{type:"discard",id:"ash-4"}),true);
 assert.equal(s.turn,1);
});
test("bot moves preserve card conservation",()=>{
 const s=newGame(4);
 for(let i=0;i<300&&s.winner===null;i++){
  assert.equal(move(s,s.turn,chooseBotMove(s)),true);
  const cards=[...s.deck,...s.discard,...s.hands.flat()];
  assert.equal(cards.length,36);assert.equal(new Set(cards.map(c=>c.id)).size,36);
 }
});
