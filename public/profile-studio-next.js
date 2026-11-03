/* Knightfall Profile Studio 2: a resilient, account-owned editing experience.
   Never stores sensitive profile drafts in localStorage and never autosaves public changes. */
(()=>{'use strict';
const form=document.getElementById('form');
if(!form||form.dataset.nextStudio)return;form.dataset.nextStudio='true';
const names=['display_name','bio','avatar_url','website_url','location','pronouns','cover_url','accent_color','profile_theme','status_message','tagline','interests','favorite_games','favorite_music','favorite_quote','profile_visibility','show_activity'];
const byId=id=>document.getElementById(id),indicator=byId('studio-save-indicator'),hint=byId('studio-save-hint'),summary=byId('studio-save-summary'),discard=byId('studio-discard'),view=byId('studio-view-profile'),status=byId('status');
const submit=form.querySelector('button[type="submit"]');
const avatarFile=byId('avatar-file'),coverFile=byId('cover-file');
let loaded=false,saving=false,error=false,baseline=null,layoutDirty=false,edited=false,pendingMedia=0,lastPublishedUser=null;
const selections=[...document.querySelectorAll('.studio-jump a')];
const pretty={public:'Everyone can view your public profile and the details you choose to share.',friends:'Only approved friends can view your full profile. Visitors see restricted information.',private:'Only you and authorized moderators can view your full profile.'};
const values=()=>Object.fromEntries(names.map(name=>{
 const e=form.elements[name];return [name,name==='show_activity'?!!e.checked:String(e.value??'')];
}));
const snapshot=()=>({...values(),__coverPending:!!coverFile?._compressedBlob});
function measure(){
 const data=values(),important=['display_name','bio','avatar_url','cover_url','tagline','status_message','interests','favorite_games','favorite_music','favorite_quote','location','pronouns','website_url'];
 const populated=important.filter(k=>data[k]?.trim()).length;
 const percentage=Math.round(100*populated/important.length);
 byId('studio-completion-percent').textContent=percentage+'%';
 byId('studio-completion-fill').style.width=percentage+'%';
 byId('studio-completion-track').setAttribute('aria-valuenow',String(percentage));
 byId('studio-completion-label').textContent=populated+'/'+important.length+' details added';
}
function setIndicator(state,message){
 indicator.dataset.state=state;
 indicator.textContent=message;
}
function update(){
 measure();
 const current=snapshot();
 const contentDirty=loaded&&baseline&&Object.keys(current).some(k=>current[k]!==baseline[k]);
 const dirty=!!(contentDirty||layoutDirty);
 discard.disabled=!loaded||saving||!dirty;
 const privacy=form.elements.profile_visibility?.value||'public';
 const show=form.elements.show_activity?.checked;
 byId('studio-privacy-guide').textContent=(pretty[privacy]||pretty.public)+' '+(show?'Recent forum activity is visible to people allowed to view your profile.':'Recent forum activity is hidden from the profile page.');
 if(!loaded){setIndicator('loading','◌ Loading profile…');summary.textContent='Checking your member account…';return}
 if(saving){setIndicator('saving','↻ Saving your profile…');summary.textContent='Uploading and saving. Keep this page open.';return}
 if(error){setIndicator('error','⚠ Could not save your changes');summary.textContent='Your edits are still here. Fix the issue and try saving again.';return}
 if(dirty){
  setIndicator('dirty','● Unsaved changes');
  summary.textContent=layoutDirty?'Profile or section layout has unpublished changes.':'Your edits have not been published.';
 }else{
  setIndicator('saved',edited?'✓ All changes saved':'✓ Profile loaded');
  summary.textContent='You are up to date. You can keep editing or view your profile.';
 }
 hint.textContent=privacy==='private'?'Private profile · only you and moderators':privacy==='friends'?'Friends-only profile':'Public profile';
}
function publishBaseline(profile,submitted){
 if(!profile&&!submitted)return;
 lastPublishedUser=profile||lastPublishedUser;
 if(profile?.username)view.href='/profile.html?username='+encodeURIComponent(profile.username);
 const data=values();
 if(submitted&&typeof submitted==='object'){
  for(const k of names)if(Object.hasOwn(submitted,k))data[k]=k==='show_activity'?!!submitted[k]:String(submitted[k]??'');
 }
 // Cover processing may already have emptied the pending blob at this point.
 baseline={...data,__coverPending:false};
 loaded=true;error=false;edited=false;update();
}
function restorePreview(){
 const avatar=form.elements.avatar_url.value,cover=form.elements.cover_url.value;
 const avatarPreview=byId('avatar-preview'),avatarPlaceholder=byId('avatar-placeholder');
 const coverPreview=byId('cover-upload-preview'),coverPlaceholder=byId('cover-upload-placeholder');
 if(avatar){
  avatarPreview.src=avatar;avatarPreview.hidden=false;avatarPlaceholder.hidden=true;
 }else{
  avatarPreview.removeAttribute('src');avatarPreview.hidden=true;avatarPlaceholder.hidden=false;
 }
 if(cover){
  coverPreview.src=cover;coverPreview.hidden=false;coverPlaceholder.hidden=true;
 }else{
  coverPreview.removeAttribute('src');coverPreview.hidden=true;coverPlaceholder.hidden=false;
 }
 if(typeof syncLivePreview==='function')syncLivePreview();
 if(typeof updatePresetSelection==='function')updatePresetSelection();
 if(typeof updateBioCount==='function')updateBioCount();
}
function discardChanges(){
 if(!loaded||!baseline||saving)return;
 const changed=Object.keys(snapshot()).some(k=>snapshot()[k]!==baseline[k]);
 if(!changed&&!layoutDirty)return;
 if(!confirm('Discard the unpublished profile and layout changes? Your last saved profile will be restored.'))return;
 for(const name of names){
  const element=form.elements[name];if(!element)continue;
  if(name==='show_activity')element.checked=!!baseline[name];
  else element.value=baseline[name]??'';
 }
 const avatar=avatarFile,cover=coverFile;
 if(avatar)avatar.value='';
 if(cover){
  cover.value='';
  delete cover._compressedBlob;
  if(cover._previewUrl){URL.revokeObjectURL(cover._previewUrl);delete cover._previewUrl}
 }
 if(layoutDirty)document.dispatchEvent(new CustomEvent('kf:profile-reset-layout'));
 layoutDirty=false;error=false;edited=false;restorePreview();
 status.textContent='Draft discarded. Your published profile is unchanged.';
 update();
}
discard.addEventListener('click',discardChanges);
for(const eventName of ['input','change'])form.addEventListener(eventName,()=>{
 if(!loaded||saving)return;
 error=false;edited=true;update();
});
document.addEventListener('kf:profile-input',()=>{edited=true;error=false;update()});
document.addEventListener('kf:layout-changed',()=>{layoutDirty=true;edited=true;error=false;update()});
document.addEventListener('kf:layout-reset',()=>{layoutDirty=false;update()});
document.addEventListener('kf:layout-saved',()=>{layoutDirty=false;update()});
document.addEventListener('kf:profile-loaded',e=>publishBaseline(e.detail?.user));
document.addEventListener('kf:profile-details-saved',e=>publishBaseline(e.detail?.user,e.detail?.submitted));
document.addEventListener('kf:profile-saving',()=>{saving=true;error=false;update()});
document.addEventListener('kf:profile-saved',e=>{
 saving=false;error=false;edited=true;
 publishBaseline(e.detail?.user,e.detail?.submitted);
 status.textContent='Profile published. Preview stays available so you can continue editing.';
 update();
});
document.addEventListener('kf:profile-save-error',e=>{
 saving=false;error=true;
 status.textContent=e.detail?.message||'Profile could not be saved.';
 update();
});
document.addEventListener('kf:profile-load-error',e=>{
 error=true;status.textContent=e.detail?.message||'Profile could not be loaded.';
 setIndicator('error','⚠ Profile unavailable');
 summary.textContent='Reload the page to reconnect before editing.';
});
document.addEventListener('kf:profile-process-start',()=>{
 pendingMedia++;
 submit.disabled=true;setIndicator('saving','◌ Preparing image…');summary.textContent='Cropping and compressing your image.';
});
document.addEventListener('kf:profile-process-end',()=>{
 pendingMedia=Math.max(0,pendingMedia-1);
 if(!pendingMedia&&!saving&&loaded)submit.disabled=false;
 update();
});
const shortcuts=()=>{if(lastPublishedUser?.username)view.href='/profile.html?username='+encodeURIComponent(lastPublishedUser.username)};
window.addEventListener('beforeunload',event=>{
 if(!loaded||saving)return;
 const dirty=layoutDirty||!!(baseline&&Object.keys(snapshot()).some(k=>snapshot()[k]!==baseline[k]));
 if(dirty){event.preventDefault();event.returnValue=''}
});
document.addEventListener('keydown',event=>{
 if(!(event.ctrlKey||event.metaKey)||event.altKey||event.key.toLowerCase()!=='s')return;
 event.preventDefault();if(loaded&&!saving&&!pendingMedia&&!submit.disabled)form.requestSubmit();
});
for(const a of selections){
 a.addEventListener('click',()=>{selections.forEach(e=>e.classList.toggle('active',e===a))});
}
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  for(const e of entries){
   if(!e.isIntersecting)continue;
   const next=selections.find(link=>link.getAttribute('href')==='#'+e.target.id);
   if(next){selections.forEach(link=>link.classList.toggle('active',link===next))}
  }
 },{rootMargin:'-14% 0px -65% 0px',threshold:0});
 for(const a of selections){
  const target=document.querySelector(a.getAttribute('href'));
  if(target)observer.observe(target);
 }
}
if(window.__kfProfileStudioUser)publishBaseline(window.__kfProfileStudioUser);
else{update();setIndicator('loading','◌ Loading your profile…')}
shortcuts();
})();
