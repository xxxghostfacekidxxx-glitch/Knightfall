/* Original Neon Nuisances minigame: Cinder Catch.
 * Player movement is real-time, touch and keyboard accessible.
 * Scores are cosmetic. Only the existing server-verified play care action
 * grants XP, subject to its normal 10-minute per-pet cooldown.
 */
(()=>{'use strict';
const canvas=document.getElementById('cinder-catch-canvas'),selector=document.getElementById('cinder-catch-pet'),
 start=document.getElementById('cinder-catch-start'),status=document.getElementById('cinder-catch-status');
if(!canvas||!selector||!start||!status)return;
const ctx=canvas.getContext('2d'),W=720,H=400,GOAL=12,DURATION=35000,API='https://api.ash-fall.com';
if(!ctx){status.textContent='This browser cannot run the Cinder Catch canvas.';start.disabled=true;return}
let pets=[],running=false,frame=0,last=0,startAt=0,spawnAt=0,items=[],score=0,lives=3,player=360,pressed={left:false,right:false},
 gamePet=null,memoryBest=0,petAvatar=null;
const note=value=>{status.textContent=String(value)};
const rnd=(min,max)=>min+Math.random()*(max-min);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
async function getPets(){
 const response=await fetch(API+'/api/mascot-pets/me',{credentials:'include',cache:'no-store'});
 if(!response.ok)throw Error(response.status===401?'Sign in to play with an adopted mascot.':'Could not load companions.');
 const data=await response.json();
 return data.pets||[];
}
function updateSelector(){
 const previous=selector.value;selector.replaceChildren();
 for(const pet of pets){
  const opt=document.createElement('option');
  opt.value=String(pet.id);opt.textContent=pet.nickname+' · '+pet.species_name;
  selector.append(opt);
 }
 if(pets.some(x=>String(x.id)===previous))selector.value=previous;
 else selector.value=String(pets.find(x=>x.featured)?.id||pets[0]?.id||'');
 if(!running)start.disabled=!pets.length;
}
function starfield(t){
 ctx.fillStyle='#080b19';ctx.fillRect(0,0,W,H);
 const glaze=ctx.createRadialGradient(350,70,40,350,240,490);
 glaze.addColorStop(0,'#58225d60');glaze.addColorStop(.55,'#19244260');glaze.addColorStop(1,'#060713');
 ctx.fillStyle=glaze;ctx.fillRect(0,0,W,H);
 ctx.lineWidth=1;
 for(let x=-H;x<W+H;x+=48){
  ctx.strokeStyle='#ff55d81c';ctx.beginPath();ctx.moveTo(x,400);ctx.lineTo(x+260,0);ctx.stroke();
 }
 for(let y=0;y<H;y+=42){
  ctx.strokeStyle='#79ffe718';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
 }
 for(let i=0;i<32;i++){
  const x=(i*173+42)%W,y=(i*109+41)%330;
  const alpha=.2+Math.abs(Math.sin(t/1100+i))*.6;
  ctx.globalAlpha=alpha;ctx.fillStyle=i%3?'#79ffe7':'#ff55d8';
  ctx.fillRect(x,y,2.2,2.2);
 }
 ctx.globalAlpha=1;
 const horizon=ctx.createLinearGradient(0,340,0,400);
 horizon.addColorStop(0,'#ff55d821');horizon.addColorStop(1,'#c6ff4543');
 ctx.fillStyle=horizon;ctx.fillRect(0,342,W,58);
 ctx.strokeStyle='#c6ff45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,365);ctx.lineTo(W,365);ctx.stroke();
}
function polygon(x,y,r,n,rotation){
 ctx.beginPath();for(let i=0;i<n;i++){const t=rotation+(i*2*Math.PI/n);const nx=x+Math.cos(t)*r,ny=y+Math.sin(t)*r;if(i===0)ctx.moveTo(nx,ny);else ctx.lineTo(nx,ny)}ctx.closePath();
}
function drawPickup(p,t){
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(t/700+p.spin);
 if(p.kind==='cinder'){
  ctx.shadowColor='#c6ff45';ctx.shadowBlur=20;
  polygon(0,0,13,4,Math.PI/4);ctx.fillStyle='#c6ff45';ctx.fill();
  polygon(0,0,8,4,Math.PI/4);ctx.fillStyle='#fff9ac';ctx.fill();
 }else{
  ctx.shadowColor='#ff55d8';ctx.shadowBlur=18;
  polygon(0,0,16,6,Math.PI/6);ctx.fillStyle='#d62b83';ctx.fill();
  ctx.strokeStyle='#fff6ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(7,7);ctx.moveTo(7,-7);ctx.lineTo(-7,7);ctx.stroke();
 }
 ctx.restore();
}
function drawPlayer(){
 ctx.save();ctx.translate(player,333);
 ctx.shadowColor='#79ffe7';ctx.shadowBlur=19;
 ctx.fillStyle='#161a2e';ctx.strokeStyle='#79ffe7';ctx.lineWidth=5;
 ctx.beginPath();ctx.moveTo(-36,-12);ctx.lineTo(-27,20);ctx.quadraticCurveTo(0,30,27,20);ctx.lineTo(36,-12);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle='#ff55d8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-36,-12);ctx.lineTo(36,-12);ctx.stroke();
 ctx.fillStyle='#c6ff45';ctx.beginPath();ctx.arc(0,4,7,0,Math.PI*2);ctx.fill();ctx.restore();
 if(petAvatar?.complete&&petAvatar.naturalWidth>0){
  ctx.save();ctx.shadowColor='#ff55d8';ctx.shadowBlur=10;
  ctx.drawImage(petAvatar,player-30,253,60,65);ctx.restore();
 }
 if(gamePet){ctx.save();ctx.textAlign='center';ctx.font='800 11px system-ui,sans-serif';ctx.fillStyle='#eaffec';ctx.fillText(gamePet.nickname.slice(0,22),player,392);ctx.restore()}

}
function drawOverlay(text,sub){
 ctx.fillStyle='#070817b8';ctx.fillRect(0,90,W,210);
 ctx.textAlign='center';ctx.fillStyle='#c6ff45';ctx.shadowColor='#c6ff4550';ctx.shadowBlur=16;
 ctx.font='900 39px system-ui,sans-serif';ctx.fillText(text,W/2,171);ctx.shadowBlur=0;
 ctx.font='500 16px system-ui,sans-serif';ctx.fillStyle='#f6eafe';ctx.fillText(sub,W/2,215);
}
function draw(t=0){
 starfield(t);
 for(const item of items)drawPickup(item,t);
 drawPlayer();
 ctx.textAlign='left';ctx.font='900 21px system-ui,sans-serif';ctx.fillStyle='#c6ff45';
 ctx.fillText('✦ '+score+' / '+GOAL,22,37);
 ctx.fillStyle='#ff55d8';ctx.fillText('♥ '+lives,22,67);
 ctx.textAlign='right';ctx.fillStyle='#79ffe7';
 const remaining=running?Math.ceil(Math.max(0,DURATION-(t-startAt))/1000):35;
 ctx.fillText(remaining+'s',W-25,37);
 ctx.font='700 13px system-ui,sans-serif';ctx.fillStyle='#c7b8d0';ctx.fillText('CINDER CATCH',W-25,65);
 if(!running&&score===0)drawOverlay('CINDER CATCH','Collect 12 neon Cinders. Dodge pink hazards.');
}
function spawn(){
 const hazard=Math.random()<.23;
 items.push({kind:hazard?'hazard':'cinder',x:rnd(20,W-20),y:-25,
   speed:rnd(115,200)+(score*2),spin:rnd(0,Math.PI*2)});
}
async function finish(won){
 running=false;cancelAnimationFrame(frame);start.disabled=false;
 draw(performance.now());
 drawOverlay(won?'CINDER MASTER!':'THE CINDERS ESCAPED',
  won?'Your companion earned a play session.':'Try again. No companions or currency were lost.');
 if(!won){note('You caught '+score+' / '+GOAL+' Cinders. Try again for a companion play session.');return}
 memoryBest=Math.max(memoryBest,score);
 note('Victory! Saving your companion’s regular play-care reward…');
 try{
  const result=await fetch(API+'/api/mascot-pets/'+gamePet.id+'/care',{method:'POST',credentials:'include',
   headers:{'content-type':'application/json'},body:JSON.stringify({action:'play'})});
  const data=await result.json().catch(()=>({}));
  if(!result.ok){
   note(result.status===429?'Victory! Your pet has already played recently. The server cooldown still applies.':(data.error||'Care could not be saved.'));
  }else{
   note('Victory with '+gamePet.nickname+'! '+(data.message||'Companion play completed.'));
   document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'minigame'}}));
  }
 }catch(e){note('Victory! Server care confirmation unavailable: '+e.message)}
}
function tick(t){
 if(!running)return;
 const dt=Math.min(.05,(t-last)/1000||0);last=t;
 if(t-spawnAt>490){spawn();spawnAt=t+rnd(0,170)}
 const left=pressed.left?-1:0,right=pressed.right?1:0;
 player=clamp(player+(left+right)*dt*410,40,W-40);
 const kept=[];
 for(const item of items){
  item.y+=dt*item.speed;
  if(Math.abs(item.x-player)<43&&item.y>311&&item.y<359){
   if(item.kind==='cinder')score++;else lives--;
   continue;
  }
  if(item.y<385)kept.push(item);
 }
 items=kept;
 draw(t);
 if(score>=GOAL){void finish(true);return}
 if(lives<=0||t-startAt>=DURATION){void finish(false);return}
 frame=requestAnimationFrame(tick);
}
start.addEventListener('click',()=>{
 if(running||!pets.length)return;
 gamePet=pets.find(x=>String(x.id)===selector.value)||pets[0];if(!gamePet)return;
 petAvatar=null;
 if(/^\/assets\/devil-tools\/neon-nuisances\/[a-z0-9-]+\.svg$/.test(gamePet.idle||'')){
  petAvatar=new Image();petAvatar.src=gamePet.idle+'?v=20261102-catch-avatar1';
 }
 running=true;score=0;lives=3;items=[];player=360;pressed.left=false;pressed.right=false;
 start.disabled=true;startAt=performance.now();last=startAt;spawnAt=startAt-550;
 note('Playing with '+gamePet.nickname+'. Catch the lime crystals and dodge magenta hazards.');
 canvas.focus({preventScroll:true});frame=requestAnimationFrame(tick);
});
function handleDirection(event,down){
 if(!running)return;
 const target=event.target;
 if(target?.matches?.('input,select,textarea,[contenteditable="true"]'))return;
 if(['ArrowLeft','a','A'].includes(event.key)){pressed.left=down;event.preventDefault()}
 if(['ArrowRight','d','D'].includes(event.key)){pressed.right=down;event.preventDefault()}
}
window.addEventListener('keydown',event=>handleDirection(event,true));
window.addEventListener('keyup',event=>handleDirection(event,false));
function pointerMove(event){
 if(!running)return;
 const r=canvas.getBoundingClientRect();
 player=clamp((event.clientX-r.left)*W/r.width,40,W-40);
}
canvas.addEventListener('pointerdown',event=>{pointerMove(event);canvas.setPointerCapture?.(event.pointerId);event.preventDefault()});
canvas.addEventListener('pointermove',event=>{if(event.buttons||event.pointerType==='touch')pointerMove(event)});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&running){running=false;cancelAnimationFrame(frame);start.disabled=false;note('Game paused because the tab was hidden. Start a fresh round when you return.')}
});
document.addEventListener('sanctuary-changed',event=>{if(event.detail?.source!=='pets'&&event.detail?.source!=='adventures')return;void load()});
async function load(){
 try{pets=await getPets();updateSelector();
  if(!pets.length)note('Rescue your first companion to play Cinder Catch.');
  else if(!running)note('Choose a companion, then catch 12 Cinders to play together. Scores never mint extra currency.');
 }catch(e){pets=[];updateSelector();note(e.message)}
}
draw(0);void load();
})();