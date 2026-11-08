/**
 * Four original species-family trials, deterministic challenge metadata.
 * Client outcomes are entertainment only; pet-care rewards remain server-side.
 */
export const SPECIES_TRIALS=Object.freeze({
 moxie:['runes','Moonlit Moth Runes','moth'],bloop:['catch','Gillrot’s Toxic Drops','axolotl'],
 pippa:['memory','Hexgourd’s Harvest Memory','pumpkin'],nib:['dodge','Nocturnib Night Flight','bat'],
 glim:['memory','Cryptglow Grave Memory','ghost'],zuzu:['catch','Sludgebyte Slime Harvest','slime'],
 kiki:['dodge','Riotpaws Rooftop Dash','cat'],emberbun:['dodge','Cinderfang Ember Sprint','rabbit'],
 gravebyte:['runes','Gravebyte Frequency Code','robot'],statichex:['runes','Statichex Signal Cipher','alien'],
 rattlepop:['memory','Rattlepop Coffin Cards','ghoul'],thornriot:['dodge','Thornriot Vinestrike','cyclops'],
 'volt-imp':['catch','Volt Imp Spark Collector','imp'],
 'crypt-koi':['catch','Crypt Koi Spirit Current','koi'],
 'casket-pup':['memory','Casket Pup Bone Hunt','pup'],
 'void-sprout':['runes','Void Sprout Eclipse Runes','sprout'],
 'minion-mouse':['memory','Minion Mouse Tunnel Tiles','mouse'],
 'mini-villain':['runes','Mini Villain Evil Code','villain'],
 'mini-eddie':['dodge','The Eddie Grave Guard','guardian'],
 gutterkit:['dodge','Gutterkit Alley Escape','cat'],
 'chunky-monkey':['catch','Chunky Monkey Jungle Catch','monkey'],
 'boo-thang':['memory','Boo Thang Haunted Hearts','ghost'],
 'lydibug':['runes','Lydibug Starlight Circuit','beetle'],
 'sootsnoot':['catch','Sootsnoot Ember Burrow','badger'],
 'rumblefluff':['dodge','Rumblefluff Thunder Roll','lamb'],
 'glittergob':['memory','Glittergob Crystal Cache','goblin'],
 'craggle':['dodge','Craggle Moonstone Climb','gargoyle'],
 'prismare':['memory','Prismare Prism Tide','jelly'],
 'butters':['memory','Butters’ Cozy Scarf Search','ferret'],
 'trouble':['catch','Trouble’s Raccoon Loot Dash','raccoon'],
 crush:['dodge','Crush’s Reef Run','turtle'],
 'skunk-riot':['dodge','Skunk Riot’s Backstage Blitz','skunk']
});
export const TRIAL_TYPES=Object.freeze(['catch','memory','runes','dodge']);
export function challengeFor(species,level=1){
 const entry=SPECIES_TRIALS[species];
 if(!entry)return null;
 const lvl=Math.max(1,Math.min(20,Math.floor(Number(level)||1)));
 return {species,mode:entry[0],title:entry[1],family:entry[2],
  level:lvl,
  target:entry[0]==='catch'?8+Math.min(6,Math.floor(lvl/2)):
   entry[0]==='dodge'?12+Math.min(8,Math.floor(lvl/2)):
   entry[0]==='runes'?3+Math.min(3,Math.floor(lvl/3)):6+Math.min(2,Math.floor(lvl/4)),
  time_limit:entry[0]==='runes'?35:entry[0]==='memory'?65:35};
}
export const RUNES=Object.freeze(['✦','◆','☾','✸']);
export const MEMORY_SYMBOLS=Object.freeze(['☠','✦','☾','♠','◆','♥','♣','✸','☯','♜']);
export function seededRng(seed){
 let s=(Number(seed)>>>0)||0x9e3779b9;
 return ()=>{
  s=(Math.imul(1664525,s)+1013904223)>>>0;
  return s/4294967296;
 };
}
export function shuffle(values,rng=Math.random){
 const a=[...values];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(rng()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
export function memoryDeck(pairs=6,rng=Math.random){
 const n=Math.max(2,Math.min(MEMORY_SYMBOLS.length,Math.floor(Number(pairs)||6)));
 const values=MEMORY_SYMBOLS.slice(0,n);
 return shuffle([...values,...values],rng).map((symbol,index)=>({index,symbol}));
}
export function runeSequence(length=4,rng=Math.random){
 return Array.from({length:Math.max(2,Math.min(9,length))},()=>Math.floor(rng()*RUNES.length));
}
