// Cinder Eights: original deterministic 2-seat card rules.
// UI, cosmetics, score sync and fullscreen are separate from this game model.
export const SUITS=Object.freeze(["♠","♥","♦","♣"]);
export const RANKS=Object.freeze(["A","2","3","4","5","6","7","8","9","10","J","Q","K"]);
export const cardLabel=card=>card?card.r+card.s:"";
export const validSuit=suit=>SUITS.includes(suit);
export function newDeck(){
 return SUITS.flatMap(s=>RANKS.map(r=>({r,s})));
}
export function shuffle(cards,random=Math.random){
 const arr=[...cards];
 for(let i=arr.length-1;i>0;i--){
  const sample=random();
  const j=Math.max(0,Math.min(i,Math.floor((Number.isFinite(sample)?sample:0)* (i+1))));
  [arr[i],arr[j]]=[arr[j],arr[i]];
 }
 return arr;
}
export class CinderEightsGame {
 constructor(random=Math.random){this.random=random;this.start();}
 start(){
  this.deck=shuffle(newDeck(),this.random);
  this.hands=[[],[]];
  this.pile=[];
  this.suit=null;this.turn=0;this.over=false;this.winner=null;this.awaitingSuit=false;
  this.round=0;this.moves=0;this.stalled=0;
  for(let i=0;i<7;i++){this.drawFor(0);this.drawFor(1);}
  const pos=this.deck.findIndex(c=>c.r!=="8");
  if(pos<0)throw Error("Cinder Eights cannot choose opening discard");
  const top=this.deck.splice(pos,1)[0];
  this.pile.push(top);this.suit=top.s;
 }
 get top(){return this.pile[this.pile.length-1];}
 get remaining(){return this.deck.length;}
 canPlay(card){return Boolean(card)&&(card.r==="8"||card.s===this.suit||card.r===this.top.r);}
 drawFor(player){
  if(player!==0&&player!==1)return null;
  if(!this.deck.length&&this.pile.length>1){
   const top=this.pile.pop();
   this.deck=shuffle(this.pile,this.random);
   this.pile=[top];
  }
  const card=this.deck.pop();
  if(card)this.hands[player].push(card);
  return card||null;
 }
 play(player,index){
  if(this.over||this.awaitingSuit||this.turn!==player)return {ok:false,reason:"Not your turn"};
  const hand=this.hands[player];
  if(!Number.isInteger(index)||index<0||index>=hand.length)return {ok:false,reason:"No such card"};
  const card=hand[index];
  if(!this.canPlay(card))return {ok:false,reason:"That card cannot be played"};
  hand.splice(index,1);this.pile.push(card);this.suit=card.s;this.moves++;this.stalled=0;
  if(!hand.length){
   this.over=true;this.winner=player;
   return {ok:true,kind:"win",card,winner:player};
  }
  if(card.r==="8"&&player===0){
   this.awaitingSuit=true;
   return {ok:true,kind:"choose-suit",card};
  }
  if(card.r==="8"&&player===1){
   const counts=SUITS.map(s=>({s,n:hand.filter(c=>c.s===s).length}));
   counts.sort((a,b)=>b.n-a.n);
   this.suit=counts[0].s;
  }
  this.turn=1-player;
  return {ok:true,kind:"played",card};
 }
 chooseSuit(suit){
  if(this.over||!this.awaitingSuit||!validSuit(suit))return false;
  this.suit=suit;this.awaitingSuit=false;this.turn=1;
  return true;
 }
 drawHuman(){
  if(this.over||this.turn!==0||this.awaitingSuit)return {ok:false,reason:"Cannot draw right now"};
  const card=this.drawFor(0);
  this.turn=1;this.moves++;
  this.stalled=card?0:this.stalled+1;
  if(this.stalled>=2){this.over=true;this.winner=null;return {ok:true,kind:"draw",card:null};}
  return {ok:true,kind:card?"drawn":"passed",card};
 }
 cpuMove(){
  if(this.over||this.turn!==1||this.awaitingSuit)return {ok:false,reason:"CPU cannot move"};
  const hand=this.hands[1];
  let index=hand.findIndex(c=>c.r!=="8"&&this.canPlay(c));
  if(index<0)index=hand.findIndex(c=>this.canPlay(c));
  let drawn=null;
  if(index<0){
   drawn=this.drawFor(1);
   if(drawn)index=hand.findIndex(c=>this.canPlay(c));
  }
  if(index>=0){
   const result=this.play(1,index);
   return {...result,drawn};
  }
  this.turn=0;this.moves++;
  this.stalled=drawn?0:this.stalled+1;
  if(this.stalled>=2){this.over=true;this.winner=null;return {ok:true,kind:"draw",drawn};}
  return {ok:true,kind:"passed",drawn};
 }
 checkIntegrity(){
  const cards=[...this.deck,...this.hands[0],...this.hands[1],...this.pile];
  const ids=cards.map(cardLabel);
  return cards.length===52&&new Set(ids).size===52&&!this.over&&(!this.awaitingSuit||this.turn===0);
 }
}
