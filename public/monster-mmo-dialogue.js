(()=>{
"use strict";
const box=document.getElementById("field-dialogue"),text=document.getElementById("field-dialogue-text"),speaker=document.getElementById("field-dialogue-speaker"),next=document.getElementById("field-dialogue-next");
if(!box||!text||!speaker||!next)return;
const queue=[];let current=null,timer=0,visible=0,full="",previousFocus=null;
const named=[["MOX THE UNLICENSED MAYOR","📢"],["VEX THE INFERNAL CLERK","😈"],["AMBASSADOR QUIBBLE","👽"]];
const reducedMotion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
function stopTyping(){if(timer){clearInterval(timer);timer=0}}
function reveal(){stopTyping();visible=full.length;text.textContent=full;next.textContent="Continue ▸"}
function dismiss(){stopTyping();box.hidden=true;document.body.classList.remove("dialogue-open");current=null;if(queue.length){show();return}if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null}
function advance(){if(!current)return;if(visible<full.length){reveal();return}dismiss()}
function show(){
 if(current||!queue.length)return;
 current=queue.shift();full=current.message;visible=0;
 speaker.textContent=current.name;
 box.querySelector(".field-dialogue-portrait").textContent=current.icon;
 text.textContent="";
 box.hidden=false;document.body.classList.add("dialogue-open");
 if(!previousFocus)previousFocus=document.activeElement;
 next.textContent="Skip ▸";next.focus();
 if(reducedMotion||full.length<16){reveal();return}
 timer=setInterval(()=>{
  visible=Math.min(full.length,visible+3);
  text.textContent=full.slice(0,visible);
  if(visible>=full.length)reveal();
 },25);
}
next.addEventListener("click",advance);
document.addEventListener("keydown",e=>{
 if(box.hidden)return;
 if(["Enter"," ","Escape"].includes(e.key)&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){
  e.preventDefault();e.stopImmediatePropagation();advance();
 }
},true);
document.addEventListener("hell-high-orbit:log",e=>{
 const message=String(e.detail?.message||"");if(!message)return;
 const npc=named.find(([name])=>message.startsWith(name+":"));
 const important=npc||/EVOLVED|LEGENDARY|CAPTURED|treaty signed|commander defeated/i.test(message);
 if(!important)return;
 queue.push({name:npc?.[0]||"FIELD TRANSMISSION",icon:npc?.[1]||"📡",message:npc?message.slice(npc[0].length+1).trim():message});
 show();
});
})();