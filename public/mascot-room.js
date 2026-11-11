/* Neon Nuisances personal rooms. No local-storage ownership or rewards. */
(()=>{'use strict';
const clock=window.KnightfallPetCare;
const API='https://api.ash-fall.com',q=id=>document.getElementById(id);
const stage=q('room-stage'),avatar=q('room-avatar'),background=q('room-background'),furniture=q('room-decoration'),
 photo=q('room-pet-image'),outfit=q('room-outfit'),name=q('room-pet-label'),reactionBubble=q('room-reaction-bubble'),picker=q('room-pet'),level=q('room-level'),
 theme=q('room-theme'),decor=q('room-decor'),pose=q('room-pose'),save=q('room-save'),status=q('room-message'),sparks=q('room-particles');
if(!stage||!avatar||!picker||!theme||!decor||!pose||!save)return;
let pets=[],themes=[],decorations=[],selected=null,point={x:50,y:65},dirty=false,busy=false,drag=null,visitor=false,currentReaction=null,reactionTimer=0;
const say=text=>{status.textContent=String(text)};
const safeAsset=url=>/^\/assets\/devil-tools\/neon-nuisances\/(?:habitats\/|accessories\/|evolutions\/)?[a-z0-9-]+\.svg$/.test(url||'')?url:'';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
async function request(path,options={}){
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...options,
  headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const err=new Error(data.error||'Room request failed');err.status=response.status;throw err}
 return data;
}
function img(node,source){
 const valid=safeAsset(source);
 if(valid){node.src=valid+'?v=20261102-room1';node.hidden=false;}
 else{node.removeAttribute('src');node.hidden=true}
}
function renderVisitorFurniture(){
 let layer=stage.querySelector('.room-visitor-furniture');
 if(!visitor){layer?.remove();return}
 if(!layer){
  layer=document.createElement('div');layer.className='room-visitor-furniture';
  layer.setAttribute('aria-hidden','true');stage.append(layer);
 }
 layer.replaceChildren();
 for(const item of selected?.furniture||[]){
  const source=String(item.art||'');
  if(!source.startsWith('/assets/devil-tools/neon-nuisances/furniture/')||!source.endsWith('.svg')||source.includes('..')||source.slice('/assets/devil-tools/neon-nuisances/furniture/'.length,-4).includes('/'))continue;
  const image=document.createElement('img');image.alt='';
  image.src=source+'?v=20261103-public-room1';image.draggable=false;
  image.style.left=clamp(Number(item.x)||50,8,92)+'%';
  image.style.top=clamp(Number(item.y)||64,16,85)+'%';
  image.style.transform='translate(-50%,-50%)'+(item.flipped?' scaleX(-1)':'');
  layer.append(image);
 }
}
function renderOutfit(){
 outfit.replaceChildren();
 for(const item of selected?.equipment||[]){
  const source=safeAsset(item.asset);
  if(!source)continue;
  const layer=document.createElement('img');layer.src=source+'?v=20261102-room2';layer.alt='';
  layer.setAttribute('aria-hidden','true');layer.draggable=false;outfit.append(layer);
 }
}
function draw(){
 avatar.style.left=point.x+'%';avatar.style.top=point.y+'%';
 const visiblePose=currentReaction?.pose||pose.value;
 avatar.dataset.pose=visiblePose;avatar.dataset.bondStage=currentReaction?.bond_stage||selected?.relationship?.id||'new';
 if(reactionBubble){reactionBubble.textContent=currentReaction?.emote||'';reactionBubble.hidden=!currentReaction}
 if(selected){
  const base=selected.idle||selected.image;
  img(photo,clock.poseAsset(base,visiblePose));
 }
 const chosenTheme=themes.find(x=>x.id===theme.value),chosenDecor=decorations.find(x=>x.id===decor.value);
 img(background,visitor?selected?.habitat?.art:(chosenTheme?.art||selected?.habitat?.art));
 img(furniture,visitor?selected?.habitat?.decoration_art:(chosenDecor?.art||selected?.habitat?.decoration_art));
 if(selected)name.textContent=selected.nickname;
 save.disabled=busy||!selected||!dirty;
}
function setDirty(){dirty=true;draw()}
function choices(select,values,selection,rank){
 select.replaceChildren();
 for(const option of values){
  if((Number(option.unlock_level)||1)>rank)continue;
  const node=document.createElement('option');
  node.value=option.id;node.textContent=option.name;select.append(node);
 }
 const fallback=values.find(x=>x.unlock_level<=rank);
 select.value=values.some(x=>x.id===selection&&x.unlock_level<=rank)?selection:(fallback?.id||'');
}
function roomSummary(){
 const root=q('room-companion-summary');if(!root||!selected)return;
 root.replaceChildren();
 const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;node.textContent=String(text);return node};
 const identity=make('div','room-pet-identity','');
 identity.append(make('strong','',selected.nickname),make('span','',selected.species_name+' · Lv '+selected.level));
 root.append(identity);
 const lore=make('p','room-pet-lore',selected.lore||('Meet '+selected.nickname+'.'));
 if(selected.temperament||selected.favorite){
  lore.textContent=(selected.temperament||'Curious')+' · Loves '+(selected.favorite||'adventures')+'. '+(selected.lore||'');
 }
 root.append(lore);
 if(!visitor){
  const moods=make('div','room-pet-mood',''),mood=selected.mood||{label:'Content',tip:'Care makes your companion happy.'};
  moods.append(make('strong','','♡ '+mood.label),make('span','',selected.bond?.label||'Newly rescued'),make('small','',mood.tip||''));
  root.append(moods);
  const bond=selected.relationship||{experience:0,progress:0};
  const relationship=make('div','room-bond-progress','');
  const track=make('div','room-bond-track'),fill=make('i');fill.style.width=Math.max(0,Math.min(100,Number(bond.progress)||0))+'%';track.append(fill);
  relationship.append(make('small','',(Number(bond.experience)||0)+' bond · grows through little rituals'),track);root.append(relationship);
  const vitals=make('div','room-need-tags','');
  for(const [key,label] of [['hunger','Food'],['joy','Joy'],['energy','Energy']]){
   const value=Number(selected.vitals?.[key]??90);
   const pill=make('span','room-need-tag',label+' '+Math.round(value)+'%');
   pill.dataset.state=value<40?'low':value<65?'medium':'good';vitals.append(pill);
  }
  root.append(vitals);
 }
}
function syncCareButtons(){
 for(const button of document.querySelectorAll('button[data-care]')){
  const action=button.dataset.care;
  const delay=clock.remaining(selected,action);
  button.disabled=visitor||busy||!selected||delay>0;
  const base={feed:'🍕 Give a snack',play:'🎮 Play together',rest:'🌙 Time to rest',talk:'💬 Talk it out',cuddle:'🫂 Cozy cuddle',groom:'🪮 Brush the chaos'}[action]||action;
  const label=delay>0?base+' · '+clock.label(delay):base;
  if(button.textContent!==label)button.textContent=label;
 }
}
setInterval(()=>{if(!document.hidden&&selected&&!visitor)syncCareButtons()},1000);
function activate(id){
 if(reactionTimer)clearTimeout(reactionTimer);reactionTimer=0;currentReaction=null;
 selected=pets.find(p=>String(p.id)===String(id))||pets[0]||null;
 if(!selected)return;
 point={x:clamp(Number(selected.room?.x??50),8,92),y:clamp(Number(selected.room?.y??65),25,85)};
 const rank=Number(selected.level)||1;
 level.textContent='Level '+rank;
 choices(theme,themes,selected.habitat?.theme||'graveyard',rank);
 choices(decor,decorations,selected.habitat?.decoration||'none',rank);
 pose.value=['idle','bounce','mischief'].includes(selected.room?.pose)?selected.room.pose:'idle';
 picker.value=String(selected.id);
 dirty=false;renderOutfit();renderVisitorFurniture();draw();roomSummary();syncCareButtons();
 say(visitor?('Visiting '+selected.nickname+'’s public room. Room changes are only available to its owner.'):
  ('Visiting '+selected.nickname+'. Tap the floor or drag your companion to explore the room.'));
 document.dispatchEvent(new CustomEvent('sanctuary-room-selected',{detail:{petId:selected.id,visitor}}));
}
function coords(event){
 const rect=stage.getBoundingClientRect();
 return{x:clamp(Math.round((event.clientX-rect.left)/rect.width*100),8,92),
        y:clamp(Math.round((event.clientY-rect.top)/rect.height*100),25,85)};
}
function move(next){point=next;setDirty()}
stage.addEventListener('pointerdown',event=>{
 if(visitor||!selected||busy||event.button>0)return;
 const pos=coords(event);
 if(avatar.contains(event.target)){
  drag={id:event.pointerId};
  avatar.setPointerCapture?.(event.pointerId);
 }else move(pos);
});
avatar.addEventListener('pointermove',event=>{
 if(visitor||!drag||drag.id!==event.pointerId||!selected||busy)return;
 move(coords(event));
});
const release=()=>{drag=null};
avatar.addEventListener('pointerup',release);
avatar.addEventListener('pointercancel',release);
avatar.addEventListener('lostpointercapture',release);
avatar.addEventListener('keydown',event=>{
 const offsets={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};
 const direction=offsets[event.key];
 if(visitor||!direction||!selected||busy)return;
 event.preventDefault();
 move({x:clamp(point.x+direction[0],8,92),y:clamp(point.y+direction[1],25,85)});
});
pose.addEventListener('change',setDirty);
theme.addEventListener('change',setDirty);
decor.addEventListener('change',setDirty);
picker.addEventListener('change',()=>{
 if(dirty&&!window.confirm('Your room changes are not saved. Switch pets anyway?')){
  picker.value=String(selected.id);return
 }
 activate(picker.value);
});
async function reloadPet(petId){
 const mine=await request('/api/mascot-pets/me');
 pets=mine.pets||[];pets.forEach(pet=>clock.remember(pet));
 const prev=selected?.id;
 picker.replaceChildren();
 for(const pet of pets){
  const option=document.createElement('option');option.value=String(pet.id);
  option.textContent=pet.nickname+' · '+pet.species_name;
  picker.append(option);
 }
 activate(petId||prev||pets[0]?.id);
}
save.addEventListener('click',async()=>{
 if(visitor||!selected||!dirty||busy)return;
 const id=selected.id,changes={x:point.x,y:point.y,pose:pose.value};
 const home={theme:theme.value,decoration:decor.value};
 busy=true;draw();say('Saving '+selected.nickname+'’s room…');
 try{
  // Both endpoints verify that the acting member owns this specific pet.
  await request('/api/mascot-pets/'+id+'/room',{method:'PUT',body:JSON.stringify(changes)});
  await request('/api/mascot-pets/'+id+'/habitat',{method:'PUT',body:JSON.stringify(home)});
  await reloadPet(id);say('✦ Saved! '+selected.nickname+' has a freshly decorated home.');
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'room'}}));
 }catch(error){
  say('Could not fully save: '+error.message+'. Your unsaved choices are still here.');
  dirty=true;
 }finally{busy=false;draw()}
});
function sparkle(text){
 const node=document.createElement('span');node.className='room-spark';node.textContent=text;
 node.style.left=point.x+'%';node.style.top=clamp(point.y-14,10,80)+'%';
 sparks.append(node);node.addEventListener('animationend',()=>node.remove(),{once:true});
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)node.remove();
}
function showReaction(reaction){
 if(visitor||!reaction)return;
 currentReaction=reaction;draw();
 if(reactionTimer)clearTimeout(reactionTimer);
 const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?1100:2200;
 reactionTimer=window.setTimeout(()=>{currentReaction=null;reactionTimer=0;draw()},duration);
}
document.querySelectorAll('button[data-care]').forEach(button=>button.addEventListener('click',async()=>{
 if(visitor||!selected||busy)return;
 const action=button.dataset.care,id=selected.id;
 busy=true;document.querySelectorAll('button[data-care]').forEach(x=>x.disabled=true);
 say('Caring for '+selected.nickname+'…');
 try{
  const ritual=['talk','cuddle','groom'].includes(action);
  const answer=await request('/api/mascot-pets/'+id+(ritual?'/interact':'/care'),{method:'POST',body:JSON.stringify({action})});
  sparkle(answer.reaction?.emote||(action==='feed'?'♥':action==='rest'?'☾':'✦'));
  await reloadPet(id);
  showReaction(answer.reaction);
  say(answer.message||'Your companion enjoyed that.');
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'room'}}));
 }catch(err){say(err.message)}
 finally{busy=false;syncCareButtons();draw()}
}));
async function launch(){
 try{
  const params=new URLSearchParams(location.search),visiting=params.get('user');
  visitor=!!visiting;
  if(visitor){
   if(!/^[a-zA-Z0-9_-]{1,32}$/.test(visiting))throw Error('Invalid visitor profile.');
   const profile=await request('/api/mascot-pets/profile/'+encodeURIComponent(visiting));
   pets=profile.pets||[];
   themes=[{id:'graveyard',name:'Midnight Graveyard',unlock_level:1},
    {id:'neon-city',name:'Neon Rooftops',unlock_level:1},
    {id:'toxic-lagoon',name:'Radioactive Lagoon',unlock_level:1},
    {id:'cosmic-void',name:'Eclipse Observatory',unlock_level:1}];
   decorations=[{id:'none',name:'No decoration',unlock_level:1},
    {id:'lantern',name:'Haunted Lantern',unlock_level:1},
    {id:'arcade',name:'Tiny Arcade Cabinet',unlock_level:1},
    {id:'crystal',name:'Void Crystal',unlock_level:1}];
   document.querySelector('.room-controls')?.setAttribute('hidden','');
   document.querySelector('.room-controls-hint')?.setAttribute('hidden','');
   avatar.tabIndex=-1;avatar.setAttribute('aria-label','Visiting a companion room, view only');
   stage.style.cursor='default';
   document.querySelector('#room-heading').textContent=visiting+'’s companion rooms';
   picker.setAttribute('aria-label','Choose one of '+visiting+'’s visible companions');
  }else{
   const [mine,quests]=await Promise.all([request('/api/mascot-pets/me'),request('/api/mascot-pets/adventures')]);
   pets=mine.pets||[];pets.forEach(pet=>clock.remember(pet));themes=quests.themes||[];decorations=quests.decorations||[];
  }
  if(!pets.length){
   say('Your sanctuary has no pets yet. Rescue one first to give it a room.');
   const option=document.createElement('option');option.textContent='No companions adopted';picker.append(option);
   save.disabled=true;return;
  }
  for(const pet of pets){
   const option=document.createElement('option');option.value=String(pet.id);
   option.textContent=pet.nickname+' · '+pet.species_name;picker.append(option);
  }
  const wanted=new URLSearchParams(location.search).get('pet');
  activate(wanted);
 }catch(error){
  say(error.status===401?'Sign in to visit your companion rooms.':'Room service unavailable: '+error.message);
  save.disabled=true;
 }
}
void launch();
})();
