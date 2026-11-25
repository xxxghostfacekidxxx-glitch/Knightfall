"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const clock=$("clock"), duration=$("duration"), start=$("start"), stop=$("stop"), status=$("session-status");
 if(!clock||!duration||!start||!stop||!status)return;
 let interval=null,deadline=0,remaining=0,state="idle";
 const selected=()=>[60,300,600].includes(Number(duration.value))?Number(duration.value):60;
 function render(n){clock.textContent=String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
 function controls(){start.disabled=state==="running";start.textContent=state==="paused"?"Resume":"Start";duration.disabled=state==="running"||state==="paused";stop.disabled=state==="idle";pause.disabled=state!=="running"}
 function clear(){if(interval!==null)clearInterval(interval);interval=null}
 function finish(message){clear();state="idle";remaining=0;status.textContent=message;controls()}
 function tick(){if(state!=="running")return;remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));render(remaining);if(!remaining)finish("Reflection complete.")}
 function suspend(message){if(state!=="running")return;tick();if(state!=="running")return;clear();state="paused";status.textContent=message;controls()}
 const pause=document.createElement("button");pause.type="button";pause.textContent="Pause";stop.before(pause);
 duration.addEventListener("change",()=>{if(state==="idle")render(selected())});
 start.addEventListener("click",()=>{if(state==="running")return;if(state!=="paused")remaining=selected();deadline=Date.now()+remaining*1000;state="running";status.textContent="Reflection in progress.";controls();interval=setInterval(tick,250);tick()});
 pause.addEventListener("click",()=>suspend("Reflection paused. Resume when ready."));
 stop.addEventListener("click",()=>{finish("Reflection stopped.");render(selected())});
 addEventListener("pagehide",()=>suspend("Reflection paused when leaving the chamber."));
 addEventListener("pageshow",()=>{if(state==="idle")render(selected());else if(state==="paused")render(remaining);controls()});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick()});
 render(selected());controls();
})();
