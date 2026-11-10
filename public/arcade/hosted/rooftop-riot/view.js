/* Rooftop Riot 2.0 canvas presentation + accessible controls. */
(()=>{'use strict';
const Engine=window.RooftopRiotEngine;if(!Engine)return;
const byId=id=>document.getElementById(id),canvas=byId('game'),ctx=canvas.getContext('2d',{alpha:false});
if(!ctx)return;
const {W,H}=Engine,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const art={};
for(const [key,src] of Object.entries({runner:'./sprites/ash-runner.svg',shard:'./sprites/ember-shard.svg'})){
 const img=new Image();img.decoding='async';img.src=src;art[key]=img;
}
let game=new Engine.Game(),paused=false,runId=0,frameId=0,last=0,finished=false,sound=false,audio=null,fullscreenFallback=false,fxTime=0,screenShake=0;
let best=0;try{best=Math.max(0,Number(localStorage.getItem('rooftop-riot-v2-best'))||0)}catch{}
const colors=['#ff55d8','#79ffe7','#c6ff45','#a889ff'],reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
const setText=(id,t)=>{const node=byId(id);if(node&&node.textContent!==String(t))node.textContent=String(t)};
function sfx(type){
 if(!sound)return;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  const o=audio.createOscillator(),g=audio.createGain();
  o.type=type==='shard'?'sine':'triangle';o.frequency.value=type==='shard'?780:type==='checkpoint'?620:type==='jump'?310:120;
  g.gain.value=.045;o.connect(g);g.connect(audio.destination);o.start();
  o.frequency.exponentialRampToValueAtTime(Math.max(60,o.frequency.value*.48),audio.currentTime+.14);
  g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.17);o.stop(audio.currentTime+.18);
 }catch{}
}
function endRun(){
 if(finished)return;finished=true;cancelAnimationFrame(frameId);frameId=0;
 const won=game.state==='won',data=game.snapshot();
 if(data.score>best){best=data.score;try{localStorage.setItem('rooftop-riot-v2-best',String(best))}catch{}}
 byId('overlay').hidden=false;setText('headline',won?'EXTRACTION COMPLETE':'RUN TERMINATED');
 setText('desc',(won?'Four districts cleared. You actually escaped the skyline. ':
   data.falls>=3?'Three falls. Gravity refuses to negotiate. ':data.hp<=0?'The city security system won this round. ':'Time expired. The rooftops are still waiting. ')+
   'Final score: '+data.score.toLocaleString()+' · '+data.shards+' crystals · '+data.progress+'% route cleared.');
 setText('start','Run it back');paintHud();
 document.dispatchEvent(new CustomEvent('ashfall:arcade-finished',{detail:{gameId:'cabinet-rooftop-riot',score:data.score,won,shards:data.shards,distance:data.distance}}));
}
function syncPause(){
 setText('pause',paused?'▶ Resume':'Ⅱ Pause');
 const panel=byId('pause-overlay');
 if(panel)panel.hidden=!paused;
}
function start(){
 cancelAnimationFrame(frameId);runId++;const token=runId;
 game=new Engine.Game({seed:20261103+runId*127});game.start();paused=false;finished=false;last=performance.now();screenShake=0;
 byId('overlay').hidden=true;canvas.focus({preventScroll:true});setText('toast','');byId('pause-overlay').hidden=true;setText('start','Start run');syncPause();paintHud();draw();
 document.dispatchEvent(new CustomEvent('ashfall:arcade-started',{detail:{gameId:'cabinet-rooftop-riot'}}));
 frameId=requestAnimationFrame(t=>loop(t,token));
}
function pause(){
 if(game.state!=='running'||finished)return;paused=!paused;
 game.input.left=false;game.input.right=false;syncPause();
 if(!paused){canvas.focus({preventScroll:true});last=performance.now();const token=runId;frameId=requestAnimationFrame(t=>loop(t,token));}
 else{cancelAnimationFrame(frameId);frameId=0;}
}
function loop(now,token){
 if(token!==runId||paused||game.state!=='running')return;
 const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;fxTime+=dt;
 const previousHp=game.hp,previousFalls=game.falls,previousShards=game.shards;
 const prev=game.lastEvent;game.tick(dt);
 if(game.lastEvent!==prev||game.shards!==previousShards){
  if(['shard','checkpoint','jump','hit','fall','won'].includes(game.lastEvent))sfx(game.lastEvent);
  
  if(game.lastEvent==='checkpoint')setText('toast','CHECKPOINT SECURED · FALLS REMAIN '+(3-game.falls));
  if(game.lastEvent==='shard')setText('toast',game.combo>1?'COMBO ×'+game.combo+' · KEEP MOVING':'CRYSTAL ACQUIRED');
 }
 if(game.falls>previousFalls){
  screenShake=8;sfx('fall');setText('toast','FALL · '+(3-game.falls)+' remaining');
 }else if(game.hp<previousHp){
  screenShake=8;sfx('hit');setText('toast',game.lastEvent==='steam'?'STEAM BURN · clear the vent':'DRONE HIT · move clear');
 }
 screenShake=Math.max(0,screenShake-dt*22);
 draw();paintHud();
 if(game.state==='running')frameId=requestAnimationFrame(t=>loop(t,token));
 else endRun();
}
function paintHud(){
 const s=game.snapshot();
 setText('distance',s.distance+' m');setText('shards',String(s.score));setText('crystals',s.shards+' / '+game.world.shards.length);
 setText('best',best.toLocaleString());setText('falls',s.falls+' / 3');
 setText('health','♥ '.repeat(Math.max(0,s.hp)).trim()||'OUT');
 setText('district',s.district);setText('timer',Math.ceil(s.time)+'s');
 setText('progress',s.progress+'%');setText('checkpoint','ROOF '+(s.checkpoint+1));
 setText('combo',s.combo>1?'×'+s.combo:'—');
 const bar=byId('route-progress');if(bar)bar.style.width=s.progress+'%';
 const dash=byId('dash-ready');if(dash)dash.textContent=game.player.dashReady?'DASH READY':'DASH RECHARGING';
}
function buildings(cam,rate,color,blocks,topVariance,windowAlpha){
 ctx.fillStyle=color;
 const base=Math.floor(cam*rate/blocks)*blocks;
 for(let i=-2;i<Math.ceil(W/blocks)+3;i++){
  const ix=base+i*blocks,screen=ix-cam*rate,h=topVariance+(Math.abs(Math.sin(ix*.00173))*150);
  ctx.fillRect(screen,H-h,blocks-10,h);
  ctx.fillStyle=windowAlpha;
  for(let y=H-h+18;y<H-14;y+=27)for(let x=screen+14;x<screen+blocks-18;x+=20){
   if((Math.abs(Math.floor(ix/blocks)+Math.floor(y/27)+Math.floor(x/20)))%5<2)ctx.fillRect(x,y,7,10);
  }
  ctx.fillStyle=color;
 }
}
function drawBackground(cam){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#080719');const district=game.world.roofs.findLast(roof=>roof.x<=game.player.x)?.district||0;
 const horizons=[['#211339','#263146'],['#102938','#274958'],['#351938','#553045'],['#231a48','#40456b']];
 sky.addColorStop(.45,horizons[district][0]);sky.addColorStop(1,horizons[district][1]);
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 const moon=ctx.createRadialGradient(753,105,6,753,105,175);
 moon.addColorStop(0,'#a98dff44');moon.addColorStop(1,'#8855ff00');ctx.fillStyle=moon;ctx.fillRect(580,-60,350,340);
 ctx.fillStyle='#dcceff';ctx.beginPath();ctx.arc(754,105,38,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#25163b';ctx.beginPath();ctx.arc(766,98,36,0,Math.PI*2);ctx.fill();
 for(let i=0;i<85;i++){
  const x=((i*137+24-cam*.015)%W+W)%W,y=(i*97)%225;
  ctx.fillStyle=i%5?'#caafff56':'#d6ffba80';ctx.fillRect(x,y,i%7===0?2:1,i%7===0?2:1);
 }
 buildings(cam,.12,'#191629',138,210,'#c6ff4515');
 buildings(cam,.27,'#22213c',112,180,'#ff55d824');
 buildings(cam,.45,'#18263a',135,132,'#79ffe731');
 ctx.fillStyle='#79ffe719';for(let i=0;i<7;i++){
  const x=((i*285-cam*.12)%1250+1250)%1250-140;
  ctx.save();ctx.translate(x,385);ctx.rotate(Math.sin(fxTime*.25+i)*.13);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-105,-330);ctx.lineTo(105,-330);ctx.closePath();ctx.fill();ctx.restore();
 }
}
function roofDraw(roof,cam){
 const x=roof.x-cam;if(x>W+80||x+roof.w<-80)return;
 const palette=[['#2a2842','#ff55d8'],['#283449','#79ffe7'],['#2c3140','#c6ff45'],['#32273f','#ff84cb']][roof.district];
 const grad=ctx.createLinearGradient(0,roof.y,0,H);
 grad.addColorStop(0,palette[0]);grad.addColorStop(1,'#0e101c');
 ctx.fillStyle=grad;ctx.fillRect(x,roof.y,roof.w,H-roof.y);
 ctx.fillStyle='#10121d';ctx.fillRect(x-6,roof.y-12,roof.w+12,17);
 ctx.fillStyle=palette[1];ctx.shadowColor=palette[1];ctx.shadowBlur=14;ctx.fillRect(x,roof.y-7,roof.w,4);ctx.shadowBlur=0;
 ctx.fillStyle='#ffffff10';ctx.fillRect(x+9,roof.y+16,roof.w-18,2);
 for(let i=0;i<Math.floor(roof.w/45);i++){
  ctx.strokeStyle='#8b86aa28';ctx.lineWidth=2;ctx.strokeRect(x+11+i*43,roof.y+29,30,37);
 }
 if(roof.i%3===0){
  ctx.fillStyle='#11111a';ctx.fillRect(x+26,roof.y-47,43,41);
  ctx.strokeStyle=palette[1];ctx.lineWidth=2;ctx.strokeRect(x+26,roof.y-47,43,41);
  ctx.fillStyle=palette[1];ctx.font='900 11px system-ui';ctx.fillText('KF',x+37,roof.y-23);
 }
 if(roof.checkpoint){
  const glow=Math.sin(fxTime*4)*4;
  ctx.strokeStyle='#c6ff45';ctx.shadowColor='#c6ff45';ctx.shadowBlur=20;ctx.lineWidth=4;
  ctx.strokeRect(x+roof.w*.44,roof.y-68+glow,45,68);ctx.shadowBlur=0;
  ctx.fillStyle='#c6ff45';ctx.font='900 12px system-ui';ctx.fillText('SAVE',x+roof.w*.44,roof.y-78+glow);
 }
 if(roof.exit){
  const px=x+roof.w*.7;
  const halo=ctx.createRadialGradient(px,roof.y-88,4,px,roof.y-88,80);
  halo.addColorStop(0,'#c6ff4559');halo.addColorStop(1,'#c6ff4500');
  ctx.fillStyle=halo;ctx.fillRect(px-85,roof.y-180,180,180);
  ctx.strokeStyle='#c6ff45';ctx.lineWidth=7;ctx.shadowBlur=25;ctx.shadowColor='#c6ff45';
  ctx.strokeRect(px-30,roof.y-120,63,118);ctx.shadowBlur=0;
  ctx.fillStyle='#c6ff45';ctx.font='1000 15px system-ui';ctx.textAlign='center';ctx.fillText('EXIT',px,roof.y-133);ctx.textAlign='left';
 }
}
function drawHazards(cam){
 for(const v of game.world.vents){
  const x=v.x-cam;if(x<-50||x>W+50)continue;
  const active=(game.time+v.phase)%3.6>1.15;
  ctx.fillStyle='#263544';ctx.fillRect(x-14,v.y-12,40,12);
  ctx.fillStyle=active?'#ff55d8':'#79ffe7';
  ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=active?18:5;
  for(let j=0;j<4;j++)ctx.fillRect(x-10+j*9,v.y-15,5,4);
  if(active){ctx.globalAlpha=.4+Math.sin(game.time*10)*.17;ctx.fillRect(x-8,v.y-70,32,55);ctx.globalAlpha=1;}
  ctx.shadowBlur=0;
 }
 for(const d of game.world.drones){
  const x=d.baseX+Math.sin(game.time*1.9+d.phase)*44-cam,y=d.baseY+Math.cos(game.time*2.1+d.phase)*14;
  if(x<-50||x>W+50)continue;
  ctx.save();ctx.translate(x,y);ctx.shadowColor='#ff55d8';ctx.shadowBlur=20;
  ctx.fillStyle='#301632';ctx.strokeStyle='#ff55d8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#c6ff45';ctx.fillRect(-7,-3,14,6);
  ctx.shadowBlur=0;ctx.strokeStyle='#79ffe7';ctx.beginPath();ctx.moveTo(-32,-12);ctx.lineTo(-15,0);ctx.moveTo(32,-12);ctx.lineTo(15,0);ctx.stroke();ctx.restore();
 }
}
function drawRunner(cam){
 const p=game.player,x=p.x-cam,y=p.y;
 if(p.inv>0&&Math.floor(fxTime*18)%2===0)return;
 ctx.save();ctx.translate(x+p.w/2,y+p.h/2);ctx.scale(p.face,1);
 const run=Math.min(1,Math.abs(p.vx)/350),step=Math.sin(game.time*18)*run*4;
 ctx.fillStyle='#10111c';ctx.beginPath();ctx.ellipse(0,23,23,7,0,0,Math.PI*2);ctx.fill();
 ctx.shadowColor='#ff55d8';ctx.shadowBlur=14;ctx.fillStyle='#c6ff45';ctx.fillRect(-7,7+step,5,19);ctx.fillRect(3,7-step,5,19);
 ctx.fillStyle='#20172a';ctx.fillRect(-13,-17,26,33);
 ctx.fillStyle='#ff55d8';ctx.fillRect(-13,-17,26,8);
 ctx.fillStyle='#f9c9b1';ctx.beginPath();ctx.arc(0,-23,11,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#25142b';ctx.fillRect(-11,-35,22,8);
 ctx.fillStyle='#c6ff45';ctx.fillRect(-9,-25,7,3);ctx.fillRect(3,-25,7,3);
 if(art.runner.complete&&art.runner.naturalWidth)ctx.drawImage(art.runner,-24,-45,48,74);
 if(p.dash>0){ctx.strokeStyle='#c6ff45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-69,0);ctx.moveTo(-21,9);ctx.lineTo(-44,9);ctx.stroke();}
 ctx.restore();
}
function draw(){
 const cam=game.camera,p=game.player;
 ctx.save();if(!reduced()&&screenShake>0)ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);
 drawBackground(cam);
 for(const roof of game.world.roofs)roofDraw(roof,cam);
 drawHazards(cam);
 for(const s of game.world.shards){
  if(s.taken)continue;const x=s.x-cam;if(x<-30||x>W+30)continue;
  const y=s.y+Math.sin(game.time*5+s.x*.1)*6;
  ctx.save();ctx.translate(x,y);ctx.rotate(game.time*1.8);
  ctx.shadowColor='#c6ff45';ctx.shadowBlur=17;ctx.fillStyle='#c6ff45';
  ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,0);ctx.lineTo(0,12);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;if(art.shard.complete&&art.shard.naturalWidth)ctx.drawImage(art.shard,-12,-12,24,24);ctx.restore();
 }
 drawRunner(cam);
 for(const e of game.effects){
  const x=e.x-cam,y=e.y,alpha=clamp(e.life/.45,0,1);
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=20;ctx.lineWidth=2+(1-alpha)*3;
  ctx.beginPath();ctx.arc(x,y,12+(1-alpha)*50,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 if(game.combo>1){
  ctx.fillStyle='#c6ff45';ctx.shadowColor='#c6ff45';ctx.shadowBlur=14;
  ctx.font='1000 30px system-ui';ctx.fillText('CRYSTAL CHAIN ×'+game.combo,22,84);ctx.shadowBlur=0;
 }
 const vignette=ctx.createRadialGradient(W/2,H/2,110,W/2,H/2,660);
 vignette.addColorStop(0,'#05071000');vignette.addColorStop(1,'#05071092');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#ffffff08';for(let y=0;y<H;y+=6)ctx.fillRect(0,y,W,1);
 ctx.restore();
}
function fullscreen(){
 const scene=byId('cabinet');if(!scene)return;
 if(document.fullscreenElement===scene){document.exitFullscreen?.();return}
 if(fullscreenFallback){fullscreenFallback=false;scene.classList.remove('immersive-fallback');syncFull();return}
 if(scene.requestFullscreen){scene.requestFullscreen().catch(()=>{fullscreenFallback=true;scene.classList.add('immersive-fallback');syncFull()});}
 else{fullscreenFallback=true;scene.classList.add('immersive-fallback');syncFull();}
}
function syncFull(){
 const active=!!document.fullscreenElement||fullscreenFallback;
 setText('fullscreen',active?'⤢ Exit fullscreen':'⛶ Fullscreen');
 byId('fullscreen')?.setAttribute('aria-pressed',String(active));
}
byId('start').addEventListener('click',start);
byId('restart').addEventListener('click',start);
byId('pause').addEventListener('click',pause);
byId('resume').addEventListener('click',pause);
byId('fullscreen').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',syncFull);
byId('sound').addEventListener('click',()=>{sound=!sound;setText('sound',sound?'♫ Sound on':'♪ Sound off');byId('sound').setAttribute('aria-pressed',String(sound));if(sound)sfx('checkpoint')});
function down(e){
 if(e.target.closest('input,select,textarea,[contenteditable]'))return;
 const code=e.code;
 if(e.altKey||e.metaKey||e.ctrlKey)return;
 if((code==='Space'||code==='Enter')&&e.target.closest('button,a'))return;
 if(paused&& !['KeyP','Escape','KeyF','KeyR'].includes(code))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','Space','ShiftLeft','ShiftRight'].includes(code))e.preventDefault();
 if(['ArrowLeft','KeyA'].includes(code))game.input.left=true;
 if(['ArrowRight','KeyD'].includes(code))game.input.right=true;
 if(['ArrowUp','KeyW','Space'].includes(code)&&!e.repeat)game.pressJump();
 if(['ShiftLeft','ShiftRight','KeyX'].includes(code)&&!e.repeat)game.pressDash();
 if(['KeyP','Escape'].includes(code)&&!e.repeat)pause();
 if(code==='KeyR'&&!e.repeat)start();
 if(code==='KeyF'&&!e.repeat)fullscreen();
 if(code==='Enter'&&game.state!=='running'&&!e.repeat)start();
}
function up(e){if(['ArrowLeft','KeyA'].includes(e.code))game.input.left=false;if(['ArrowRight','KeyD'].includes(e.code))game.input.right=false;}
document.addEventListener('keydown',down);
document.addEventListener('keyup',up);
function bindHold(id,key){
 const button=byId(id),active=new Set();
 button.addEventListener('pointerdown',e=>{e.preventDefault();active.add(e.pointerId);button.setPointerCapture?.(e.pointerId);game.input[key]=true;});
 for(const eventName of ['pointerup','pointercancel','lostpointercapture']){
  button.addEventListener(eventName,e=>{active.delete(e.pointerId);if(!active.size)game.input[key]=false;});
 }
}
bindHold('left','left');bindHold('right','right');
for(const [id,fn] of [['jump',()=>game.pressJump()],['dash',()=>game.pressDash()]]){
 const button=byId(id);button.addEventListener('pointerdown',e=>{e.preventDefault();fn()});
}
function clearInput(){game.input.left=false;game.input.right=false;}
window.addEventListener('blur',()=>{clearInput();if(game.state==='running'&&!paused)pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.state==='running'&&!paused)pause()}});
window.RooftopRiotStatus=()=>game.snapshot();
draw();paintHud();syncPause();
})();
