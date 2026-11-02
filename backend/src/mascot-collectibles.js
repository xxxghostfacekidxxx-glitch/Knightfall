// Server-authoritative Sanctuary catalog. Prices are fixed, never accepted from the browser.
export const PET_MARKET = Object.freeze({
moxie:[350,1],bloop:[350,1],pippa:[350,1],nib:[350,1],glim:[350,1],zuzu:[350,1],kiki:[350,1],emberbun:[350,1],
rattlepop:[750,2],gutterkit:[750,2],"volt-imp":[750,2],"casket-pup":[750,2],"chunky-monkey":[750,2],"boo-thang":[750,2],
"crypt-koi":[1400,3],"void-sprout":[1400,3],"minion-mouse":[1400,3],gravebyte:[1400,3],thornriot:[1400,3],
statichex:[2500,5],"mini-villain":[2500,5],"mini-eddie":[2500,5]
});
const entries=[
["scrap_crown","Scrap Crown","head",450,null],["witch_hat","Midnight Witch Hat","head",550,null],["glitch_horns","Glitch Horns","head",null,299],
["toxic_shades","Toxic Shades","eyes",350,null],["cyber_visor","Cyber Visor","eyes",650,null],["void_eyes","Void Gaze","eyes",null,249],
["spike_collar","Spiked Collar","neck",400,null],["skull_pendant","Skull Pendant","neck",750,null],["royal_chains","Royal Chains","neck",null,199],
["ember_aura","Ember Aura","aura",650,null],["acid_particles","Acid Sparks","aura",900,null],["eclipse_aura","Eclipse Aura","aura",null,399]
];
export const PET_ACCESSORIES = Object.freeze(Object.fromEntries(entries.map(([sku,name,slot,cinders_price,price_cents])=>[sku,Object.freeze({sku,name,slot,cinders_price,price_cents,asset:'/assets/devil-tools/neon-nuisances/accessories/'+sku+'.svg',premium:price_cents!==null})])));
export const MAX_PET_SPECIES=22;
export const petMarketPrice=(species,adoptedCount)=>adoptedCount===0?0:(PET_MARKET[species]?.[0]??null);
export const petUnlockLevel=species=>PET_MARKET[species]?.[1]??null;
