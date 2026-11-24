// Original Knightfall game: build three ascending chains of four cards.
// Pure immutable rules; no network, copyrighted decks or external artwork.
export const SUITS=Object.freeze(["ash","ember","moon","thorn"]);
export function createDeck(){
 return SUITS.flatMap(suit=>Array.from({length:12},(_,i)=>({id:suit+"-"+(i+1),suit,rank:i+1})));
}
export function newSequenceGame(random=Math.random){
 const deck=createDeck();
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 return {deck:deck.slice(6),hand:deck.slice(0,6),chains:[[],[],[]],discard:[],turn:0,status:"playing"};
}
export function canPlace(card,chain){
 if(!card||!Array.isArray(chain)||chain.length>=4)return false;
 if(!chain.length)return true;
 const last=chain.at(-1);
 return card.rank===last.rank+1&&card.suit!==last.suit;
}
export function sequenceScore(state){
 return state.chains.reduce((sum,chain)=>sum+chain.length*10+(chain.length===4?25:0),0);
}
export function sequenceMove(state,move){
 if(state.status!=="playing"||!move||!["place","discard"].includes(move.type))return null;
 const index=state.hand.findIndex(card=>card.id===move.cardId);
 if(index<0)return null;
 const card=state.hand[index];
 if(move.type==="place"&&(!Number.isInteger(move.chain)||!canPlace(card,state.chains[move.chain])))return null;
 const next={...state,deck:[...state.deck],hand:[...state.hand],chains:state.chains.map(c=>[...c]),discard:[...state.discard],turn:state.turn+1};
 next.hand.splice(index,1);
 if(move.type==="place")next.chains[move.chain].push(card);
 else next.discard.push(card);
 if(next.deck.length)next.hand.push(next.deck.shift());
 if(next.chains.every(c=>c.length===4))next.status="won";
 else if(!next.hand.length)next.status="lost";
 return next;
}
