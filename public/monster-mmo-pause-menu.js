(()=>{"use strict";
const menu=document.getElementById("game-menu"),toggle=document.getElementById("game-menu-toggle"),close=document.getElementById("game-menu-close"),backdrop=document.getElementById("game-menu-backdrop");
if(!menu||!toggle||!close||!backdrop)return;
const tabs=[...menu.querySelectorAll("[data-pause-tab]")],sections=[...menu.querySelectorAll("[data-pause-section]")];
let active="creatures",previousFocus=null;
const battleActive=()=>!document.getElementById("battle-panel")?.hidden;
const editable=()=>["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
function select(name){active=name;tabs.forEach(b=>b.setAttribute("aria-selected",String(b.dataset.pauseTab===name)));sections.forEach(s=>s.classList.toggle("pause-active",s.dataset.pauseSection===name));}
function setOpen(open){if(open&&battleActive())return;const wasOpen=menu.classList.contains("is-open");if(wasOpen===open)return;if(open)previousFocus=document.activeElement;menu.classList.toggle("is-open",open);menu.setAttribute("aria-hidden",String(!open));toggle.setAttribute("aria-expanded",String(open));backdrop.hidden=!open;document.body.classList.toggle("pause-open",open);if(open){select(active);close.focus();}else (previousFocus?.isConnected?previousFocus:toggle).focus();}
tabs.forEach(b=>b.addEventListener("click",()=>select(b.dataset.pauseTab)));
toggle.addEventListener("click",()=>setOpen(!menu.classList.contains("is-open")));
close.addEventListener("click",()=>setOpen(false));backdrop.addEventListener("click",()=>setOpen(false));
document.addEventListener("keydown",e=>{const opened=menu.classList.contains("is-open");if(opened){if(e.key==="Escape"){e.preventDefault();setOpen(false);}else if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(e.key)&&!editable()){e.stopImmediatePropagation();e.preventDefault();}else if(e.key==="Tab"){const focusable=[...menu.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)")].filter(el=>el.getClientRects().length);if(focusable.length){const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}return;}if(!editable()&&!battleActive()&&(e.key==="m"||e.key==="M"||e.key==="Escape")){e.preventDefault();setOpen(true);}},true);
select(active);
})();