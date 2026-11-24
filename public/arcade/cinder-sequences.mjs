// Original Knightfall game: build three-card ascending sequences in four suits.
export const SUITS=Object.freeze(["ash","ember","moon","thorn"]);
export function createDeck(){
 return SUITS.flatMap(suit=>Array.from({length:9},(_,i)=>({id:suit+"-"+(i+1),suit,rank:i+1})));
}
export function shuffleDeck(deck,rng=Math.random){
 const copy=deck.slice();
 for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
 return copy;
}
export function validSequence(cards){
 if(!Array.isArray(cards)||cards.length!==3||new Set(cards.map(c=>c?.id)).size!==3)return false;
 if(cards.some(c=>!c||!SUITS.includes(c.suit)||!Number.isInteger(c.rank)||c.rank<1||c.rank>9))return false;
 const ranks=cards.map(c=>c.rank).sort((a,b)=>a-b);
 return cards.every(c=>c.suit===cards[0].suit)&&ranks[1]===ranks[0]+1&&ranks[2]===ranks[1]+1;
}
export function newGame(players=2,rng=Math.random){
 if(!Number.isInteger(players)||players<2||players>4)throw Error("Choose two to four players.");
 const deck=shuffleDeck(createDeck(),rng);
 return {deck,hands:Array.from({length:players},()=>deck.splice(0,5)),discard:[],scores:Array(players).fill(0),turn:0,phase:"draw",winner:null};
}
export function move(state,seat,action,rng=Math.random){
 if(state.winner!==null||seat!==state.turn||!action)return false;
 const hand=state.hands[seat];
 if(action.type==="draw"&&state.phase==="draw"){
  if(!state.deck.length&&state.discard.length>1){
   const top=state.discard.pop();state.deck=shuffleDeck(state.discard,rng);state.discard=[top];
  }
  const source=action.from==="discard"?state.discard:action.from==="deck"?state.deck:null;
  if(!source?.length)return false;
  hand.push(source.pop());state.phase="meld";return true;
 }
 if(action.type==="meld"&&state.phase==="meld"){
  if(!Array.isArray(action.ids)||new Set(action.ids).size!==3)return false;
  const cards=action.ids.map(id=>hand.find(c=>c.id===id));
  if(!validSequence(cards))return false;
  state.hands[seat]=hand.filter(c=>!action.ids.includes(c.id));
  state.discard.push(...cards);state.scores[seat]++;
  if(state.scores[seat]>=3){state.winner=seat;state.phase="finished";}
  else state.phase="discard";
  return true;
 }
 if(action.type==="discard"&&["meld","discard"].includes(state.phase)){
  const index=hand.findIndex(c=>c.id===action.id);
  if(index<0&&hand.length)return false;
  if(index>=0)state.discard.push(hand.splice(index,1)[0]);
  state.turn=(seat+1)%state.hands.length;state.phase="draw";return true;
 }
 return false;
}
export function chooseBotMove(state){
 const hand=state.hands[state.turn];
 if(state.phase==="draw")return {type:"draw",from:state.deck.length||state.discard.length>1?"deck":"discard"};
 if(state.phase==="meld"){
  for(let a=0;a<hand.length;a++)for(let b=a+1;b<hand.length;b++)for(let c=b+1;c<hand.length;c++){
   const cards=[hand[a],hand[b],hand[c]];
   if(validSequence(cards))return {type:"meld",ids:cards.map(x=>x.id)};
  }
 }
 return {type:"discard",id:hand[0]?.id};
}
