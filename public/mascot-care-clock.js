/* Relative server cooldowns become display deadlines. The Worker authorizes every action. */
(() => {
 'use strict';
 const deadlines = new WeakMap();
 // These pets have a single illustrated idle pose. CSS still animates their reactions.
 const idleOnly = new Set(['lydibug','sootsnoot','rumblefluff','glittergob','craggle','prismare']);
 function poseAsset(source,pose) {
  const match=typeof source==='string'&&source.match(/\/([a-z0-9-]+)-idle\.svg(?:\?|$)/);
  return match&&!idleOnly.has(match[1])&&['bounce','blink','mischief'].includes(pose)
   ?source.replace('-idle.svg','-'+pose+'.svg'):source;
 }
 const actions = {feed:'hunger',play:'joy',rest:'energy'};
 function remember(pet,now=Date.now()) {
  if (pet && !deadlines.has(pet)) deadlines.set(pet,Object.fromEntries(
   Object.entries({...pet.next_care,...pet.next_interaction}).map(([action,delay])=>[action,now+Math.max(0,Number(delay)||0)])
  ));
 }
 function remaining(pet,action,now=Date.now()) {
  remember(pet,now);
  return Math.max(0,(deadlines.get(pet)?.[action]||0)-now);
 }
 function label(delay) {
  const seconds=Math.ceil(delay/1000);
  return seconds<60?seconds+'s':Math.floor(seconds/60)+'m '+String(seconds%60).padStart(2,'0')+'s';
 }
 function recommended(pet) {
  return Object.keys(actions).filter(action=>!remaining(pet,action)&&Number(pet.vitals?.[actions[action]]??90)<65)
   .sort((a,b)=>pet.vitals[actions[a]]-pet.vitals[actions[b]])[0]||null;
 }
 window.KnightfallPetCare={remember,remaining,label,recommended,poseAsset};
})();
