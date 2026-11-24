import test from "node:test";
import assert from "node:assert/strict";
import {createDeck,newSequenceGame,sequenceMove,canPlace,sequenceScore} from "../public/arcade/cinder-sequence.mjs";
test("deck has 48 unique cards",()=>{const d=createDeck();assert.equal(d.length,48);assert.equal(new Set(d.map(c=>c.id)).size,48)});
test("invalid moves do not mutate state",()=>{const s=newSequenceGame(()=>0);const before=JSON.stringify(s);assert.equal(sequenceMove(s,{type:"place",chain:9,cardId:s.hand[0].id}),null);assert.equal(JSON.stringify(s),before)});
test("chains require consecutive ranks and different suits",()=>{const c={rank:4,suit:"ash"};assert.equal(canPlace({rank:5,suit:"moon"},[c]),true);assert.equal(canPlace({rank:5,suit:"ash"},[c]),false);assert.equal(canPlace({rank:6,suit:"moon"},[c]),false)});
test("discarding conserves all cards and eventually ends game",()=>{let s=newSequenceGame(()=>0);while(s.status==="playing"){s=sequenceMove(s,{type:"discard",cardId:s.hand[0].id});assert.equal(s.deck.length+s.hand.length+s.discard.length+s.chains.flat().length,48)}assert.equal(s.status,"lost");assert.equal(s.turn,48)});
test("completed chains score bonuses and win",()=>{let s=newSequenceGame();const deck=createDeck();s={...s,deck:[],hand:deck.filter(c=>c.rank<=3),chains:[[deck[0],deck[13],deck[26]],[deck[12],deck[25],deck[38]],[deck[24],deck[37],deck[2]]],status:"playing"};s.hand=[deck[39],deck[3],deck[15]];for(const [i,c] of s.hand.entries())s=sequenceMove(s,{type:"place",chain:i,cardId:c.id});assert.equal(s.status,"won");assert.equal(sequenceScore(s),195)});
