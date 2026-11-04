/* Connect saved personal misfits to the Profile Studio preview and active look. */
(()=>{'use strict';
const API='https://api.ash-fall.com',kit=window.KnightfallMisfitAvatars;
const select=document.getElementById('profile-misfit-slot'),preview=document.getElementById('profile-misfit-preview'),
 activate=document.getElementById('profile-misfit-activate'),deactivate=document.getElementById('profile-misfit-deactivate'),
 status=document.getElementById('profile-misfit-status');
if(!select||!preview||!activate||!deactivate||!status||!kit)return;
let slots=[],activeSlot=null,busy=false;
window.KnightfallProfileMisfits={activeAvatar:null,previewAvatar:null,activeName:''};
async function api(path,options={}){
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
 const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'Misfit settings could not be loaded.');return data;
}
const selected=()=>slots.find(slot=>Number(slot.slot_no)===Number(select.value))||null;
function draw(){
 const slot=selected(),avatar=slot?.avatar||null;preview.replaceChildren();
 if(avatar){preview.innerHTML=kit.render(avatar);window.KnightfallProfileMisfits.previewAvatar=avatar;}
 else{const placeholder=document.createElement('span');placeholder.textContent='Choose a saved design to preview it here.';preview.append(placeholder);window.KnightfallProfileMisfits.previewAvatar=null;}
 activate.disabled=busy||!avatar||Number(slot?.slot_no)===activeSlot;
 activate.textContent=Number(slot?.slot_no)===activeSlot?'Currently on your profile':'Use this misfit';
 deactivate.hidden=activeSlot===null;deactivate.disabled=busy;
 document.dispatchEvent(new CustomEvent('kf:personal-avatar-preview'));
}
function populate(preferred){
 select.replaceChildren();const saved=slots.filter(slot=>slot.avatar);
 if(!saved.length){select.add(new Option('No saved misfits yet',''));select.disabled=true;activate.disabled=true;preview.replaceChildren();window.KnightfallProfileMisfits.previewAvatar=null;deactivate.hidden=activeSlot===null;status.textContent='Create a misfit in the Avatar Studio, then choose it here. Your photo remains your profile picture.';document.dispatchEvent(new CustomEvent('kf:personal-avatar-preview'));return;}
 select.disabled=false;
 for(const slot of saved)select.add(new Option((slot.name||'Misfit '+slot.slot_no)+(Number(slot.slot_no)===activeSlot?' · Active profile look':''),String(slot.slot_no)));
 const target=saved.find(slot=>Number(slot.slot_no)===Number(preferred))||saved.find(slot=>Number(slot.slot_no)===activeSlot)||saved[0];
 select.value=String(target.slot_no);draw();
 status.textContent=activeSlot===null?'Preview any saved look here. Choosing “Use this misfit” updates your profile immediately.':'Your current profile look is '+(saved.find(slot=>Number(slot.slot_no)===activeSlot)?.name||'Misfit '+activeSlot)+'.';
}
function sync(data,preferred){slots=data.slots||slots;activeSlot=slots.find(slot=>slot.is_active)?.slot_no??null;const active=slots.find(slot=>Number(slot.slot_no)===Number(activeSlot));window.KnightfallProfileMisfits.activeAvatar=active?.avatar||null;window.KnightfallProfileMisfits.activeName=active?.name||'';populate(preferred);}
select.addEventListener('change',()=>{draw();const slot=selected();status.textContent=slot?.avatar?(Number(slot.slot_no)===activeSlot?'This misfit is already active on your profile.':'Previewing '+(slot.name||'this misfit')+'. Activate it to publish this look.'):'Choose a saved misfit to preview.';});
activate.addEventListener('click',async()=>{const slot=selected();if(!slot?.avatar||busy)return;busy=true;draw();status.textContent='Setting your profile look…';try{const data=await api('/api/avatars/active',{method:'PATCH',body:JSON.stringify({slot_no:Number(slot.slot_no)})});sync(data,slot.slot_no);status.textContent=data.message||'Your misfit is now on your profile.';}catch(error){status.textContent=error.message;}finally{busy=false;draw();}});
deactivate.addEventListener('click',async()=>{if(activeSlot===null||busy)return;busy=true;deactivate.disabled=true;activate.disabled=true;status.textContent='Switching back to your profile photo…';try{const data=await api('/api/avatars/active',{method:'PATCH',body:JSON.stringify({slot_no:null})});sync(data,select.value);status.textContent=data.message||'Your profile photo is active again.';}catch(error){status.textContent=error.message;}finally{busy=false;draw();}});
const originalSync=window.syncLivePreview;
if(typeof originalSync==='function')window.syncLivePreview=function(){originalSync();const avatar=window.KnightfallProfileMisfits.previewAvatar;if(!avatar)return;const target=document.getElementById('studio-preview-avatar');if(target){target.replaceChildren();target.innerHTML=kit.render(avatar);target.dataset.identity='misfit';}};
document.addEventListener('kf:personal-avatar-preview',()=>window.syncLivePreview?.());
api('/api/avatars/me').then(data=>sync(data)).catch(error=>{select.replaceChildren(new Option('Could not load misfits',''));select.disabled=true;activate.disabled=true;deactivate.hidden=true;preview.textContent='Your saved avatar designs are unavailable right now.';status.textContent=error.message;});
})();
