/* Knightfall CanvasFX v2: original, dependency-free 2D atmosphere and hit feedback.
   Visuals only; no game logic or canvas sizing changes. */
(()=>{"use strict";
if(window.AshFallCanvasFX)return;
const TAU=Math.PI*2;
const colors=["#ff38ce","#b8ff45","#48efff","#aa79ff"];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=i=>{let x=Math.imul(i^0x45d9f3b,0x45d9f3b);x^=x>>>16;return (x>>>0)/4294967295};
const reduced=()=>!!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ||!!window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches;
class CanvasFX {
 constructor(){this.particles=[];this.rings=[];this.max=140;this.time=0;this.enabled=true}
 reset(){this.particles.length=0;this.rings.length=0;this.time=0}
 sky(ctx,t,w,h,variant="space"){
  if(!ctx)return;
  const tm=reduced()?0:t*.001;
  ctx.save();
  const grad=ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,variant==="lab"?"#110a31":variant==="lander"?"#11132c":"#090d2a");
  grad.addColorStop(.52,variant==="lab"?"#071e35":"#101a33");
  grad.addColorStop(1,"#050915");ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  const clouds=[[.16,.23,.44,"#ff38ce"],[.77,.68,.49,"#4579ff"],[.84,.17,.27,"#45e9ff"]];
  for(const [cx,cy,r,color] of clouds){
   const x=w*cx,y=h*cy,rad=Math.max(w,h)*r;
   const mist=ctx.createRadialGradient(x,y,0,x,y,rad);
   mist.addColorStop(0,color+"24");mist.addColorStop(.5,color+"0d");mist.addColorStop(1,color+"00");
   ctx.fillStyle=mist;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  for(let i=0;i<92;i++){
   const x=hash(i*7+19)*w,y=hash(i*13+43)*h;
   const opacity=(.18+hash(i+550)*.55)*(reduced()?1:.83+.17*Math.sin(tm*(.6+hash(i+3))+i));
   const r=.55+hash(i+901)*1.4;
   ctx.fillStyle=(i%9===0?"#ff9ff0":i%6===0?"#a3efff":"#d0dbff");
   ctx.globalAlpha=opacity;ctx.fillRect(x,y,r,r);
  }
  ctx.globalAlpha=1;
  if(variant==="space"){
   ctx.strokeStyle="#49edff13";ctx.lineWidth=1;
   const offset=tm*7%48;
   for(let y=offset;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  }
  ctx.restore();
 }
 impact(x,y,color="#ff38ce",power=1){
  if(!this.enabled||reduced()||typeof x!=="number"||typeof y!=="number")return;
  const size=clamp(power,.25,3),count=Math.round(size*13);
  this.rings.push({x,y,color,r:3,max:26+size*43,life:.45,maxLife:.45});
  if(this.rings.length>14)this.rings.shift();
  for(let i=0;i<count&&this.particles.length<this.max;i++){
   const a=Math.random()*TAU,s=(40+Math.random()*175)*size,life=.3+Math.random()*.55;
   this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,maxLife:life,
    r:1.2+Math.random()*2.8,color:i%4===0?"#ffffff":color});
  }
 }
 trail(x,y,vx=0,vy=0,color="#49edff",power=1){
  if(!this.enabled||reduced()||this.particles.length>=this.max)return;
  const life=.17+Math.random()*.3;
  this.particles.push({x,y,vx:vx*.12+(Math.random()-.5)*35,vy:vy*.12+(Math.random()-.5)*35,
   life,maxLife:life,r:1+clamp(power,0,3)*1.9,color});
 }
 step(dt){
  if(!this.enabled||reduced()||document.hidden){this.particles.length=0;this.rings.length=0;return}
  const d=clamp(Number(dt)||0,0,.05);this.time+=d;
  for(const p of this.particles){p.x+=p.vx*d;p.y+=p.vy*d;p.vx*=1-d*1.2;p.vy*=1-d*1.2;p.life-=d}
  for(const r of this.rings){r.r+=(r.max-r.r)*Math.min(1,d*7);r.life-=d}
  this.particles=this.particles.filter(p=>p.life>0);
  this.rings=this.rings.filter(r=>r.life>0);
 }
 draw(ctx){
  if(!ctx||!this.enabled||reduced())return;
  ctx.save();ctx.globalCompositeOperation="lighter";
  for(const r of this.rings){
   const alpha=r.life/r.maxLife;ctx.globalAlpha=alpha*.75;ctx.strokeStyle=r.color;
   ctx.lineWidth=1.2+alpha*3;ctx.shadowColor=r.color;ctx.shadowBlur=12;
   ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke();
  }
  for(const p of this.particles){
   const alpha=clamp(p.life/p.maxLife,0,1);ctx.globalAlpha=alpha*alpha;
   ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8+alpha*13;
   ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.2,p.r*alpha),0,TAU);ctx.fill();
  }
  ctx.restore();
 }
}
window.AshFallCanvasFX={create:()=>new CanvasFX(),colors};
})();