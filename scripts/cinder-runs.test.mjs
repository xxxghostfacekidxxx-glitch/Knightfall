import test from "node:test";
import assert from "node:assert/strict";
import {makeDeck,newGame,validRun,move,botMove} from "../public/arcade/hosted/cinder-runs/engine.mjs";
test("unique deck and two to four player dealing",()=>{
 assert.equal(new Set(makeDeck().map(c=>c.id)).size,48);
 for(let n=2;n<=4;n++){const s=newGame(n,()=>.5);assert.equal(s.hands.length,n);assert.equal(s.deck.length,48-7*n);}
});
test("turn order, immutable moves and single draw",()=>{
 const s=newGame(2,()=>.5);assert.equal(move(s,1,{type:"draw",source:"deck"}),null);
 const n=move(s,0,{type:"draw",source:"deck"});assert.equal(s.hands[0].length,7);assert.equal(n.hands[0].length,8);
 assert.equal(move(n,0,{type:"draw",source:"deck"}),null);
 const d=move(n,0,{type:"discard",id:n.hands[0][0].id});assert.equal(d.turn,1);assert.equal(d.phase,"draw");
 assert.ok(botMove(d,()=>.5));
});
test("valid runs and scoring reject repeated or foreign cards",()=>{
 const cards=makeDeck().slice(0,3);assert.ok(validRun(cards));assert.equal(validRun([cards[0],cards[0],cards[2]]),false);
 const s=newGame(2);s.hands[0]=[...cards,makeDeck()[5]];s.phase="meld";s.scores[0]=6;
 assert.equal(move(s,0,{type:"meld",ids:["fake",cards[1].id,cards[2].id]}),null);
 const n=move(s,0,{type:"meld",ids:cards.map(c=>c.id)});assert.equal(n.winner,0);assert.equal(n.scores[0],9);
});
