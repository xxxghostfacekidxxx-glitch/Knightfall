/* Chaos Cartridge NextGen effects: cheap event-driven canvas bursts, no game-loop interception. */
(()=>{"use strict";
if(window.AshFallVisuals)return;
const prefsKey="ashfall:arcade:effects:v1", root=document.documentElement;
const slug=(location.pathname.match(/\/arcade\/hosted\/([^/]+)\//)||[])[1]||"directory";
const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)");
const limited=window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches||false;
let enabled=true;
try{enabled=localStorage.getItem(prefsKey)!=="off"}catch{}
const disabled=()=>!enabled||!!motion?.matches||limited||document.hidden;
const paint=["#ff35d5","#bdff43","#4cf4ff","#8c65ff","#ffffff"];
let layer,ctx,particles=[],scheduled=false,last=0;
function size(){if(!layer||!ctx)return;const dpr=Math.min(1.5,window.devicePixelRatio||1);layer.width=Math.floor(window.innerWidth*dpr);layer.height=Math.floor(window.innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
function attach(){if(layer||!document.body)return;layer=document.createElement("canvas");layer.id="af-vfx-canvas";layer.setAttribute("aria-hidden","true");layer.width=1;layer.height=1;document.body.appendChild(layer);ctx=layer.getContext("2d",{alpha:true});if(ctx)size()}
function frame(now){scheduled=false;if(disabled()||!ctx){particles.length=0;if(ctx)ctx.clearRect(0,0,window.innerWidth,window.innerHeight);return}
const dt=Math.min(.04,Math.max(.008,(now-last||16)/1000));last=now;ctx.clearRect(0,0,window.innerWidth,window.innerHeight);ctx.save();ctx.globalCompositeOperation="lighter";
particles=particles.filter(p=>p.life>0);
for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;const f=Math.max(0,p.life/p.max);ctx.globalAlpha=Math.min(1,f*f);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=12*f;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.2,p.r*f),0,Math.PI*2);ctx.fill()}
ctx.restore();if(particles.some(p=>p.life>0)){scheduled=true;requestAnimationFrame(frame)}else ctx.clearRect(0,0,window.innerWidth,window.innerHeight)}
function burst(x,y,power=1){if(disabled())return;attach();if(!ctx)return;
const cap=Number(navigator.hardwareConcurrency||4)<=2?30:58;const count=Math.min(16,Math.max(4,Math.round(8*power)));
for(let i=0;i<count&&particles.length<cap;i++){const a=Math.random()*Math.PI*2,s=(40+Math.random()*125)*Math.min(2,power);const life=.25+Math.random()*.38;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,life,max:life,r:1.6+Math.random()*2.9,color:paint[Math.floor(Math.random()*paint.length)]})}
if(!scheduled){last=0;scheduled=true;requestAnimationFrame(frame)}
}
function setEnabled(v){enabled=!!v;root.classList.toggle("af-effects-off",!enabled);try{localStorage.setItem(prefsKey,enabled?"on":"off")}catch{}const b=document.getElementById("af-vfx-toggle");if(b){b.textContent=enabled?"ON":"OFF";b.setAttribute("aria-pressed",String(enabled))}if(!enabled){particles.length=0;if(ctx)ctx.clearRect(0,0,window.innerWidth,window.innerHeight)}}
window.AshFallVisuals={burst,setEnabled,get enabled(){return enabled}};
function init(){
if(!document.body)return;
document.body.classList.add("af-nextgen");document.body.dataset.afGame=slug;setEnabled(enabled);
const cards=document.querySelectorAll("#game-shelf article.arcade-flat-card");
const icons={Action:"⚡",Adventure:"🗺️",Arcade:"👾",Board:"♟️",Card:"🃏",Casual:"🎯",Fighting:"🥊",Idle:"✨",Platformer:"🏃",Puzzle:"🧩",RPG:"⚔️",Racing:"🏎️",Shooter:"🚀",Simulation:"🏗️",Sports:"🏆",Strategy:"♜",Word:"🔮"};
const palettes=[["#9631b7","#1a3b59"],["#087a8f","#302047"],["#7654df","#19433d"],["#ca2674","#183c4f"]];
cards.forEach(c=>{const genre=c.dataset.category||"Arcade",id=c.dataset.gameId||"";let h=0;for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))>>>0;const p=palettes[h%palettes.length];c.dataset.afIcon=icons[genre]||"🎮";c.style.setProperty("--af-card-a",p[0]);c.style.setProperty("--af-card-b",p[1])});
const deck=document.querySelector(".control-deck");
if(deck&&!document.getElementById("af-vfx-toggle")){
const row=document.createElement("div");row.className="af-vfx-pref";
const label=document.createElement("span");label.textContent="Reactive visual FX";
const b=document.createElement("button");b.id="af-vfx-toggle";b.type="button";b.setAttribute("aria-label","Toggle reactive visual effects");
b.addEventListener("click",()=>setEnabled(!enabled));row.append(label,b);
const info=deck.querySelector("details");if(info)info.append(row);else deck.append(row);setEnabled(enabled)
}
document.addEventListener("pointerdown",e=>{if(disabled())return;const target=e.target.closest?.(".tile-button,.signal,.portal,.bug,.tile,.memory-card,.game-field button,.arena button,.play-area button,.cartridge-cabinet a.button");if(!target||target.disabled)return;const r=target.getBoundingClientRect();burst(e.clientX??(r.left+r.width/2),e.clientY??(r.top+r.height/2),.8)},{passive:true});
document.addEventListener("click",e=>{if(disabled()||e.detail!==0)return;const target=e.target.closest?.(".tile-button,.signal,.portal,.bug,.game-field button");if(!target)return;const r=target.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height/2,.8)},{passive:true});
const nodes=[...document.querySelectorAll("#score,#chain,#wave,#combo,.scores strong,.stats output,.stat strong")].slice(0,20);
if(nodes.length&&typeof MutationObserver!=="undefined"){let changed=0;const observer=new MutationObserver(records=>{const now=Date.now();if(disabled()||now-changed<650)return;const node=records[0]?.target?.nodeType===3?records[0].target.parentElement:records[0]?.target;if(!node||!node.isConnected)return;changed=now;const r=node.getBoundingClientRect();if(!r.width)return;node.classList.remove("af-vfx-flash");void node.offsetWidth;node.classList.add("af-vfx-flash");burst(r.left+r.width/2,r.top+r.height/2,.5)});nodes.forEach(n=>observer.observe(n,{childList:true,characterData:true,subtree:true}))}
window.addEventListener("resize",size,{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden){particles.length=0;if(ctx)ctx.clearRect(0,0,window.innerWidth,window.innerHeight)}});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()
})();
