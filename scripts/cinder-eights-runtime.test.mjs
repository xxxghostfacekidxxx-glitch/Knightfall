import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CinderEightsGame,SUITS,RANKS,cardLabel,newDeck,shuffle} from "../public/arcade/hosted/cinder-eights/engine.mjs";
const read=p=>readFileSync(p,"utf8");
const gameHTML=read("public/arcade/hosted/cinder-eights/index.html");
const frontend=read("public/arcade/hosted/cinder-eights/game.js");
const css=read("public/arcade/hosted/cinder-eights/game.css");
function randomSeed(seed){
 return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
}
const count=g=>[...g.deck,...g.hands[0],...g.hands[1],...g.pile].length;
test("52 original cards are unique; all seeds deal 7 each and a non-wild opening",()=>{
 assert.equal(SUITS.length,4);assert.equal(RANKS.length,13);
 assert.equal(newDeck().length,52);
 assert.equal(new Set(newDeck().map(cardLabel)).size,52);
 assert.equal(shuffle(newDeck(),()=>.5).length,52);
 for(let seed=1;seed<=45;seed++){
  const game=new CinderEightsGame(randomSeed(seed));
  assert.equal(game.hands[0].length,7);
  assert.equal(game.hands[1].length,7);
  assert.notEqual(game.top.r,"8");
  assert.equal(game.suit,game.top.s);
  assert.equal(game.turn,0);
  assert.equal(count(game),52);
  assert.equal(game.checkIntegrity(),true);
 }
});
test("human and CPU turns always follow the same legal card rules",()=>{
 for(let seed=1;seed<=50;seed++){
  const g=new CinderEightsGame(randomSeed(seed));
  let actions=0;
  while(!g.over&&actions<1500){
   actions++;
   if(g.turn===0){
    const index=g.hands[0].findIndex(c=>g.canPlay(c));
    const result=index>=0?g.play(0,index):g.drawHuman();
    assert.equal(result.ok,true);
    if(g.awaitingSuit){
     assert.equal(g.chooseSuit("🍕"),false);
     assert.equal(g.turn,0);
     const counts=SUITS.map(s=>[s,g.hands[0].filter(c=>c.s===s).length]).sort((a,b)=>b[1]-a[1]);
     assert.equal(g.chooseSuit(counts[0][0]),true);
    }
   }else{
    const move=g.cpuMove();
    assert.equal(move.ok,true);
   }
   assert.equal(count(g),52);
   if(!g.over)assert.equal(g.checkIntegrity(),true);
  }
  assert.equal(g.over,true,"Seed "+seed+" should eventually finish with a winner or stalemate");
  assert.ok(g.winner===0||g.winner===1||g.winner===null);
  assert.ok(actions<1500);
 }
});
test("wild Eight requires human suit choice; CPU selects majority suit",()=>{
 const g=new CinderEightsGame(randomSeed(11));
 g.turn=0;g.over=false;
 g.hands[0]=[{r:"8",s:"♣"},{r:"A",s:"♥"}];
 let result=g.play(0,0);
 assert.equal(result.ok,true);
 assert.equal(result.kind,"choose-suit");
 assert.equal(g.awaitingSuit,true);
 assert.equal(g.play(0,0).ok,false);
 assert.equal(g.drawHuman().ok,false);
 assert.equal(g.chooseSuit("♦"),true);
 assert.equal(g.suit,"♦");
 assert.equal(g.turn,1);
 const h=new CinderEightsGame(randomSeed(22));
 h.turn=1;h.over=false;h.suit="♠";h.pile=[{r:"Q",s:"♠"}];
 h.hands[1]=[{r:"8",s:"♣"},{r:"A",s:"♥"},{r:"J",s:"♥"}];
 result=h.cpuMove();
 assert.equal(result.ok,true);
 assert.equal(result.card.r,"8");
 assert.equal(h.suit,"♥");
 assert.equal(h.turn,0);
});
test("a deadlocked empty deck ends as a tie, never an infinite pass loop",()=>{
 const g=new CinderEightsGame(randomSeed(3));
 g.deck=[];g.pile=[{r:"A",s:"♠"}];g.hands=[[{r:"2",s:"♥"}],[{r:"3",s:"♦"}]];g.suit="♠";g.turn=0;
 let r=g.drawHuman();assert.equal(r.kind,"passed");assert.equal(g.over,false);
 r=g.cpuMove();assert.equal(r.kind,"draw");assert.equal(g.over,true);assert.equal(g.winner,null);
 assert.equal(g.cpuMove().ok,false);assert.equal(g.drawHuman().ok,false);
});
test("mobile cabinet has accessible card controls, fullscreen and shared Deck Locker",()=>{
 for(const id of ["eights-root","full","new","draw","hand","choose","cpu-hand","top-card","active-suit","status","count-cpu","count-hand","count-deck","you-wins","cpu-wins"]){
  assert.match(gameHTML,new RegExp('id="'+id+'"'),id+" missing");
 }
 assert.match(gameHTML,/card-deck-skins\.css/);
 assert.match(gameHTML,/card-deck-skins\.js/);
 assert.match(frontend,/from "\.\/engine\.mjs"/);
 assert.match(frontend,/window\.AshFallDeckSkins\?\.recordDeal\("cinder-eights"\)/);
 assert.match(frontend,/requestFullscreen/);
 assert.match(frontend,/eights-focus/);
 assert.match(frontend,/aria-pressed/);
 assert.match(frontend,/newGame\(\)/);
 assert.match(css,/@media\(max-width:470px\)/);
 assert.match(css,/scroll-snap-type:x proximity/);
 assert.match(css,/#eights-root:fullscreen/);
});
