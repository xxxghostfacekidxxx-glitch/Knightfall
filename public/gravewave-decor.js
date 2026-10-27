/* Site-wide original Gravewave decorations; presentation-only and privacy-safe. */
(()=>{'use strict';
if(window.__gravewaveDecorLoaded)return;
window.__gravewaveDecorLoaded=true;
const mascots=['moxie','bloop','pippa','nib','glim','zuzu','kiki','emberbun','gravebyte','statichex','rattlepop','thornriot'];
const sprites=['bone-drone','toxic-turret','void-eye','skull-missile','plasma-bolt','hex-flame','cinder-heart','bone-coin','chaos-shield','ghost-key','neon-portal','impact-burst'];
const mascotRoot='/assets/devil-tools/neon-nuisances/',spriteRoot='/assets/arcade/gravewave/';
const sensitive=/\/(?:admin|moderation|account|profile|messages|vault|adult|dating|friends|notifications|devil-tools|die-ary|create-|edit-|settings|checkout|payment|login|register)/i;
const path=location.pathname.toLowerCase();
function img(src){const el=document.createElement('img');el.src=src;el.alt='';el.setAttribute('aria-hidden','true');el.loading='lazy';el.decoding='async';return el}
function mount(){
 const footer=document.getElementById('ashfall-support-footer')||document.querySelector('footer');
 if(footer&&!footer.querySelector('.kf-gravewave-ribbon')){const ribbon=document.createElement('div');ribbon.className='kf-gravewave-ribbon';ribbon.dataset.gravewaveDecor='footer';const seed=[0,4,8,10,2];seed.forEach(i=>ribbon.append(img(mascotRoot+mascots[i]+'.svg')));footer.prepend(ribbon)}
 if(sensitive.test(path))return;
 const main=document.querySelector('main');if(!main)return;
 const title=main.querySelector('h1');if(title&&!main.querySelector('.kf-gravewave-title')){const wrap=document.createElement('div');wrap.className='kf-gravewave-title';wrap.dataset.gravewaveDecor='title';const id=/arcade|game|cartridge/.test(path)?'gravebyte':/community|madhouse/.test(path)?'statichex':/shop|support/.test(path)?'rattlepop':'thornriot';wrap.append(img(mascotRoot+id+'.svg'),img(spriteRoot+(/arcade|game/.test(path)?'plasma-bolt':'cinder-heart')+'.svg'));title.after(wrap)}
 const cards=main.querySelectorAll('.game-card,.arcade-card,.cartridge-cabinet,.cabinet,.af-card,.feature-card');
 for(let i=0;i<Math.min(cards.length,18);i++){const card=cards[i];if(card.querySelector('.kf-gravewave-corner,.gw-panel-mascot'))continue;const style=getComputedStyle(card);if(style.position==='static')card.style.position='relative';const oldStamp=card.querySelector('.chaos-sprite-stamp');if(oldStamp)oldStamp.remove();const deco=img(spriteRoot+sprites[i%sprites.length]+'.svg');deco.className='kf-gravewave-corner';deco.dataset.gravewaveDecor='card';card.append(deco)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();