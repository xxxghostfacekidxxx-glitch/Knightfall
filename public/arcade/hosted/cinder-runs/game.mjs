import {newGame,move,botMove} from "./engine.mjs";
const $=id=>document.getElementById(id);
let state,selected=new Set(),generation=0;
const label=c=>c.element+" "+c.rank;
function render(){
 $("status").textContent=state.winner!==null?(state.winner===0?"You forged victory!":"Opponent "+state.winner+" wins."):""+(state.turn===0?(state.phase==="draw"?"Draw one card.":"Forge a run or discard one card."):"Opponent "+state.turn+" is playing.");
 $("scores").replaceChildren(...state.scores.map((score,i)=>{const el=document.createElement("p");el.textContent=(i?"Opponent "+i:"You")+" · "+score+" points · "+state.hands[i].length+" cards";return el;}));
 $("hand").replaceChildren(...state.hands[0].map(card=>{const b=document.createElement("button");b.className="card "+card.element;b.textContent=label(card);b.setAttribute("aria-pressed",String(selected.has(card.id)));b.disabled=state.turn!==0||state.phase!=="meld";b.onclick=()=>{if(selected.has(card.id))selected.delete(card.id);else if(selected.size<3)selected.add(card.id);render();};return b;}));
 $("runs").replaceChildren(...state.runs[0].map(run=>{const p=document.createElement("p");p.textContent=run.map(label).join(" · ");return p;}));
 const active=state.winner===null&&state.turn===0;
 $("draw").disabled=!active||state.phase!=="draw"||(!state.deck.length&&state.discard.length<2);
 $("take").disabled=!active||state.phase!=="draw"||!state.discard.length;
 $("take").textContent="Take discard"+(state.discard.length?": "+label(state.discard.at(-1)):"");
 $("meld").disabled=!active||state.phase!=="meld"||selected.size!==3;
 $("discard").disabled=!active||state.phase!=="meld"||selected.size!==1;
}
function opponents(token){
 if(token!==generation||state.winner!==null||state.turn===0)return;
 setTimeout(()=>{if(token!==generation)return;const next=botMove(state);if(!next){$("status").textContent="No legal draw remains. Start a new table.";return;}state=next;render();opponents(token);},450);
}
function act(action){const next=move(state,0,action);if(!next){$("status").textContent="Invalid move. Runs require three consecutive ranks of the same element.";return;}state=next;selected.clear();render();opponents(generation);}
$("draw").onclick=()=>act({type:"draw",source:"deck"});
$("take").onclick=()=>act({type:"draw",source:"discard"});
$("meld").onclick=()=>act({type:"meld",ids:[...selected]});
$("discard").onclick=()=>act({type:"discard",id:[...selected][0]});
function restart(){generation++;state=newGame(Number($("players").value));selected.clear();render();}
$("restart").onclick=restart;restart();
