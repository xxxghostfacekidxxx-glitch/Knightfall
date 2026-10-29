(()=>{"use strict";
const menu=document.getElementById("game-menu"),toggle=document.getElementById("game-menu-toggle"),close=document.getElementById("game-menu-close"),backdrop=document.getElementById("game-menu-backdrop");
if(!menu||!toggle||!close||!backdrop)return;
const tabs=[...menu.querySelectorAll("[data-pause-tab]")],sections=[...menu.querySelectorAll("[data-pause-section]")];
const nav=menu.querySelector(".pause-tabs");
const content=document.createElement("div");content.className="pause-content";content.id="pause-content";content.setAttribute("role","region");content.setAttribute("aria-label","Selected game menu");
sections.forEach(section=>content.append(section));
menu.append(content);
nav?.setAttribute("aria-label","Pause menu categories");
tabs.forEach((tab,index)=>{tab.setAttribute("role","tab");tab.setAttribute("aria-controls","pause-content");tab.setAttribute("tabindex",index===0?"0":"-1");});
nav?.setAttribute("role","tablist");
let active="creatures",previousFocus=null;
const battleActive=()=>!document.getElementById("battle-panel")?.hidden;
const editable=()=>["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
function select(name){active=name;tabs.forEach(b=>{const selected=b.dataset.pauseTab===name;b.setAttribute("aria-selected",String(selected));b.tabIndex=selected?0:-1;});sections.forEach(s=>s.classList.toggle("pause-active",s.dataset.pauseSection===name));content.scrollTop=0;}
function setOpen(open){if(open&&(battleActive()||document.body.classList.contains("dialogue-open")||document.body.classList.contains("interior-open")))return;const wasOpen=menu.classList.contains("is-open");if(wasOpen===open)return;if(open)previousFocus=document.activeElement;menu.classList.toggle("is-open",open);menu.setAttribute("aria-hidden",String(!open));toggle.setAttribute("aria-expanded",String(open));backdrop.hidden=!open;document.body.classList.toggle("pause-open",open);if(open){select(active);close.focus();}else (previousFocus?.isConnected?previousFocus:toggle).focus();}
tabs.forEach(b=>b.addEventListener("click",()=>select(b.dataset.pauseTab)));
nav?.addEventListener("keydown",event=>{if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();event.stopPropagation();const index=tabs.indexOf(document.activeElement);const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowUp"||event.key==="ArrowLeft"?-1:1)+tabs.length)%tabs.length;select(tabs[next].dataset.pauseTab);tabs[next].focus();});
toggle.addEventListener("click",()=>setOpen(!menu.classList.contains("is-open")));
close.addEventListener("click",()=>setOpen(false));backdrop.addEventListener("click",()=>setOpen(false));
document.addEventListener("keydown",e=>{const opened=menu.classList.contains("is-open");if(opened){if(e.key==="Escape"){e.preventDefault();setOpen(false);}else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(e.key)&&!editable()&&!nav?.contains(document.activeElement)){e.stopImmediatePropagation();e.preventDefault();}else if(e.key==="Tab"){const focusable=[...menu.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)")].filter(el=>el.getClientRects().length);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}return;}if(!editable()&&!battleActive()&&(e.key==="m"||e.key==="M"||e.key==="Escape")){e.preventDefault();setOpen(true);}},true);
select(active);
})();
/* A handheld four-command battle interface, separate from the overworld pause menu. */
const battleTabs=[...document.querySelectorAll("[data-battle-tab]")];
const battleSections=[...document.querySelectorAll("[data-battle-section]")];
const battleHint=document.getElementById("battle-command-hint");
let lastLeadId=null,lastLeadHp=null;
function chooseBattleTab(name){
 battleTabs.forEach(b=>b.setAttribute("aria-selected",String(b.dataset.battleTab===name)));
 battleSections.forEach(section=>{section.hidden=section.dataset.battleSection!==name;});
 if(battleHint)battleHint.textContent=({fight:"Choose one of four moves.",party:"Send in a healthy reserve.",bag:"Use an item or defensive action."})[name]||"Choose a command.";
}
battleTabs.forEach(b=>b.addEventListener("click",()=>chooseBattleTab(b.dataset.battleTab)));
document.addEventListener("hell-high-orbit:battle",e=>{
 const current=e.detail;
 if(!current){lastLeadId=null;lastLeadHp=null;chooseBattleTab("fight");return;}
 const lead=current.lead;
 if(lead?.hp<=0&&battleTabs.length)chooseBattleTab("party");
 else if(lead&&((lastLeadId!==null&&lead.id!==lastLeadId)||(lastLeadHp!==null&&lastLeadHp<=0&&lead.hp>0)))chooseBattleTab("fight");
 lastLeadId=lead?.id||null;lastLeadHp=lead?.hp??null;
});
