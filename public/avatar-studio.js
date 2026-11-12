(()=>{
 const API='https://api.ash-fall.com',kit=window.KnightfallMisfitAvatars;
 const fields=[['skin','Skin tone','face'],['face_shape','Face shape','face'],['hair','Hair shape','face'],['hair_color','Hair color','face'],['headwear','Headwear','face'],['eyes','Eye style','features'],['eye_color','Eye color','features'],['brow_style','Brow style','features'],['eye_glimmer','Eye glimmer','features'],['expression','Expression','features'],['face_mark','Face markings','features'],['piercing','Piercing','features'],['eyewear','Eyewear','features'],['outfit','Outfit','fit'],['outfit_color','Outfit color','fit'],['neckwear','Neckwear','fit'],['accessory','Extra chaos','fit'],['background','Backdrop','scene'],['pattern','Backdrop pattern','scene'],['aura','Aura effect','scene']];
 const labels={round:'Round',soft_square:'Soft square',heart_face:'Heart shaped',long:'Long',soft:'Soft brows',raised:'Raised brows',bold:'Bold brows',sleepy:'Sleepy brows',double:'Double glimmer',porcelain:'Porcelain',peach:'Peach',honey:'Honey',olive:'Olive',cocoa:'Cocoa',violet:'Lavender',shag:'Shaggy',spikes:'Spiky',bob:'Bob cut',mohawk:'Mohawk',horns:'Little horns',buns:'Double buns',flop:'Floppy fringe',ink:'Ink black',plum:'Plum',pink:'Hot pink',acid:'Acid green',silver:'Silver',copper:'Copper',blue:'Electric blue',witch_hat:'Witch hat',tiara:'Misfit tiara',antenna:'Glitch antenna',headphones:'Oversized headphones',flower:'Hair flower',star_shades:'Star shades',round_specs:'Round specs',visor:'Neon visor',monocle:'Tiny monocle',eyepatch:'Pirate patch',spike_choker:'Spike choker',chain:'Skull chain',bandana:'Bandana',scarf:'Cozy scarf',ghost_flames:'Ghost-flame aura',spark_ring:'Orbit ring',glow:'Neon glow',moon:'Crescent moon',doe:'Big doe eyes',sleepy:'Sleepy eyes',mischief:'Mischief eyes',star:'Star eyes',spiral:'Hypno eyes',green:'Green',gold:'Gold',red:'Cherry red',smile:'Soft grin',grin:'Big grin',pout:'Pout',fang:'Tiny fangs',frown:'Grumpy',tongue:'Silly tongue',freckles:'Freckles',stars:'Star freckles',stitches:'Stitches',lightning:'Lightning marks',heart:'Heart marks',septum:'Septum ring',brow:'Brow studs',lip:'Lip ring',ear:'Double ear studs',hoodie:'Hoodie',jacket:'Patch jacket',overalls:'Overalls',dress:'Chaos dress',sweater:'Comfy sweater',cape:'Tiny cape',none:'None',halo:'Glitch halo',bow:'Big bow',beanie:'Slouch beanie',crown:'Tiny crown',bandage:'Bandage patch',void:'Midnight void',bubblegum:'Bubblegum',toxic:'Toxic garden',gravewave:'Gravewave',ember:'Ember glow',lavender:'Haunted lavender',sky:'Night sky',sparkles:'Sparkles',static:'Neon static',bats:'Tiny bats',hearts:'Floaty hearts',black:'Ink black'};
 Object.assign(labels,{frost:'Frost',ashen:'Ashen',infernal:'Infernal red',angular:'Angular',oval:'Oval',undercut:'Undercut',waves:'Long waves',locs:'Locs',white:'Arctic white',crimson:'Crimson',teal:'Cyber teal',cat:'Cat eyes',cyber:'Cyber eyes',hollow:'Void eyes',ice:'Ice blue',amber:'Amber',smirk:'Side smirk',snarl:'Snarl',scar:'Battle scar',runes:'Arcane runes',nose:'Nose stud',armor:'Dark armor',punk:'Street punk',techwear:'Techwear',gold:'Gold',safety_pin:'Safety pin',eclipse:'Total eclipse',neon_city:'Neon city',shards:'Glass shards',lightning:'Electric storm',cyber_lens:'Cyber lens',spiked_cap:'Spiked cap',pendant:'Crystal pendant'});
 const presets=[
  {name:'Gutter Goth',avatar:{skin:'porcelain',hair:'mohawk',hair_color:'ink',eyes:'mischief',eye_color:'red',expression:'fang',face_mark:'stitches',piercing:'brow',outfit:'jacket',outfit_color:'black',headwear:'headphones',eyewear:'eyepatch',neckwear:'spike_choker',aura:'ghost_flames',accessory:'bandage',background:'gravewave',pattern:'static'}},
  {name:'Bubblegum Gremlin',avatar:{skin:'violet',hair:'buns',hair_color:'pink',eyes:'star',eye_color:'pink',expression:'tongue',face_mark:'heart',piercing:'septum',outfit:'hoodie',outfit_color:'pink',headwear:'flower',eyewear:'round_specs',neckwear:'scarf',aura:'glow',accessory:'bow',background:'bubblegum',pattern:'hearts'}},
  {name:'Toxic Sprite',avatar:{skin:'honey',hair:'spikes',hair_color:'acid',eyes:'spiral',eye_color:'green',expression:'grin',face_mark:'lightning',piercing:'lip',outfit:'overalls',outfit_color:'acid',headwear:'antenna',eyewear:'visor',neckwear:'chain',aura:'spark_ring',accessory:'horns',background:'toxic',pattern:'sparkles'}},
  {name:'Gravewave Angel',avatar:{skin:'porcelain',hair:'flop',hair_color:'silver',eyes:'doe',eye_color:'blue',expression:'smile',face_mark:'stars',piercing:'ear',outfit:'cape',outfit_color:'silver',headwear:'witch_hat',eyewear:'monocle',neckwear:'scarf',aura:'moon',accessory:'halo',background:'void',pattern:'bats'}},
  {name:'Soft Spot Menace',avatar:{skin:'peach',hair:'bob',hair_color:'copper',eyes:'sleepy',eye_color:'gold',expression:'pout',face_mark:'freckles',piercing:'none',outfit:'sweater',outfit_color:'copper',headwear:'flower',eyewear:'round_specs',neckwear:'scarf',aura:'glow',accessory:'beanie',background:'ember',pattern:'sparkles'}},
  {name:'Tiny Villain',avatar:{skin:'cocoa',hair:'horns',hair_color:'plum',eyes:'mischief',eye_color:'violet',expression:'grin',face_mark:'lightning',piercing:'septum',outfit:'dress',outfit_color:'red',headwear:'tiara',eyewear:'star_shades',neckwear:'chain',aura:'spark_ring',accessory:'crown',background:'lavender',pattern:'hearts'}}
  ,{name:'Neon Renegade',avatar:{skin:'ashen',face_shape:'angular',hair:'undercut',hair_color:'teal',eyes:'cyber',eye_color:'ice',expression:'smirk',outfit:'techwear',outfit_color:'teal',headwear:'none',eyewear:'cyber_lens',background:'neon_city',pattern:'shards',aura:'lightning'}}
  ,{name:'Infernal Knight',avatar:{skin:'infernal',face_shape:'angular',hair:'locs',hair_color:'crimson',eyes:'hollow',expression:'snarl',face_mark:'scar',outfit:'armor',outfit_color:'black',headwear:'spiked_cap',background:'eclipse',pattern:'runes',neckwear:'pendant'}}
  ,{name:'Grunge Oracle',avatar:{skin:'frost',face_shape:'oval',hair:'waves',hair_color:'white',eyes:'cat',eye_color:'amber',expression:'smirk',outfit:'punk',outfit_color:'gold',face_mark:'runes',accessory:'safety_pin',background:'storm',pattern:'shards'}}
 ];
 let state={slots:[],wallet:0,products:[],extra:0,max:20},selected=1,avatar={...kit.defaults},busy=false;
 let activeGroup='face',history=[],historyIndex=0,savedSnapshot='',savedName='',comparing=false;
 const groups=[{key:'face',name:'Face & hair',icon:'✦'},{key:'features',name:'Expression',icon:'◉'},{key:'fit',name:'Style & gear',icon:'⚡'},{key:'scene',name:'World & aura',icon:'☾'}];
 const colorFields=new Set(['skin','hair_color','eye_color','outfit_color','background']);
 const byId=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const status=byId('studio-status');
 async function api(path,options={}){const r=await fetch(API+path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Avatar request failed.');return d;}
 function selectedSlot(){return state.slots.find(s=>Number(s.slot_no)===selected)||null;}
 function updatePreview(){
  const stage=byId('avatar-preview');stage.innerHTML=kit.render(comparing&&selectedSlot()?.avatar?selectedSlot().avatar:avatar);
  stage.classList.toggle('is-comparing',comparing);
  stage.setAttribute('aria-label',comparing?'Last saved Misfit appearance':'Live Misfit character preview');
  syncDirty();
 }
 function syncDirty(){
  const dirty=JSON.stringify(avatar)!==savedSnapshot||byId('avatar-name').value!==savedName;
  const badge=byId('unsaved-indicator');if(badge){badge.classList.toggle('dirty',dirty);badge.textContent=dirty?'● Unsaved changes':'✓ All changes saved';}
  byId('undo-avatar').disabled=historyIndex<=0;byId('redo-avatar').disabled=historyIndex>=history.length-1;
  byId('preview-compare').disabled=!selectedSlot()?.avatar;
  return dirty;
 }
 function resetHistory(){
  history=[JSON.stringify(avatar)];historyIndex=0;
  savedSnapshot=JSON.stringify(avatar);savedName=byId('avatar-name').value;
  comparing=false;syncDirty();
 }
 function applyAvatar(next,message){
  const safe=kit.safeAvatar(next),snapshot=JSON.stringify(safe);
  if(snapshot!==JSON.stringify(avatar)){
   history=history.slice(0,historyIndex+1);history.push(snapshot);
   if(history.length>45)history.shift();historyIndex=history.length-1;avatar=safe;
  }
  paintControls();updatePreview();if(message)status.textContent=message;
 }
 function moveHistory(delta){
  const target=historyIndex+delta;if(target<0||target>=history.length||busy)return;
  historyIndex=target;avatar=kit.safeAvatar(JSON.parse(history[target]));paintControls();updatePreview();
 }
 function paintTabs(){
  const nav=byId('category-tabs');nav.replaceChildren();
  for(const group of groups){
   const tab=document.createElement('button');tab.type='button';tab.className='category-tab';
   tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(group.key===activeGroup));tab.setAttribute('aria-controls','controls');
   tab.innerHTML='<span class="tab-icon" aria-hidden="true">'+group.icon+'</span><span>'+group.name+'</span>';
   tab.addEventListener('click',()=>{activeGroup=group.key;paintControls();});
   nav.append(tab);
  }
 }
 async function loadBuddy(){
  const root=byId('avatar-buddy');if(!root)return;
  try{
   const data=await api('/api/mascot-pets/me'),pets=Array.isArray(data.pets)?data.pets:[];
   root.replaceChildren();root.hidden=false;
   const title=document.createElement('strong');title.textContent='✦ Traveling companion';
   const copy=document.createElement('p');copy.className='avatar-buddy-copy';
   if(!pets.length){
    copy.textContent='Your Misfit can bring a pet along. Rescue your first companion in the Sanctuary.';
    root.append(title,copy);
   }else{
    const pet=pets.find(x=>x.featured)||pets[0];
    const line=document.createElement('div');line.className='avatar-buddy-line';
    const image=document.createElement('img');
    const src=pet.portrait||pet.image||'';
    image.src=/^\/assets\/devil-tools\/neon-nuisances\/(?:portraits\/|evolutions\/)?[a-z0-9_-]+\.svg$/.test(src)?src:'';
    image.alt='';image.setAttribute('aria-hidden','true');image.loading='lazy';
    const text=document.createElement('span');
    const name=document.createElement('b');name.textContent=pet.nickname||pet.species_name||'Companion';
    const detail=document.createElement('small');detail.textContent=(pet.featured?'Profile companion':'Your first companion')+' · Lv '+Number(pet.level||1);
    text.append(name,detail);line.append(image,text);
    const link=document.createElement('a');link.href='/mascot-pets.html';link.textContent='Visit the Sanctuary';
    root.append(title,line,link);
   }
  }catch{const root=byId('avatar-buddy');if(root)root.hidden=true}
}
 function paintSlots(){const root=byId('slot-list');root.replaceChildren();for(const slot of state.slots){const b=document.createElement('button');b.type='button';b.className='slot-card'+(selected===Number(slot.slot_no)?' active':'');b.setAttribute('aria-pressed',String(selected===Number(slot.slot_no)));const icon=slot.avatar?kit.render(slot.avatar):kit.render(kit.defaults);const n=slot.name?esc(slot.name):'Empty slot';b.innerHTML='<span class="tiny-avatar">'+icon+'</span><strong>Slot '+slot.slot_no+'</strong><small>'+n+(slot.is_active?' · Profile look':'')+'</small>';b.addEventListener('click',()=>loadSlot(slot.slot_no));root.append(b);}const slot=selectedSlot();byId('clear-avatar').hidden=!slot||slot.empty;byId('remove-active-avatar').hidden=!state.slots.some(item=>item.is_active);byId('slot-note').textContent='Slot '+selected+' of '+state.slots.length+' · '+(slot?.is_active?'This is your active profile look.':slot?.empty?'Ready for a new misfit.':'Saved look is private until you choose it for your profile.');byId('wallet-note').textContent='✦ '+Number(state.wallet||0).toLocaleString()+' Cinders';}
 function loadSlot(slotNo){
  if(savedSnapshot&&Number(slotNo)!==selected&&syncDirty()&&!window.confirm('Discard unsaved changes and switch to another Misfit?'))return;
  selected=Number(slotNo);const slot=selectedSlot();avatar=kit.safeAvatar(slot?.avatar||kit.defaults);
  byId('avatar-name').value=slot?.name||('Misfit '+selected);
  resetHistory();paintSlots();paintControls();updatePreview();
 }
 function paintControls(){
  paintTabs();const root=byId('controls');root.replaceChildren();
  const own=fields.filter(field=>field[2]===activeGroup);
  for(const [key,label] of own){
   const box=document.createElement('fieldset');box.className='control-group';
   const legend=document.createElement('legend');legend.textContent=label;box.append(legend);
   const row=document.createElement('div');row.className='trait-options';row.setAttribute('role','group');row.setAttribute('aria-label',label);
   for(const choice of kit.choices[key]){
    const button=document.createElement('button');button.type='button';button.className='trait-option';
    const choiceLabel=labels[choice]||choice.replace(/_/g,' '),picked=avatar[key]===choice;
    button.setAttribute('aria-pressed',String(picked));button.setAttribute('aria-label',label+': '+choiceLabel);
    const image=document.createElement('span');
    if(colorFields.has(key)){
     image.className='trait-swatch';image.style.background=kit.palettes?.[key]?.[choice]||'#4f4059';
    }else{
     image.className='trait-thumbnail';image.innerHTML=kit.render({...avatar,[key]:choice});
    }
    const caption=document.createElement('span');caption.textContent=choiceLabel;
    button.append(image,caption);
    button.addEventListener('click',()=>applyAvatar({...avatar,[key]:choice}));
    row.append(button);
   }
   box.append(row);root.append(box);
  }
 }
 function paintPresets(){
  const root=byId('preset-list');root.replaceChildren();
  for(const preset of presets){
   const button=document.createElement('button');button.type='button';button.className='preset-chip';
   const thumbnail=document.createElement('span');thumbnail.className='look-avatar';
   thumbnail.innerHTML=kit.render(preset.avatar);
   const title=document.createElement('span');title.textContent=preset.name;button.append(thumbnail,title);
   button.addEventListener('click',()=>applyAvatar(preset.avatar,preset.name+' look loaded. Keep customizing or save it.'));
   root.append(button);
  }
 }
 function paintProducts(){const root=byId('slot-products');root.replaceChildren();for(const product of state.products){const card=document.createElement('div');card.className='product';const label=document.createElement('div');label.innerHTML='<strong>'+esc(product.label)+'</strong><small>✦ '+Number(product.cost_cinders).toLocaleString()+' Cinders</small>';const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent='Unlock';button.disabled=state.wallet<product.cost_cinders||busy||(product.slots>state.max-state.extra);button.addEventListener('click',()=>buy(product.id,button));card.append(label,button);root.append(card);}}
 async function reload(){const data=await api('/api/avatars/me');state={slots:data.slots||[],wallet:Number(data.wallet_balance||0),products:data.products||[],extra:Number(data.extra_slots||0),max:Number(data.max_extra_slots||20)};paintSlots();paintProducts();}
 async function save(active){
  if(busy)return;busy=true;const button=active?byId('set-active'):byId('save-avatar');
  button.disabled=true;status.textContent='Saving your Misfit…';
  try{
   const shouldBeActive=active||Boolean(selectedSlot()?.is_active);
   const data=await api('/api/avatars/save',{method:'PUT',body:JSON.stringify({slot_no:selected,name:byId('avatar-name').value,avatar,active:shouldBeActive})});
   state.slots=data.slots||state.slots;paintSlots();resetHistory();syncDirty();
   status.textContent=data.message||'Misfit saved.';
  }catch(error){status.textContent=error.message;}
  finally{busy=false;button.disabled=false;paintProducts();}
 }
 async function useProfilePhoto(){if(busy)return;busy=true;const button=byId('remove-active-avatar');button.disabled=true;status.textContent='Switching back to your profile photo…';try{const data=await api('/api/avatars/active',{method:'PATCH',body:JSON.stringify({slot_no:null})});state.slots=data.slots||state.slots;paintSlots();status.textContent=data.message||'Your profile photo is active again.';}catch(error){status.textContent=error.message;}finally{busy=false;button.disabled=false;}}
 async function clearSlot(){
  const slot=selectedSlot();if(!slot||slot.empty||busy)return;
  if(!window.confirm('Clear '+(slot.name||'this misfit')+' from slot '+selected+'? This removes the saved design.'))return;
  busy=true;byId('clear-avatar').disabled=true;status.textContent='Clearing this slot…';
  try{
   const data=await api('/api/avatars/'+selected,{method:'DELETE'});
   state.slots=data.slots||state.slots;avatar=kit.safeAvatar(kit.defaults);byId('avatar-name').value='Misfit '+selected;
   resetHistory();paintSlots();paintControls();updatePreview();status.textContent=data.message||'Misfit cleared.';
  }catch(error){status.textContent=error.message;}
  finally{busy=false;byId('clear-avatar').disabled=false;}
 }
 async function buy(productId,button){
  if(busy)return;busy=true;button.disabled=true;status.textContent='Unlocking your slots…';
  try{
   const data=await api('/api/avatars/purchase',{method:'POST',body:JSON.stringify({product:productId})});
   state.slots=data.slots||state.slots;state.wallet=Number(data.wallet_balance??state.wallet);state.extra=Number(data.extra_slots??state.extra);
   const next=state.slots.find(s=>s.empty);selected=Number(next?.slot_no||state.slots.length);
   avatar=kit.safeAvatar(next?.avatar||kit.defaults);byId('avatar-name').value=next?.name||('Misfit '+selected);
   resetHistory();paintSlots();paintProducts();paintControls();updatePreview();
   status.textContent=data.message||'New slot unlocked.';
  }catch(error){status.textContent=error.message;}
  finally{busy=false;button.disabled=false;paintProducts();}
 }
 async function downloadPng(){const button=byId('download-avatar');button.disabled=true;status.textContent='Rendering your misfit as a PNG…';let svgUrl='';try{const blob=new Blob([kit.render(avatar)],{type:'image/svg+xml;charset=utf-8'});svgUrl=URL.createObjectURL(blob);const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not render this misfit.'));image.src=svgUrl;});const canvas=document.createElement('canvas');canvas.width=768;canvas.height=768;const context=canvas.getContext('2d');if(!context)throw Error('PNG export is unavailable in this browser.');context.clearRect(0,0,768,768);context.drawImage(image,48,0,672,768);const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('PNG export failed.');const safeName=(byId('avatar-name').value||'misfit').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'misfit';const link=document.createElement('a');link.href=URL.createObjectURL(png);link.download=safeName+'-knightfall-avatar.png';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);status.textContent='PNG downloaded at 768 × 768.';}catch(error){status.textContent=error.message;}finally{if(svgUrl)URL.revokeObjectURL(svgUrl);button.disabled=false;}}
 byId('download-avatar').addEventListener('click',downloadPng);byId('remove-active-avatar').addEventListener('click',useProfilePhoto);
 byId('new-avatar').addEventListener('click',()=>{
  const empty=state.slots.find(s=>s.empty);
  if(!empty){status.textContent='All unlocked slots are in use. Unlock more in the shop below.';return;}
  loadSlot(empty.slot_no);status.textContent='New Misfit ready. Make it yours.';
 });
 byId('save-avatar').addEventListener('click',()=>save(false));
 byId('set-active').addEventListener('click',()=>save(true));
 byId('clear-avatar').addEventListener('click',clearSlot);
 byId('randomize-avatar').addEventListener('click',()=>{
  const next={...avatar};
  for(const [key,values] of Object.entries(kit.choices)){
   const pool=values.filter(value=>value!==next[key]);next[key]=pool[Math.floor(Math.random()*pool.length)]||next[key];
  }
  applyAvatar(next,'Remixed! Keep adjusting until the look is yours.');
 });
 byId('undo-avatar').addEventListener('click',()=>moveHistory(-1));
 byId('redo-avatar').addEventListener('click',()=>moveHistory(1));
 byId('reset-avatar').addEventListener('click',()=>applyAvatar(kit.defaults,'Back to the blank canvas. Your saved look is untouched.'));
 byId('avatar-name').addEventListener('input',syncDirty);
 const compare=byId('preview-compare');
 function setComparing(value){comparing=Boolean(value)&&Boolean(selectedSlot()?.avatar);updatePreview();}
 compare.addEventListener('pointerdown',event=>{if(!compare.disabled){setComparing(true);compare.setPointerCapture?.(event.pointerId);}});
 for(const type of ['pointerup','pointercancel','pointerleave','blur'])compare.addEventListener(type,()=>setComparing(false));
 compare.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();setComparing(true);}});
 compare.addEventListener('keyup',()=>setComparing(false));
 document.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='z'||event.target.closest('input,textarea,[contenteditable="true"]'))return;
  event.preventDefault();moveHistory(event.shiftKey?1:-1);
 });
 byId('download-svg').addEventListener('click',()=>{
  const name=(byId('avatar-name').value||'misfit').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'misfit';
  const url=URL.createObjectURL(new Blob([kit.render(avatar)],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name+'-knightfall-avatar.svg';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);status.textContent='Your crisp, scalable SVG is ready.';
 });
 paintControls();paintPresets();updatePreview();reload().then(()=>{const active=state.slots.find(s=>s.is_active),first=active||state.slots[0];if(first)loadSlot(first.slot_no);}).catch(error=>{status.textContent=error.message;byId('slot-note').textContent='Sign in to use your personal misfit slots.';});
 loadBuddy();
})();
