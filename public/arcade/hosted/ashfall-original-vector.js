(()=>{"use strict";
const id=location.pathname.split("/").at(-2),prism=id==="prism-panic",c=document.querySelector("canvas"),g=c.getContext("2d"),$=x=>document.getElementById(x),W=640,H=480;
let active=false,gen=0,last=0,score=0,best=0,ship={},rocks=[],shots=[],sparks=[],keys=new Set(),time=0,spawn=0,fire=0;
try{best=Number(localStorage.getItem("ash-vector-"+id))||0}catch{}
const rand=(a,b)=>a+Math.random()*(b-a);
function text(s,x,y,size=17){g.fillStyle="#effaff";g.font="bold "+size+"px system-ui";g.textAlign="center";g.fillText(s,x,y)}
function burst(x,y,color){for(let i=0;i<12;i++){const a=rand(0,Math.PI*2),speed=rand(24,135);sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:rand(.25,.6),max:.6,color})}sparks=sparks.slice(-96)}
function circle(x,y,r,color){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=color;g.fill()}
function scoreUp(n){score+=n;best=Math.max(score,best);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-vector-"+id,String(best))}catch{}}
function end(t){active=false;$("status").textContent=t+" · "+score+" points";document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function start(){gen++;active=true;score=0;time=0;spawn=0;fire=0;rocks=[];shots=[];sparks=[];ship={x:320,y:400,hp:4,shield:0};last=performance.now();$("score").textContent="0";$("status").textContent="RUNNING · survive the barrage";document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));const run=gen;requestAnimationFrame(t=>loop(t,run));draw()}
function step(dt){time+=dt;spawn-=dt;fire-=dt;ship.shield=Math.max(0,ship.shield-dt);
 let vx=(keys.has("ArrowRight")||keys.has("d")?1:0)-(keys.has("ArrowLeft")||keys.has("a")?1:0),vy=(keys.has("ArrowDown")||keys.has("s")?1:0)-(keys.has("ArrowUp")||keys.has("w")?1:0);
 ship.x=Math.max(24,Math.min(616,ship.x+vx*240*dt));ship.y=Math.max(35,Math.min(445,ship.y+vy*240*dt));
 if(spawn<=0){spawn=Math.max(.22,.85-time*.006);rocks.push({x:rand(30,610),y:-25,vx:rand(-35,35),vy:rand(95,155)+time*.6,r:rand(12,26),hp:prism?2:1})}
 if(fire<=0){fire=prism?.17:.28;shots.push({x:ship.x,y:ship.y-20,vy:-390})}
 for(const b of shots)b.y+=b.vy*dt;
 for(let i=rocks.length-1;i>=0;i--){const r=rocks[i];r.x+=r.vx*dt;r.y+=r.vy*dt;
  if(r.y>500){rocks.splice(i,1);continue}
  if(ship.shield<=0&&Math.hypot(r.x-ship.x,r.y-ship.y)<r.r+16){rocks.splice(i,1);ship.hp--;ship.shield=1;burst(ship.x,ship.y,"#ff50d6");if(ship.hp<=0){end("REACTOR DESTROYED");break}continue}
  for(let j=shots.length-1;j>=0;j--){const b=shots[j];if(Math.hypot(r.x-b.x,r.y-b.y)<r.r+5){shots.splice(j,1);r.hp--;if(r.hp<=0){rocks.splice(i,1);burst(r.x,r.y,prism?"#b476ff":"#4de9ff");scoreUp(prism?15:10)}break}}
 }
 shots=shots.filter(b=>b.y>-20).slice(-80);rocks=rocks.slice(-65);for(const p of sparks){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt}sparks=sparks.filter(p=>p.life>0)}
