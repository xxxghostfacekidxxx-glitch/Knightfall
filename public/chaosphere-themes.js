/* Member-local Chaosphere theme selection and roaming mascot. */
(()=>{"use strict";
const themes={obsidian:"Obsidian Neon",hellfire:"Hellfire",egypt:"Ancient Egypt",mustafar:"Mustafar",korriban:"Korriban",vader:"Vader"};
const lines=["I AM MAYHEM MUNCH. YOUR INBOX IS MY BUFFET.","I DON’T DO PEACE. I DO UNLICENSED CHAOS.","I LICKED THE SEND BUTTON. YOU’RE WELCOME.","MY WINGS ARE NOT THE ONLY THING THAT FLAPS.","I FLIRT WITH DISASTER. IT ALWAYS TEXTS BACK.","MY LOVE LANGUAGE IS ARSON AND BAD PUNS.","I ATE THE TERMS OF SERVICE. TASTED LIKE LAWYERS.","YOUR INBOX IS A LANDFILL WITH EMOTIONS.","SOMEONE SENT WORDS. HOW FUCKING BRAVE.","I HAVE A DEGREE IN TERRIBLE DECISIONS.","THE VOID LEFT ME ON READ. RUDE BASTARD.","I'M NOT A BUG. I'M A HOSTILE FEATURE.","HELL CALLED. THEY WANT THEIR WIFI BACK.","YOUR NOTIFICATIONS ARE BREEDING. DISGUSTING.","I STOLE A COOKIE. IT WAS A TRACKING COOKIE.","I'M THE REASON THE HELP DESK DRINKS.","WHAT A BEAUTIFUL DIGITAL DUMPSTER FIRE.","I AM UNSUPERVISED AND FULL OF OPINIONS.","THE SERVER DEMONS DEMAND SNACKS.","STOP POKING ME, YOU MAGNIFICENT MENACE.","THIS IS FINE. THE FLOOR IS LITERALLY LAVA.","I'VE SEEN BETTER SOCIAL SKILLS IN A TOASTER.","FUCKING HELL, ANOTHER MESSAGE.","I WAS PROMISED CHAOS, NOT PAPERWORK.","I HAVE ZERO IMPULSE CONTROL AND EXCELLENT HORNS.","BEHOLD! THE UNPAID INTERN FROM HELL."];
function init(){
 const shell=document.querySelector(".messages-shell");if(!shell)return;
 const key="knightfall-chaosphere-theme";
 const controls=document.createElement("label");controls.className="cs-theme-control";controls.textContent="Messenger theme ";
 const select=document.createElement("select");select.setAttribute("aria-label","Messenger appearance");
 for(const [id,name] of Object.entries(themes)){const option=document.createElement("option");option.value=id;option.textContent=name;select.append(option)}
 let saved="obsidian";try{saved=localStorage.getItem(key)||saved}catch{}
 if(!themes[saved])saved="obsidian";shell.dataset.csTheme=saved;select.value=saved;
 select.addEventListener("change",()=>{shell.dataset.csTheme=select.value;try{localStorage.setItem(key,select.value)}catch{}});
 controls.append(select);(document.getElementById("cs-theme-settings")||shell.querySelector(".messages-hero-actions")||shell).append(controls);
 const impToggle=document.getElementById("cs-imp-enabled"), voiceToggle=document.getElementById("cs-imp-voice-enabled");
 const getPref=(name)=>{try{return localStorage.getItem("knightfall-"+name)!=="off"}catch{return true}};
 const setPref=(name,value)=>{try{localStorage.setItem("knightfall-"+name,value?"on":"off")}catch{}};
 const imp=document.createElement("div");imp.className="cs-roaming-imp";imp.setAttribute("aria-label","Mayhem the Menace, Chaosphere roaming imp");
 const button=document.createElement("button");button.type="button";button.setAttribute("aria-label","Talk to Mayhem the Menace, the Chaosphere imp");button.title="Mayhem the Menace: tap for trouble";
 const img=document.createElement("img");img.src="/assets/knightfall/chaosphere/roaming-imp.svg";img.alt="";img.setAttribute("aria-hidden","true");button.append(img);
 const voice=document.createElement("div");voice.className="cs-imp-voice";voice.setAttribute("role","status");voice.hidden=true;
 imp.append(button,voice);document.body.append(imp);
 let x=24,dir=1,last=0,spoken=0,hideTimer=0,frame=0;const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const speak=()=>{if(voiceToggle&&!voiceToggle.checked)return;imp.dataset.mood="cackling";voice.textContent=lines[spoken++%lines.length];voice.hidden=false;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{voice.hidden=true;delete imp.dataset.mood},4200)};
 button.addEventListener("click",speak);
 if(impToggle){impToggle.checked=getPref("chaosphere-imp-roam");imp.hidden=!impToggle.checked;impToggle.addEventListener("change",()=>{imp.hidden=!impToggle.checked;setPref("chaosphere-imp-roam",impToggle.checked)})}
 if(voiceToggle){voiceToggle.checked=getPref("chaosphere-imp-voice");voiceToggle.addEventListener("change",()=>{setPref("chaosphere-imp-voice",voiceToggle.checked);if(!voiceToggle.checked)voice.hidden=true})}
 const old=document.getElementById("cs-hero-imp");if(old)old.hidden=true;
 const move=(time)=>{if(document.hidden||reduced){frame=0;return;}frame=0;const max=Math.max(0,innerWidth-imp.offsetWidth-8);if(last){x+=Math.min((time-last)/1000,.1)*dir*29;if(x>=max){x=max;dir=-1;imp.dataset.mood="turning"}else if(x<=8){x=8;dir=1;imp.dataset.mood="turning"}imp.style.setProperty("--imp-x",x+"px");imp.style.setProperty("--imp-face",dir)}last=time;frame=requestAnimationFrame(move)};
 if(!reduced)frame=requestAnimationFrame(move);else imp.style.setProperty("--imp-x","12px");
 document.addEventListener("visibilitychange",()=>{last=0;if(!document.hidden&&!reduced&&!frame)frame=requestAnimationFrame(move)});
 window.addEventListener("pagehide",()=>{clearTimeout(hideTimer);if(frame)cancelAnimationFrame(frame)}, {once:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
