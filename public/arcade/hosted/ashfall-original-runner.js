(()=>{"use strict";
const id=location.pathname.split("/").at(-2),c=document.querySelector("canvas"),g=c.getContext("2d"),$=x=>document.getElementById(x),W=640,H=480;
let running=false,epoch=0,last=0,score=0,best=0,world={},keys=new Set(),hold=false;
try{best=Number(localStorage.getItem("ash-run-"+id))||0}catch{}
const rnd=(a,b)=>a+Math.random()*(b-a),isSlush=id==="slush-rush";
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function circle(x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()}
function label(t){$("status").textContent=t}
function add(n){score+=n;best=Math.max(score,best);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-run-"+id,String(best))}catch{}}
function finish(t){running=false;label(t+" · "+score+" points");document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function reset(){epoch++;running=true;last=performance.now();score=0;$("score").textContent="0";world={x:110,y:isSlush?350:365,vy:0,ground:390,obstacles:[],spawn:1,speed:190,time:0,life:3,invuln:0,flap:0};label("RUNNING · dodge the ruins");document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));requestAnimationFrame(t=>loop(t,epoch));draw()}
function jump(){if(!running)return;if(isSlush){if(world.y>=world.ground-26)world.vy=-370}else world.vy=-235}
function loop(now,token){if(token!==epoch||!running)return;const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;const s=world;s.time+=dt;s.speed=Math.min(390,190+s.time*2);s.spawn-=dt;s.invuln=Math.max(0,s.invuln-dt);
 if(s.spawn<=0){s.spawn=rnd(.9,1.6)*190/s.speed;s.obstacles.push({x:W+30,y:isSlush?390:150+rnd(0,210),w:rnd(24,48),h:isSlush?rnd(25,55):65,passed:false})}
 if(isSlush){s.vy+=900*dt;s.y+=s.vy*dt;if(s.y>s.ground-26){s.y=s.ground-26;s.vy=0}}
 else {s.vy+=420*dt;s.y+=s.vy*dt;if(keys.has("ArrowUp")||keys.has(" ")||hold){s.vy-=630*dt}s.y=Math.max(30,Math.min(420,s.y));if(s.y>=420||s.y<=30){s.life--;s.y=225;s.vy=0;if(s.life<=0)finish("FLIGHT LOST")}}
 for(const o of s.obstacles){o.x-=s.speed*dt;if(!o.passed&&o.x+o.w<s.x-20){o.passed=true;add(10)}
  if(s.invuln<=0&&s.x+19>o.x&&s.x-19<o.x+o.w&&s.y+22>o.y-o.h&&s.y-22<o.y){s.life--;s.invuln=1.5;if(s.life<=0){finish("RUN ENDED");break}}}
 s.obstacles=s.obstacles.filter(o=>o.x+o.w>-20).slice(-30);draw();if(running)requestAnimationFrame(t=>loop(t,token))}
function draw(){rect(0,0,W,H,"#0c1018");for(let i=0;i<24;i++){const x=(i*83-world.time*12)%W;circle((x+W)%W,25+(i*37)%240,1.4,"#c8b2a3")}
 rect(0,390,W,90,"#3d2727");rect(0,389,W,4,"#f29d63");for(let i=0;i<12;i++)rect(((i*100-(world.time||0)*world.speed*.4)%740+740)%740,423,60,5,"#835344");
 for(const o of world.obstacles||[]){rect(o.x,o.y-o.h,o.w,o.h,isSlush?"#ce714b":"#b55e50");rect(o.x+5,o.y-o.h+5,Math.max(0,o.w-10),5,"#f3b477")}
 if(!world.invuln||Math.floor(world.invuln*8)%2===0){circle(world.x||110,world.y||365,19,isSlush?"#f7c68b":"#e5a96d");rect((world.x||110)-11,(world.y||365)-5,22,9,"#4d3033")}
 g.fillStyle="#ffe0c3";g.font="bold 19px system-ui";g.textAlign="center";g.fillText("SCORE "+score+" · LIVES "+(world.life??3),320,32);g.font="bold 14px system-ui";g.fillText(isSlush?"SPACE / TAP TO JUMP":"HOLD SPACE / TAP TO FLY",320,465)}
c.addEventListener("pointerdown",e=>{e.preventDefault();hold=true;jump()});for(const ev of ["pointerup","pointercancel","pointerleave"])c.addEventListener(ev,()=>hold=false);
document.addEventListener("keydown",e=>{if([" ","ArrowUp"].includes(e.key)){e.preventDefault();if(!keys.has(e.key))jump();keys.add(e.key)}if(e.key==="Enter"&&!running)reset()});
document.addEventListener("keyup",e=>keys.delete(e.key));$("restart").addEventListener("click",reset);document.addEventListener("visibilitychange",()=>{last=performance.now();keys.clear();hold=false});
$("best").textContent=best;world={x:110,y:365,life:3,obstacles:[],time:0,speed:190};draw();label("Ready · press Start");
})();