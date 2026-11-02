/* Neon Nuisances Sanctuary. Real ownership is stored by Knightfall's Worker, never localStorage. */
(()=>{'use strict';
const API='https://api.ash-fall.com';
const owned=document.querySelector('#owned-pets'),adopt=document.querySelector('#adopt-pets'),
 message=document.querySelector('#pet-message'),slots=document.querySelector('#pet-slots');
if(!owned||!adopt||!message||!slots)return;
let species=[],pets=[],signedIn=false,working=false,max=6;
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el};
const say=(text)=>{message.textContent=String(text)};
const safeSrc=src=>/^\/assets\/devil-tools\/neon-nuisances\/[a-z0-9-]+\.svg$/.test(src)?src:'';
async function api(path,options={}){
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(data.error||'Request failed');error.status=response.status;throw error}return data;
}
const button=(label,action,disabled=false,primary=false)=>{
 const el=make('button',primary?'primary':'',label);el.type='button';el.dataset.action=action;el.disabled=disabled;return el;
};
function cardBase(item,image,ownedCard=false){
 const card=make('article','pet-card'+(item.featured?' featured':''));
 if(item.id!==undefined&&ownedCard)card.dataset.petId=String(item.id);
 if(!ownedCard)card.dataset.species=item.id;
 const visual=make('div','pet-art'),src=safeSrc(image);
 if(src){const img=make('img');img.src=src+'?v=20261102-sanctuary3';img.alt=item.name||item.nickname;img.loading='lazy';visual.append(img)}
 if(item.featured)visual.append(make('span','pet-badge','✦ PROFILE COMPANION'));
 card.append(visual);return card;
}
const statRow=(label,value)=>{
 const row=make('div','pet-meter');row.append(make('span','',label));
 const track=make('div','pet-track'),fill=make('i');fill.style.width=Math.max(0,Math.min(100,Number(value)||0))+'%';
 track.append(fill);row.append(track,make('span','',Math.round(Number(value)||0)+'%'));return row;
};
function renderOwned(){
 owned.replaceChildren();slots.textContent=pets.length+' / '+max+' companions';
 if(!signedIn){owned.append(make('p','pet-empty','Sign in to adopt and care for mascot companions. Your pets will be saved to your profile.'));return}
 if(!pets.length){owned.append(make('p','pet-empty','Your sanctuary is empty. Choose any species below to adopt your first companion for free.'));return}
 for(const pet of pets){
  const card=cardBase(pet,pet.portrait||pet.idle||pet.image,true),label=make('div','pet-label');
  label.append(make('strong','',pet.nickname),make('small','',pet.featured?'✦ Featured':'Lv '+pet.level));
  card.append(label,make('p','pet-type',pet.species_name+' · Level '+pet.level+' · '+pet.experience+' XP'));
  const bars=make('div','pet-bars');for(const [key,caption] of [['hunger','Food'],['joy','Joy'],['energy','Energy']])bars.append(statRow(caption,pet.vitals?.[key]));
  card.append(bars);
  const actions=make('div','pet-actions');
  for(const [action,title] of [['feed','🍕 Feed'],['play','🎮 Play'],['rest','🌙 Rest']]){
   const delay=Number(pet.next_care?.[action]||0),minutes=Math.ceil(delay/60000);
   actions.append(button(delay?title+' '+minutes+'m':title,action,working||delay>0));
  }
  actions.append(button('✦ Display','feature',working||pet.featured));
  actions.append(button('✎ Rename','rename',working));
  card.append(actions);owned.append(card);
 }
}
function renderAdopt(){
 adopt.replaceChildren();
 for(const pet of species){
  const already=pets.some(x=>x.species===pet.id),full=pets.length>=max,card=cardBase(pet,pet.portrait||pet.svg);
  const title=make('div','pet-label');title.append(make('strong','',pet.name),make('small','',already?'Adopted':'FREE'));
  card.append(title,make('p','pet-type',pet.type));
  const label=make('label','','Companion nickname');
  const field=make('input');field.maxLength=28;field.value=pet.name;field.setAttribute('aria-label','Nickname for '+pet.name);field.dataset.nickname='1';
  card.append(label,field);
  const actions=make('div','pet-actions');actions.append(button(already?'Already yours':!signedIn?'Sign in to adopt':full?'6 slots full':'Adopt companion',already?'owned':'adopt',already||full||working,!already&&!full));
  card.append(actions);adopt.append(card);
 }
}
function render(){renderOwned();renderAdopt()}
async function reload(){
 const catalog=await api('/api/mascot-pets/catalog');species=catalog.species||[];max=catalog.max_owned||6;
 try{const mine=await api('/api/mascot-pets/me');pets=mine.pets||[];signedIn=true;say('Every misfit deserves a home. Choose your favorite and make it yours.')}
 catch(error){if(error.status===401){signedIn=false;say('Please sign in to save companions to your account. You can browse all 22 species below.')}else throw error;}
 render();
}
async function perform(fn){
 if(working)return;working=true;render();
 try{const feedback=await fn();if(feedback?.message)say(feedback.message);else say('Your companion collection has been updated.');const mine=await api('/api/mascot-pets/me');pets=mine.pets||[]}
 catch(error){say(error.message)}
 finally{working=false;render()}
}
document.addEventListener('click',event=>{
 const btn=event.target.closest('button[data-action]');if(!btn||!(owned.contains(btn)||adopt.contains(btn)))return;
 const action=btn.dataset.action,card=btn.closest('.pet-card');if(!card)return;
 if(action==='owned')return;
 if(action==='adopt'){
  if(!signedIn){location.href='/auth.html?next=%2Fmascot-pets.html';return}
  const nickname=card.querySelector('input[data-nickname]')?.value||'';
  perform(()=>api('/api/mascot-pets/adopt',{method:'POST',body:JSON.stringify({species:card.dataset.species,nickname})}));return;
 }
 if(!signedIn)return;
 const id=Number(card.dataset.petId);if(!Number.isSafeInteger(id)||id<=0)return;
 if(['feed','play','rest'].includes(action)){
  perform(()=>api('/api/mascot-pets/'+id+'/care',{method:'POST',body:JSON.stringify({action})}));return;
 }
 if(action==='feature'){
  perform(()=>api('/api/mascot-pets/'+id+'/feature',{method:'PUT',body:'{}'}));return;
 }
 if(action==='rename'){
  const old=pets.find(x=>x.id===id)?.nickname||'',value=window.prompt('New companion nickname (1–28 characters):',old);
  if(value!==null)perform(()=>api('/api/mascot-pets/'+id+'/nickname',{method:'PATCH',body:JSON.stringify({nickname:value})}));
 }
});
reload().catch(error=>{say('Sanctuary unavailable: '+error.message+'.');if(error.status===404)say('The sanctuary service is not deployed yet.');});
})();
