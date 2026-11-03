/* Profile Studio photo wall. Reuses the member-owned R2-backed gallery API. */
(()=>{'use strict';
const panel=document.getElementById('photo-studio');
if(!panel||panel.dataset.ready)return;panel.dataset.ready='true';
const API='https://api.ash-fall.com',get=id=>document.getElementById(id),form=get('studio-photo-upload'),grid=get('studio-photo-grid'),photoStatus=get('studio-photo-status'),count=get('studio-photo-count'),refreshButton=get('studio-photo-refresh'),uploadButton=form.querySelector('button[type="submit"]'),field=get('studio-photo-file'),caption=get('studio-photo-caption'),profileForm=get('form');
const make=(tag,klass,text)=>{const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=String(text);return el};
const allowed=new Set(['image/jpeg','image/png','image/gif','image/webp']);
let username='',working=false,requestVersion=0,items=[];
const say=(message,error=false)=>{photoStatus.textContent=message;photoStatus.dataset.error=error?'true':'false'};
function photoUrl(p){
 const id=Number(p?.id);
 return Number.isSafeInteger(id)&&id>0?'https://api.ash-fall.com/api/profile-media/'+id:null;
}
function canUpload(){uploadButton.disabled=working||items.length>=60;uploadButton.textContent=working?'Uploading…':items.length>=60?'Photo wall full':'↥ Upload to photo wall'}
// Native dialog keeps full-size viewing accessible without leaving Profile Studio.
let photoViewer=null;
function showFullImage(p,url){
 if(!photoViewer){
  const dialog=make('dialog','studio-photo-viewer'),frame=make('div','studio-photo-viewer-inner');
  dialog.id='studio-photo-viewer';dialog.setAttribute('aria-label','Profile photo viewer');
  const header=make('div','studio-photo-viewer-head'),title=make('strong','studio-photo-viewer-title','Profile photo'),close=make('button','studio-photo-viewer-close','×');
  close.type='button';close.setAttribute('aria-label','Close photo viewer');close.addEventListener('click',()=>dialog.close());
  header.append(title,close);
  const large=make('img','studio-photo-viewer-image');large.alt='Full-size profile photo';
  frame.append(header,large);dialog.append(frame);document.body.append(dialog);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  photoViewer=dialog;
 }
 photoViewer.querySelector('.studio-photo-viewer-title').textContent=p.caption||'Gallery photo';
 const image=photoViewer.querySelector('.studio-photo-viewer-image');
 image.src=url;image.alt=p.caption?String(p.caption).slice(0,120):'Full-size profile photo';
 if(typeof photoViewer.showModal==='function')photoViewer.showModal();
 else window.open(url,'_blank','noopener,noreferrer');
}

async function api(path,options){
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...options});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'Photo wall request failed ('+response.status+').');
 return data;
}
function show(){
 grid.replaceChildren();
 count.textContent=items.length+' / 60 photos';
 canUpload();
 if(!items.length){grid.append(make('p','studio-photo-empty','Your photo wall is empty. Add a picture to start your collection.'));return}
 for(const p of items){
  const url=photoUrl(p);if(!url)continue;
  const card=make('article','studio-photo-card');
  const preview=make('div','studio-photo-image'),image=make('img');
  image.src=url;image.alt=p.caption?String(p.caption).slice(0,120):'Photo from your gallery';
  image.loading='lazy';image.decoding='async';
  const open=make('button','studio-photo-view-button');open.type='button';open.setAttribute('aria-label','View photo: '+(p.caption||'Untitled photo'));
  open.append(image);preview.append(open);open.addEventListener('click',()=>showFullImage(p,url));
  const label=make('div','studio-photo-details');
  label.append(make('strong','',p.caption||'Untitled photo'),make('small','',p.created_at?new Date(p.created_at).toLocaleDateString():'Saved photo'));
  const controls=make('div','studio-photo-controls'),use=make('button','studio-photo-button primary','Use as cover'),edit=make('button','studio-photo-button','Caption'),remove=make('button','studio-photo-button danger','Delete');
  for(const b of [use,edit,remove])b.type='button';
  use.addEventListener('click',()=>{
   const cover=profileForm?.elements?.cover_url;
   if(!cover)return;
   const pending=get('cover-file');if(pending)pending.value='';
   cover.value=url;
   cover.dispatchEvent(new Event('input',{bubbles:true}));
   say('Photo selected as your cover. Save profile to publish it.');document.getElementById('studio-save-indicator')?.scrollIntoView({block:'nearest',behavior:'auto'});
  });
  edit.addEventListener('click',()=>{
   if(working)return;
   const previous=card.querySelector('.studio-photo-caption-edit');
   if(previous){previous.remove();return}
   const editor=make('div','studio-photo-caption-edit'),captionLabel=make('label','','Photo caption');
   const text=make('input','studio-photo-caption-input');text.type='text';text.maxLength=240;
   text.placeholder='Describe this photo…';text.value=p.caption||'';
   captionLabel.append(text);
   const buttons=make('div','studio-photo-caption-actions');
   const save=make('button','studio-photo-button primary','Save caption'),cancel=make('button','studio-photo-button','Cancel');
   save.type=cancel.type='button';
   cancel.addEventListener('click',()=>editor.remove());
   save.addEventListener('click',async()=>{
    if(working)return;working=true;canUpload();save.disabled=true;say('Saving photo caption…');
    try{
     const result=await api('/api/profile/photos/'+p.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({caption:text.value.trim()})});
     if(!result.photo||Number(result.photo.id)!==Number(p.id))throw Error('Caption was not confirmed by the server.');
     p.caption=result.photo.caption||'';
     show();say('Caption updated without re-uploading your photo. ✓');
    }catch(error){say(error.message||'Caption could not be saved.',true);save.disabled=false}
    finally{working=false;canUpload()}
   });
   buttons.append(save,cancel);editor.append(captionLabel,buttons);card.append(editor);
   text.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();cancel.click()}else if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();save.click()}});
   text.focus({preventScroll:true});text.select();
  });
  remove.addEventListener('click',async()=>{
   if(working)return;
   const active=profileForm.elements.cover_url.value===url;
   const question=active?'Delete this photo? It is your selected cover, so the cover will also be cleared.':'Delete this gallery photo? This cannot be undone.';
   if(!confirm(question))return;
   working=true;canUpload();remove.disabled=true;use.disabled=true;say('Deleting photo…');
   try{
    await api('/api/profile/photos/'+p.id,{method:'DELETE'});
    items=items.filter(x=>Number(x.id)!==Number(p.id));
    if(active){
     const cover=profileForm.elements.cover_url;cover.value='';cover.dispatchEvent(new Event('input',{bubbles:true}));
     say('Photo deleted and cover cleared. Save profile to update your editor.');
    }else say('Photo deleted from your wall.');
    show();
   }catch(error){say(error.message,true);remove.disabled=false;use.disabled=false}
   finally{working=false;canUpload()}
  });
  controls.append(use,edit,remove);card.append(preview,label,controls);grid.append(card);
 }
}
async function load(){
 if(!username)return;
 const version=++requestVersion;
 try{
  const data=await api('/api/profile/photos?username='+encodeURIComponent(username));
  if(version!==requestVersion)return;
  items=(data.photos||[]).filter(p=>photoUrl(p)).slice(0,60);show();say(items.length?'Photo wall synced.':'Your photo wall is ready.');
 }catch(error){if(version===requestVersion){say(error.message||'Could not load your photos.',true);show()}}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(working||!username)return;
 const file=field.files?.[0];
 if(!file){say('Choose an image first.',true);return}
 if(!allowed.has(file.type)||file.size>8*1024*1024||!file.size){say('Use JPG, PNG, GIF or WebP, 8 MB or smaller.',true);return}
 if(items.length>=60){say('Your gallery is full. Delete a photo before adding another.',true);return}
 working=true;canUpload();say('Uploading to your photo wall…');
 try{
  const data=new FormData();data.append('file',file);data.append('kind','gallery');data.append('caption',caption.value.trim());
  const result=await api('/api/profile/photos',{method:'POST',body:data});
  if(!result.photo?.id)throw Error('Upload did not return a photo.');
  form.reset();await load();say('Photo added. It is now part of your gallery.');
 }catch(error){say(error.message||'Upload failed. Your photo was not lost.',true)}
 finally{working=false;canUpload()}
});
refreshButton.addEventListener('click',()=>void load());
document.addEventListener('kf:profile-loaded',e=>{
 const user=e.detail?.user;if(!user?.username)return;
 if(username!==user.username){username=user.username;void load()}
});
document.addEventListener('kf:profile-saved',()=>void load());
if(window.__kfProfileStudioUser?.username){username=window.__kfProfileStudioUser.username;void load()}
})();
