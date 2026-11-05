// Playable original species activities. Every pet has a unique quest title and a
// challenge archetype. Scores are local display only; rewards use existing care API.
export const CHALLENGE_MODES=Object.freeze({
 echo:{name:'Echo Runes',description:'Remember and repeat the growing rune sequence.',win:'Complete four sequences.'},
 hunt:{name:'Shadow Hunt',description:'Catch twelve wandering wisps before your timer expires.',win:'Catch twelve wisps in 30 seconds.'},
 pairs:{name:'Crypt Pairs',description:'Reveal and match six pairs of glowing sigils.',win:'Find all six pairs.'},
 circuit:{name:'Cursed Circuit',description:'Clear the corrupted neon circuit by toggling adjacent cells.',win:'Turn off every active tile.'}
});
const characters=[
['moxie','echo','Moonmoth Resonance','#c6ff45'],['bloop','circuit','Gillrot Toxic Circuit','#79ffe7'],
['pippa','pairs','Pumpkin Crypt Pairs','#ff55d8'],['nib','hunt','Nocturnib Night Hunt','#b78cff'],
['glim','echo','Cryptglow Echo Lanterns','#79ffe7'],['zuzu','circuit','Sludgebyte Acid Grid','#c6ff45'],
['kiki','hunt','Riotpaws Rooftop Chase','#ff55d8'],['emberbun','pairs','Cinderfang Ember Twins','#ff9655'],
['gravebyte','circuit','Gravebyte Signal Repair','#79ffe7'],['statichex','echo','Statichex Codebreaker','#c6ff45'],
['rattlepop','pairs','Rattlepop Coffin Doubles','#ff55d8'],['thornriot','hunt','Thornriot Briar Sweep','#c6ff45'],
['volt-imp','circuit','Volt Imp Power Surge','#ff55d8'],['crypt-koi','echo','Crypt Koi Spirit Ripples','#79ffe7'],
['casket-pup','hunt','Casket Pup Graveyard Sniff','#c6ff45'],['void-sprout','pairs','Void Sprout Seed Twins','#b78cff'],
['minion-mouse','hunt','Minion Mouse Tunnel Dash','#79ffe7'],['mini-villain','circuit','Mini Villain Trap Console','#ff55d8'],
['mini-eddie','pairs','The Eddie Bone Match','#c6ff45'],['gutterkit','hunt','Gutterkit Alley Sweep','#ff55d8'],
['chunky-monkey','echo','Chunky Monkey Rhythm Run','#c6ff45'],['boo-thang','pairs','Boo Thang Haunted Hearts','#79ffe7'],
['lydibug','echo','Lydibug Starlight Sequence','#c6ff45'],['sootsnoot','hunt','Sootsnoot Ash Hunt','#ff55d8'],
['rumblefluff','echo','Rumblefluff Thunder Choir','#79ffe7'],['glittergob','pairs','Glittergob Gems','#ff55d8'],
['craggle','circuit','Craggle Moonstone Switch','#c6ff45'],['prismare','pairs','Prismare Color Twins','#79ffe7'],
['butters','pairs','Butters Cozy Scarf Pairs','#b78cff'],['trouble','hunt','Trouble Moonlit Loot','#c6ff45'],
['skunk-riot','hunt','Skunk Riot Stage Dive','#ff55d8']
];
export const SPECIES_CHALLENGES=Object.freeze(Object.fromEntries(characters.map(([id,mode,title,color])=>[id,Object.freeze({
 id,mode,title,color,portrait:'/assets/devil-tools/neon-nuisances/portraits/'+id+'.svg',
 ...CHALLENGE_MODES[mode]
})])));
