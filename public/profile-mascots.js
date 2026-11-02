/* Optional profile companion card. Does not block or replace main profile rendering. */
(()=>{'use strict';
const root=document.getElementById('profile');if(!root)return;
const API='https://api.ash-fall.com';
let current='',busy=false;
const safeImage=src=>/^\/assets\/devil-tools\/neon-nuisances\/(?:portraits\/|habitats\/)?[a-z0-9-]+\.svg$/.test(src)?src:null;
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
  const group=el('div','mascot-profile-grid');
  for(const pet of d.pets){
   const item=el('div','mascot-profile-pet'+(pet.featured?' featured':''));
   const art=el('div','mascot-profile-art'),url=safeImage(pet.idle||pet.image||pet.portrait);
   const scene=safeImage(pet.habitat?.art);
   if(scene){const img=el('img','mascot-profile-habitat');img.src=scene+'?v=20261102-adventures2';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);}
   if(url){const img=el('img','mascot-profile-master');img.src=url+'?v=20261102-adventures2';img.alt=pet.species_name;img.loading='lazy';art.append(img);}
   const decoration=safeImage(pet.habitat?.decoration_art);
   if(decoration){const img=el('img','mascot-profile-decoration');img.src=decoration+'?v=20261102-adventures2';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);}
   for(const gear of pet.equipment||[]){
    const asset=String(gear.asset||'');const prefix='/assets/devil-tools/neon-nuisances/accessories/';
    if(!asset.startsWith(prefix)||!asset.endsWith('.svg')||asset.includes('..')||asset.slice(prefix.length,-4).includes('/'))continue;
    const img=el('img','mascot-profile-layer');
    img.src=gear.asset+'?v=20261102-sanctuary6';img.alt='';img.setAttribute('aria-hidden','true');img.loading='lazy';art.append(img);
   }
   item.append(art,el('strong','',pet.nickname),el('small','',pet.species_name+' · Lv '+pet.level));
   if(pet.featured)item.append(el('span','mascot-profile-featured','✦ Profile companion'));
   group.append(item);
  }
  card.append(group);
 }catch(error){
  if(card.isConnected)card.remove();
 }finally{busy=false}
}
const observer=new MutationObserver(()=>{if(root.querySelector('.profile-top'))void mount()});
observer.observe(root,{childList:true,subtree:false});
void mount();
})();
