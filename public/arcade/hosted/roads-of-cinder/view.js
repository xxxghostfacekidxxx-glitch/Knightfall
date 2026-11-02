(()=>{"use strict";
const {RoadsGame,PATH}=window.RoadsOfCinder,$=id=>document.getElementById(id),key="ashfall:roads-of-cinder:v2";
const ICONS={start:"🚦",payday:"💰",event:"🎴",career:"🎓",family:"💚",choice:"⚡",expense:"💸",home:"🏡",fork:"🛣️",invest:"📈",tax:"🧾",retire:"🌅"};
let game=new RoadsGame(),rotation=0,animating=false,turnToken=0;
const defaults=["Ash","Ember","Ruin","Cinder"];
function nameFields(){const n=Number($("player-count").value)||2,box=$("player-names");const previous=Array.from(box.querySelectorAll("input"),e=>e.value);box.replaceChildren();for(let i=0;i<n;i++){const label=document.createElement("label");label.textContent="P"+(i+1);const input=document.createElement("input");input.maxLength=24;input.setAttribute("aria-label","Player "+(i+1)+" name");input.value=previous[i]||game.players[i]?.name||defaults[i];label.append(input);box.append(label)}}
$("player-count").addEventListener("change",nameFields);
const fmt=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
function save(){try{localStorage.setItem(key,JSON.stringify(game.snapshot()));$("save-status").textContent="Progress saved on this device."}catch{$("save-status").textContent="Browser storage unavailable: this run is temporary."}}
function render(){
 const p=game.player();$("turn-label").textContent=game.finished?"THE JOURNEY ENDS":p.name+(game.pending?" · decision":" · spin the wheel");
 $("round").textContent=String(game.round+1);$("spin-result").textContent=game.lastSpin||"—";
 $("spin").disabled=game.finished||!!game.pending||animating;
 $("message").textContent=game.finished?"Everyone has retired. Count your fortune.":game.pending?"Choose a path or decision before the next spin.":p.name+"'s turn. Spin to move along the road.";
 $("board-progress").textContent=PATH.length+" LIFE SPACES";
 const board=$("board");board.replaceChildren();
 for(let row=0;row<Math.ceil(PATH.length/6);row++){
  const positions=PATH.slice(row*6,row*6+6);
  if(row%2===1)positions.reverse();
  for(const tile of positions){
   const el=document.createElement("div");el.className="tile";el.dataset.kind=tile.kind;
   if(game.players.some(pl=>pl.pos===tile.index))el.classList.add("current");
   const no=document.createElement("small");no.textContent=tile.index===0?"START":tile.index===PATH.length-1?"FINISH":"SPACE "+tile.index;
   const icon=document.createElement("span");icon.className="symbol";icon.textContent=ICONS[tile.kind]||"✦";
   const name=document.createElement("span");name.className="label";name.textContent=tile.name;
   const pawns=document.createElement("div");pawns.className="pawns";
   game.players.forEach((pl,j)=>{if(pl.pos!==tile.index)return;const marker=document.createElement("span");marker.className="pawn";marker.style.background=pl.color;marker.textContent=j+1;marker.title=pl.name;pawns.append(marker)});
   el.append(no,icon,name,pawns);board.append(el);
  }
 }
 const players=$("players");players.replaceChildren();
 game.players.forEach((pl,i)=>{
  const article=document.createElement("article");article.className="player"+(!game.finished&&i===game.current?" active":"");article.style.setProperty("--player",pl.color);
  const heading=document.createElement("strong");heading.textContent=(i+1)+". "+pl.name+(pl.retired?" · RETIRED":"");
  const worth=document.createElement("div");worth.className="worth";worth.textContent=fmt(game.netWorth(pl));
  const career=document.createElement("p");career.textContent=pl.career+" · Salary "+fmt(pl.salary);
  const holdings=document.createElement("p");holdings.textContent="Cash "+fmt(pl.cash)+" · Property "+fmt(pl.house)+" · Debt "+fmt(pl.debt);
  const family=document.createElement("p");family.textContent="👶 "+pl.kids+" kids · ♥ "+pl.happiness+" happiness · 📈 "+fmt(pl.investments);
  article.append(heading,worth,career,holdings,family);players.append(article);
 });
 const panel=$("choices"),choices=$("choice-list");choices.replaceChildren();panel.hidden=!game.pending;
 if(game.pending){
  $("choice-title").textContent=({path:"CHOOSE YOUR START",career:"CHOOSE YOUR CAREER",family:"FAMILY DECISION",home:"PROPERTY DECISION",invest:"INVESTMENT DECISION",retire:"YOUR RETIREMENT",choice:"YOUR NEXT MOVE",fork:"TWO ROADS"}[game.pending.kind]||"MAKE A DECISION");
  game.options().forEach(o=>{const b=document.createElement("button");b.type="button";b.className="choice";
   const title=document.createElement("strong");title.textContent=o.title;
   const info=document.createElement("span");info.textContent=o.description;b.append(title,info);
   b.addEventListener("click",()=>{if(!game.choose(o.id))return;turnToken++;save();render()});choices.append(b)});
 }
 const log=$("game-log");log.replaceChildren();game.log.slice(0,12).forEach(message=>{
  const li=document.createElement("li");li.textContent=message;log.append(li)});
 const result=$("results");result.hidden=!game.finished;result.replaceChildren();
 if(game.finished){const h=document.createElement("h2");h.textContent="🏆 RETIREMENT STANDINGS";result.append(h);
  game.results().forEach((pl,i)=>{const row=document.createElement("article");const title=document.createElement("strong");title.textContent=(i===0?"🏆 ":"")+(i+1)+". "+pl.name+" · "+fmt(pl.netWorth);
   const detail=document.createElement("div");detail.className="tiny";detail.textContent="Cash "+fmt(pl.cash)+" · Property "+fmt(pl.property)+" · Investments "+fmt(pl.investments)+" · Debt "+fmt(pl.debt);
   row.append(title,detail);result.append(row)})}
}
function reset(){const n=Number($("player-count").value)||2;const names=Array.from($("player-names").querySelectorAll("input"),(e,i)=>e.value.trim().slice(0,24)||defaults[i]);game=new RoadsGame({names:names.slice(0,n)});turnToken++;rotation=0;$("spinner").style.transform="rotate(0deg)";$("wheel-number").textContent="★";save();render()}
$("new-game").addEventListener("click",()=>{if(game.round>0&&!game.finished&&!confirm("Start over and overwrite this saved game?"))return;reset()});
$("resume").addEventListener("click",()=>{try{const raw=JSON.parse(localStorage.getItem(key)||"null");const candidate=new RoadsGame({names:["Ash","Ember"]});
 if(!candidate.restore(raw))throw Error("No valid saved run");game=candidate;$("player-count").value=String(game.players.length);turnToken++;nameFields();render();$("save-status").textContent="Saved journey resumed."}catch{$("save-status").textContent="No valid saved journey found."}});
$("spin").addEventListener("click",()=>{
 if(game.pending||game.finished||animating)return;
 const rolled=game.spin();if(rolled===null)return;
 const token=++turnToken;animating=true;rotation+=720+rolled*36;$("spinner").style.transform="rotate("+rotation+"deg)";
 $("wheel-number").textContent=String(rolled);save();render();
 $("spin").disabled=true;
 const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
 const complete=()=>{if(token!==turnToken)return;animating=false;render()};
 if(reduced)complete();else setTimeout(complete,900);
});
try{const raw=JSON.parse(localStorage.getItem(key)||"null");if(raw&&game.restore(raw)){$("player-count").value=String(game.players.length);$("save-status").textContent="Saved journey restored.";}}catch{}
nameFields();render();
})();