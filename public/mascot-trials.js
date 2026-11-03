import {challengeFor,memoryDeck,runeSequence,RUNES} from './mascot-trials-engine.mjs';

const API='https://api.ash-fall.com';
const q=id=>document.getElementById(id);
const select=q('trial-companion'),portrait=q('trial-portrait'),family=q('trial-family'),
 title=q('trial-title'),description=q('trial-description'),level=q('trial-level'),
 playfield=q('trial-playfield'),controls=q('trial-controls'),scoreLabel=q('trial-score'),
 timeLabel=q('trial-time'),livesLabel=q('trial-lives'),start=q('trial-start'),
 stop=q('trial-stop'),status=q('trial-status');
const info={
 catch:'Catch glowing crystals and avoid pink hazards. Use arrows, A/D, or drag on the game.',
 memory:'Find every matching pair before the haunted clock runs out.',
 runes:'Watch the glowing four-symbol sequence, then repeat it in the correct order.',
 dodge:'Dodge waves of pink hazards. Survive the timer and protect your companion.'
};
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=String(content);return el};
const say=text=>{status.textContent=String(text)};
const safeAvatar=s=>/^\/assets\/devil-tools\/neon-nuisances\/(?:portraits\/)?[a-z0-9-]+\.svg$/.test(s)?s:'';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let pets=[],pet=null,challenge=null,active=false,roundId=0,deadline=0,ticker=0,raf=0,
 score=0,lives=3,timers=[],run=null,pressed={left:false,right:false};
