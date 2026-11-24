"use strict";
const $=id=>document.getElementById(id);let interval=null,deadline=0;
function render(n){$("clock").textContent=String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
function stop(message){clearInterval(interval);interval=null;$("start").disabled=false;$("duration").disabled=false;$("session-status").textContent=message}
function tick(){const n=Math.max(0,Math.ceil((deadline-Date.now())/1000));render(n);if(!n)stop("Reflection complete.")}
$("duration").onchange=()=>render(Number($("duration").value));
$("start").onclick=()=>{if(interval!==null)return;deadline=Date.now()+Number($("duration").value)*1000;$("start").disabled=true;$("duration").disabled=true;$("session-status").textContent="Reflection started.";interval=setInterval(tick,250);tick()};
$("stop").onclick=()=>{stop("Reflection stopped.");render(Number($("duration").value))};
addEventListener("pagehide",()=>clearInterval(interval));