import {CinderEightsGame,SUITS,cardLabel} from "./engine.mjs";
const $=id=>document.getElementById(id);
const main=$("eights-root"),status=$("status"),hand=$("hand"),choose=$("choose");
const KEY="ashfall:cinder-eights:record:v2";
let game=new CinderEightsGame(),timer=null,generation=0,playingRound=false,focusMode=false;
let record={you:0,cpu:0};
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||"{}");
 for(const who of ["you","cpu"])if(Number.isSafeInteger(raw?.[who])&&raw[who]>=0&&raw[who]<=1000000)record[who]=raw[who];
}catch{}
const name=card=>card?.r==="8"?"Wild Eight "+card.s:cardLabel(card);
function announce(text){
 status.textContent=text;
 const win=game.over;
 status.classList.toggle("is-winner",win&&game.winner===0);
 status.classList.toggle("is-loss",win&&game.winner===1);
}
function wins(){
 $("you-wins").textContent=record.you;
 $("cpu-wins").textContent=record.cpu;
}
function scoreRound(){
 if(!game.over)return;
 const who=game.winner===0?"you":"cpu";
 record[who]=Math.min(1000000,record[who]+1);
 try{localStorage.setItem(KEY,JSON.stringify(record))}catch{}
 wins();
}
function registerProgress(){
 if(playingRound)return;
 playingRound=true;
 window.AshFallDeckSkins?.recordDeal("cinder-eights");
}
function cardElement(card,i){
 const btn=document.createElement("button");btn.type="button";
 btn.className="af-deck-card "+(card.s==="♥"||card.s==="♦"?"red":"black");
 btn.dataset.index=String(i);
 btn.setAttribute("aria-label","Card "+(i+1)+": "+name(card)+(game.canPlay(card)?" playable":" unavailable"));
 const mark=document.createElement("span");mark.className="eights-card-value";mark.textContent=card.r;
 const suit=document.createElement("span");suit.className="eights-card-suit";suit.textContent=card.s;
 const foot=document.createElement("span");foot.className="eights-card-foot";foot.textContent="KF / "+String(i+1).padStart(2,"0");
 btn.append(mark,suit,foot);
 btn.disabled=game.over||game.turn!==0||game.awaitingSuit||!game.canPlay(card);
 btn.addEventListener("click",()=>humanPlay(i));
 return btn;
}
function render(note){
 wins();
 $("count-deck").textContent=String(game.remaining);
 $("count-cpu").textContent=String(game.hands[1].length);
 $("count-hand").textContent=String(game.hands[0].length);
 $("active-suit").textContent=game.suit;
 $("round-moves").textContent=String(game.moves);
 $("turn-indicator").textContent=game.over?"ROUND FINISHED":game.awaitingSuit?"CHOOSE THE SUIT":game.turn===0?"YOUR TURN":"CPU THINKING";
 $("turn-indicator").className="eights-state "+(game.turn===0&&!game.over?"is-turn":"");
 const top=game.top,discard=$("top-card");
 discard.className="playing-card eights-discard "+(top.s==="♥"||top.s==="♦"?"red":"black");
 discard.replaceChildren();
 const corner=document.createElement("span");corner.className="corner";corner.textContent=top.r;
 const icon=document.createElement("strong");icon.className="suit";icon.textContent=top.s;
 const foot=document.createElement("small");foot.textContent="DISCARD";
 discard.append(corner,icon,foot);
 hand.replaceChildren(...game.hands[0].map(cardElement));
 $("cpu-hand").replaceChildren();
 for(let i=0;i<game.hands[1].length;i++){
  const back=document.createElement("span");back.className="playing-card back";
  back.setAttribute("aria-hidden","true");back.textContent="✦";$("cpu-hand").append(back);
 }
 choose.replaceChildren();
 if(game.awaitingSuit&&!game.over){
  const label=document.createElement("strong");label.textContent="YOUR EIGHT, YOUR RULES · PICK A SUIT";choose.append(label);
  for(const suit of SUITS){
   const btn=document.createElement("button");btn.type="button";btn.textContent=suit;
   btn.className="eights-suit-btn "+(suit==="♥"||suit==="♦"?"red":"");
   btn.setAttribute("aria-label","Choose "+({ "♠":"spades","♥":"hearts","♦":"diamonds","♣":"clubs"}[suit]));
   btn.addEventListener("click",()=>selectSuit(suit));
   choose.append(btn);
  }
 }
 $("draw").disabled=game.over||game.turn!==0||game.awaitingSuit;
 if(note)announce(note);
 else if(game.over)announce(game.winner===0?"YOU WIN! The CPU's ego has been legally declared missing.":"CPU WINS. Its smugness is almost unbearable.");
 else if(game.awaitingSuit)announce("Eight played. Choose a suit to make the CPU miserable.");
 else if(game.turn===0)announce("Match the suit or rank. Eights are wild. Swipe your hand to see all cards.");
 else announce("CPU is choosing its next terrible idea…");
}
function queueCpu(){
 const token=++generation;
 clearTimeout(timer);
 timer=setTimeout(()=>{
  timer=null;if(token!==generation||game.over||game.turn!==1)return;
  const move=game.cpuMove();
  if(move.kind==="win")scoreRound();
  render(move.kind==="win"?"CPU played "+name(move.card)+" and emptied its hand.":move.kind==="passed"?"CPU passed. Your turn.":"CPU played "+name(move.card)+(move.card.r==="8"?", switched to "+game.suit:"")+".");
 },460);
}
function humanPlay(index){
 const move=game.play(0,index);
 if(!move.ok)return;
 registerProgress();
 if(move.kind==="win"){scoreRound();render("YOU WIN! Your last card was "+name(move.card)+".");return;}
 if(move.kind==="choose-suit"){render();return;}
 render("You played "+name(move.card)+".");
 queueCpu();
}
function selectSuit(suit){
 if(!game.chooseSuit(suit))return;
 render("You changed the suit to "+suit+". The CPU is probably filing a complaint.");
 queueCpu();
}
function draw(){
 const move=game.drawHuman();
 if(!move.ok)return;
 registerProgress();
 render(move.kind==="drawn"?"You drew one card and passed.":"No cards left to draw; your turn passes.");
 queueCpu();
}
function newGame(){
 clearTimeout(timer);timer=null;generation++;playingRound=false;
 game=new CinderEightsGame();
 render("Fresh deck. Seven cards each. Your move.");
}
$("draw").addEventListener("click",draw);
$("new").addEventListener("click",newGame);
let isNative=()=>document.fullscreenElement===main||document.webkitFullscreenElement===main;
function updateFull(){
 const active=isNative()||focusMode;
 $("full").textContent=active?"⤡ Exit fullscreen":"⛶ Fullscreen";
 $("full").setAttribute("aria-pressed",String(active));
 $("full").setAttribute("aria-label",active?"Exit fullscreen":"Enter fullscreen");
 document.body.classList.toggle("eights-focus",focusMode);
}
async function toggleFull(){
 if(isNative()){
  try{await (document.exitFullscreen?.()||document.webkitExitFullscreen?.())}catch(error){console.warn("Fullscreen exit failed",error)}
 }else if(focusMode)focusMode=false;
 else{
  try{
   if(main.requestFullscreen)await main.requestFullscreen({navigationUI:"hide"});
   else if(main.webkitRequestFullscreen)main.webkitRequestFullscreen();
   else focusMode=true;
  }catch(error){focusMode=true}
 }
 updateFull();
}
$("full").addEventListener("click",toggleFull);
document.addEventListener("fullscreenchange",updateFull);
document.addEventListener("webkitfullscreenchange",updateFull);
document.addEventListener("keydown",event=>{
 if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||""))return;
 if(event.key==="Escape"&&focusMode){focusMode=false;updateFull();return;}
 if(event.ctrlKey||event.altKey||event.metaKey)return;
 if(event.key==="f"||event.key==="F"){event.preventDefault();void toggleFull();return;}
 if(event.key==="n"||event.key==="N"){event.preventDefault();newGame();return;}
 if(event.key==="d"||event.key==="D"){if(!game.over&&game.turn===0){event.preventDefault();draw();}return;}
 const n=Number(event.key);
 if(n>=1&&n<=9&&!game.awaitingSuit&&!game.over&&game.turn===0){
  event.preventDefault();humanPlay(n-1);
 }
});
newGame();