async function api(path,options={}){
 const res=await fetch(API+path,{credentials:'include',cache:'no-store',...options,
  headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){const error=new Error(data.error||'Sanctuary service unavailable');error.status=res.status;throw error}
 return data;
}
function delay(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function clearTimers(){
 if(ticker)clearInterval(ticker);
 if(raf)cancelAnimationFrame(raf);
 for(const id of timers)clearTimeout(id);
 ticker=0;raf=0;timers=[];
}
function hud(){
 scoreLabel.textContent=challenge?.mode==='dodge'?'Survived '+score+' / '+(challenge?.target||0):'Progress '+score+' / '+(challenge?.target||0);
 timeLabel.textContent='Time '+(active?Math.max(0,Math.ceil((deadline-performance.now())/1000)):0)+'s';
 livesLabel.textContent=lives>0?'♥ '.repeat(lives):'0 lives';
}
function selectPet(){
 if(active)return;
 pet=pets.find(p=>String(p.id)===select.value)||null;
 challenge=pet?challengeFor(pet.species,pet.level):null;
 if(!challenge){start.disabled=true;return}
 title.textContent=challenge.title;
 family.textContent=challenge.mode.toUpperCase()+' · '+challenge.family.toUpperCase();
 description.textContent=info[challenge.mode];
 level.textContent='Level '+challenge.level+' · Target '+challenge.target;
 playfield.dataset.mode=challenge.mode;
 portrait.src=safeAvatar(pet.portrait||pet.image)||'';
 portrait.alt=pet.species_name+' original companion';
 start.disabled=false;playfield.replaceChildren();controls.replaceChildren();
 playfield.append(node('p','trial-ready','✦ '+challenge.title+' · '+info[challenge.mode]));
 score=0;lives=3;hud();
}
async function load(){
 try{
  const data=await api('/api/mascot-pets/me');
  pets=data.pets||[];
  const requested=new URLSearchParams(location.search).get('pet');
  const selected=select.value;select.replaceChildren();
  for(const entry of pets){
   const option=node('option','',entry.nickname+' · '+entry.species_name);option.value=String(entry.id);select.append(option);
  }
  if(pets.some(p=>String(p.id)===requested))select.value=requested;
  else if(pets.some(p=>String(p.id)===selected))select.value=selected;
  else select.value=String(pets.find(p=>p.featured)?.id||pets[0]?.id||'');
  if(!pets.length){start.disabled=true;say('Adopt a mascot before visiting Species Trials.');}
  else {selectPet();say('Select a companion, then begin its species trial. Victories use the normal pet-care cooldown.')}
 }catch(e){start.disabled=true;say(e.status===401?'Sign in to access your companion trials.':e.message)}
}
function newRun(){
 clearTimers();roundId++;active=true;start.disabled=true;stop.disabled=false;select.disabled=true;
 score=0;lives=3;deadline=performance.now()+challenge.time_limit*1000;
 pressed={left:false,right:false};playfield.replaceChildren();controls.replaceChildren();
 run={id:roundId,petId:pet.id,mode:challenge.mode,target:challenge.target};
 hud();
 ticker=setInterval(()=>{
  if(!active)return;
  hud();
  if(performance.now()>=deadline)void finish(challenge.mode==='dodge'&&score>=challenge.target);
 },100);
}
async function finish(won){
 if(!active)return;
 const resultRun=run;
 active=false;roundId++;
 clearTimers();start.disabled=false;stop.disabled=true;select.disabled=false;hud();
 const banner=node('p',won?'trial-win':'trial-lose',
  won?'✦ TRIAL CLEARED!':'THE TRIAL ENDED');
 playfield.append(banner);
 if(!won){say('Trial ended: '+score+' / '+resultRun.target+'. Your companion is safe. Try again!');return}
 say('Victory! Confirming '+pet.nickname+'’s normal Play session with Knightfall…');
 try{
  const response=await api('/api/mascot-pets/'+resultRun.petId+'/care',
   {method:'POST',body:JSON.stringify({action:'play'})});
  say(response.message||'Your companion earned a regular Play session!');
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'minigame'}}));
 }catch(e){
  say(e.status===429?'Trial won! Your companion has already played recently. The normal cooldown still applies.':('Trial won, but Play care was not saved: '+e.message));
 }
}
function trialButton(label,cls,handler){
 const b=node('button',cls,label);b.type='button';b.addEventListener('click',handler);return b;
}
function memoryTrial(){
 const pieces=memoryDeck(challenge.target);
 const grid=node('div','trial-memory-grid');
 playfield.append(grid);
 const revealed=[],matched=new Set();
 let locked=false;
 for(const piece of pieces){
  const button=trialButton('?', 'trial-memory-card',()=>{
   if(!active||locked||matched.has(piece.index)||revealed.some(i=>i===piece.index))return;
   button.textContent=piece.symbol;button.classList.add('is-revealed');
   revealed.push(piece.index);
   if(revealed.length!==2)return;
   locked=true;
   const first=pieces[revealed[0]],second=pieces[revealed[1]];
   const pair=first.symbol===second.symbol;
   if(pair){matched.add(first.index);matched.add(second.index);score++;hud()}
   const current=roundId;
   delay(()=>{
    if(!active||current!==roundId)return;
    for(const id of revealed){
     const el=grid.querySelector('[data-index="'+id+'"]');
     if(!pair&&el){el.textContent='?';el.classList.remove('is-revealed')}
     if(pair&&el)el.classList.add('is-matched');
    }
    revealed.splice(0,2);locked=false;
    if(score>=challenge.target)void finish(true);
   },pair?260:690);
  });
  button.dataset.index=String(piece.index);button.setAttribute('aria-label','Reveal hidden symbol at position '+(piece.index+1));
  grid.append(button);
 }
 say('Match all '+challenge.target+' haunted pairs before the timer runs out.');
}
function runeTrial(){
 const buttons=RUNES.map((symbol,i)=>trialButton(symbol,'trial-rune',()=>enter(i)));
 const panel=node('div','trial-runes');buttons.forEach(b=>panel.append(b));controls.append(panel);
 const prompt=node('p','trial-rune-prompt');playfield.append(prompt);
 let stage=1,input=0,sequence=runeSequence(challenge.target);
 let viewing=true;
 function show(){
  const current=roundId;
  viewing=true;input=0;
  buttons.forEach(b=>b.disabled=true);
  prompt.textContent='Watch '+stage+' rune'+(stage===1?'':'s')+' carefully…';
  for(let i=0;i<stage;i++){
   delay(()=>{
    if(!active||roundId!==current)return;
    buttons.forEach(b=>b.classList.remove('lit'));
    buttons[sequence[i]].classList.add('lit');
   },600+i*950);
   delay(()=>{if(active&&roundId===current)buttons[sequence[i]].classList.remove('lit')},1200+i*950);
  }
  delay(()=>{
   if(!active||roundId!==current)return;
   viewing=false;buttons.forEach(b=>b.disabled=false);
   prompt.textContent='Your turn: repeat '+stage+' rune'+(stage===1?'':'s')+'.';
  },700+stage*950);
 }
 function enter(index){
  if(!active||viewing)return;
  if(index!==sequence[input]){
   lives--;hud();prompt.textContent='Wrong rune. The signal resets!';
   if(lives<=0){void finish(false);return}
   show();return;
  }
  input++;
  if(input<stage)return;
  score=stage;hud();
  if(stage>=challenge.target){void finish(true);return}
  stage++;
  show();
 }
 show();
 say('The rune signal starts simple and grows as you succeed. Three mistakes end the trial.');
}
function arcadeTrial(){
 const W=720,H=380,mode=challenge.mode;
 const canvas=node('canvas','trial-canvas');canvas.width=W;canvas.height=H;
 canvas.tabIndex=0;canvas.setAttribute('aria-label',mode==='dodge'?'Dodge pink obstacles':'Catch green sparks and avoid pink obstacles');
 playfield.append(canvas);
 const context=canvas.getContext('2d');
 if(!context){void finish(false);return}
 const backdrop=new Image();
 backdrop.src='/assets/devil-tools/neon-nuisances/trials/'+mode+'.svg?v=20261102-trials-art1';
 const sprite=new Image();
 const spritePath=safeAvatar(pet.idle||pet.image);
 if(spritePath)sprite.src=spritePath+'?v=20261102-trials-sprite1';
 let x=W/2,items=[],spawn=0,last=performance.now(),started=last;
 let pointerHeld=false;
 const canvasX=event=>{
  const rect=canvas.getBoundingClientRect();
  x=clamp((event.clientX-rect.left)*W/rect.width,35,W-35);
 };
 canvas.addEventListener('pointerdown',e=>{pointerHeld=true;canvas.setPointerCapture?.(e.pointerId);canvasX(e);e.preventDefault()});
 canvas.addEventListener('pointermove',e=>{if(pointerHeld||e.pointerType==='touch')canvasX(e)});
 canvas.addEventListener('pointerup',()=>{pointerHeld=false});
 canvas.focus({preventScroll:true});
 function paint(t){
  if(!active)return;
  const dt=Math.min((t-last)/1000,.045);last=t;
  if(pressed.left)x-=dt*405;
  if(pressed.right)x+=dt*405;
  x=clamp(x,35,W-35);
  const gradient=context.createLinearGradient(0,0,0,H);
  gradient.addColorStop(0,'#1c1231');gradient.addColorStop(1,'#090d1a');
  context.fillStyle=gradient;context.fillRect(0,0,W,H);
  if(backdrop.complete&&backdrop.naturalWidth){context.globalAlpha=.86;context.drawImage(backdrop,0,0,W,H);context.globalAlpha=1}
  context.strokeStyle='#79ffe727';context.lineWidth=1;
  for(let n=0;n<20;n++){context.beginPath();context.moveTo(0,n*24);context.lineTo(W,n*24);context.stroke()}
  if(t-spawn>440){
   const danger=mode==='dodge'||Math.random()<.28;
   items.push({x:25+Math.random()*(W-50),y:-25,fall:145+Math.random()*110,evil:danger});
   spawn=t;
  }
  for(const item of items){
   item.y+=item.fall*dt;
   context.beginPath();context.arc(item.x,item.y,item.evil?14:11,0,2*Math.PI);
   context.shadowColor=item.evil?'#ff55d8':'#c6ff45';
   context.shadowBlur=16;context.fillStyle=item.evil?'#ff55d8':'#c6ff45';context.fill();
  }
  context.shadowBlur=0;
  const remaining=[];
  for(const item of items){
   if(item.y>302&&item.y<358&&Math.abs(item.x-x)<37){
    if(item.evil){lives--;hud();if(lives<=0){void finish(false);return}}
    else{score++;hud();if(mode==='catch'&&score>=challenge.target){void finish(true);return}}
   }else if(item.y<H+25)remaining.push(item);
  }
  items=remaining;
  if(mode==='dodge'){score=Math.min(challenge.target,Math.floor((t-started)/1000));hud();
   if(score>=challenge.target){void finish(true);return}
  }
  const shadow=context.createRadialGradient(x,329,0,x,329,58);
  shadow.addColorStop(0,'#79ffe785');shadow.addColorStop(1,'#79ffe700');
  context.fillStyle=shadow;context.fillRect(x-58,272,116,110);
  context.fillStyle='#091422';context.strokeStyle='#79ffe7';context.lineWidth=5;
  context.beginPath();context.moveTo(x,287);context.lineTo(x-37,341);context.lineTo(x+37,341);
  context.closePath();context.fill();context.stroke();
  context.fillStyle='#c6ff45';context.beginPath();context.arc(x,324,8,0,2*Math.PI);context.fill();
  if(sprite.complete&&sprite.naturalWidth){
   context.save();context.shadowColor=mode==='dodge'?'#ff55d8':'#79ffe7';context.shadowBlur=12;
   context.drawImage(sprite,x-35,251+Math.sin(t/230)*2,70,74);
   context.restore();
  }
  context.font='700 12px system-ui,sans-serif';context.textAlign='center';
  context.fillStyle='#f3edff';context.fillText(pet.nickname.slice(0,22),x,365);
  raf=requestAnimationFrame(paint);
 }
 raf=requestAnimationFrame(paint);
 say(mode==='dodge'?'Survive '+challenge.target+' seconds while keeping your hearts.':'Catch '+challenge.target+' crystals and dodge magenta hazards.');
}
start.addEventListener('click',()=>{
 if(active||!challenge||!pet)return;
 newRun();
 if(challenge.mode==='memory')memoryTrial();
 else if(challenge.mode==='runes')runeTrial();
 else arcadeTrial();
});
stop.addEventListener('click',()=>{if(active){void finish(false);say('Trial ended early. No currency or XP was awarded.')}});
select.addEventListener('change',selectPet);
window.addEventListener('keydown',event=>{
 if(!active||!['catch','dodge'].includes(challenge?.mode))return;
 if(event.target?.matches?.('select,input,textarea,[contenteditable]'))return;
 if(['ArrowLeft','a','A'].includes(event.key)){pressed.left=true;event.preventDefault()}
 if(['ArrowRight','d','D'].includes(event.key)){pressed.right=true;event.preventDefault()}
});
window.addEventListener('keyup',event=>{
 if(['ArrowLeft','a','A'].includes(event.key))pressed.left=false;
 if(['ArrowRight','d','D'].includes(event.key))pressed.right=false;
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&active){void finish(false);say('The trial stopped when this tab was hidden. Start a fresh round.')}
});
document.addEventListener('sanctuary-changed',event=>{
 if(!active&&event.detail?.source==='minigame')void load();
});
void load();
