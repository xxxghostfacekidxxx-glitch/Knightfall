import {CinderEightsGame,SUITS,cardLabel} from "./engine.mjs";
const $=id=>document.getElementById(id);
const main=$("eights-root"),status=$("status"),hand=$("hand"),choose=$("choose");
const KEY="ashfall:cinder-eights:record:v2";
let game=null,timer=null,generation=0,playingRound=false,focusMode=false,hotseat=false,covered=false;
let record={you:0,cpu:0,player2:0};
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||"{}");
 for(const who of ["you","cpu","player2"])if(Number.isSafeInteger(raw?.[who])&&raw[who]>=0&&raw[who]<=1000000)record[who]=raw[who];
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
 if(!game.over||game.winner===null)return;
 const who=game.winner===0?"you":hotseat?"player2":"cpu";
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
 btn.disabled=game.over||covered||(!hotseat&&game.turn!==0)||game.awaitingSuit||!game.canPlay(card);
 btn.addEventListener("click",()=>humanPlay(i));
 return btn;
}
function render(note){
 wins();
 const activePlayer=hotseat?game.turn:0,opponent=1-activePlayer,humanTurn=hotseat||game.turn===0;
 $("mode-eyebrow").textContent=hotseat?"LOCAL CARD GAME / PASS-AND-PLAY DUEL":"SOLO CARD GAME / YOU VS THE CPU";
 $("mode-description").textContent=hotseat?"Trade the device between turns, hide each hand during the pass, and race to empty your cards. All style, zero actual gambling.":"Match suit or rank, throw wild Eights to change the rules, and empty your hand before the CPU does. All style, zero actual gambling.";
 $("opponent-name").textContent=hotseat?"PLAYER "+(opponent+1)+" · HAND HIDDEN":"THE COMPUTER · AN EXTREMELY SMUG OPPONENT";
 $("count-opponent-label").textContent=hotseat?"PLAYER "+(opponent+1):"CPU";
 $("opponent-wins-label").textContent=hotseat?"PLAYER 2 VICTORIES":"CPU VICTORIES";
 $("hand-owner").textContent=hotseat?"♠ PLAYER "+(activePlayer+1)+" HAND":"♠ YOUR HAND";
 $("pass-screen").hidden=!covered;
 $("pass-copy").textContent="Hand the device to Player "+(game.turn+1)+". Their cards stay hidden until they are ready.";
 $("pass-ready").textContent="Player "+(game.turn+1)+" is ready · show hand";
 $("count-deck").textContent=String(game.remaining);
 $("count-cpu").textContent=String(game.hands[opponent].length);
 $("count-hand").textContent=String(game.hands[activePlayer].length);
 $("active-suit").textContent=game.suit;
 $("round-moves").textContent=String(game.moves);
 $("turn-indicator").textContent=game.over?"ROUND FINISHED":covered?"PASS THE DEVICE":game.awaitingSuit?"CHOOSE THE SUIT":humanTurn?(hotseat?"PLAYER "+(activePlayer+1)+" TURN":"YOUR TURN"):"CPU THINKING";
 $("turn-indicator").className="eights-state "+(humanTurn&&!game.over&&!covered?"is-turn":"");
 const top=game.top,discard=$("top-card");
 discard.className="playing-card eights-discard "+(top.s==="♥"||top.s==="♦"?"red":"black");
 discard.replaceChildren();
 const corner=document.createElement("span");corner.className="corner";corner.textContent=top.r;
 const icon=document.createElement("strong");icon.className="suit";icon.textContent=top.s;
 const foot=document.createElement("small");foot.textContent="DISCARD";
 discard.append(corner,icon,foot);
 hand.replaceChildren(...(covered?[]:game.hands[activePlayer].map(cardElement)));
 $("cpu-hand").replaceChildren();
 for(let i=0;i<game.hands[opponent].length;i++){
  const back=document.createElement("span");back.className="playing-card back";
  back.setAttribute("aria-hidden","true");back.textContent="✦";$("cpu-hand").append(back);
 }
 choose.replaceChildren();
 if(game.awaitingSuit&&!game.over&&!covered){
  const label=document.createElement("strong");label.textContent="YOUR EIGHT, YOUR RULES · PICK A SUIT";choose.append(label);
  for(const suit of SUITS){
   const btn=document.createElement("button");btn.type="button";btn.textContent=suit;
   btn.className="eights-suit-btn "+(suit==="♥"||suit==="♦"?"red":"");
   btn.setAttribute("aria-label","Choose "+({ "♠":"spades","♥":"hearts","♦":"diamonds","♣":"clubs"}[suit]));
   btn.addEventListener("click",()=>selectSuit(suit));
   choose.append(btn);
  }
 }
 $("draw").disabled=game.over||covered||(!hotseat&&game.turn!==0)||game.awaitingSuit;
 if(note)announce(note);
 else if(game.over)announce(game.winner===null?"DRAW. No cards left to draw and neither player can move.":game.winner===0?"YOU WIN! The CPU's ego has been legally declared missing.":"CPU WINS. Its smugness is almost unbearable.");
 else if(game.awaitingSuit)announce("Eight played. Choose a suit to make the CPU miserable.");
 else if(game.turn===0)announce("Match the suit or rank. Eights are wild. Swipe your hand to see all cards.");
 else announce("CPU is choosing its next terrible idea…");
}
function queueCpu(){
 if(hotseat)return;
 const token=++generation;
 clearTimeout(timer);
 timer=setTimeout(()=>{
  timer=null;if(token!==generation||game.over||game.turn!==1)return;
  const move=game.cpuMove();
  if(move.kind==="win")scoreRound();
  render(move.kind==="draw"?"DRAW. Neither player can make another move.":move.kind==="win"?"CPU played "+name(move.card)+" and emptied its hand.":move.kind==="passed"?"CPU passed. Your turn.":"CPU played "+name(move.card)+(move.card.r==="8"?", switched to "+game.suit:"")+".");
 },460);
}
function handoff(note){covered=true;render(note);$("pass-ready").focus();}
function humanPlay(index){
 const player=hotseat?game.turn:0;
 const move=game.play(player,index,{humanWild:hotseat||player===0});
 if(!move.ok)return;
 registerProgress();
 if(move.kind==="win"){scoreRound();render("YOU WIN! Your last card was "+name(move.card)+".");return;}
 if(move.kind==="choose-suit"){render();return;}
 if(hotseat){handoff("Player "+(player+1)+" played "+name(move.card)+". Pass the table to Player "+(game.turn+1)+".");return;}
 render("You played "+name(move.card)+".");
 queueCpu();
}
function selectSuit(suit){
 const player=hotseat?game.turn:0;
 if(!game.chooseSuit(suit,player))return;
 if(hotseat){handoff("Player "+(player+1)+" changed the suit. Pass the table to Player "+(game.turn+1)+".");return;}
 render("You changed the suit to "+suit+". The CPU is probably filing a complaint.");
 queueCpu();
}
function draw(){
 const player=hotseat?game.turn:0;
 const move=game.drawPlayer(player);
 if(!move.ok)return;
 registerProgress();
 render(move.kind==="draw"?"DRAW. Neither player can make another move.":move.kind==="drawn"?(hotseat?"Player "+(player+1)+" drew one card and passed.":"You drew one card and passed."):(hotseat?"Player "+(player+1)+" passed the turn.":"No cards left to draw; your turn passes."));
 if(hotseat&&!game.over){handoff("Player "+(player+1)+" passed. Hand the device to Player "+(game.turn+1)+".");return;}
 if(!game.over)queueCpu();
}
function newGame(){
 clearTimeout(timer);timer=null;generation++;playingRound=false;
 hotseat=$("game-mode").value==="local";covered=false;
 game=new CinderEightsGame();
 render(hotseat?"Fresh deck. Player 1 starts. Pass the device after every turn.":"Fresh deck. Seven cards each. Your move.");
}
$("draw").addEventListener("click",draw);
$("new").addEventListener("click",newGame);
$("game-mode").addEventListener("change",newGame);
$("pass-ready").addEventListener("click",()=>{covered=false;render("Player "+(game.turn+1)+", your hand is ready.");$("hand").querySelector("button")?.focus();});
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
