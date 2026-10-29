/* Progressive menu layer: existing gameplay IDs and event handlers remain untouched. */
(()=>{"use strict";
const shell=document.querySelector(".shell"),header=shell?.querySelector("header"),aside=document.querySelector(".layout > aside");
if(!shell||!header||!aside)return;
const sections=[
["Party",aside.querySelector("#party")?.closest(".panel")],
["Trainer",aside.querySelector("#trainer")?.closest(".panel")],
["Missions",aside.querySelector(".bureau-panel")],
["Story",aside.querySelector(".story-panel")],
["Settlements",aside.querySelector(".settlement-panel")],
["Commanders",aside.querySelector(".commander-panel")],
["Bestiary",aside.querySelector("#journal")?.closest(".panel")],
["Legends",aside.querySelector("#legendary-creatures")?.closest(".panel")],
["Online",aside.querySelector("#endpoint")?.closest(".panel")],
["About",aside.querySelector(".controller-panel")]
].filter(([,panel])=>panel);
const toggle=document.createElement("button");toggle.id="rpg-menu-toggle";toggle.textContent="☰ MENU";toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-controls","rpg-menu-tabs");header.append(toggle);
const close=document.createElement("button");close.id="rpg-menu-close";close.textContent="✕ CLOSE";close.setAttribute("aria-label","Close pause menu");shell.append(close);
const tabs=document.createElement("nav");tabs.id="rpg-menu-tabs";tabs.setAttribute("aria-label","Pause menu");aside.prepend(tabs);
let active=0,previousFocus=null;
function choose(index){active=index;sections.forEach(([name,panel],i)=>{panel.classList.toggle("rpg-active-panel",i===index);tabs.children[i]?.setAttribute("aria-selected",String(i===index));});}
sections.forEach(([name],i)=>{const b=document.createElement("button");b.textContent=name;b.type="button";b.setAttribute("role","tab");b.addEventListener("click",()=>choose(i));tabs.append(b);});
tabs.setAttribute("role","tablist");choose(0);
function setOpen(open){if(open&& !document.getElementById("battle-panel")?.hidden)return;document.body.classList.toggle("rpg-menu-open",open);toggle.setAttribute("aria-expanded",String(open));if(open){previousFocus=document.activeElement;close.focus();}else{(previousFocus instanceof HTMLElement?previousFocus:toggle).focus();}}
toggle.addEventListener("click",()=>setOpen(!document.body.classList.contains("rpg-menu-open")));close.addEventListener("click",()=>setOpen(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("rpg-menu-open")){e.preventDefault();setOpen(false);}if(document.body.classList.contains("rpg-menu-open")&&["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key)&&!(e.target instanceof HTMLInputElement)){e.stopImmediatePropagation();}});
const battle=document.getElementById("battle-panel");if(battle){document.querySelector(".layout")?.after(battle);const observer=new MutationObserver(()=>{if(!battle.hidden&&document.body.classList.contains("rpg-menu-open"))setOpen(false);});observer.observe(battle,{attributes:true,attributeFilter:["hidden"]});}
})();
