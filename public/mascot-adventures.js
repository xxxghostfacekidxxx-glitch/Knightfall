/* Neon Nuisances Expeditions: client for server-verified quests and transparent rescue eggs. */
(()=>{'use strict';
const API='https://api.ash-fall.com';
const status=document.getElementById('adventure-status'),questRoot=document.getElementById('pet-quests'),
 eggRoot=document.getElementById('pet-eggs'),shells=document.getElementById('pet-shells');
if(!status||!questRoot||!eggRoot||!shells)return;
let adventures=null,pets=[],species=[],busy=false,guest=false;
const rarityFor=id=>{const spec=species.find(x=>x.id===id),level=Number(spec?.unlock_level||1);return level>=5?'legendary':level>=3?'rare':level>=2?'uncommon':'common'};
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const say=message=>{status.textContent=String(message)};
const button=(caption,action,disabled=false)=>{
 const b=el('button','pet-quest-button',caption);b.type='button';b.dataset.adventureAction=action;b.disabled=disabled;return b;
};
async function api(route,options={}){
 const response=await fetch(API+route,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
 const d=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(d.error||'Sanctuary request failed.');error.code=response.status;throw error}
 return d;
}
function renderQuests(){
 questRoot.replaceChildren();
 if(guest){questRoot.append(el('p','pet-empty','Sign in and rescue your first companion to begin daily species quests.'));return}
 if(!pets.length){questRoot.append(el('p','pet-empty','Rescue your first mascot to unlock its story missions.'));return}
 const missionSlots=adventures?.quests_left??3,offers=adventures?.offers||[];
 for(const offer of offers){
  const card=el('article','pet-quest-card'),head=el('div','pet-quest-heading');
  head.append(el('strong','',offer.title),el('span','',offer.pet_name));
  card.append(head,el('p','',offer.instruction),el('small','','✦ +75 Cinders · +1 Rescue Shell'));
  const run=offer.run,footer=el('div','pet-quest-footer');
  const action=run?.claimed?'claimed':run?.progress?'claim':run?'active':'start';
  const label={claimed:'✓ Quest complete',claim:'Claim rewards',active:'Care for your pet to finish',start:'Begin quest'}[action];
  const b=button(label,action,busy||action==='claimed'||action==='active'||(action==='start'&&missionSlots<=0));
  b.dataset.petId=offer.pet_id;if(run)b.dataset.questId=run.id;
  footer.append(b);
  if(!run)footer.append(el('span','',offer.action.toUpperCase()+' action required'));
  card.append(footer);questRoot.append(card);
 }
}
function renderEggs(){
 eggRoot.replaceChildren();
 if(guest){eggRoot.append(el('p','pet-empty','Your Rescue Shells and incubating eggs appear when you sign in.'));return}
 const fragments=Number(adventures?.shell_fragments||0);
 shells.textContent=fragments+' Rescue Shell'+(fragments===1?'':'s')+' · 3 to craft an egg';
 const hatchery=el('div','pet-egg-workshop');
 const preview=el('img','pet-egg-craft-preview');preview.src='/assets/devil-tools/neon-nuisances/eggs/fragment.svg?v=20261102-eggs1';preview.alt='Glowing earned Rescue Shell fragment';hatchery.append(preview);
 hatchery.append(el('h3','','Craft a known-species rescue egg'),
   el('p','','Choose exactly which missing mascot you want. Eggs are earned, not random, and never sold for real money.'));
 const options=species.filter(x=>!pets.some(p=>p.species===x.id) &&
  !(adventures?.eggs||[]).some(e=>e.species===x.id));
 const select=el('select');select.id='pet-egg-species';select.setAttribute('aria-label','Species to incubate');
 for(const item of options){
  const option=el('option','',item.name+' · unlock level '+item.unlock_level);option.value=item.id;select.append(option);
 }
 const label=el('label','','Chosen species'),nickLabel=el('label','','Egg nickname');
 const nick=el('input');nick.id='pet-egg-nickname';nick.maxLength=28;nick.placeholder='Name your future companion';
 hatchery.append(label,select,nickLabel,nick,button('Craft egg · 3 Rescue Shells','craft',busy||fragments<3||!pets.length||!options.length));
 eggRoot.append(hatchery);
 for(const egg of adventures?.eggs||[]){
  const card=el('article','pet-incubator '+(egg.status==='hatched'?'hatched':''));
  card.dataset.eggId=egg.id;
  const icon=el('div','pet-egg-icon'),visual=el('img');
  visual.src='/assets/devil-tools/neon-nuisances/eggs/'+rarityFor(egg.species)+'.svg?v=20261102-eggs1';
  visual.alt=rarityFor(egg.species)+' rescue egg';visual.loading='lazy';icon.append(visual);card.append(icon);
  const info=el('div','pet-egg-info');
  info.append(el('strong','',egg.nickname),el('span','',egg.species));
  if(egg.status==='hatched')info.append(el('small','','✓ Hatched and in your collection'));
  else{
   const remaining=Math.max(0,Date.parse(egg.ready_at)-Date.now());
   info.append(el('small','',remaining?('Ready '+new Date(egg.ready_at).toLocaleString()):'Ready to hatch now!'));
  }
  card.append(info);
  if(egg.status==='incubating'){
   const notReady=Date.parse(egg.ready_at)>Date.now();
   const b=button(notReady?'Incubating…':'Hatch now','hatch',busy||notReady);card.append(b);
  }
  eggRoot.append(card);
 }
}
function render(){
 if(!adventures)return;
 shells.textContent=(adventures.shell_fragments||0)+' Rescue Shells · 3 craft an egg';
 const slots=document.getElementById('quest-slots');
 if(slots)slots.textContent=adventures.quests_left+' / 3 quests left today';
 renderQuests();renderEggs();
}
async function refresh(){
 try{
  const catalog=await api('/api/mascot-pets/catalog');species=catalog.species||[];
  const mine=await api('/api/mascot-pets/me');pets=mine.pets||[];
  adventures=await api('/api/mascot-pets/adventures');
  guest=false;render();
 }catch(error){
  if(error.code===401){guest=true;pets=[];adventures={offers:[],eggs:[],shell_fragments:0,quests_left:3};render()}
  else say('Adventure service unavailable: '+error.message);
 }
}
async function perform(action){
 if(busy)return;busy=true;render();
 try{
  const result=await action();
  say(result.message||'Your expedition has been updated.');
  const mine=await api('/api/mascot-pets/me');
  pets=mine.pets||[];adventures=result.adventures||await api('/api/mascot-pets/adventures');
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'adventures'}}));
 }catch(error){say(error.message)}
 finally{busy=false;render()}
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-adventure-action]');
 if(!b||!(questRoot.contains(b)||eggRoot.contains(b)))return;
 const action=b.dataset.adventureAction;
 if(action==='start'){
  perform(()=>api('/api/mascot-pets/quests/start',{method:'POST',body:JSON.stringify({pet_id:Number(b.dataset.petId)})}));
 }else if(action==='claim'){
  perform(()=>api('/api/mascot-pets/quests/'+Number(b.dataset.questId)+'/claim',{method:'POST',body:'{}'}));
 }else if(action==='craft'){
  const species=document.getElementById('pet-egg-species')?.value,nickname=document.getElementById('pet-egg-nickname')?.value;
  if(!species)return;
  perform(()=>api('/api/mascot-pets/eggs/craft',{method:'POST',body:JSON.stringify({species,...(nickname?{nickname}:{})})}));
 }else if(action==='hatch'){
  perform(()=>api('/api/mascot-pets/eggs/'+Number(b.closest('[data-egg-id]')?.dataset.eggId)+'/hatch',{method:'POST',body:'{}'}));
 }
});
document.addEventListener('sanctuary-changed',event=>{if(event.detail?.source==='pets')void refresh()});
void refresh();
})();