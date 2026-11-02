(()=>{"use strict";const $=id=>document.getElementById(id),c=$("game"),g=c.getContext("2d"),W=c.width,H=c.height;const mode=new URLSearchParams(location.search).get("game")==="cinder-defense"?"defense":"drift";const id=mode==="defense"?"cinder-defense":"neon-drift";$("title").textContent=mode==="defense"?"Cinder Defense":"Neon Drift";$("help").textContent=mode==="defense"?"Defend the core. Move with arrows or touch controls. Automatic shots target the closest enemy.":"Survive the neon storm. Dodge hazards with arrows or touch controls.";let keys=new Set(),state=null,active=false,last=0,seq=0,best=0;try{best=Math.max(0,Math.min(1000000,Number(localStorage.getItem("ashfall:neon:"+id))||0))}catch{}$("best").textContent=best;const rand=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));function start(){seq++;keys.clear();state={x:450,y:460,hp:3,score:0,time:0,spawn:0,shot:0,entities:[],shots:[],sparks:[]};active=true;last=performance.now();$("status").textContent="Playing";$("score").textContent="0";requestAnimationFrame(t=>loop(t,seq))}function finish(){active=false;$("status").textContent="Game over · restart to try again";best=Math.max(best,Math.floor(state.score));$("best").textContent=best;try{localStorage.setItem("ashfall:neon:"+id,String(best))}catch{}document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:id,score:Math.floor(state.score)}}));if(window.AshFallArcade?.recordScore){Promise.resolve(window.AshFallArcade.ready).then(()=>window.AshFallArcade.recordScore(id,Math.floor(state.score),{game:id,score:Math.floor(state.score)})).catch(()=>{})}}const stars=Array.from({length:82},(_,i)=>({x:(i*151.7+29)%W,y:(i*233.3+67)%H,r:i%7===0?1.9:.6+(i%3)*.34,speed:9+(i%4)*13}));
function circle(x,y,r,color){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill()}
function glow(x,y,r,color){g.shadowColor=color;g.shadowBlur=18;circle(x,y,r,color);g.shadowBlur=0}
function emit(x,y,color,count=10){if(!state)return;state.sparks??=[];for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),speed=rand(42,180),life=rand(.22,.65);state.sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,max:life,color})}state.sparks=state.sparks.slice(-110)}
function draw(){
 const t=state?.time||0;
 const sky=g.createLinearGradient?.(0,0,0,H);
 if(sky){sky.addColorStop(0,"#15102f");sky.addColorStop(.55,"#08152b");sky.addColorStop(1,"#070817")}
 g.fillStyle=sky||"#080e20";g.fillRect(0,0,W,H);
 g.globalAlpha=.85;
 for(const s of stars){const y=(s.y+t*s.speed)%H;circle(s.x,y,s.r,"#90e5ff")}
 g.globalAlpha=1;
 g.lineWidth=1;
 // A scrolling perspective grid supplies depth without WebGL dependencies.
 const horizon=H*.55,offset=(t*56)%52;
 g.strokeStyle="#3a3e85";
 for(let i=-9;i<=9;i++){g.beginPath();g.moveTo(W/2+i*28,horizon);g.lineTo(W/2+i*125,H);g.stroke()}
 for(let y=horizon+offset;y<H;y+=52){const d=(y-horizon)/(H-horizon);g.globalAlpha=.16+d*.25;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
 g.globalAlpha=1;
 g.fillStyle="#4cf4ff";g.font="900 13px system-ui";g.textAlign="left";g.fillText(mode==="defense"?"CINDER // DEFENSE":"NEON // DRIFT",20,23);
 if(!state){g.fillStyle="#bdff43";g.shadowColor="#bdff43";g.shadowBlur=15;g.font="900 34px system-ui";g.textAlign="center";g.fillText("PRESS START",W/2,H/2);g.shadowBlur=0;return}
 for(const e of state.entities){
 const color=mode==="defense"?"#ff38cf":"#ff784e";
 g.shadowColor=color;g.shadowBlur=20;
 circle(e.x,e.y,e.r+4,"#37224c");
 circle(e.x,e.y,e.r,color);g.shadowBlur=0;
 g.strokeStyle="#ffffffa8";g.lineWidth=2;g.beginPath();g.arc(e.x,e.y,e.r*.57,0,Math.PI*2);g.stroke();
 g.strokeStyle="#201021";g.beginPath();g.moveTo(e.x-e.r*.4,e.y);g.lineTo(e.x+e.r*.4,e.y);g.stroke()
 }
 for(const b of state.shots){
 g.strokeStyle="#a8ffff";g.shadowColor="#4cf4ff";g.shadowBlur=16;g.lineWidth=3;
 g.beginPath();g.moveTo(b.x-b.vx*.024,b.y-b.vy*.024);g.lineTo(b.x,b.y);g.stroke();g.shadowBlur=0;circle(b.x,b.y,5,"#bdff43")
 }
 for(const p of state.sparks||[]){g.globalAlpha=Math.min(1,p.life/p.max);glow(p.x,p.y,Math.max(.5,p.life/p.max*3),p.color)}
 g.globalAlpha=1;
 // Layered vector ship with a separate glowing engine core.
 const x=state.x,y=state.y;
 g.shadowBlur=24;g.shadowColor="#4cf4ff";
 g.fillStyle="#a9f9ff";g.strokeStyle="#21184e";g.lineWidth=3;g.beginPath();
 g.moveTo(x,y-25);g.lineTo(x+20,y+19);g.lineTo(x+6,y+12);g.lineTo(x,y+8);g.lineTo(x-6,y+12);g.lineTo(x-20,y+19);
 g.closePath?.();g.fill();g.stroke();g.shadowBlur=0;
 glow(x,y+4,7,"#ff38cf");circle(x,y-2,4,"#181e51");
 if(state.hp>0){g.fillStyle="#1d2540";g.fillRect(20,40,140,8);g.fillStyle=state.hp===1?"#ff658c":"#bdff43";g.fillRect(20,40,140*state.hp/3,8)}
 g.fillStyle="#f3f4ff";g.font="bold 19px system-ui";g.textAlign="right";g.fillText("SCORE "+Math.floor(state.score),W-22,30);
 g.fillStyle="#a9b7d8";g.font="bold 12px system-ui";g.textAlign="left";g.fillText("HULL "+state.hp+"/3",20,66)
}
function loop(now,token){if(!active||token!==seq)return;const dt=Math.max(0,Math.min(.04,(now-last)/1000));last=now;const s=state;s.time+=dt;s.spawn-=dt;s.shot-=dt;const speed=300*dt;if(keys.has("ArrowLeft")||keys.has("a"))s.x-=speed;if(keys.has("ArrowRight")||keys.has("d"))s.x+=speed;if(keys.has("ArrowUp")||keys.has("w"))s.y-=speed;if(keys.has("ArrowDown")||keys.has("s"))s.y+=speed;s.x=clamp(s.x,20,W-20);s.y=clamp(s.y,45,H-20);if(s.spawn<=0){s.spawn=Math.max(.22,.9-s.time*.004);s.entities.push({x:rand(24,W-24),y:-30,r:mode==="defense"?16:rand(15,30),vy:rand(100,175)+s.time*1.2})}if(mode==="defense"&&s.shot<=0&&s.entities.length){s.shot=.22;const target=s.entities.reduce((a,b)=>Math.hypot(b.x-s.x,b.y-s.y)<Math.hypot(a.x-s.x,a.y-s.y)?b:a);const angle=Math.atan2(target.y-s.y,target.x-s.x);s.shots.push({x:s.x,y:s.y,vx:Math.cos(angle)*460,vy:Math.sin(angle)*460})}for(const b of s.shots){b.x+=b.vx*dt;b.y+=b.vy*dt}for(const e of s.entities){e.y+=e.vy*dt;if(!e.dead&&Math.hypot(e.x-s.x,e.y-s.y)<e.r+15){e.dead=true;s.hp--;emit(e.x,e.y,"#ff38cf",14)}if(!e.dead&&mode==="defense"&&e.y>H-12){e.dead=true;s.hp--;emit(e.x,e.y,"#ff784e",14)}if(!e.dead&&mode==="drift"&&e.y>H+e.r){e.dead=true;s.score+=5}for(const b of s.shots){if(!e.dead&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+5){e.dead=true;b.dead=true;s.score+=20;emit(e.x,e.y,"#bdff43",9)}}}for(const p of s.sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;p.life-=dt}s.sparks=s.sparks.filter(p=>p.life>0).slice(-100);s.entities=s.entities.filter(e=>!e.dead&&e.y<H+40).slice(-150);s.shots=s.shots.filter(b=>!b.dead&&b.y>-20&&b.y<H+20&&b.x>-20&&b.x<W+20);if(mode==="drift")s.score+=dt*2;s.score=Math.min(1000000,s.score);$("score").textContent=Math.floor(s.score);if(s.hp<=0){finish();draw();return}draw();requestAnimationFrame(t=>loop(t,token))}function control(key,down){if(down)keys.add(key);else keys.delete(key)}document.addEventListener("keydown",e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();if(e.key==="Enter"&&!active)start();control(e.key.toLowerCase().length===1?e.key.toLowerCase():e.key,true)});document.addEventListener("keyup",e=>control(e.key.toLowerCase().length===1?e.key.toLowerCase():e.key,false));document.addEventListener("visibilitychange",()=>{last=performance.now();keys.clear();if(document.hidden&&active){active=false;seq++;$("status").textContent="Paused · press Start to restart"}});document.querySelectorAll("[data-key]").forEach(b=>{const key=b.dataset.key;b.addEventListener("pointerdown",e=>{e.preventDefault();b.setPointerCapture(e.pointerId);control(key,true)});for(const event of ["pointerup","pointercancel","lostpointercapture"])b.addEventListener(event,()=>control(key,false))});c.addEventListener("pointerdown",e=>{if(!active){start();return}c.setPointerCapture?.(e.pointerId);const r=c.getBoundingClientRect();state.x=clamp((e.clientX-r.left)*W/r.width,20,W-20);state.y=clamp((e.clientY-r.top)*H/r.height,45,H-20)});c.addEventListener("pointermove",e=>{if(!active||!(e.buttons||c.hasPointerCapture?.(e.pointerId)))return;const r=c.getBoundingClientRect();state.x=clamp((e.clientX-r.left)*W/r.width,20,W-20);state.y=clamp((e.clientY-r.top)*H/r.height,45,H-20)});$("start").addEventListener("click",start);draw()})();