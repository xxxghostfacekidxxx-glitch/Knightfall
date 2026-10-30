(()=>{"use strict";
const id=location.pathname.split("/").at(-2),c=document.querySelector("canvas"),g=c.getContext("2d"),$=x=>document.getElementById(x),W=640,H=500;
let score=0,best=0,playing=false,last=0,frame=0,game={},generation=0;
try{best=Number(localStorage.getItem("ash-original-"+id))||0}catch{}
function note(t){$("status").textContent=t}
function points(n){score+=n;best=Math.max(score,best);$("score").textContent=score;$("best").textContent=best;try{localStorage.setItem("ash-original-"+id,String(best))}catch{}}
function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h)}
function text(t,x,y){g.fillStyle="#ffe3c0";g.font="bold 19px system-ui";g.textAlign="center";g.fillText(t,x,y)}
function end(t){playing=false;note(t+" · "+score+" points");document.dispatchEvent(new CustomEvent("ashfall:arcade-finished",{detail:{gameId:"cabinet-"+id,score}}))}
function reset(){generation++;score=0;$("score").textContent="0";playing=true;last=performance.now();frame=0;
 if(id==="whack-a-bug")game={time:45,bugs:[],spawn:0};
 else if(id==="stack-tower")game={blocks:[{x:180,y:450,w:240}],beam:{x:0,y:416,w:240,v:170},level:1};
 else game={time:60,tilt:0,wind:0,drop:320,blocks:[],gust:2};
 note("RUNNING");document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));const seq=generation;requestAnimationFrame(now=>loop(now,seq))}
function tap(x,y){if(!playing){reset();return;}
 if(id==="whack-a-bug"){const i=game.bugs.findIndex(b=>Math.hypot(b.x-x,b.y-y)<b.r+8);if(i>=0){game.bugs.splice(i,1);points(10)}else game.time-=1}
 else if(id==="stack-tower"){const b=game.blocks.at(-1),m=game.beam,l=Math.max(b.x,m.x),r=Math.min(b.x+b.w,m.x+m.w),w=r-l;
 if(w<15){end("SPIRE COLLAPSED");return}game.blocks.push({x:l,y:m.y,w});points(Math.ceil(w/8));game.level++;
 if(game.blocks.length>10){game.blocks.shift();for(const b of game.blocks)b.y+=34}
 game.beam={x:0,y:game.blocks.at(-1).y-34,w,v:170+game.level*15}}
 else {game.blocks.push({x:game.drop});game.tilt+=(game.drop-320)/200*(1+game.blocks.length*.15);points(10);if(Math.abs(game.tilt)>2.6)end("BALANCE LOST")}
}
function loop(now,seq){if(!playing||seq!==generation)return;const dt=Math.min(.05,(now-last)/1000);last=now;frame+=dt;
 if(id==="whack-a-bug"){game.time-=dt;game.spawn-=dt;if(game.spawn<=0){game.spawn=.65;game.bugs.push({x:35+Math.random()*570,y:80+Math.random()*350,r:22,life:1.5})}
 for(const b of game.bugs)b.life-=dt;game.bugs=game.bugs.filter(b=>b.life>0).slice(-15);if(game.time<=0)end("SHIFT COMPLETE")}
 else if(id==="stack-tower"){const m=game.beam;m.x+=m.v*dt;if(m.x<0||m.x+m.w>W){m.x=Math.max(0,Math.min(W-m.w,m.x));m.v=-m.v}}
 else {game.time-=dt;game.gust-=dt;game.drop=320+Math.sin(now/550)*220;if(game.gust<=0){game.wind=(Math.random()-.5)*.6;game.gust=2+Math.random()*2}game.tilt+=((game.wind||0)-game.tilt*.1)*dt;if(Math.abs(game.tilt)>2.6)end("WIND WINS");if(game.time<=0)end("BALANCE SURVIVED")}
 draw();if(playing)requestAnimationFrame(t=>loop(t,seq))}
