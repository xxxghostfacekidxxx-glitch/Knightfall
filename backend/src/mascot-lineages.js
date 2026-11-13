/**
 * Knightfall companion affinities and earnable growth, shared as server authority.
 * All forms derive from level and bond already stored in D1. No purchases, client
 * flags, or extra migrations are involved. Five legacy Starborn thresholds remain.
 */
export const PET_AFFINITIES=Object.freeze({
 wildwood:{id:'wildwood',name:'Wildwood',description:'Forest, gardens and living roots'},
 tidal:{id:'tidal',name:'Tidal',description:'Oceans, reefs and deep water'},
 ember:{id:'ember',name:'Ember',description:'Warmth, cinders and flame'},
 dusk:{id:'dusk',name:'Dusk',description:'Moonless streets and hidden paths'},
 spectral:{id:'spectral',name:'Spectral',description:'Ghostlight, memory and the afterlife'},
 stone:{id:'stone',name:'Stone',description:'Mineral, crystal and ancient guardians'},
 storm:{id:'storm',name:'Storm',description:'Thunder, wind and rain'},
 celestial:{id:'celestial',name:'Celestial',description:'Stars, night skies and orbiting worlds'},
 feral:{id:'feral',name:'Feral',description:'Wild creatures, loyalty and mischief'},
 toxic:{id:'toxic',name:'Toxic',description:'Mutagens, alchemy and swamp life'},
 neon:{id:'neon',name:'Neon',description:'Living circuitry and punk electricity'}
});
const groups={
 wildwood:['thornriot','lydibug','chunky-monkey'],
 tidal:['crypt-koi','prismare','crush'],
 ember:['pippa','emberbun','sootsnoot'],
 dusk:['nib','mini-villain','gutterkit'],
 spectral:['glim','rattlepop','casket-pup','boo-thang'],
 stone:['mini-eddie','glittergob','craggle'],
 storm:['volt-imp','rumblefluff'],
 celestial:['moxie','void-sprout'],
 feral:['kiki','minion-mouse','butters','trouble'],
 toxic:['bloop','zuzu'],
 neon:['gravebyte','statichex','skunk-riot']
};
export const SPECIES_AFFINITY=Object.freeze(Object.fromEntries(
 Object.entries(groups).flatMap(([type,ids])=>ids.map(id=>[id,type]))
));
const forms={
 moxie:['Moonwing','Astral Vexwing'],bloop:['Miregill','Abyssal Gillrot'],
 pippa:['Wickgourd','Harvest Hexlord'],nib:['Duskfang','Nocturne Sovereign'],
 glim:['Lantern Wisp','Evershade'],zuzu:['Sludge Reactor','Sludge Colossus'],
 kiki:['Alley Stalker','Rooftop Reign'],emberbun:['Emberbound','Pyreheart'],
 gravebyte:['Signal Warden','Gravebyte Prime'],statichex:['Phasewalker','Statichex Omega'],
 rattlepop:['Coffin Jester','Crypt Carnival King'],thornriot:['Briarback','Elder Thornriot'],
 'volt-imp':['Stormskipper','Thunder Tyrant'],'crypt-koi':['Moonfin','Abyssal Oracle'],
 'casket-pup':['Gravehound','Eternal Watcher'],'void-sprout':['Nightbloom','Astral Rootheart'],
 'minion-mouse':['Tinker Mouse','Minion Mouse: Mastermind'],
 'mini-villain':['Cape Cadet','Supreme Mini Villain'],
 'mini-eddie':['Night Guard','Everguard Eddie'],
 gutterkit:['Scrap Scout','Alley King'],'chunky-monkey':['Canopy Cruiser','Jungle Heart'],
 'boo-thang':['Moonheart','Boo Thang: Heartlight'],lydibug:['Lanternbug','Lydibloom'],
 sootsnoot:['Ash Digger','Forgeback'],rumblefluff:['Cloudram','Thunderwool'],
 glittergob:['Gem Hoarder','Crowned Glittergob'],craggle:['Stone Sentry','Moonspire Guardian'],
 prismare:['Prism Drifter','Tidal Kaleidoscope'],butters:['Cozy Scout','Hearthkeeper'],
 trouble:['Bottlecap Bandit','Midnight Trickster'],crush:['Reef Rider','Tidebreaker Crush'],
 'skunk-riot':['Backstage Rebel','Riot Headliner']
};
export const GROWTH_FORM_NAMES=Object.freeze(forms);
export function affinityFor(id){
 return PET_AFFINITIES[SPECIES_AFFINITY[id]]||PET_AFFINITIES.feral;
}
export function stagesFor(id,name,signature=null){
 const names=forms[id]||[name+' Awakened',name+' Ascended'];
 return [
  {stage:1,label:'First Form',name,level:1,bond:0},
  {stage:2,label:'Awakened',name:names[0],level:4,bond:100},
  {stage:3,label:'Ascended',name:signature?.name||names[1],level:signature?.level||9,bond:signature?.bond||500}
 ];
}
export function growthFor(id,name,level,bond,signature=null){
 const stages=stagesFor(id,name,signature);
 const current=[...stages].reverse().find(s=>level>=s.level&&bond>=s.bond)||stages[0];
 const next=stages.find(s=>s.stage===current.stage+1);
 const safeProgress=next?Math.max(0,Math.min(99,Math.floor(100*Math.min(level/next.level,bond/next.bond)))):100;
 return {stage:current.stage,max_stage:3,label:current.label,name:current.name,
  stages,next:next?{...next,progress:safeProgress}:null};
}
