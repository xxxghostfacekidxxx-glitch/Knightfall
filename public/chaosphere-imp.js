/* Chaosphere mascot reactions. Pure captions: never include message bodies or usernames. */
(()=>{
"use strict";
if(window.ChaosphereImp)return;
const captions=Object.freeze({
 wake:["YOU SUMMONED ME!","I WAS EATING THE SETTINGS.","IS THIS THE TALKING MACHINE?"],
 incoming:["A MESSAGE! IT'S ALIVE!","THE INBOX HAS TEETH!","SOMEBODY'S TALKING AT US!"],
 sending:["FLINGING WORDS INTO THE VOID!","YEET THE LETTERS!","THIS IS PROBABLY FINE!"],
 sent:["IT WENT THROUGH! SOMEHOW!","I DELIVERED THE CHAOS!","WE DID A COMMUNICATION!"],
 failed:["THE WORDS FELL DOWN.","I BROKE THE PIGEON.","ERROR: DEMON PANICKING!"],
 invite:["SUMMON THE GREMLINS!","PARTY TIME! WHERE'S THE FIRE?","FRIENDS! MINIONS! ACQUAINTANCES!"]
});
const spiceLevels=Object.freeze(["Sweet","Sassy","Spicy","Unhinged"]);
const spicyCaptions=Object.freeze({
 wake:["Who woke me up? I was committing crimes against boredom.","Well, shit. The tiny demon is on duty.","THE CHAOS HAS CLOCKED IN, YOU BEAUTIFUL DISASTERS."],
 incoming:["A message! Somebody's got nerve.","Holy shit, the inbox is alive.","SOMEONE'S TALKING. LET'S FUCKING GO."],
 sending:["Sending that little menace.","Yeet that shit into the void.","FIRE THE FUCKING MESSAGE CANNON."],
 sent:["Delivered. Miracles do happen.","Hell yes, it landed.","FUCK YES. CHAOS DELIVERED."],
 failed:["Whoops. That didn't work.","Well, shit. Try again.","THE MACHINE ATE OUR FUCKING MESSAGE."],
 invite:["More minions? I'm listening.","Bring the weirdos. Hell yes.","SUMMON THE WHOLE DAMN CIRCUS."]
});
const spiceKey="kf:trouble-spice";
const getSpice=()=>{try{return Math.max(0,Math.min(3,Number(localStorage.getItem(spiceKey))||0))}catch{return 0}};
const setSpice=value=>{const n=Math.max(0,Math.min(3,Math.floor(Number(value)||0)));try{localStorage.setItem(spiceKey,String(n))}catch{}return n};
const linesFor=(mood,level)=>level===0?captions[mood]:spicyCaptions[mood]||captions[mood];
const id=row=>Number.isSafeInteger(Number(row?.id))&&Number(row.id)>0?Number(row.id):0;
const unread=row=>Math.max(0,Math.floor(Number(row?.unread_count)||0));
function newUnread(before,after){
 if(!Array.isArray(before)||!Array.isArray(after))return false;
 const old=new Map(before.filter(row=>id(row)).map(row=>[id(row),unread(row)]));
 return after.some(row=>id(row)&&unread(row)>(old.get(id(row))||0));
}
function mount(root,userId){
 const button=root?.querySelector?.("#kf-imp-quiet");
 const speech=root?.querySelector?.("#kf-imp-speech");
 const inline=root?.querySelector?.("#kf-imp-inline");
 if(!button||!speech||!inline)return null;
 const key="kf-chaosphere-imp-reactions-"+Number(userId);
 let enabled=true,sequence=0,timeout=null;
 try{enabled=localStorage.getItem(key)!=="off";}catch{}
 function reset(){
  if(timeout!==null){clearTimeout(timeout);timeout=null;}
  delete root.dataset.kfImpMood;speech.hidden=true;inline.hidden=true;
 }
 function syncVisibility(){
  if(!enabled||!root.dataset.kfImpMood){speech.hidden=true;inline.hidden=true;return;}
  const opened=root.classList.contains("kf-chat-open");
  speech.hidden=opened;inline.hidden=!opened;
 }
 function setEnabled(value,remember=false){
  enabled=!!value;
  root.classList.toggle("kf-imp-quiet",!enabled);
  button.setAttribute("aria-pressed",String(enabled));
  button.setAttribute("aria-label",enabled?"Turn off Chaosphere mascot reactions":"Turn on Chaosphere mascot reactions");
  button.title=enabled?"Silence the tiny demon":"Wake the tiny demon";
  button.textContent=enabled?"😈":"😴";
  if(!enabled)reset();
  if(remember)try{localStorage.setItem(key,enabled?"on":"off");}catch{}
 }
 function react(mood){
  if(!enabled||document.hidden||!Object.prototype.hasOwnProperty.call(captions,mood))return false;
  reset();
  const lines=linesFor(mood,getSpice()),line=lines[sequence++%lines.length];
  root.dataset.kfImpMood=mood;speech.textContent=line;inline.textContent=line;
  syncVisibility();timeout=setTimeout(reset,3100);return true;
 }
 setEnabled(enabled);
 button.addEventListener("click",()=>{setEnabled(!enabled,true);if(enabled)react("wake");});
 window.addEventListener("pagehide",reset,{once:true});
 return Object.freeze({react,syncVisibility,isEnabled:()=>enabled});
}
function mountInbox(){
 const button=document.getElementById("cs-hero-imp");
 const line=document.getElementById("cs-hero-imp-speech");
 if(!button||!line||button.dataset.ready==="1")return;
 button.dataset.ready="1";
 let index=0,timeout=null;
 button.addEventListener("click",()=>{
  const lines=linesFor("wake",getSpice());line.textContent=lines[index++%lines.length];line.hidden=false;
  button.classList.remove("cs-imp-poked");
  void button.offsetWidth;
  button.classList.add("cs-imp-poked");
  if(timeout!==null)clearTimeout(timeout);
  timeout=setTimeout(()=>{line.hidden=true;button.classList.remove("cs-imp-poked");},3100);
 });
 window.addEventListener("pagehide",()=>{if(timeout!==null)clearTimeout(timeout);},{once:true});
}
window.ChaosphereImp=Object.freeze({newUnread,mount,mountInbox,getSpice,setSpice,spiceLevels});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountInbox,{once:true});
else mountInbox();
window.dispatchEvent(new Event("kf:chaosphere-imp-ready"));
})();
