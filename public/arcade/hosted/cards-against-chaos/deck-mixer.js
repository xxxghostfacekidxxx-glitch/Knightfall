// Shared mixer used by the local arcade and server-authoritative online matches.
// Chosen themes supply 75% of each type of card draw. Multiple themes share that 75% evenly.
// The base deck always supplies the remaining 25%, even if several packs are active.
export const THEME_DRAW_SHARE=0.75;

function shuffledIndices(length){
 const a=Array.from({length},(_,i)=>i);
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 return a;
}
export function validatedPacks(ids,catalog){
 if(ids===undefined||ids===null)return [];
 if(!Array.isArray(ids)||ids.length>12||ids.some(id=>typeof id!=="string"||!Object.hasOwn(catalog,id)))
  throw new Error("Unknown card expansion.");
 if(new Set(ids).size!==ids.length)throw new Error("Duplicate card expansion.");
 return [...ids];
}
export function drawThemedCard(state,kind,base,catalog){
 if(kind!=="black"&&kind!=="white")throw new Error("Invalid card type");
 const packs=(state.active_packs||[]).filter(id=>Object.hasOwn(catalog,id));
 let key=kind,source=base;
 if(packs.length&&Math.random()<THEME_DRAW_SHARE){
  const id=packs[Math.floor(Math.random()*packs.length)];
  if(catalog[id]?.[kind]?.length){key=kind+":"+id;source=catalog[id][kind];}
 }
 if(!Array.isArray(state.decks[key]))state.decks[key]=[];
 if(!state.decks[key].length)state.decks[key]=shuffledIndices(source.length);
 const next=state.decks[key].pop();
 // Original-release saved matches use card strings; new decks use compact numeric indices.
 return Number.isInteger(next)?source[next]:next;
}
export function putBackThemedCard(state,kind,card,base,catalog){
 for(const id of state.active_packs||[]){
  const source=catalog[id]?.[kind]||[];
  const position=source.indexOf(card);
  if(position>=0){
   const key=kind+":"+id;
   if(!Array.isArray(state.decks[key]))state.decks[key]=[];
   state.decks[key].push(position);
   return;
  }
 }
 const position=base.indexOf(card);
 // Preserve unknown historical cards in their old string representation.
 state.decks[kind].push(position>=0?position:card);
}
