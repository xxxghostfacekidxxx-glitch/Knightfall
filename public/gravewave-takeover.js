/* Site-wide original character takeover. All artwork is local, decorative, and inert. */
(()=>{'use strict';
if(window.__gravewaveTakeoverLoaded)return;
window.__gravewaveTakeoverLoaded=true;
const base='/assets/devil-tools/neon-nuisances/';
const names=['moxie','bloop','pippa','nib','glim','zuzu','kiki','emberbun','gravebyte','statichex','rattlepop','thornriot'];
const src=i=>base+names[((i%names.length)+names.length)%names.length]+'.svg';
const excluded=/\/(?:checkout|payment|vault|settings)/i.test(location.pathname);
const privateForm=/\/(?:messages|account|login|register|reset-password|auth)/i.test(location.pathname);
function mascot(i,cls){const el=document.createElement('img');el.src=src(i);el.alt='';el.setAttribute('aria-hidden','true');el.className=cls;el.loading='lazy';el.decoding='async';return el}
function mount(){
 // Visible, non-interactive character crew on every public site page.
 if(!excluded&&!document.querySelector('.gw-character-crew')){
  const crew=document.createElement('aside');crew.className='gw-character-crew';crew.setAttribute('aria-label','Ash-Fall original mascot characters');
  [0,8,10,11].forEach((i)=>{const figure=document.createElement('span');figure.className='gw-crew-member';figure.append(mascot(i,'gw-crew-art'));crew.append(figure)});
  document.body.append(crew);
 }

 document.body.classList.add('gravewave-everywhere');
 if(!document.querySelector('.gw-ambient')&&!excluded){
  const ambient=document.createElement('div');ambient.className='gw-ambient';ambient.setAttribute('aria-hidden','true');
  [8,9,11].forEach(i=>ambient.append(mascot(i,'')));
  document.body.prepend(ambient);
 }
 // Do not interfere with private forms, editors, or game canvases.
 if(!excluded){
  const main=document.querySelector('main');
  if(main){
   const panels=main.querySelectorAll('.entry-card,.feature-card,.game-card,.arcade-card,.cartridge-cabinet,.cabinet,.af-card,.community-card,.category-card,.topic-card,.shop-card,.panel');
   let count=0;
   for(const panel of panels){
    if(count>=36)break;
    if(panel.closest('dialog,[contenteditable],.game-panel,.play-area,.screen,.chat-messages,.message-list,.messages-thread,.conversation,.composer'))continue;
    if(panel.querySelector('.gw-panel-mascot'))continue;
    if(getComputedStyle(panel).position==='static')panel.style.position='relative';
    panel.append(mascot(count+2,'gw-panel-mascot'));count++;
   }
   const title=main.querySelector('h1');
   if(title&&!title.querySelector('.gw-glitch-mark')&&!title.closest('[contenteditable]'))title.classList.add('gw-glitch-mark');
  }
 }
 if(!excluded&&!privateForm){
  let count=0;
  for(const input of document.querySelectorAll('main input[type="text"],main input[type="search"],main input[type="email"],main input[type="url"]')){
   if(count>=24)break;
   if(input.closest('[contenteditable],dialog,.game-panel,.play-area,.screen,.chat-composer,.message-composer')||input.disabled||input.readOnly)continue;
   input.classList.add('gw-mascot-input');input.style.setProperty('--gw-input-mascot','url("'+src(count+4)+'")');count++;
  }
  for(const area of document.querySelectorAll('main textarea')){
   if(count>=30)break;
   if(area.closest('[contenteditable],dialog,.game-panel,.play-area,.screen,.chat-composer,.message-composer')||area.disabled||area.readOnly)continue;
   area.classList.add('gw-mascot-textarea');area.style.setProperty('--gw-input-mascot','url("'+src(count+4)+'")');count++;
  }
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
