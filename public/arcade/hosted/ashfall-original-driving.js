(()=>{"use strict";
const id=location.pathname.split("/").at(-2),c=document.querySelector("canvas"),ctx=c.getContext("2d"),$=x=>document.getElementById(x);
let running=false,score=0,best=0,last=0,elapsed=0,spawn=0,obstacles=[],cars=[],player=1,steps=0,generation=0,crossRow=0,crossCooldown=0;
try{best=Number(localStorage.getItem("ash-drive-"+id))||0}catch{}
const random=(a,b)=>a+Math.random()*(b-a),lane=x=>110+x*140;
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function label(t){$("status").textContent=t}
function points(n){score+=n;best=Math.max(best,score);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-drive-"+id,String(best))}catch{}}
function end(t){running=false;label(t+" · "+score+" points");document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function reset(){generation++;running=true;score=0;steps=0;crossRow=0;crossCooldown=0;elapsed=0;spawn=.6;obstacles=[];player=1;cars=[{lane:0,y:400},{lane:2,y:400}];$("score").textContent="0";last=performance.now();label("DRIVE · avoid hazards");requestAnimationFrame(t=>loop(t,generation));draw()}
function action(direction){
 if(!running)return;
 if(id==="crossy-road"){
  if(crossCooldown>0)return;
  if(direction==="up")crossRow=Math.min(5,crossRow+1);
  else if(direction==="down")crossRow=Math.max(0,crossRow-1);
  else player=Math.max(0,Math.min(2,player+direction));
  crossCooldown=.12;
  const px=lane(player),py=400-crossRow*65;
  if(obstacles.some(o=>Math.abs(o.y-py)<28&&Math.abs(o.x-px)<42)){end("CROSSING FAILED");draw();return}
  if(crossRow===5){steps+=5;points(25);crossRow=0;label("SAFE CROSSING · "+steps+"/30")}
  if(steps>=30)end("CROSSING COMPLETE")
 }
 else if(id==="two-cars"){if(direction==="left")cars[0].lane=cars[0].lane===0?1:0;else if(direction==="right")cars[1].lane=cars[1].lane===2?3:2}
 else player=Math.max(0,Math.min(3,player+(direction==="left"?-1:direction==="right"?1:0)));
 draw()
}
function loop(now,token){if(!running||token!==generation)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;spawn-=dt;crossCooldown=Math.max(0,crossCooldown-dt);
 if(id==="crossy-road"){
  if(spawn<=0){spawn=Math.max(.55,1.15-elapsed/200);const row=1+Math.floor(random(0,4)),left=Math.random()<.5;obstacles.push({x:left?-45:685,y:400-row*65,vx:(left?1:-1)*(115+elapsed*1.3)})}
  for(const o of obstacles)o.x+=o.vx*dt;
  obstacles=obstacles.filter(o=>o.x>-70&&o.x<710).slice(-35);
  if(obstacles.some(o=>Math.abs(o.y-(400-crossRow*65))<28&&Math.abs(o.x-lane(player))<42))end("CROSSING FAILED");
  if(running&&elapsed>100)end("TIME EXPIRED");
  draw();if(running)requestAnimationFrame(t=>loop(t,token));return;
 }
 if(spawn<=0){spawn=Math.max(.35,1.1-elapsed/180);const track=id==="crossy-road"?Math.floor(random(0,3)):Math.floor(random(0,4));obstacles.push({lane:track,y:-40,passed:false,speed:120+elapsed*1.8});}
 for(const o of obstacles){o.y+=o.speed*dt;if(!o.passed&&o.y>460){o.passed=true;if(id!=="crossy-road")points(2)}}
 obstacles=obstacles.filter(o=>o.y<540).slice(-25);
 for(const o of obstacles){if(Math.abs(o.y-400)>35)continue;
 if(id==="two-cars"&&cars.some(car=>car.lane===o.lane)){end("TWIN CRASH");break}
 if(id==="car-race"&&o.lane===player){end("CRASHED OUT");break}
 }
 if(running&&id==="crossy-road"&&elapsed>70)end("TIME EXPIRED");
 draw();if(running)requestAnimationFrame(t=>loop(t,token))}
function draw(){rect(0,0,640,500,"#100e13");rect(45,45,550,420,"#3a3538");for(let i=0;i<5;i++)rect(55+i*110,45,3,420,"#bcb1a0");
 for(let y=60;y<460;y+=75)for(let x=110;x<590;x+=140)rect(x,y+(elapsed*100)%75,4,30,"#e9a76e");
 for(const o of obstacles){const ox=id==="crossy-road"?o.x:lane(o.lane);rect(ox-25,o.y-22,50,44,"#e9784d");rect(ox-16,o.y-12,32,12,"#3b1720")}
 if(id==="two-cars"){for(const car of cars){rect(lane(car.lane)-24,car.y-32,48,64,car.lane<2?"#ffe0a0":"#73d3d5")}}
 else{const py=id==="crossy-road"?400-crossRow*65:417;rect(lane(player)-23,py-32,46,65,"#ffb85e");rect(lane(player)-16,py-23,32,16,"#442522")}
 ctx.font="bold 19px system-ui";ctx.textAlign="center";ctx.fillStyle="#ffe1bb";ctx.fillText("SCORE "+score+" · "+(id==="crossy-road"?"STEPS "+steps+"/30":"SURVIVE THE ROAD"),320,28);
 ctx.fillText(id==="crossy-road"?"DODGE TRAFFIC · REACH THE TOP SIX TIMES":"TAP LEFT OR RIGHT TO STEER",320,490)}
c.addEventListener("pointerdown",e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width;if(id==="crossy-road")action(x<220?-1:x>420?1:"up");else action(x<320?"left":"right")});
document.addEventListener("keydown",e=>{if(!running&&e.key==="Enter")reset();if(["ArrowLeft","a","A"].includes(e.key))action(id==="crossy-road"?-1:"left");if(["ArrowRight","d","D"].includes(e.key))action(id==="crossy-road"?1:"right");if(["ArrowUp","w","W"].includes(e.key))action("up")});
let startY=0;c.addEventListener("touchstart",e=>{startY=e.touches[0].clientY},{passive:true});c.addEventListener("touchend",e=>{if(id==="crossy-road"&&startY-e.changedTouches[0].clientY>25)action("up")},{passive:true});
$("restart").addEventListener("click",reset);document.addEventListener("visibilitychange",()=>{last=performance.now()});
$("best").textContent=best;draw();label("Ready · press Start");
})();