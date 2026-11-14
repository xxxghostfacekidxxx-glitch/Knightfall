/* Knightfall curated cabinet cover art, purely decorative.
 * Canvas previews use the original, independent character atlas and never alter game state.
 */
import {loadKnightfallArt} from '/knightfall-art-runtime.js';

const LOOKS=Object.freeze({
  'cinder-crossing':['bone-raccoon','bone'],
  'marshland-marksman':['grave-raven','moss'],
  'city-of-cinders':['iron-butcher','ember'],
  'not-dead-yet':['hollow-shroud','plum'],
  'monster-mmo':['spectral-wolf','moon'],
  'crypt-smash':['carnival-ghoul','ember'],
  'crypt-pairs':['cursed-cat','bone'],
  'ash-serpent':['antler-cultist','moss'],
  'cinder-gauntlet':['starfall-templar','bronze'],
  'crypt-labyrinth':['chainbound-revenant','plum'],
  'cinder-hopper':['iron-wraith-ranger','moon'],
  'cinder-maze':['plague-gunslinger','moss'],
  'mutation-merge':['thorn-queen','plum'],
  'roads-of-cinder':['moonbound-oracle','bronze'],
  'cinder-chess':['crimson-void-knight','ember'],
  'cinder-archer':['marsh-hunter','bone']
});
const PALETTE=Object.freeze({
  bone:['#28232c','#161824','#c8b6ab'],
  moss:['#1d322b','#111a20','#8ca68a'],
  ember:['#3a2426','#161321','#cba48c'],
  plum:['#35253c','#181423','#b9a0c8'],
  moon:['#26324a','#131923','#9daeca'],
  bronze:['#352c25','#17181e','#d4b783']
});
const BADGES={bone:'star-key',moss:'poison-crystal',ember:'blood-eclipse',plum:'chained-heart',moon:'ashen-crescent',bronze:'grave-chest'};
function makePortrait(art,card,sprite,theme,relicSheet){
  const canvas=document.createElement('canvas');
  canvas.width=352;canvas.height=148;canvas.className='kf-arcade-cover';
  canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const [hi,lo,accent]=PALETTE[theme]||PALETTE.bone;
  const fill=ctx.createLinearGradient(0,0,352,148);
  fill.addColorStop(0,hi);fill.addColorStop(1,lo);
  ctx.fillStyle=fill;ctx.fillRect(0,0,352,148);
  ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle=accent;ctx.lineWidth=1;
  for(let i=0;i<7;i++){
    const x=i*74-18;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-45,148);ctx.stroke();
  }
  ctx.restore();
  const aura=ctx.createRadialGradient(255,60,5,255,60,115);
  aura.addColorStop(0,accent+'6b');aura.addColorStop(1,accent+'00');
  ctx.fillStyle=aura;ctx.fillRect(110,0,242,148);
  ctx.fillStyle=accent;ctx.globalAlpha=.6;ctx.fillRect(0,145,352,3);ctx.globalAlpha=1;
  const definition=art.manifest.sprites.find(entry=>entry.id===sprite);
  if(!definition)return;
  const source=definition.atlasRect,ratio=source.width/source.height;
  const height=132,width=Math.min(230,height*ratio);
  const x=256-width/2,y=13+(132-height);
  art.draw(ctx,sprite,x,y,width,height);
  // Relic badges make the second original collection useful across the arcade.
  const relic=art.manifest.relics?.find(item=>item.id===BADGES[theme]);
  if(relicSheet?.naturalWidth&&relic?.atlasRect){
    const r=relic.atlasRect;
    ctx.save();ctx.fillStyle='#09080eaa';
    ctx.beginPath();ctx.roundRect(12,24,66,75,13);ctx.fill();
    ctx.drawImage(relicSheet,r.x,r.y,r.width,r.height,17,28,56,67);
    ctx.restore();
  }
  const label=document.createElement('span');label.className='kf-arcade-cover-label';label.textContent='KNIGHTFALL ORIGINAL ART';
  const wrap=document.createElement('div');wrap.className='kf-arcade-cover-frame';
  wrap.append(canvas,label);
  const heading=card.querySelector('h3,h2');
  if(heading)heading.before(wrap);
  else card.prepend(wrap);
}
async function init(){
  const shelf=document.getElementById('game-shelf');if(!shelf)return;
  const candidates=Object.entries(LOOKS).map(([id,look])=>({
    card:shelf.querySelector('.cartridge-cabinet[data-game-id="'+id+'"]'),look
  })).filter(({card})=>card&&!card.querySelector('.kf-arcade-cover-frame'));
  if(!candidates.length)return;
  try{
    const art=await loadKnightfallArt();
    const relicSheet=new Image();relicSheet.decoding='async';
    const relicReady=new Promise(resolve=>{
      relicSheet.onload=()=>resolve(relicSheet);
      relicSheet.onerror=()=>resolve(null);
      relicSheet.src='/assets/knightfall/relics-and-icons.png';
    });
    const relic=await relicReady;
    for(const {card,look} of candidates){
      if(!art.has(look[0]))continue;
      makePortrait(art,card,...look,relic);
    }
  }catch(error){
    console.warn('Knightfall cabinet cover artwork unavailable; original cards retained.',String(error));
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
