(()=>{"use strict";
const canvas=document.querySelector("#lander-field"),ctx=canvas.getContext("2d"),$=id=>document.getElementById(id),W=720,H=520;
const keys=new Set();let ship,terrain=[],pad,particles=[],stars=[],score=0,best=0,level=1,active=false,sequence=0,last=0,hold={left:false,right:false,thrust:false};
try{best=Number(localStorage.getItem("ashfall-cinder-lander-best"))||0}catch{}
const rand=(a,b)=>a+Math.random()*(b-a);
function resetWorld(){
 const padX=rand(130,550);pad={x:padX,w:110};terrain=[];
 for(let x=0;x<=W;x+=20){let y=370+Math.sin(x*.018+level)*45+Math.sin(x*.047)*20+rand(-8,8);if(x>=pad.x-20&&x<=pad.x+pad.w+20)y=395;terrain.push({x,y})}
 stars=Array.from({length:90},()=>({x:rand(0,W),y:rand(0,330),r:rand(.5,2)}));
 ship={x:rand(150,550),y:65,vx:rand(-13,13),vy:0,angle:0,fuel:100,thrust:false};
 particles=[];updateHud()
}
function updateHud(){$("score").textContent=score;$("best").textContent=best;$("fuel").textContent=Math.max(0,Math.round(ship.fuel));$("velocity").textContent=Math.round(Math.hypot(ship.vx,ship.vy));$("altitude").textContent=Math.max(0,Math.round(ground(ship.x)-ship.y-17));$("level").textContent=level}
function ground(x){const i=Math.max(0,Math.min(terrain.length-2,Math.floor(x/20))),a=terrain[i],b=terrain[i+1];return a.y+(b.y-a.y)*Math.max(0,Math.min(1,(x-a.x)/20))}
function status(s){$("status").textContent=s}
function finish(success){
 active=false;hold.thrust=false;ship.thrust=false;
 if(success){const bonus=Math.round(250+ship.fuel*7+Math.max(0,45-Math.hypot(ship.vx,ship.vy))*8);score+=bonus;best=Math.max(best,score);try{localStorage.setItem("ashfall-cinder-lander-best",String(best))}catch{}status("LANDED · +"+bonus+" · press Next Mission");$("restart").textContent="Next Mission";level++}
 else{status("IMPACT · mission failed · press Retry");$("restart").textContent="Retry Mission";for(let i=0;i<28;i++)particles.push({x:ship.x,y:ship.y,vx:rand(-90,90),vy:rand(-110,80),life:rand(.3,1)})}
 updateHud();document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-cinder-lander",score}}))
}
function start(){sequence++;active=true;last=performance.now();hold={left:false,right:false,thrust:false};$("restart").textContent="Restart";resetWorld();status("Guide the lander onto the glowing extraction platform");requestAnimationFrame(t=>loop(t,sequence))}
function step(dt){if(!active)return;
 const turn=(keys.has("ArrowRight")||keys.has("d")||hold.right?1:0)-(keys.has("ArrowLeft")||keys.has("a")||hold.left?1:0);
 ship.angle=Math.max(-1.1,Math.min(1.1,ship.angle+turn*2.1*dt));
 const burning=ship.fuel>0&&(keys.has("ArrowUp")||keys.has("w")||keys.has(" ")||hold.thrust);
 ship.thrust=burning;if(burning){ship.fuel=Math.max(0,ship.fuel-15*dt);ship.vx+=Math.sin(ship.angle)*140*dt;ship.vy-=Math.cos(ship.angle)*140*dt;
  if(Math.random()<.7)particles.push({x:ship.x-Math.sin(ship.angle)*15,y:ship.y+Math.cos(ship.angle)*15,vx:rand(-18,18)-Math.sin(ship.angle)*35,vy:rand(20,80)+Math.cos(ship.angle)*70,life:rand(.2,.6)})}
 ship.vy+=64*dt;ship.vx*=Math.pow(.999,dt*60);ship.x+=ship.vx*dt;ship.y+=ship.vy*dt;
 if(ship.x<15||ship.x>W-15||ship.y<-60){finish(false);return}
 const legY=ship.y+17,feet=[ship.x-14,ship.x+14];
 if(feet.some(x=>legY>=ground(x))){const onPad=feet.every(x=>x>=pad.x+8&&x<=pad.x+pad.w-8);
  finish(onPad&&Math.abs(ship.angle)<.16&&Math.abs(ship.vy)<42&&Math.abs(ship.vx)<24)}
 updateHud()
}
function draw(){ctx.fillStyle="#0c0b15";ctx.fillRect(0,0,W,H);
 for(const s of stars){ctx.fillStyle="#c3b1a5";ctx.fillRect(s.x,s.y,s.r,s.r)}
 const glow=ctx.createLinearGradient(0,330,0,H);glow.addColorStop(0,"#41231c");glow.addColorStop(1,"#171119");ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,terrain[0].y);for(const p of terrain)ctx.lineTo(p.x,p.y);ctx.lineTo(W,H);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#f0834a";ctx.lineWidth=2;ctx.beginPath();terrain.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
 ctx.fillStyle="#ffb35d";ctx.fillRect(pad.x,389,pad.w,9);ctx.fillStyle="#fff0a2";ctx.fillRect(pad.x+8,387,12,4);ctx.fillRect(pad.x+pad.w-20,387,12,4);
 ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);
 ctx.strokeStyle="#f8c99b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,11);ctx.lineTo(-15,17);ctx.lineTo(-23,17);ctx.moveTo(10,11);ctx.lineTo(15,17);ctx.lineTo(23,17);ctx.stroke();
 ctx.fillStyle="#e9b27b";ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(15,10);ctx.lineTo(-15,10);ctx.closePath();ctx.fill();
 ctx.fillStyle="#392634";ctx.beginPath();ctx.arc(0,-3,6,0,Math.PI*2);ctx.fill();
 if(ship.thrust){ctx.fillStyle="#ffe8a0";ctx.beginPath();ctx.moveTo(-6,11);ctx.lineTo(0,rand(26,39));ctx.lineTo(6,11);ctx.fill()}ctx.restore();
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle="#ffa75e";ctx.fillRect(p.x,p.y,4,4)}ctx.globalAlpha=1;
 ctx.font="bold 16px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe6c4";ctx.fillText("CINDER LANDER · DESCENT "+level,360,25);
 if(!active){ctx.fillStyle="#0009";ctx.fillRect(175,185,370,72);ctx.fillStyle="#ffe0ba";ctx.font="bold 19px system-ui";ctx.fillText("MISSION CONTROL · READY",360,225)}
}
function loop(now,seq){if(seq!==sequence)return;const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;
 if(active)step(dt);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);draw();
 if(active||particles.length)requestAnimationFrame(t=>loop(t,seq))}
document.addEventListener("keydown",e=>{if(["ArrowUp","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys.add(e.key);if(e.key==="Enter"&&!active)start()});
document.addEventListener("keyup",e=>keys.delete(e.key));
for(const name of ["left","right","thrust"]){const b=$(name);b.addEventListener("pointerdown",e=>{e.preventDefault();hold[name]=true;b.setPointerCapture?.(e.pointerId)});for(const ev of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(ev,()=>hold[name]=false)}
$("restart").addEventListener("click",start);document.addEventListener("visibilitychange",()=>{last=performance.now();keys.clear();hold={left:false,right:false,thrust:false}});
$("best").textContent=best;resetWorld();draw();status("Ready · press Start Mission");
})();