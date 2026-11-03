/* Sanctuary Passport achievements, earned only from server-authoritative D1 milestones. */
(()=>{'use strict';
const root=document.getElementById('sanctuary-passport'),summary=document.getElementById('passport-summary'),
 grid=document.getElementById('passport-badges'),status=document.getElementById('passport-status');
if(!root||!summary||!grid||!status)return;
const API='https://api.ash-fall.com',iconPrefix='/assets/devil-tools/neon-nuisances/badges/';
let badges=[],working=false,guest=false;
const el=(tag,cls,content)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(content!==undefined)node.textContent=String(content);return node};
async function api(path,init={}){
 const response=await fetch(API+path,{credentials:'include',cache:'no-store',...init,headers:{'content-type':'application/json',...(init.headers||{})}});
 const result=await response.json().catch(()=>({}));
 if(!response.ok){const e=new Error(result.error||'Passport unavailable');e.code=response.status;throw e}
 return result;
}
function render(){
 grid.replaceChildren();
 const claimed=badges.filter(x=>x.claimed).length;
 summary.textContent=guest?'Sign in to earn badges':claimed+' / '+badges.length+' milestones claimed';
 if(guest){grid.append(el('p','pet-empty','Sign in to earn collection badges, show medals on your profile, and claim Cinders for real milestones.'));return}
 for(const badge of badges){
  const card=el('article','passport-badge'+(badge.claimed?' claimed':badge.unlocked?' unlocked':''));
  card.dataset.badgeId=badge.id;
  const icon=el('div','passport-badge-image'),img=el('img');
  img.src=iconPrefix+badge.id+'.svg?v=20261102-passport1';img.alt=badge.title;img.loading='lazy';
  icon.append(img);card.append(icon);
  const title=el('strong','',badge.title);card.append(title,el('p','',badge.description));
  const target=Math.max(1,Number(badge.target)),progress=Math.max(0,Math.min(target,Number(badge.progress)||0));
  const meta=el('div','passport-badge-meta');
  meta.append(el('span','',Math.min(progress,target)+' / '+target),
    el('span','',badge.claimed?'✓ Reward claimed':'✦ '+Number(badge.reward_cinders).toLocaleString()+' Cinders'));
  card.append(meta);
  const track=el('div','passport-track'),fill=el('div','passport-fill');
  fill.style.width=Math.round(progress/target*100)+'%';track.append(fill);card.append(track);
  const button=el('button','passport-claim',badge.claimed?'✓ Collected':badge.unlocked?'Claim milestone':'Still locked');
  button.type='button';button.dataset.action='claim';button.disabled=working||badge.claimed||!badge.unlocked;
  card.append(button);grid.append(card);
 }
}
async function refresh(){
 try{
  const data=await api('/api/mascot-pets/passport');
  badges=data.badges||[];guest=false;render();
 }catch(e){
  guest=e.code===401;
  if(guest){badges=[];render()}
  else status.textContent='Passport unavailable: '+e.message;
 }
}
grid.addEventListener('click',async event=>{
 const button=event.target.closest('button[data-action="claim"]');
 if(!button||working||button.disabled)return;
 const id=button.closest('[data-badge-id]')?.dataset.badgeId;
 if(!/^[a-z_]{3,48}$/.test(id||''))return;
 working=true;render();
 try{
  const data=await api('/api/mascot-pets/passport/'+id+'/claim',{method:'POST',body:'{}'});
  badges=data.passport?.badges||badges;
  status.textContent=data.message||'Passport milestone earned!';
  document.dispatchEvent(new CustomEvent('sanctuary-changed',{detail:{source:'passport'}}));
 }catch(e){status.textContent=e.message}
 finally{working=false;render()}
});
document.addEventListener('sanctuary-changed',event=>{
 if(event.detail?.source==='passport')return;
 void refresh();
});
void refresh();
})();