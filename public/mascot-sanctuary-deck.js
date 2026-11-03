/* Neon Nuisances Command Deck. Pure presentation of authoritative /me state.
   No pet ownership, cooldowns or wallet credits are stored in the browser. */
(()=>{'use strict';
 const API='https://api.ash-fall.com',get=id=>document.getElementById(id);
 const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el};
 const careActions=['feed','play','rest'];
 const expanded=new Set();
 let state=null,busy=false;
 const ready=(p,a)=>Number(p?.next_care?.[a]||0)<=0;
 const lowValue=p=>Math.min(...['hunger','joy','energy'].map(k=>Number(p?.vitals?.[k]??90)));
 const attention=p=>lowValue(p)<65;
 const search=id=>(get(id)?.value||'').trim().toLocaleLowerCase();
 const value=(id,fallback)=>get(id)?.value||fallback;
 const claimReady=species=>{
  if(!state)return false;
  const {pets,incubatingSpecies,cinders,level,max}=state,first=pets.length===0;
  return !pets.some(p=>p.species===species.id)&&!incubatingSpecies.includes(species.id)
   &&pets.length<max&&(first||level>=Number(species.unlock_level||1))
   &&cinders>=(first?0:Number(species.cost_cinders||0));
 };
 const matchText=(terms,q)=>!q||terms.some(s=>String(s||'').toLocaleLowerCase().includes(q));
 function overview(){
  const root=get('sanctuary-overview'),button=get('sanctuary-care-all');
  if(!state||!root||!button)return;
  const {pets,level,max,signedIn,working}=state;
  root.replaceChildren();
  const tiles=[
   [pets.length+' / '+max,'Rescued species','✦'],
   [pets.filter(attention).length,'Need attention','♡'],
   [pets.filter(p=>careActions.some(a=>ready(p,a))).length,'Care available','⚡'],
   ['Lv '+level,'Top bond level','★']
  ];
  for(const [number,label,sign] of tiles){
   const tile=make('div','sanctuary-kpi');
   tile.append(make('span','sanctuary-kpi-symbol',sign),make('strong','',signedIn?number:'—'),make('small','',label));
   root.append(tile);
  }
  const action=value('sanctuary-care-type','feed'),n=pets.filter(p=>ready(p,action)).length;
  button.disabled=busy||working||signedIn&&n===0;
  button.textContent=busy?'Caring for everyone…':!signedIn?'Sign in to care for pets':!pets.length?'Adopt a companion first':n?'Care for '+n+' companions':'Everyone is cooling down';
 }
 function bar(label,earned,needed){
  const value=Math.max(0,Math.min(needed,earned));
  const wrapper=make('div','pet-xp-progress'),heading=make('div','pet-xp-head');
  heading.append(make('span','',label),make('span','',value+' / '+needed+' XP'));
  const track=make('div','pet-xp-track'),fill=make('i');
  track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(needed));track.setAttribute('aria-valuenow',String(value));
  fill.style.width=(needed?100*value/needed:0)+'%';track.append(fill);wrapper.append(heading,track);return wrapper;
 }
 function decorateOwned(){
  const root=get('owned-pets');if(!root||!state)return;
  for(const pet of state.pets){
   const card=root.querySelector('.pet-card[data-pet-id="'+pet.id+'"]');
   if(!card||card.querySelector('.pet-mood'))continue;
   const mood=make('div','pet-mood'),label=make('strong','',pet.mood?.label||'Content'),bond=make('small','',pet.bond?.label||'Newly rescued');
   mood.dataset.mood=pet.mood?.id||'content';mood.append(label,bond);
   const personality=make('p','pet-personality','✦ '+(pet.temperament||'Curious')+' · Loves '+(pet.favorite||'adventures'));
   if(pet.lore)personality.title=pet.lore;
   const type=card.querySelector('.pet-type');
   if(type){type.after(mood);mood.after(bar('Bond progress',Number(pet.level_progress?.earned||0),Math.max(1,Number(pet.level_progress?.needed||1))));}
   const dress=card.querySelector('.pet-dress-up'),habitat=card.querySelector('.pet-habitat-controls');
   if(dress&&habitat){
    const details=make('details','pet-customize'),summary=make('summary','','✦ Wardrobe & habitat');
    details.open=expanded.has(pet.id);
    details.addEventListener('toggle',()=>{if(details.open)expanded.add(pet.id);else expanded.delete(pet.id)});
    details.append(summary,dress,habitat);card.append(personality,details);
   }else card.append(personality);
  }
 }
 function decorateAdoption(){
  if(!state)return;
  const root=get('adopt-pets');if(!root)return;
  for(const pet of state.species){
   const card=root.querySelector('.pet-card[data-species="'+pet.id+'"]');
   if(!card||card.querySelector('.pet-personality'))continue;
   const p=make('p','pet-personality','✦ '+(pet.temperament||'Curious')+' · Loves '+(pet.favorite||'adventures'));
   const lore=make('p','pet-species-lore',pet.lore||'');
   const type=card.querySelector('.pet-type');if(type){type.after(p);p.after(lore)}
  }
 }
 function filterCards(root,entries,id,filterFn,sortFn){
  if(!root)return;
  const cards=[...root.querySelectorAll(':scope > .pet-card')];
  if(!cards.length)return;
  const keyed=new Map(cards.map(card=>[card.dataset.petId||card.dataset.species||card.dataset.sku,card]));
  const ordered=[...entries].sort(sortFn);
  let shown=0;
  for(const entry of ordered){
   const card=keyed.get(String(entry.id??entry.sku));if(!card)continue;
   card.hidden=!filterFn(entry);if(!card.hidden)shown++;
   root.append(card);
  }
  const previous=root.querySelector(':scope > .pet-filter-empty');
  if(previous)previous.remove();
  if(!shown)root.append(make('p','pet-empty pet-filter-empty','Nothing matches those filters. Try changing the search or category.'));
  return shown;
 }
 function filters(){
  if(!state)return;
  const {pets,species,accessories,wardrobe}=state,ownedSkus=new Set(wardrobe.map(x=>x.sku));
  const ownedQuery=search('pet-collection-search'),ownedFilter=value('pet-collection-filter','all'),ownedSort=value('pet-collection-sort','featured');
  filterCards(get('owned-pets'),pets,'id',p=>
   matchText([p.nickname,p.species_name,p.species,p.temperament],ownedQuery)
   &&(ownedFilter==='all'||ownedFilter==='attention'&&attention(p)||ownedFilter==='ready'&&careActions.some(a=>ready(p,a))||ownedFilter==='featured'&&p.featured),
   (a,b)=>ownedSort==='name'?a.nickname.localeCompare(b.nickname):
   ownedSort==='level'?b.level-a.level:
   ownedSort==='needs'?lowValue(a)-lowValue(b):Number(b.featured)-Number(a.featured)||b.id-a.id);
  const speciesQuery=search('pet-species-search'),speciesFilter=value('pet-species-filter','all'),speciesSort=value('pet-species-sort','level');
  const count=filterCards(get('adopt-pets'),species,'id',p=>{
   const has=pets.some(x=>x.species===p.id),can=claimReady(p);
   return matchText([p.name,p.type,p.temperament,p.favorite,p.lore],speciesQuery)&&
    (speciesFilter==='all'||speciesFilter==='available'&&!has||speciesFilter==='owned'&&has||
     speciesFilter==='ready'&&can||speciesFilter==='locked'&&!has&&!can);
  },(a,b)=>speciesSort==='name'?a.name.localeCompare(b.name):
    speciesSort==='price'?a.cost_cinders-b.cost_cinders||a.name.localeCompare(b.name):
    a.unlock_level-b.unlock_level||a.name.localeCompare(b.name));
  const countNode=get('pet-adoption-count');if(countNode)countNode.textContent=(count??0)+' of '+species.length+' species';
  const shopFilter=value('pet-shop-filter','all');
  const shopCount=filterCards(get('pet-shop'),accessories,'sku',x=>{
   if(shopFilter==='owned')return ownedSkus.has(x.sku);
   if(shopFilter==='affordable')return !ownedSkus.has(x.sku)&&!x.premium&&state.signedIn&&state.cinders>=x.cinders_price;
   if(shopFilter==='cinders')return !x.premium;
   if(shopFilter==='premium')return x.premium;
   return shopFilter==='all'||shopFilter===x.slot;
  },(a,b)=>Number(a.premium)-Number(b.premium)||(a.cinders_price||0)-(b.cinders_price||0));
  const shopLabel=get('pet-shop-count');if(shopLabel)shopLabel.textContent=(shopCount??0)+' looks';
 }
 function render(){if(!state)return;overview();decorateOwned();decorateAdoption();filters()}
 document.addEventListener('sanctuary-rendered',event=>{state=event.detail;render()});
 for(const id of ['pet-collection-search','pet-species-search'])get(id)?.addEventListener('input',render);
 for(const id of ['pet-collection-filter','pet-collection-sort','pet-species-filter','pet-species-sort','pet-shop-filter','sanctuary-care-type'])get(id)?.addEventListener('change',render);
 get('sanctuary-care-all')?.addEventListener('click',async()=>{
  if(!state||busy)return;
  if(!state.signedIn){location.href='/auth.html?next=%2Fmascot-pets.html';return}
  const action=value('sanctuary-care-type','feed');
  if(!careActions.includes(action)||!state.pets.some(p=>ready(p,action)))return;
  busy=true;overview();
  try{
   const res=await fetch(API+'/api/mascot-pets/care-all',{
    method:'POST',credentials:'include',cache:'no-store',
    headers:{'content-type':'application/json'},body:JSON.stringify({action})
   });
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(data.error||'Unable to care for your companions.');
   const info=get('pet-message');if(info)info.textContent=data.message||'Care session complete.';
   document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'bulk'}}));
   document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'pets'}}));
  }catch(error){const info=get('pet-message');if(info)info.textContent=error.message;}
  finally{busy=false;overview()}
 });
})();