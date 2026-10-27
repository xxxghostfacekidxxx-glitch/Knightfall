(()=>{"use strict";
const id=location.pathname.split("/").at(-2),c=document.querySelector("canvas"),g=c.getContext("2d"),$=x=>document.getElementById(x),W=640,H=480;
let state={},running=false,score=0,best=0,last=0,token=0,keys=new Set();
try{best=Number(localStorage.getItem("ash-action-"+id))||0}catch{}
function rand(a,b){return a+Math.random()*(b-a)}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function circle(x,y,r,color){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=color;g.fill()}
function note(t){$("status").textContent=t}
function award(n){score+=n;best=Math.max(score,best);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-action-"+id,String(best))}catch{}}
function stop(t){running=false;note(t+" · "+score+" points");document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function start(){token++;running=true;score=0;last=performance.now();$("score").textContent="0";
 if(id==="doodle-jump")state={x:320,y:350,vy:-360,platforms:Array.from({length:9},(_,i)=>({x:i===0?265:rand(40,480),y:420-i*55}))};
 else state={x:320,y:id==="survivor"?240:410,hp:id==="survivor"?5:3,enemies:[],shots:[],spawn:0,fire:0,elapsed:0};
 note("RUNNING");requestAnimationFrame(t=>loop(t,token));draw()}
function loop(now,seq){if(!running||seq!==token)return;const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;const s=state;
 const dx=(keys.has("ArrowRight")?1:0)-(keys.has("ArrowLeft")?1:0),dy=(keys.has("ArrowDown")?1:0)-(keys.has("ArrowUp")?1:0);
 s.x=Math.max(20,Math.min(620,s.x+dx*260*dt));
 if(id==="doodle-jump"){
  const prev=s.y;s.vy+=850*dt;s.y+=s.vy*dt;
  if(s.vy>0)for(const p of s.platforms)if(prev+18<=p.y&&s.y+18>=p.y&&s.x>p.x-16&&s.x<p.x+126){s.y=p.y-18;s.vy=-395;break}
  if(s.y<170){const d=170-s.y;s.y=170;for(const p of s.platforms)p.y+=d;award(Math.round(d))}
  for(const p of s.platforms)if(p.y>500){p.y=-rand(20,90);p.x=rand(40,480)}
  if(s.y>500)stop("FELL INTO THE ABYSS");
 }else{
  s.elapsed+=dt;s.spawn-=dt;s.fire-=dt;
  if(id==="survivor")s.y=Math.max(20,Math.min(460,s.y+dy*260*dt));
  if(s.spawn<=0){s.spawn=Math.max(.32,1-s.elapsed/150);s.enemies.push({x:rand(30,610),y:id==="survivor"?-20:-20})}
  if(s.fire<=0){s.fire=id==="survivor"?.4:.26;s.shots.push({x:s.x,y:s.y,vy:-430})}
  for(const b of s.shots)b.y+=b.vy*dt;
  for(let i=s.enemies.length-1;i>=0;i--){const e=s.enemies[i];e.y+=(id==="survivor"?95:125)*dt;
   const hit=s.shots.findIndex(b=>Math.hypot(e.x-b.x,e.y-b.y)<24);
   if(hit>=0){s.enemies.splice(i,1);s.shots.splice(hit,1);award(10)}
   else if(e.y>460){s.enemies.splice(i,1);s.hp--;if(s.hp<=0)stop("DEFENSE LOST")}}
  s.shots=s.shots.filter(b=>b.y>-30).slice(-60);s.enemies=s.enemies.slice(-50);
 }
 draw();if(running)requestAnimationFrame(t=>loop(t,seq))}
function draw(){rect(0,0,W,H,"#0e0c14");for(let x=0;x<W;x+=40)rect(x,0,1,H,"#34252b");
 const s=state;if(id==="doodle-jump"){for(const p of s.platforms||[])rect(p.x,p.y,110,12,"#e2a26d");circle(s.x||320,s.y||350,18,"#ffc486")}
 else{for(const e of s.enemies||[])circle(e.x,e.y,17,"#c96252");for(const b of s.shots||[])rect(b.x-3,b.y-10,6,18,"#ffe1a0");circle(s.x||320,s.y||410,20,"#ffba7b")}
 g.font="bold 18px system-ui";g.fillStyle="#ffe0bd";g.textAlign="center";g.fillText("SCORE "+score+(s.hp?" · HEALTH "+s.hp:""),320,30);g.fillText("ARROW KEYS OR TOUCH TO MOVE",320,465)}
c.addEventListener("pointerdown",e=>{if(!running)return;const r=c.getBoundingClientRect();state.x=(e.clientX-r.left)*W/r.width;if(id==="survivor")state.y=(e.clientY-r.top)*H/r.height});
document.addEventListener("keydown",e=>{if(e.key.startsWith("Arrow")){keys.add(e.key);e.preventDefault()}if(e.key==="Enter"&&!running)start()});
document.addEventListener("keyup",e=>keys.delete(e.key));$("restart").addEventListener("click",start);document.addEventListener("visibilitychange",()=>{last=performance.now();keys.clear()});
$("best").textContent=best;draw();note("Ready · press Start");
})();