/* Tamagotchi-style companion reactions + Misfit/avatar sanctuary pairing. */
(()=>{'use strict';
const API='https://api.ash-fall.com';
const life={lastAction:null,confirmed:null,expiry:null};
const speciesLines={
 moxie:'I found a moonlit shortcut. Want to see?',
 bloop:'I discovered a puddle that is probably a portal.',
 pippa:'I saved you the best pumpkin seed.',
 nib:'I have a secret. It is a very good secret.',
 glim:'Your little light is safe with me.',
 zuzu:'I tested a button. It made a different button.',
 kiki:'I checked the rooftops. We are still the coolest.',
 emberbun:'Race you to the next sunrise.',
 gravebyte:'I ran the numbers. You are my favorite variable.',
 statichex:'Your signal is the one I always tune in to.',
 rattlepop:'I hid a surprise. It is probably not haunted.',
 thornriot:'We grew through worse weather than this.',
 'volt-imp':'I have enough energy for both of us. Probably.',
 'crypt-koi':'The quiet is nicer when you are here.',
 'casket-pup':'I saved you the safest spot beside me.',
 'void-sprout':'Even the dark has room for new things.',
 'minion-mouse':'I have devised a tiny plan for a huge snack.',
 'mini-villain':'At last, an audience for my extremely small scheme.',
 'mini-eddie':'I am on watch. You can rest.',
 gutterkit:'I found a treasure. It is shiny and slightly sticky.',
 'chunky-monkey':'I made the room more fun. You are welcome.',
 'boo-thang':'I missed you in the most romantic haunting way.'
};
const reactions={
 feed:['Finally, excellent snack timing.','That was delicious. I am filing it under “excellent decisions.”','Snack secured. I have returned to peak menace.'],
 play:['Again! I was just getting warmed up.','That was fun. I am counting it as training.','You make even practice feel like an adventure.'],
 rest:['Wake me when the next adventure starts.','A cozy recharge. I shall dream of snacks.','Thank you. Even little legends need naps.'],
 talk:['I like when you tell me what is going on.','I am listening. Ears, antennae, spooky senses—everything.','I have thoughts too. Most of them involve snacks.'],
 cuddle:['You are my favorite safe place.','I am keeping this moment.','More of this, please.'],
 groom:['Looking sharp. Causing trouble responsibly.','A little polish for a very important menace.','I feel fancy enough to haunt a ballroom.']
};
const moodLines={
 hungry:['My snack radar is making that noise again.','I am thinking about food with impressive focus.'],
 bored:['I have energy and a suspicious lack of plans.','Could we make something happen? Anything mildly chaotic.'],
 sleepy:['My eyelids are staging a tiny rebellion.','I could use a quiet corner and a minute.'],
 radiant:['This is a pretty excellent day to be your companion.','I feel bright enough to cause tasteful trouble.'],
 content:['I like being here with you.','No big plan. Just happy to share the same little corner of the world.']
};
function choose(list,seed){let h=0;for(let i=0;i<String(seed).length;i++)h=(h*31+String(seed).charCodeAt(i))|0;return list[Math.abs(h)%list.length]}
function renderThoughts(detail){
 for(const pet of detail?.pets||[]){
  const card=document.querySelector('.pet-card[data-pet-id="'+Number(pet.id)+'"]');
  if(!card)continue;
  let thought=card.querySelector('.pet-thought');
  if(!thought){thought=document.createElement('p');thought.className='pet-thought';thought.setAttribute('role','status');thought.setAttribute('aria-live','polite');card.querySelector('.pet-personality')?.after(thought)}
  const action=life.confirmed&&life.confirmed.id===Number(pet.id)?life.confirmed.action:null;
  const mood=pet.mood?.id||'content';
  thought.dataset.tone=mood;
  const lines=action?reactions[action]:moodLines[mood]||moodLines.content;
  const unique=speciesLines[pet.species]||'I am glad we found each other.';
  thought.textContent=action?choose(lines,pet.id+action+Math.floor(Date.now()/3000)):choose([...lines,unique],pet.id+mood+new Date().getUTCDay());
  if(action){card.classList.remove('pet-reacted');void card.offsetWidth;card.classList.add('pet-reacted')}
 }
 if(life.confirmed)setTimeout(()=>{life.confirmed=null},2500);
}
function rememberAction(event){
 const b=event.target.closest('button[data-action]');
 if(!b)return;
 const card=b.closest('.pet-card[data-pet-id]'),action=b.dataset.action;
 if(!card||!['feed','play','rest','interact'].includes(action))return;
 life.lastAction={id:Number(card.dataset.petId),action:action==='interact'?b.dataset.interaction:action};
 const pending=life.lastAction;clearTimeout(life.expiry);life.expiry=setTimeout(()=>{if(life.lastAction===pending)life.lastAction=null},15000);
}
document.addEventListener('click',rememberAction,true);
document.addEventListener('sanctuary-changed',event=>{
 if(event.detail?.source==='pets'&&life.lastAction){clearTimeout(life.expiry);life.confirmed=life.lastAction;life.lastAction=null}
});
document.addEventListener('sanctuary-rendered',event=>renderThoughts(event.detail));

async function addMisfitCard(){
 const header=document.querySelector('.sanctuary-header');
 const kit=window.KnightfallMisfitAvatars;
 if(!header||!kit)return;
 try{
  const response=await fetch(API+'/api/avatars/me',{credentials:'include',cache:'no-store'});
  if(!response.ok)return;
  const data=await response.json(),active=(data.slots||[]).find(slot=>slot.is_active&&slot.avatar);
  const card=document.createElement('section');card.className='sanctuary-owner-misfit';card.setAttribute('aria-label','Your Misfit and companion collection');
  const art=document.createElement('div');art.className='sanctuary-owner-misfit-art';
  art.innerHTML=kit.render(active?kit.safeAvatar(active.avatar):kit.defaults);
  const copy=document.createElement('div');copy.className='sanctuary-owner-misfit-copy';
  const title=document.createElement('strong');title.textContent=active?(active.name||'Your Misfit')+' is on sanctuary duty':'Your companions need a Misfit keeper';
  const p=document.createElement('p');p.textContent=active?'Your Misfit travels with your crew. Their look is part of your Sanctuary.':'Create a big-headed little menace, then bring them along to meet your pets.';
  copy.append(title,p);
  const link=document.createElement('a');link.href='/avatar-studio.html';link.textContent=active?'Edit your Misfit':'Make a Misfit';
  card.append(art,copy,link);header.after(card);
 }catch{}
}
addMisfitCard();
})();