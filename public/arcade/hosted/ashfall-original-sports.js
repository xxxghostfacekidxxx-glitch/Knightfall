(()=>{"use strict";
const id=location.pathname.split("/").at(-2),canvas=document.querySelector("canvas"),ctx=canvas.getContext("2d"),$=x=>document.getElementById(x),W=640,H=480;
let score=0,best=0,shots=0,active=false,elapsed=0,last=0,round=0,targets=[],pointer={x:320,y:240},message="Tap Start",generation=0;
try{best=Math.max(0,Number(localStorage.getItem("ash-sports-"+id))||0)}catch{}
function rand(a,b){return a+Math.random()*(b-a)}
function drawText(t,x,y,size=20,color="#ffdab5"){ctx.font="bold "+size+"px system-ui";ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(t,x,y)}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function status(t){message=t;$("status").textContent=t}
function award(n){score+=n;best=Math.max(best,score);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-sports-"+id,String(best))}catch{}}
function target(){
 round++;
 if(id==="basketball")targets=[{x:rand(180,470),y:rand(135,270),r:34}];
 else if(id==="penalty-shootout")targets=[{x:rand(155,490),y:rand(130,270),r:35}];
 else targets=Array.from({length:10},(_,i)=>({x:205+(i%4)*67+rand(-8,8),y:135+Math.floor(i/4)*65,r:18,alive:true}));
}
function end(){active=false;status("ROUND COMPLETE · "+score+" points");try{window.AshFallArcade?.recordScore?.("cabinet-"+id,score,{schema:1,shots,score,round})}catch{}}
function start(){generation++;score=0;shots=0;elapsed=0;round=0;active=true;last=performance.now();$("score").textContent="0";target();status("PLAYING · aim and tap");requestAnimationFrame(now=>loop(now,generation));draw()}
function fire(x,y){if(!active)return;shots++;pointer={x,y};
 if(id==="bowling"){
  let hits=0;for(const t of targets){if(t.alive&&Math.abs(t.x-x)<75&&Math.abs(t.y-y)<90){t.alive=false;hits++}}
  award(hits*10+(hits===10?40:0));status(hits+" pins down · "+(10-hits)+" remaining");
  if(targets.every(t=>!t.alive)||shots%2===0)target();
 }else{
  const t=targets[0],distance=Math.hypot(x-t.x,y-t.y);
  const keeper=id==="penalty-shootout"&&Math.abs(x-(320+Math.sin(elapsed*3)*140))<55&&y>155;
  const hit=distance<t.r&&!keeper;
  if(hit){award(id==="basketball"?25:30);status(id==="basketball"?"SWISH! +25":"GOAL! +30")}
  else status(keeper?"SAVED BY THE KEEPER":"MISSED · aim again");
  target();
 }
 if(shots>=20)end();draw()
}
function loop(now,token){if(!active||token!==generation)return;const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;elapsed+=dt;if(elapsed>=75){end();draw();return}draw();requestAnimationFrame(t=>loop(t,token))}
function draw(){
 rect(0,0,W,H,"#100d13");for(let x=0;x<W;x+=40)rect(x,0,1,H,"#30202a");for(let y=0;y<H;y+=40)rect(0,y,W,1,"#30202a");
 drawText("SHOTS "+shots+"/20 · TIME "+Math.ceil(Math.max(0,75-elapsed)),320,38,18);
 if(id==="basketball"){rect(80,90,480,295,"#3b241e");rect(95,105,450,260,"#5b3525");circle(320,240,75,"#693d28");drawText("INFERNO COURT",320,420,19);
  for(const t of targets){circle(t.x,t.y,t.r+9,"#ed8d4c");circle(t.x,t.y,t.r,"#23141b");circle(t.x,t.y,6,"#ffcf8b")}
 }else if(id==="penalty-shootout"){rect(80,90,480,255,"#293b2a");rect(105,110,430,205,"#e2d4c0");rect(115,120,410,185,"#2c4530");
  for(const t of targets){circle(t.x,t.y,t.r,"#d48b4e");circle(t.x,t.y,13,"#f9e2b9")}
  const k=320+Math.sin(elapsed*3)*140;rect(k-32,220,64,76,"#f3a55f");drawText("KEEPER",k,215,12);
 }else{rect(110,85,420,300,"#38231e");rect(140,100,360,270,"#654535");for(const t of targets){if(!t.alive)continue;circle(t.x,t.y,t.r,"#ffe1bd");rect(t.x-6,t.y-17,12,26,"#fff2d8");circle(t.x,t.y-10,4,"#d56b45")}drawText("CRYPT LANES",320,430,18)}
 drawText(active?"TAP YOUR TARGET TO SHOOT":"START A NEW ROUND",320,460,16);
}
canvas.addEventListener("pointerdown",e=>{const r=canvas.getBoundingClientRect();fire((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
$("restart").addEventListener("click",start);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&!active)start();if(e.key===" "&&active){e.preventDefault();fire(pointer.x,pointer.y)}});
canvas.addEventListener("pointermove",e=>{const r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}});
document.addEventListener("visibilitychange",()=>{last=performance.now()});
$("best").textContent=best;target();draw();status("Ready · press Start");
})();