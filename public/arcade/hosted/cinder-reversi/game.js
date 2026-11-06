import {CinderReversi,HUMAN,CPU,legalMoves,flipsFor} from "./engine.mjs";
const $=id=>document.getElementById(id);
const root=$("reversi-root"),board=$("board"),status=$("status");
const SAVE="ashfall:cinder-reversi:session:v2",RECORD="ashfall:cinder-reversi:record:v2";
function read(key){try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
const record={human:0,cpu:0,draws:0};
const rawRecord=read(RECORD);
if(rawRecord&&typeof rawRecord==="object")for(const key of Object.keys(record)){
 if(Number.isSafeInteger(rawRecord[key])&&rawRecord[key]>=0&&rawRecord[key]<=100000)record[key]=rawRecord[key];
}
let game=CinderReversi.restore(read(SAVE)),cpuTimer=null,token=0,hint=null,focusMode=false,hasScoredEnd=game.ended;
function save(){write(SAVE,game.serialize())}
function newGame(){clearTimeout(cpuTimer);token++;hint=null;hasScoredEnd=false;game.reset();save();render("Fresh board. Pink makes the opening move.");}
function recordFinish(){
 if(!game.ended||hasScoredEnd)return;
 hasScoredEnd=true;
 const field=game.winner===HUMAN?"human":game.winner===CPU?"cpu":"draws";
 record[field]=Math.min(100000,record[field]+1);
 write(RECORD,record);
}
function updateScores(){
 const {human,cpu}=game.counts;
 $("human-score").textContent=human;
 $("cpu-score").textContent=cpu;
 $("moves").textContent=game.moves;
 $("win-human").textContent=record.human;
 $("win-cpu").textContent=record.cpu;
 $("win-draws").textContent=record.draws;
 $("turn").textContent=game.ended?"MATCH COMPLETE":game.turn===HUMAN?"YOUR MOVE":"CPU THINKING";
 $("turn").dataset.side=game.turn===HUMAN?"human":"cpu";
 $("undo").disabled=!game.history.length;
 $("hint").disabled=game.ended||game.turn!==HUMAN||!game.humanMoves.length;
 $("difficulty").value=game.difficulty;
}
function render(message){
 const legal=game.ended||game.turn!==HUMAN?[]:game.humanMoves;
 const legalByPosition=new Map(legal.map(m=>[m.y*8+m.x,m]));
 board.replaceChildren();
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const index=y*8+x,value=game.board[index],move=legalByPosition.get(index);
  const button=document.createElement("button");button.type="button";
  button.className="rev-cell"+(move?" legal":"")+(game.lastMove?.x===x&&game.lastMove?.y===y?" last-move":"")+
   (hint?.x===x&&hint?.y===y?" hinted":"");
  const coordinate=String.fromCharCode(65+x)+(y+1);
  button.setAttribute("aria-label",coordinate+": "+(value===HUMAN?"pink piece":value===CPU?"black piece":move?"playable square, flips "+move.flipped.length+" piece"+(move.flipped.length!==1?"s":""):"empty square"));
  button.disabled=!move;
  if(move){button.addEventListener("click",()=>playHuman(x,y));button.title=coordinate+" · Flip "+move.flipped.length;}
  if(value){
   const disc=document.createElement("span");disc.className="rev-disc "+(value===HUMAN?"human":"cpu");
   disc.setAttribute("aria-hidden","true");button.append(disc);
  }
  board.append(button);
 }
 updateScores();
 if(message)status.textContent=message;
 else if(game.ended)status.textContent=game.winner===HUMAN?"You win. The computer is processing humiliation.":game.winner===CPU?"CPU wins. This is getting personal.":"Draw. Nobody gets bragging rights.";
 else status.textContent=game.turn===HUMAN?"Your move. Play a glowing square to flip pieces.":"CPU is choosing a move…";
 status.className="rev-status"+(game.ended&&game.winner===HUMAN?" won":game.ended?" finished":"");
}
function scheduleCpu(){
 clearTimeout(cpuTimer);
 if(game.ended||game.turn!==CPU||document.hidden)return;
 const current=++token;
 cpuTimer=setTimeout(()=>{
  if(current!==token||game.turn!==CPU||game.ended)return;
  const move=game.cpuMove();
  if(!move.ok){render("Computer couldn't move. It's your turn.");return}
  recordFinish();save();
  render(move.ended?undefined:move.passed?"CPU moved. You have no legal moves, so it plays again.": "Computer flipped "+move.flipped+" piece"+(move.flipped===1?"":"s")+". Your move.");
  if(!game.ended&&game.turn===CPU)scheduleCpu();
 },470);
}
function playHuman(x,y){
 const move=game.play(x,y,HUMAN);
 if(!move.ok)return;
 hint=null;recordFinish();save();
 render(move.ended?undefined:move.passed?"No CPU moves available. You play again.":"You flipped "+move.flipped+" piece"+(move.flipped===1?"":"s")+".");
 if(!game.ended&&game.turn===CPU)scheduleCpu();
}
function undo(){
 if(!game.history.length)return;
 clearTimeout(cpuTimer);token++;
 const credited=game.ended&&hasScoredEnd,winner=game.winner;
 if(!game.undoHumanTurn())return;
 // Undoing a finished match must also undo its local record, otherwise a
 // player can repeatedly undo/re-win one match to farm victories.
 if(credited){
  const field=winner===HUMAN?"human":winner===CPU?"cpu":"draws";
  record[field]=Math.max(0,record[field]-1);write(RECORD,record);
 }
 hint=null;hasScoredEnd=game.ended;save();
 render("Last turn reversed. Even the computer deserves a second chance.");
 if(game.turn===CPU)scheduleCpu();
}
function showHint(){
 if(game.ended||game.turn!==HUMAN)return;
 const moves=game.humanMoves;
 if(!moves.length)return;
 const corners=moves.filter(m=>(m.x===0||m.x===7)&&(m.y===0||m.y===7));
 const candidates=corners.length?corners:moves;
 hint=candidates.reduce((a,b)=>b.flipped.length>a.flipped.length?b:a);
 const coord=String.fromCharCode(65+hint.x)+(hint.y+1);
 render("Hint: "+coord+" flips "+hint.flipped.length+" piece"+(hint.flipped.length===1?"":"s")+". Corners are worth protecting.");
 board.children[hint.y*8+hint.x]?.focus();
}
$("reset").addEventListener("click",newGame);
$("undo").addEventListener("click",undo);
$("hint").addEventListener("click",showHint);
$("difficulty").addEventListener("change",event=>{
 if(game.setDifficulty(event.target.value)){save();render("CPU set to "+event.target.selectedOptions[0].textContent+".");}
});
function nativeFull(){return document.fullscreenElement===root||document.webkitFullscreenElement===root}
function updateFullscreen(){
 const active=nativeFull()||focusMode;
 document.body.classList.toggle("rev-focus",focusMode);
 $("full").textContent=active?"⤡ Exit fullscreen":"⛶ Fullscreen";
 $("full").setAttribute("aria-pressed",String(active));
 $("full").setAttribute("aria-label",active?"Exit fullscreen":"Enter fullscreen");
}
async function toggleFullscreen(){
 if(nativeFull()){
  try{await (document.exitFullscreen?.()||document.webkitExitFullscreen?.())}catch{}
 }else if(focusMode)focusMode=false;
 else{
  try{
   if(root.requestFullscreen)await root.requestFullscreen({navigationUI:"hide"});
   else if(root.webkitRequestFullscreen)root.webkitRequestFullscreen();
   else focusMode=true;
  }catch{focusMode=true}
 }
 updateFullscreen();
}
$("full").addEventListener("click",toggleFullscreen);
document.addEventListener("fullscreenchange",updateFullscreen);
document.addEventListener("webkitfullscreenchange",updateFullscreen);
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){clearTimeout(cpuTimer);token++;}
 else if(game.turn===CPU&&!game.ended)scheduleCpu();
});
document.addEventListener("keydown",event=>{
 if(/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||""))return;
 if(event.key==="Escape"&&focusMode){focusMode=false;updateFullscreen();return;}
 if(event.altKey||event.metaKey||event.ctrlKey)return;
 const key=event.key.toLowerCase();
 if(key==="f"){event.preventDefault();void toggleFullscreen();}
 if(key==="u"){event.preventDefault();undo();}
 if(key==="r"){event.preventDefault();newGame();}
 if(key==="h"){event.preventDefault();showHint();}
});
render();
if(!game.ended&&game.turn===CPU)scheduleCpu();