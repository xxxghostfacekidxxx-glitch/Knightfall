// Original Knightfall card game. Build ascending three-card elemental runs.
// Pure state transitions; no DOM, network or external assets.
export const ELEMENTS=Object.freeze(["ember","ash","storm","void"]);
export const makeDeck=()=>ELEMENTS.flatMap(element=>Array.from({length:12},(_,i)=>({id:element+":"+(i+1),element,rank:i+1})));
export function shuffle(cards,rng=Math.random){
 const out=cards.slice();
 for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
export function newGame(players=2,rng=Math.random){
 if(!Number.isInteger(players)||players<2||players>4)throw Error("Two to four players required");
 const deck=shuffle(makeDeck(),rng),hands=Array.from({length:players},()=>deck.splice(0,7));
 return {deck,hands,discard:[],runs:Array.from({length:players},()=>[]),scores:Array(players).fill(0),turn:0,phase:"draw",winner:null};
}
export function validRun(cards){
 if(!Array.isArray(cards)||cards.length!==3||new Set(cards.map(c=>c.id)).size!==3)return false;
 const sorted=cards.slice().sort((a,b)=>a.rank-b.rank);
 return ELEMENTS.includes(sorted[0].element)&&sorted.every((c,i)=>c.element===sorted[0].element&&Number.isInteger(c.rank)&&c.rank>=1&&c.rank<=12&&c.rank===sorted[0].rank+i);
}
export function move(state,player,action,rng=Math.random){
 if(state.winner!==null||player!==state.turn||!action)return null;
 const next=JSON.parse(JSON.stringify(state)),hand=next.hands[player];
 if(action.type==="draw"&&next.phase==="draw"){
  if(action.source==="discard"){if(!next.discard.length)return null;hand.push(next.discard.pop());}
  else if(action.source==="deck"){
   if(!next.deck.length){if(next.discard.length<2)return null;const top=next.discard.pop();next.deck=shuffle(next.discard,rng);next.discard=[top];}
   hand.push(next.deck.pop());
  }else return null;
  next.phase="meld";return next;
 }
 if(action.type==="meld"&&next.phase==="meld"){
  if(!Array.isArray(action.ids)||new Set(action.ids).size!==3||action.ids.length!==3)return null;
  const cards=action.ids.map(id=>hand.find(c=>c.id===id));
  if(cards.some(c=>!c)||!validRun(cards))return null;
  next.hands[player]=hand.filter(c=>!action.ids.includes(c.id));
  next.runs[player].push(cards);next.scores[player]+=3;
  if(next.scores[player]>=9||next.hands[player].length===0){next.winner=player;next.phase="finished";}
  return next;
 }
 if(action.type==="discard"&&next.phase==="meld"){
  const index=hand.findIndex(c=>c.id===action.id);if(index<0)return null;
  next.discard.push(hand.splice(index,1)[0]);
  if(!hand.length){next.winner=player;next.phase="finished";return next;}
  next.turn=(player+1)%next.hands.length;next.phase="draw";return next;
 }
 return null;
}
export function botMove(state,rng=Math.random){
 const player=state.turn;
 let next=move(state,player,{type:"draw",source:"deck"},rng)||move(state,player,{type:"draw",source:"discard"},rng);
 if(!next)return null;
 for(const element of ELEMENTS){
  for(let rank=1;rank<=10;rank++){
   const ids=[rank,rank+1,rank+2].map(r=>element+":"+r);
   const meld=move(next,player,{type:"meld",ids},rng);
   if(meld){next=meld;if(next.winner!==null)return next;}
  }
 }
 const hand=next.hands[player];
 return move(next,player,{type:"discard",id:hand[Math.floor(rng()*hand.length)].id},rng);
}
