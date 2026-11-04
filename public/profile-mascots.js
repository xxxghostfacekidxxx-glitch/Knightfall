/* Optional profile companion card. Does not block or replace main profile rendering. */
(()=>{'use strict';
const root=document.getElementById('profile');if(!root)return;
const API='https://api.ash-fall.com';
let current='',busy=false;
const safeImage=src=>/^\/assets\/devil-tools\/neon-nuisances\/(?:portraits\/|habitats\/|evolutions\/)?[a-z0-9-]+\.svg$/.test(src)?src:null;
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
function displayUser(){
 const text=root.querySelector('.profile-heading .handle')?.textContent||'';
 return text.match(/@([a-zA-Z0-9_-]{1,32})/)?.[1]||'';
}
async function mount(){
 const user=displayUser(),top=root.querySelector('.profile-top');
 if(!user||!top||busy||(user===current&&root.querySelector('#mascot-profile-companions')))return;
 current=user;busy=true;
 const old=root.querySelector('#mascot-profile-companions');old?.remove();
 const card=el('section','mascot-profile-panel');card.id='mascot-profile-companions';
 const header=el('div','mascot-profile-heading');
 header.append(el('h2','','✦ Sanctuary Companions'));
 const status=el('p','mascot-profile-status','Checking this member’s companions…');
 card.append(header,status);
 const after=root.querySelector('.profile-actions-wrap')||top;
 after.insertAdjacentElement('afterend',card);
 try{
  const url='/api/mascot-pets/profile/'+encodeURIComponent(user);
  const r=await fetch(API+url,{credentials:'include',cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||'Unavailable');
  if(current!==user||!card.isConnected)return;
  status.remove();
  if(d.own_profile){
   const link=el('a','mascot-profile-link','Adopt & care for companions');
   link.href='/mascot-pets.html';header.append(link);
  }
  if(!d.pets?.length){
   card.append(el('p','mascot-profile-status',d.own_profile?'No pets yet. Adopt a Neon Nuisance to make your profile come alive.':'No companions on display yet.'));
   return;
  }
  const featured=d.pets.find(p=>p.featured)||d.pets[0];
  const summary=el('div','mascot-profile-intro');
  summary.append(el('strong','',d.pets.length+' / 28 companions collected'));
  if(featured)summary.append(el('p','','✦ '+featured.nickname+' · '+(featured.temperament||'Curious')+' · '+(featured.lore||'A misfit with a story worth sharing.')));
  card.append(summary);
  const group=el('div','mascot-profile-grid');
  for(const pet of d.pets){
   const item=el('div','mascot-profile-pet'+(pet.featured?' featured':''));
   const art=el('div','mascot-profile-art'),url=safeImage(pet.idle||pet.image||pet.portrait);
   const scene=safeImage(pet.habitat?.art);
   if(scene){const img=el('img','mascot-profile-habitat');img.src=scene+'?v=20261102-adventures2';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);}
   if(url){const img=el('img','mascot-profile-master');img.src=url+'?v=20261104-starborn1';img.alt=pet.species_name;img.loading='lazy';art.append(img);}
   const decoration=safeImage(pet.habitat?.decoration_art);
   if(decoration){const img=el('img','mascot-profile-decoration');img.src=decoration+'?v=20261102-adventures2';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);}
   for(const furniture of (pet.furniture||[]).slice(0,4)){
    const asset=String(furniture.art||''),prefix='/assets/devil-tools/neon-nuisances/furniture/';
    if(!asset.startsWith(prefix)||!asset.endsWith('.svg')||asset.slice(prefix.length,-4).includes('/'))continue;
    const img=el('img','mascot-profile-room-furniture');
    img.src=asset+'?v=20261103-furniture1';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';
    img.style.left=Math.max(4,Math.min(82,Number(furniture.x)||50))+'%';
    img.style.top=Math.max(15,Math.min(85,Number(furniture.y)||60))+'%';
    if(furniture.flipped)img.style.scale='-1 1';
    art.append(img);
   }
   for(const gear of pet.equipment||[]){
    const asset=String(gear.asset||'');const prefix='/assets/devil-tools/neon-nuisances/accessories/';
    if(!asset.startsWith(prefix)||!asset.endsWith('.svg')||asset.includes('..')||asset.slice(prefix.length,-4).includes('/'))continue;
    const img=el('img','mascot-profile-layer');
    img.src=gear.asset+'?v=20261102-sanctuary6';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);
   }
   item.append(art,el('strong','',pet.nickname),el('small','',pet.species_name+' · Lv '+pet.level));
   if(pet.evolution?.evolved)item.append(el('small','mascot-profile-evolved','✧ '+pet.evolution.name));
   if(pet.temperament||pet.favorite)item.append(el('small','mascot-profile-trait',(pet.temperament||'Curious')+' · '+(pet.favorite||'Adventures')));
   if(pet.lore)item.title=pet.lore;
   if(pet.featured)item.append(el('span','mascot-profile-featured','✦ Profile companion'));
   const visit=el('a','mascot-profile-link','⌂ Visit room');
   visit.href='/mascot-room.html?user='+encodeURIComponent(user)+'&pet='+encodeURIComponent(String(pet.id));
   visit.setAttribute('aria-label','Visit '+pet.nickname+'\'s room');
   item.append(visit);
   group.append(item);
  }
  card.append(group);
  if(Array.isArray(d.badges)&&d.badges.length){
   const medalTitle=el('h3','mascot-profile-medals-title','✦ Sanctuary Passport');
   const medals=el('div','mascot-profile-medals');
   for(const badge of d.badges){
    if(!/^[a-z_]{3,48}$/.test(badge.badge_id||''))continue;
    const medal=el('div','mascot-profile-medal');
    const img=el('img');img.src='/assets/devil-tools/neon-nuisances/badges/'+badge.badge_id+'.svg?v=20261102-passport1';
    img.alt=badge.title||'Sanctuary medal';img.loading='lazy';
    medal.append(img,el('small','',badge.title));medals.append(medal);
   }
   card.append(medalTitle,medals);
  }
 }catch(error){
  if(card.isConnected)card.remove();
 }finally{busy=false}
}
const observer=new MutationObserver(()=>{if(root.querySelector('.profile-top'))void mount()});
observer.observe(root,{childList:true,subtree:false});
void mount();
})();