function draw(){rect(0,0,W,H,"#0b0c13");for(let x=0;x<W;x+=40)rect(x,0,1,H,"#292632");for(let y=0;y<H;y+=40)rect(0,y,W,1,"#292632");
 if(id==="whack-a-bug"){text("TIME "+Math.ceil(game.time||0),320,40);for(const b of game.bugs||[]){g.beginPath();g.arc(b.x,b.y,b.r,0,Math.PI*2);g.fillStyle="#ff55d8";g.fill();text("×",b.x,b.y+6)}}
 else if(id==="stack-tower"){for(const b of game.blocks||[])rect(b.x,b.y,b.w,30,"#ff55d8");if(game.beam)rect(game.beam.x,game.beam.y,game.beam.w,30,"#c6ff45");text("FLOOR "+(game.level||1),320,40)}
 else {text("TIME "+Math.ceil(game.time||0),320,40);g.save();g.translate(320,390);g.rotate((game.tilt||0)*.2);rect(-210,-8,420,16,"#c6ff45");for(let i=0;i<(game.blocks||[]).length;i++)rect(game.blocks[i].x-345,-36-i*24,50,22,"#ff55d8");g.restore();rect((game.drop||320)-22,70,44,26,"#c6ff45")}
 text(playing?"TAP TO ACT":"TAP TO START",320,480)}
c.addEventListener("pointerdown",e=>{const r=c.getBoundingClientRect();tap((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height)});
$("restart").addEventListener("click",reset);
document.addEventListener("keydown",e=>{if(e.key===" "&&e.target.tagName!=="BUTTON"){e.preventDefault();if(playing){if(id==="whack-a-bug")note("Tap a target to exterminate it");else tap(320,250)}else reset()}});
document.addEventListener("visibilitychange",()=>{last=performance.now()});
$("best").textContent=best;game={time:45,bugs:[],blocks:[],level:1};draw();note("Ready · press Start");

function saveNumbers(o,names){return o&&typeof o==="object"&&names.every(k=>Number.isFinite(o[k])&&Math.abs(o[k])<=1000000000)}
function saveList(a,names,max=100){return Array.isArray(a)&&a.length<=max&&a.every(o=>saveNumbers(o,names))}
function validSave(d){try{return d&&d.schema===1&&d.game===id&&d.engine==="trio-v1"&&Number.isInteger(d.score)&&d.score>=0&&d.score<=1000000&&Number.isFinite(d.best)&&d.best>=0&&d.best<=1000000&&JSON.stringify(d).length<=30000&&Number.isFinite(d.frame)&&d.frame>=0&&d.frame<=1000000000&&d.state&&(id==="stack-tower"?saveList(d.state.blocks,["x","y","w"],10)&&d.state.blocks.length>0&&d.state.blocks.every(b=>b.w>=15&&b.w<=640)&&saveNumbers(d.state.beam,["x","y","w","v"])&&d.state.beam.w>0&&d.state.beam.w<=640&&Number.isInteger(d.state.level)&&d.state.level>0:id==="whack-a-bug"?saveNumbers(d.state,["time","spawn"])&&d.state.time>0&&d.state.time<=45&&saveList(d.state.bugs,["x","y","r","life"],15):saveNumbers(d.state,["time","tilt","wind","drop","gust"])&&d.state.time>0&&d.state.time<=60&&Math.abs(d.state.tilt)<=2.6&&saveList(d.state.blocks,["x"],2000))}catch{return false}}
globalThis.exportSaveState=()=>playing?JSON.parse(JSON.stringify({schema:1,game:id,engine:"trio-v1",score,best,state:game,frame})):null;
globalThis.importSaveState=input=>{let d;try{d=JSON.parse(JSON.stringify(input))}catch{return false}if(!validSave(d))return false;generation++;playing=true;game=d.state;frame=d.frame;score=d.score;best=Math.max(best,d.best,score);$("score").textContent=score;$("best").textContent=best;last=performance.now();$("status").textContent="Cloud save restored.";document.dispatchEvent(new CustomEvent("ashfall:arcade-started",{detail:{gameId:"cabinet-"+id}}));draw();const restored=generation;requestAnimationFrame(t=>loop(t,restored));return true};
globalThis.isGameActive=()=>playing;
})();