/* Knightfall Neon Nuisances Sanctuary: server-owned pets, Cinders rescues and cosmetics. */
(()=>{'use strict';
const API='https://api.ash-fall.com';
const owned=document.querySelector('#owned-pets'),adopt=document.querySelector('#adopt-pets'),
 shop=document.querySelector('#pet-shop'),spotlight=document.querySelector('#spotlight-card'),picker=document.querySelector('#spotlight-picker'),message=document.querySelector('#pet-message'),
 slots=document.querySelector('#pet-slots'),balance=document.querySelector('#pet-wallet');
if(!owned||!adopt||!shop||!message||!slots)return;
const clock=window.KnightfallPetCare;
let spotlightId=null;
const openDetails=new Map();
let affinities=[],species=[],pets=[],accessories=[],wardrobe=[],signedIn=false,working=false,max=31,
    cinders=0,level=1,premiumEnabled=false,habitatThemes=[],habitatDecorations=[],incubatingSpecies=[];
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el};
const say=text=>{message.textContent=String(text)};
const safeSrc=src=>/^\/assets\/devil-tools\/neon-nuisances\/(?:portraits\/|accessories\/|habitats\/|evolutions\/)?[a-z0-9_-]+\.svg$/.test(src)?src:'';
const ownedSku=sku=>wardrobe.some(x=>x.sku===sku);
async function api(path,options={}){
 const r=await fetch(API+path,{credentials:'include',cache:'no-store',...options,
  headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(data.error||'Request failed');e.status=r.status;throw e}
 return data;
}
function button(label,action,disabled=false,primary=false){
 const b=make('button',primary?'primary':'',label);b.type='button';b.dataset.action=action;b.disabled=disabled;return b;
}
function cardBase(item,image,ownedCard=false){
 const card=make('article','pet-card'+(item.featured?' featured':'')+(item.rarity==='Starborn'?' starborn':''));
 if(ownedCard)card.dataset.petId=String(item.id);
 else card.dataset.species=item.id;
 card.dataset.rarity=item.rarity||'Misfit';
 const visual=make('div','pet-art'),src=safeSrc(image);
 if(ownedCard&&item.habitat?.art){
  const scene=safeSrc(item.habitat.art);
  if(scene){const imageBg=make('img','pet-habitat-scene');imageBg.src=scene+'?v=20261102-adventures1';imageBg.alt='';imageBg.setAttribute('aria-hidden','true');visual.append(imageBg)}
 }
 if(src){const img=make('img','pet-base-image');img.src=src+'?v=20261104-starborn1';img.alt=item.name||item.nickname||'Companion';img.loading='lazy';visual.append(img)}
 if(ownedCard&&item.habitat?.decoration_art){
  const decor=safeSrc(item.habitat.decoration_art);
  if(decor){const layer=make('img','pet-habitat-decor');layer.src=decor+'?v=20261102-adventures1';layer.alt='';layer.setAttribute('aria-hidden','true');visual.append(layer)}
 }
 if(ownedCard)for(const piece of item.equipment||[]){
  const overlay=safeSrc(piece.asset);
  if(overlay){const layer=make('img','pet-overlay pet-overlay-'+piece.slot);layer.src=overlay+'?v=20261104-starborn1';layer.alt='';layer.setAttribute('aria-hidden','true');layer.loading='lazy';visual.append(layer)}
 }
 if(item.featured)visual.append(make('span','pet-badge',ownedCard?'✦ PROFILE COMPANION':'✦ STARBORN'));
 card.append(visual);
 window.KnightfallPetRenderer?.decorate(visual,item);
 return card;
}
function statRow(label,value){
 const row=make('div','pet-meter'),track=make('div','pet-track'),fill=make('i');
 const percent=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
 row.dataset.health=percent<40?'low':percent<65?'medium':'good';
 track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);
 track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(percent));
 fill.style.width=Math.max(0,Math.min(100,Number(value)||0))+'%';
 track.append(fill);row.append(make('span','',label),track,make('span','',Math.round(Number(value)||0)+'%'));return row;
}
function dressUp(card,pet){
 const wrap=make('div','pet-dress-up'),title=make('strong','','✦ Wardrobe');wrap.append(title);
 for(const slot of ['head','eyes','neck','aura']){
  const row=make('div','pet-equip-row'),label=make('label','',slot[0].toUpperCase()+slot.slice(1));
  const select=make('select');select.dataset.equipSlot=slot;
  const empty=make('option','','None');empty.value='';select.append(empty);
  for(const item of accessories.filter(x=>x.slot===slot&&ownedSku(x.sku))){
   const opt=make('option','',item.name);opt.value=item.sku;select.append(opt);
  }
  select.value=pet.equipment?.find(g=>g.slot===slot)?.sku||'';
  select.setAttribute('aria-label','Choose '+slot+' accessory for '+pet.nickname);
  const save=button('Apply','equip',working);save.dataset.slot=slot;
  row.append(label,select,save);wrap.append(row);
 }
 const zone=make('div','pet-habitat-controls');zone.append(make('strong','','⌂ Personal habitat'));
 for(const [field,options,selected] of [
  ['theme',habitatThemes,pet.habitat?.theme||'graveyard'],
  ['decoration',habitatDecorations,pet.habitat?.decoration||'none']]){
  const row=make('div','pet-equip-row'),label=make('label','',field==='theme'?'Home':'Decor');
  const select=make('select');select.dataset.habitatField=field;select.setAttribute('aria-label',field+' for '+pet.nickname);
  for(const opt of options){if(Number(opt.unlock_level||1)>pet.level)continue;const item=make('option','',opt.name);item.value=opt.id;select.append(item)}
  select.value=selected;row.append(label,select);zone.append(row);
 }
 zone.append(button('Save habitat','habitat',working||!habitatThemes.length));
 const details=detailsFor(pet.id,'style','Wardrobe & habitat');
 details.append(wrap,zone);card.append(details);
}
function renderMoments(pet){
 const list=Array.isArray(pet.last_moments)?pet.last_moments:[];
 const details=make('details','pet-moments'),summary=make('summary','','▸ Recent moments');
 details.append(summary);
 if(!list.length){details.append(make('p','pet-moments-empty','Your first little moment is waiting.'));return details}
 const labels={rescued:'Found each other',fed:'Shared a snack',played:'Played together',rested:'Rested',talked:'Had a chat',cuddled:'Shared a cuddle',groomed:'Got spruced up'};
 const ul=make('ul','');
 for(const moment of list){
  const parsed=Date.parse(moment.at);if(!Number.isFinite(parsed))continue;
  const li=make('li',''),strong=make('strong','',labels[moment.kind]||'Spent time together'),time=make('time','');
  const elapsed=Math.max(0,Date.now()-parsed),minutes=Math.floor(elapsed/60000);
  time.dateTime=moment.at;
  time.textContent=minutes<1?'just now':minutes<60?minutes+'m ago':minutes<1440?Math.floor(minutes/60)+'h ago':Math.floor(minutes/1440)+'d ago';
  li.append(strong,time);ul.append(li);
 }
 details.append(ul);return details;
}
function detailsFor(id,key,label){
 const stateKey=id+'-'+key,details=make('details','pet-customize');
 details.open=openDetails.get(stateKey)===true;
 details.append(make('summary','',label));
 details.addEventListener('toggle',()=>{if(details.isConnected)openDetails.set(stateKey,details.open)});
 return details;
}
const actionLabels={feed:'Feed',play:'Play',rest:'Rest',talk:'Talk',cuddle:'Cuddle',groom:'Groom'};
function careButtons(pet,ritual=false){
 const list=make('div','pet-actions'+(ritual?' pet-rituals':''));
 for(const action of ritual?['talk','cuddle','groom']:['feed','play','rest']){
  const b=button(actionLabels[action],ritual?'interact':action,working);
  if(ritual)b.dataset.interaction=action;
  b.dataset.petCare=action;
  list.append(b);
 }
 return list;
}
function tickCare(){
 const petsById=new Map(pets.map(pet=>[String(pet.id),pet]));
 for(const b of document.querySelectorAll('button[data-pet-care]')){
  const pet=petsById.get(b.closest('[data-pet-id]')?.dataset.petId);
  if(!pet)continue;
  const action=b.dataset.petCare,delay=clock.remaining(pet,action);
  const label=actionLabels[action]+(delay?' · '+clock.label(delay):'');
  if(b.textContent!==label)b.textContent=label;
  b.disabled=working||delay>0;
 }
}
function renderSpotlight(){
 if(!spotlight||!picker)return;
 spotlight.replaceChildren();
 const pet=pets.find(item=>item.id===spotlightId)||pets.find(item=>item.featured)||pets[0];
 picker.parentElement.hidden=!pet;
 if(!pet){
  const starters=make('div','spotlight-starters');
  for(const item of species.filter(item=>item.first_rescue_free).slice(0,4)){
   const image=make('img');image.src=safeSrc(item.idle||item.svg);image.alt='';starters.append(image);
  }
  const panel=make('div','spotlight-empty');
  panel.append(starters,make('h3','','Your first rescue is free'),make('p','','Choose a starter in the adoption gallery to meet your first companion.'));
  const link=make('a','pet-room-link','Meet the starters');link.href='#adoption-gallery';panel.append(link);
  spotlight.append(panel);
  return;
 }
 spotlightId=pet.id;
 picker.replaceChildren(...pets.map(item=>{const option=make('option','',item.nickname);option.value=String(item.id);return option}));
 picker.value=String(pet.id);
 const card=cardBase({...pet,habitat:null},pet.idle||pet.image||pet.portrait,true);
 card.classList.add('spotlight-card');
 const info=make('div','spotlight-info');
 info.append(make('p','spotlight-species',pet.species_name+' · Lv '+pet.level),make('h3','',pet.nickname),
  make('p','spotlight-lore',pet.lore||pet.mood?.tip||''),make('p','pet-personality',(pet.temperament||'Curious')+' · Loves '+(pet.favorite||'adventures')));
 const bars=make('div','pet-bars');
 for(const [key,label] of [['hunger','Food'],['joy','Joy'],['energy','Energy']])bars.append(statRow(label,pet.vitals?.[key]));
 const bond=pet.relationship;
 const status=make('p','spotlight-status',[pet.mood?.label,bond?.label,bond&&bond.experience+' bond'].filter(Boolean).join(' · '));
 const note=make('p','spotlight-recommendation');
 const actions=careButtons(pet);
 const room=make('a','pet-room-link','Visit room');room.href='/mascot-room.html?pet='+encodeURIComponent(pet.id);
 info.append(bars,status,note,actions,careButtons(pet,true),room);
 card.append(info);spotlight.append(card);
}
function updateSpotlightNote(){
 const pet=pets.find(item=>item.id===spotlightId),note=spotlight?.querySelector('.spotlight-recommendation');
 if(!pet||!note)return;
 const action=clock.recommended(pet),label=action?('Suggested care · '+actionLabels[action]):'Your companion can rest here between visits.';
 if(note.textContent!==label)note.textContent=label;
 spotlight.querySelectorAll('[data-pet-care]').forEach(button=>button.classList.toggle('primary',button.dataset.petCare===action));
}
if(picker)picker.addEventListener('change',()=>{spotlightId=Number(picker.value);document.querySelector('#spotlight-result').textContent='';renderSpotlight();tickCare();updateSpotlightNote()});
setInterval(()=>{if(!document.hidden){tickCare();updateSpotlightNote()}},1000);
function renderOwned(){
 owned.replaceChildren();
 slots.textContent=pets.length+' / '+max+' companions';
 if(balance)balance.textContent=signedIn?'✦ '+cinders.toLocaleString()+' Cinders · Sanctuary Level '+level:'Sign in to view your Cinders balance';
 if(!signedIn){owned.append(make('p','pet-empty','Sign in to collect pets and keep everything saved to your account.'));return}
 if(!pets.length){owned.append(make('p','pet-empty','Your collection is empty. Your first rescue is free, and you can eventually rescue every species.'));return}
 for(const pet of pets){
  const card=cardBase(pet,pet.idle||pet.image||pet.portrait,true),heading=make('div','pet-label');
  heading.append(make('strong','',pet.nickname),make('small','',pet.featured?'✦ Featured':'Lv '+pet.level));
  if(pet.rarity==='Starborn')heading.lastChild.textContent=pet.featured?'✦ Starborn · Featured':'✦ Starborn';
  card.append(heading,make('p','pet-type',pet.species_name+' · Lv '+pet.level+' · '+pet.experience+' XP'));
  card.append(make('span','pet-affinity-chip',pet.affinity_label||'Feral'));
  if(pet.growth){
   const g=pet.growth,box=make('div','pet-growth-track');
   box.append(make('strong','',g.label+' · '+g.name));
   box.append(make('small','',g.next?'Next: '+g.next.name+' · Lv '+g.next.level+' and '+g.next.bond+' bond':'Final form reached through care and friendship'));
   if(g.next){const bar=make('progress');bar.max=100;bar.value=g.next.progress||0;bar.setAttribute('aria-label','Growth toward '+g.next.name);box.append(bar)}
   card.append(box);
  }else if(pet.evolution){
   const ev=pet.evolution,box=make('div','pet-evolution'+(ev.evolved?' evolved':''));
   box.append(make('strong','',ev.evolved?'✧ '+ev.name:'✧ Starborn evolution · '+ev.name));
   box.append(make('small','',ev.evolved?(ev.tagline||'A new form, earned together.'):'Reach Lv '+ev.level+' and '+ev.bond_required+' bond · '+Math.min(100,ev.progress||0)+'%'));
   card.append(box);
  }
  const bars=make('div','pet-bars');
  for(const [key,label] of [['hunger','Food'],['joy','Joy'],['energy','Energy']])bars.append(statRow(label,pet.vitals?.[key]));
  card.append(bars);
  const mood=pet.mood||{id:'content',label:'Content',tip:'Happy to be hanging out with you.'};
  const moodCard=make('div','pet-mood');moodCard.dataset.mood=mood.id;
  moodCard.append(make('strong','','♡ '+mood.label),make('small','',mood.tip||''));card.append(moodCard);
  const personality=make('p','pet-personality',(pet.temperament||'Curious')+' · Loves '+(pet.favorite||'mischief'));
  card.append(personality,renderMoments(pet));
  const relationship=pet.relationship||{label:'New little friend',experience:0,progress:0};
  const bond=make('div','pet-relationship');
  const bondHead=make('div','pet-relationship-head');bondHead.append(make('strong','','♡ '+relationship.label),make('small','',Number(relationship.experience||0)+' bond'));
  const bondTrack=make('div','pet-relationship-track'),bondFill=make('i');bondFill.style.width=Math.max(0,Math.min(100,Number(relationship.progress)||0))+'%';bondTrack.append(bondFill);bond.append(bondHead,bondTrack);card.append(bond);
  const quick=make('div','pet-actions');
  quick.append(button('Open care','spotlight',false,true));
  const roomLink=make('a','pet-room-link','Visit room');
  roomLink.href='/mascot-room.html?pet='+encodeURIComponent(String(pet.id));
  quick.append(roomLink);card.append(quick);
  const more=detailsFor(pet.id,'care','More care & profile options');
  more.append(careButtons(pet),careButtons(pet,true));
  const actions=make('div','pet-actions');
  actions.append(button('Display on profile','feature',working||pet.featured),button('Rename','rename',working));
  more.append(actions);
  const trialLink=make('a','pet-room-link pet-trial-shortcut','Species Trial');
  trialLink.href='/mascot-trials.html?pet='+encodeURIComponent(String(pet.id));
  more.append(trialLink);card.append(more);
  dressUp(card,pet);
  owned.append(card);
 }
}
function renderAdopt(){
 adopt.replaceChildren();
 for(const pet of species){
  const already=pets.some(x=>x.species===pet.id),incubating=incubatingSpecies.includes(pet.id),first=pets.length===0,free=first&&!!pet.first_rescue_free;
  const unlock=Number(pet.unlock_level||1),locked=first?!pet.first_rescue_free:level<unlock,full=pets.length>=max;
  const price=free?0:Number(pet.cost_cinders||0),canAfford=cinders>=price;
  const card=cardBase(pet,pet.idle||pet.svg),heading=make('div','pet-label');
  heading.append(make('strong','',pet.name),make('small','',already?'OWNED':incubating?'EGG WAITING':free?'FREE':'✦ '+price.toLocaleString()));
  card.append(heading,make('p','pet-type',(pet.affinity_label||'Feral')+' affinity · '+pet.type+' · Unlock Lv '+unlock));
  if(pet.evolution)card.append(make('p','pet-cost-note','Starborn signature form: '+pet.evolution.name+' · Lv '+pet.evolution.level+' + '+pet.evolution.bond+' bond'));
  const hint=make('p','pet-cost-note',already?'You have already rescued this species.':incubating?'Your egg for this mascot is incubating. Hatch that egg instead.':locked?first?'Your first rescue must be one of the eight starter misfits.':'Train any companion to Lv '+unlock+' first.':!canAfford?'Earn Cinders through arcade and daily rewards.':free?'Your first starter companion is free.':'Ready to rescue with Cinders.');
  card.append(hint);
  const field=make('input');field.maxLength=28;field.value=pet.name;field.setAttribute('aria-label','Nickname for '+pet.name);field.dataset.nickname='1';
  card.append(field);
  const actions=make('div','pet-actions');
  const label=already?'Already rescued':incubating?'Egg incubating · hatch instead':!signedIn?'Sign in to rescue':full?'Full collection':locked?first?'Starter required':'Locked · Lv '+unlock:price?'Rescue · '+price.toLocaleString()+' ✦':'Free starter rescue';
  actions.append(button(label,already?'owned':'adopt',already||incubating||full||locked||!canAfford||working,!(already||incubating||locked||full||!canAfford)));
  card.append(actions);adopt.append(card);
 }
}
function renderBestiary(){
 const grid=document.querySelector('#pet-bestiary-grid'),counter=document.querySelector('#pet-bestiary-count');
 if(!grid)return;
 const found=new Map(pets.map(p=>[p.species,p]));
 const query=(document.querySelector('#pet-bestiary-search')?.value||'').trim().toLowerCase();
 const type=document.querySelector('#pet-bestiary-type')?.value||'all';
 const status=document.querySelector('#pet-bestiary-status')?.value||'all';
 grid.replaceChildren();
 let visible=0;
 for(let i=0;i<species.length;i++){
  const item=species[i],mine=found.get(item.id),discovered=!!mine;
  if(type!=='all'&&item.affinity!==type)continue;
  if(status==='found'&&!discovered||status==='missing'&&discovered)continue;
  if(query&&!(item.name+' '+item.type+' '+item.affinity_label+' '+item.id).toLowerCase().includes(query))continue;
  visible++;
  const entry=cardBase({...item,growth:mine?.growth},item.idle||item.svg);
  entry.classList.add('bestiary-entry');
  if(!discovered)entry.classList.add('is-undiscovered');
  const heading=make('div','pet-label');
  heading.append(make('strong','',discovered?item.name:'Undiscovered'),make('small','',String(i+1).padStart(3,'0')));
  entry.append(heading,make('span','pet-affinity-chip',item.affinity_label||'Feral'));
  if(discovered){
   const g=mine.growth,detail=make('details'),summary=make('summary','','View field notes and evolution');
   detail.append(summary,make('p','',item.lore||''));
   const stages=make('ol');
   for(const s of item.growth_stages||g?.stages||[]){
    const label=s.name+' · Lv '+s.level+(s.bond?' / '+s.bond+' bond':'');
    const li=make('li','',label);
    if(g?.stage>=s.stage)li.append(make('strong','',' ✓'));
    stages.append(li);
   }
   detail.append(stages);
   entry.append(make('p','pet-cost-note',mine.nickname+' · '+(g?.label||'First Form')),detail);
  }else{
   entry.append(make('p','pet-cost-note','Rescue unlock: Lv '+item.unlock_level+'. A new companion to discover.'));
  }
  grid.append(entry);
 }
 if(counter)counter.textContent=found.size+' / '+species.length+' discovered · '+visible+' shown';
 if(!visible)grid.append(make('p','pet-empty','No creatures match these filters.'));
}
for(const id of ['pet-bestiary-search','pet-bestiary-type','pet-bestiary-status']){
 const filter=document.getElementById(id);
 if(filter)filter.addEventListener(id.includes('search')?'input':'change',renderBestiary);
}
function renderShop(){
 shop.replaceChildren();
 for(const item of accessories){
  const card=make('article','pet-card accessory-card');
  card.dataset.sku=item.sku;
  const visual=make('div','pet-art'),src=safeSrc(item.asset);
  if(src){const img=make('img','pet-accessory-preview');img.src=src+'?v=20261104-starborn1';img.alt=item.name;img.loading='lazy';visual.append(img)}
  const own=ownedSku(item.sku);
  const h=make('div','pet-label');h.append(make('strong','',item.name),make('small','',own?'OWNED':item.premium?'PREMIUM':'CINDERS'));
  card.append(visual,h,make('p','pet-type',item.slot+' slot · cosmetic only'));
  const price=item.premium?'$'+(item.price_cents/100).toFixed(2):'✦ '+Number(item.cinders_price).toLocaleString()+' Cinders';
  card.append(make('p','pet-cost-note',own?'Unlocked account-wide. Equip on any pet.':price));
  const actions=make('div','pet-actions');
  const disabled=own||working||(!item.premium&&cinders<item.cinders_price)||(item.premium&&!premiumEnabled);
  actions.append(button(own?'In your wardrobe':item.premium&&!premiumEnabled?'Paid shop not configured':item.premium?'Secure checkout':!signedIn?'Sign in to shop':'Unlock accessory',
    item.premium?'premium':'buy',disabled||(!signedIn&&!item.premium),!disabled));
  card.append(actions);shop.append(card);
 }
}
function render(){renderOwned();renderSpotlight();renderAdopt();renderBestiary();renderShop();tickCare();updateSpotlightNote();document.dispatchEvent(new CustomEvent('sanctuary-rendered',{detail:{pets,species,accessories,wardrobe,cinders,level,max,signedIn,working,incubatingSpecies}}))}
function updateMe(d){
 pets=d.pets||[];pets.forEach(pet=>clock.remember(pet));wardrobe=d.wardrobe||[];cinders=Number(d.wallet_balance||0);
 level=Number(d.sanctuary_level||1);max=d.max_owned||31;
}
async function reload(){
 const catalog=await api('/api/mascot-pets/catalog');
 species=catalog.species||[];affinities=catalog.affinities||[];accessories=catalog.accessories||[];
 const typeSelect=document.querySelector('#pet-bestiary-type');
 if(typeSelect&&typeSelect.options.length===1){for(const type of affinities){const option=make('option','',type.name);option.value=type.id;typeSelect.append(option)}}
 premiumEnabled=!!catalog.premium_enabled;max=catalog.max_owned||31;
 try{updateMe(await api('/api/mascot-pets/me'));signedIn=true;
  const adv=await api('/api/mascot-pets/adventures').catch(()=>null);
  habitatThemes=adv?.themes||[];habitatDecorations=adv?.decorations||[];
  incubatingSpecies=(adv?.eggs||[]).filter(x=>x.status==='incubating').map(x=>x.species);
  say('First rescue free. Complete daily companion quests to earn rescue shells, incubate eggs, and decorate every pet habitat.');
 }catch(error){if(error.status===401){signedIn=false;say('Browse every species and cosmetic here. Sign in to own companions.')}else throw error}
 const checkout=new URLSearchParams(location.search).get('checkout');
 if(checkout==='success')say('Payment returned successfully. Premium items are granted only after Stripe confirms payment. Refresh your wardrobe shortly.');
 if(checkout==='cancelled')say('Checkout cancelled. No new item was granted.');
 render();
}
async function perform(fn,localStatus){
 if(working)return;
 working=true;tickCare();
 const feedback=text=>{say(text);if(localStatus)localStatus.textContent=text};
 try{const result=await fn();feedback(result?.message||'Your Sanctuary was updated.');
  updateMe(await api('/api/mascot-pets/me'));
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'pets'}}));
 }catch(error){feedback(error.message)}
 finally{working=false;render()}
}
document.addEventListener('click',event=>{
 const b=event.target.closest('button[data-action]');
 if(!b||working||!([owned,adopt,shop,spotlight].some(root=>root?.contains(b))))return;
 const action=b.dataset.action,card=b.closest('.pet-card');if(!card||action==='owned')return;
 if(action==='adopt'){
  if(!signedIn){location.href='/auth.html?next=%2Fmascot-pets.html';return}
  perform(()=>api('/api/mascot-pets/adopt',{method:'POST',body:JSON.stringify({species:card.dataset.species,nickname:card.querySelector('[data-nickname]')?.value})}));return;
 }
 if(action==='buy'){
  if(!signedIn){location.href='/auth.html?next=%2Fmascot-pets.html';return}
  perform(()=>api('/api/mascot-pets/accessories/buy',{method:'POST',body:JSON.stringify({sku:card.dataset.sku})}));return;
 }
 if(action==='premium'){
  if(!premiumEnabled)return;
  if(!signedIn){location.href='/auth.html?next=%2Fmascot-pets.html';return}
  if(working)return;
  working=true;say('Opening secure payment checkout…');
  api('/api/member-shop/checkout',{method:'POST',body:JSON.stringify({sku:card.dataset.sku})})
   .then(data=>{
    const destination=new URL(data.checkout_url||'');
    if(destination.protocol!=='https:'||!(destination.hostname==='checkout.stripe.com'||destination.hostname.endsWith('.checkout.stripe.com')))throw Error('Invalid checkout destination');
    window.location.assign(destination.href);
   }).catch(err=>{say(err.message);working=false;render()});
  return;
 }
 const id=Number(card.dataset.petId);
 if(!signedIn||!Number.isSafeInteger(id)||id<=0)return;
 if(action==='spotlight'){
  spotlightId=id;document.querySelector('#spotlight-result').textContent='';renderSpotlight();tickCare();updateSpotlightNote();
  picker.focus({preventScroll:true});
  spotlight.closest('section').scrollIntoView({block:'start'});
  return;
 }
 const localStatus=spotlight?.contains(card)?document.querySelector('#spotlight-result'):null;
 if(['feed','play','rest'].includes(action)){
  perform(()=>api('/api/mascot-pets/'+id+'/care',{method:'POST',body:JSON.stringify({action})}),localStatus);return;
 }
 if(action==='interact'){
  perform(()=>api('/api/mascot-pets/'+id+'/interact',{method:'POST',body:JSON.stringify({action:b.dataset.interaction})}),localStatus);return;
 }
 if(action==='feature'){perform(()=>api('/api/mascot-pets/'+id+'/feature',{method:'PUT',body:'{}'}));return}
 if(action==='rename'){
  const old=pets.find(x=>x.id===id)?.nickname||'',value=window.prompt('Nickname (1–28 characters)',old);
  if(value!==null)perform(()=>api('/api/mascot-pets/'+id+'/nickname',{method:'PATCH',body:JSON.stringify({nickname:value})}));
  return;
 }
 if(action==='habitat'){
  const theme=card.querySelector('[data-habitat-field="theme"]')?.value;
  const decoration=card.querySelector('[data-habitat-field="decoration"]')?.value;
  perform(()=>api('/api/mascot-pets/'+id+'/habitat',{method:'PUT',body:JSON.stringify({theme,decoration})}));return;
 }
 if(action==='equip'){
  const slot=b.dataset.slot,sku=card.querySelector('select[data-equip-slot="'+slot+'"]')?.value;
  if(!slot)return;
  if(sku)perform(()=>api('/api/mascot-pets/'+id+'/equipment',{method:'PUT',body:JSON.stringify({slot,sku})}));
  else perform(()=>api('/api/mascot-pets/'+id+'/equipment',{method:'DELETE',body:JSON.stringify({slot})}));
 }
});
document.addEventListener('sanctuary-changed',async event=>{
 if(!['adventures','passport','minigame','bulk'].includes(event.detail?.source))return;
 try{updateMe(await api('/api/mascot-pets/me'));
  const a=await api('/api/mascot-pets/adventures');incubatingSpecies=(a.eggs||[]).filter(x=>x.status==='incubating').map(x=>x.species);
  render()}catch(error){say(error.message)}
});
reload().catch(err=>say('Sanctuary unavailable: '+err.message));
})();