function draw(){const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#080a20");bg.addColorStop(.55,"#181033");bg.addColorStop(1,"#071b2b");g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle="#4de9ff22";g.lineWidth=1;g.beginPath();for(let x=0;x<W;x+=40){g.moveTo(x,0);g.lineTo(x,H)}for(let y=0;y<H;y+=40){g.moveTo(0,y);g.lineTo(W,y)}g.stroke();
 for(const r of rocks){circle(r.x,r.y,r.r+3,"#50ecff44");circle(r.x,r.y,r.r,prism?"#9949e8":"#ee39b5");circle(r.x-4,r.y-5,r.r*.3,"#baff4b")}
 for(const b of shots){g.fillStyle="#55f1ff88";g.fillRect(b.x-5,b.y-18,10,25);g.fillStyle="#e9fcff";g.fillRect(b.x-2,b.y-14,4,20)}for(const p of sparks){g.globalAlpha=Math.max(0,Math.min(1,p.life/p.max));circle(p.x,p.y,2.5,p.color)}g.globalAlpha=1;
 if(ship.x){g.save();g.translate(ship.x,ship.y);g.fillStyle=prism?"#b9a1ff":"#55f1ff";g.beginPath();g.moveTo(0,-22);g.lineTo(19,18);g.lineTo(0,10);g.lineTo(-19,18);g.closePath();g.fill();g.restore();if(ship.shield>0){g.strokeStyle="#baff4b";g.lineWidth=3;g.beginPath();g.arc(ship.x,ship.y,25,0,Math.PI*2);g.stroke()}}
 text("SCORE "+score+" · HULL "+(ship.hp||0),320,26);text("ARROWS / WASD / TOUCH TO MOVE",320,464,14)}
function loop(now,token){if(token!==gen||!active)return;const dt=Math.min(.04,Math.max(0,(now-last)/1000));last=now;step(dt);draw();if(active)requestAnimationFrame(t=>loop(t,token))}
function move(e){if(!active)return;const r=c.getBoundingClientRect();ship.x=Math.max(24,Math.min(616,(e.clientX-r.left)*W/r.width));ship.y=Math.max(35,Math.min(445,(e.clientY-r.top)*H/r.height))}
c.addEventListener("pointerdown",e=>{try{c.setPointerCapture(e.pointerId)}catch{}move(e)});c.addEventListener("pointermove",e=>{if(e.buttons||c.hasPointerCapture?.(e.pointerId))move(e)});document.addEventListener("keydown",e=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||""))return;if(e.key.startsWith("Arrow")&&active)e.preventDefault();keys.add(e.key);if(e.key==="Enter"&&!active)start()});window.addEventListener("blur",()=>keys.clear());document.addEventListener("keyup",e=>keys.delete(e.key));document.addEventListener("visibilitychange",()=>{last=performance.now();keys.clear()});$("restart").addEventListener("click",start);$("best").textContent=best;draw();$("status").textContent="Ready · press Start";

function saveNumbers(o,names){return o&&typeof o==="object"&&names.every(k=>Number.isFinite(o[k])&&Math.abs(o[k])<=1000000000)}
function saveList(a,names,max=100){return Array.isArray(a)&&a.length<=max&&a.every(o=>saveNumbers(o,names))}
function validSave(d){try{return d&&d.schema===1&&d.game===id&&d.engine==="vector-v1"&&Number.isInteger(d.score)&&d.score>=0&&d.score<=1000000&&Number.isFinite(d.best)&&d.best>=0&&d.best<=1000000&&JSON.stringify(d).length<=30000&&saveNumbers(d.ship,["x","y","hp","shield"])&&d.ship.hp>0&&d.ship.hp<=4&&saveList(d.rocks,["x","y","vx","vy","r","hp"],65)&&d.rocks.every(r=>r.r>0&&r.hp>0)&&saveList(d.shots,["x","y","vy"],80)&&saveNumbers(d,["time","spawn","fire"])&&d.time>=0}catch{return false}}
globalThis.exportSaveState=()=>active?JSON.parse(JSON.stringify({schema:1,game:id,engine:"vector-v1",score,best,ship,rocks,shots,time,spawn,fire})):null;
globalThis.importSaveState=input=>{let d;try{d=JSON.parse(JSON.stringify(input))}catch{return false}if(!validSave(d))return false;gen++;active=true;keys.clear();({ship,rocks,shots,time,spawn,fire}=d);sparks=[];score=d.score;best=Math.max(best,d.best,score);$("score").textContent=score;$("best").textContent=best;last=performance.now();$("status").textContent="Cloud save restored.";document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));draw();const restored=gen;requestAnimationFrame(t=>loop(t,restored));return true};
globalThis.isGameActive=()=>active;
})();