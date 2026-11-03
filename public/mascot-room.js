/* Neon Nuisances personal rooms. No local-storage ownership or rewards. */
(()=>{'use strict';
const API='https://api.ash-fall.com',q=id=>document.getElementById(id);
const stage=q('room-stage'),avatar=q('room-avatar'),background=q('room-background'),furniture=q('room-decoration'),
 photo=q('room-pet-image'),name=q('room-pet-label'),picker=q('room-pet'),level=q('room-level'),
 theme=q('room-theme'),decor=q('room-decor'),pose=q('room-pose'),save=q('room-save'),status=q('room-message'),sparks=q('room-particles');
if(!stage||!avatar||!picker||!theme||!decor||!pose||!save)return;
let pets=[],themes=[],decorations=[],selected=null,point={x:50,y:65},dirty=false,busy=false,drag=null;
const say=text=>{status.textContent=String(text)};
const safeAsset=url=>/^\/assets\/devil-tools\/neon-nuisances\/(?:habitats\/)?[a-z0-9-]+\.svg$/.test(url||'')?url:'';
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
function draw(){
 avatar.style.left=point.x+'%';avatar.style.top=point.y+'%';
 avatar.dataset.pose=pose.value;
 if(selected){
  const base=selected.idle||selected.image;
  let src=base;
  if(pose.value!=='idle'&&/[-]idle[.]svg$/.test(base||'')){
   src=base.replace(/-idle\.svg$/, '-'+pose.value+'.svg');
  }
  img(photo,src);
 }
 const chosenTheme=themes.find(x=>x.id===theme.value),chosenDecor=decorations.find(x=>x.id===decor.value);
 img(background,chosenTheme?.art||selected?.habitat?.art);
 img(furniture,chosenDecor?.art||'');
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
function activate(id){
 selected=pets.find(p=>String(p.id)===String(id))||pets[0]||null;
 if(!selected)return;
 point={x:clamp(Number(selected.room?.x??50),8,92),y:clamp(Number(selected.room?.y??65),25,85)};
 const rank=Number(selected.level)||1;
 level.textContent='Level '+rank;
 choices(theme,themes,selected.habitat?.theme||'graveyard',rank);
 choices(decor,decorations,selected.habitat?.decoration||'none',rank);
 pose.value=['idle','bounce','mischief'].includes(selected.room?.pose)?selected.room.pose:'idle';
 picker.value=String(selected.id);
 dirty=false;draw();
 say('Visiting '+selected.nickname+'. Tap the floor or drag your companion to explore the room.');
}
function coords(event){
 const rect=stage.getBoundingClientRect();
 return{x:clamp(Math.round((event.clientX-rect.left)/rect.width*100),8,92),
        y:clamp(Math.round((event.clientY-rect.top)/rect.height*100),25,85)};
}
function move(next){point=next;setDirty()}
stage.addEventListener('pointerdown',event=>{
 if(!selected||busy||event.button>0)return;
 const pos=coords(event);
 if(avatar.contains(event.target)){
  drag={id:event.pointerId};
  avatar.setPointerCapture?.(event.pointerId);
 }else move(pos);
});
avatar.addEventListener('pointermove',event=>{
 if(!drag||drag.id!==event.pointerId||!selected||busy)return;
 move(coords(event));
});
const release=()=>{drag=null};
avatar.addEventListener('pointerup',release);
avatar.addEventListener('pointercancel',release);
avatar.addEventListener('lostpointercapture',release);
avatar.addEventListener('keydown',event=>{
 const offsets={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};
 const direction=offsets[event.key];
 if(!direction||!selected||busy)return;
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
 pets=mine.pets||[];
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
 if(!selected||!dirty||busy)return;
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
document.querySelectorAll('button[data-care]').forEach(button=>button.addEventListener('click',async()=>{
 if(!selected||busy)return;
 const action=button.dataset.care,id=selected.id;
 busy=true;document.querySelectorAll('button[data-care]').forEach(x=>x.disabled=true);
 say('Caring for '+selected.nickname+'…');
 try{
  const answer=await request('/api/mascot-pets/'+id+'/care',{method:'POST',body:JSON.stringify({action})});
  sparkle(action==='feed'?'♥':action==='rest'?'☾':'✦');
  await reloadPet(id);
  say(answer.message||'Your companion enjoyed that.');
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'room'}}));
 }catch(err){say(err.message)}
 finally{busy=false;document.querySelectorAll('button[data-care]').forEach(x=>x.disabled=false);draw()}
}));
async function launch(){
 try{
  const [mine,quests]=await Promise.all([request('/api/mascot-pets/me'),request('/api/mascot-pets/adventures')]);
  pets=mine.pets||[];themes=quests.themes||[];decorations=quests.decorations||[];
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