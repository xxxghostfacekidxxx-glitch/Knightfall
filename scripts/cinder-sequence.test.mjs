import test from "node:test";
import assert from "node:assert/strict";
import {createDeck,newGame,validSequence,move} from "../public/arcade/cinder-sequences.mjs";

test("the Cinder Sequences game uses one unique 36-card rules deck",()=>{
 const deck=createDeck();
 assert.equal(deck.length,36);
 assert.equal(new Set(deck.map(card=>card.id)).size,36);
});

test("illegal melds and out-of-turn moves leave the table unchanged",()=>{
 const state=newGame(2,()=>0.5),before=JSON.stringify(state);
 assert.equal(move(state,1,{type:"draw",from:"deck"}),false);
 assert.equal(JSON.stringify(state),before);
 assert.equal(move(state,0,{type:"draw",from:"deck"}),true);
 const afterDraw=JSON.stringify(state);
 assert.equal(move(state,0,{type:"meld",ids:["ash-1","ash-2","moon-3"]}),false);
 assert.equal(JSON.stringify(state),afterDraw);
});

test("sequences require same sigil and three consecutive ranks",()=>{
 const deck=createDeck();
 assert.equal(validSequence([deck[0],deck[1],deck[2]]),true);
 assert.equal(validSequence([deck[0],deck[1],deck[10]]),false);
 assert.equal(validSequence([deck[0],deck[9],deck[18]]),false);
});

test("a legal meld scores, refills the hand and ends at three sequences",()=>{
 const state=newGame(2,()=>0.5);
 state.hands[0]=createDeck().slice(0,5);
 assert.equal(move(state,0,{type:"draw",from:"deck"}),true);
 assert.equal(move(state,0,{type:"meld",ids:["ash-1","ash-2","ash-3"]}),true);
 assert.equal(state.scores[0],1);
 assert.equal(state.hands[0].length,6);
 state.scores[0]=2;
 state.phase="meld";
 state.hands[0]=createDeck().slice(0,3);
 assert.equal(move(state,0,{type:"meld",ids:["ash-1","ash-2","ash-3"]}),true);
 assert.equal(state.winner,0);
 assert.equal(state.phase,"finished");
});
