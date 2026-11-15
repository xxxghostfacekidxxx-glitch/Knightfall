/* Knightfall Misfit: HumanForge Forge2D v0.8.1, MIT. Production single renderer. */
(()=>{'use strict';
const defaults={"skin":"peach","face_shape":"round","hair":"shag","hair_color":"ink","eyes":"doe","eye_color":"violet","brow_style":"soft","eye_glimmer":"none","expression":"smile","face_mark":"freckles","piercing":"none","outfit":"hoodie","outfit_color":"plum","headwear":"none","eyewear":"none","neckwear":"spike_choker","aura":"none","accessory":"none","background":"void","pattern":"sparkles","ear_style":"human","nose":"button","facial_hair":"none","makeup":"none","tattoo":"none","hair_highlight":"none","outfit_patch":"none"};
const choices={"skin":["porcelain","peach","honey","olive","cocoa","violet","frost","ashen","infernal"],"face_shape":["round","soft_square","heart_face","long","angular","oval"],"hair":["shag","spikes","bob","mohawk","horns","buns","flop","wolfcut","coils","braids","long_messy","buzzcut","slickback","undercut","waves","locs"],"hair_color":["ink","plum","pink","acid","silver","copper","blue","white","crimson","teal"],"eyes":["doe","sleepy","mischief","star","spiral","cat","cyber","hollow"],"eye_color":["violet","green","blue","pink","gold","red","ice","amber"],"brow_style":["none","soft","raised","bold","sleepy"],"eye_glimmer":["none","star","double","heart"],"expression":["smile","grin","pout","fang","frown","tongue","smirk","snarl"],"face_mark":["none","freckles","stars","stitches","lightning","heart","scar","runes"],"piercing":["none","septum","brow","lip","ear","nose"],"outfit":["hoodie","jacket","overalls","dress","sweater","cape","armor","punk","techwear"],"outfit_color":["plum","pink","acid","silver","copper","blue","black","red","teal","gold"],"headwear":["none","witch_hat","tiara","antenna","headphones","flower","spiked_cap"],"eyewear":["none","star_shades","round_specs","visor","monocle","eyepatch","cyber_lens"],"neckwear":["none","spike_choker","chain","bandana","scarf","pendant"],"aura":["none","ghost_flames","spark_ring","glow","moon","lightning"],"accessory":["none","horns","halo","bow","beanie","crown","bandage","safety_pin"],"background":["void","bubblegum","toxic","gravewave","ember","lavender","sky","eclipse","neon_city","storm"],"pattern":["none","sparkles","static","bats","hearts","runes","shards"],"nose":["button","sharp","hooked","minimal"],"facial_hair":["none","stubble","mustache","goatee","full_beard"],"makeup":["none","smoky","winged","corpse","glitter"],"tattoo":["none","teardrop","neon_sigil","cracks","serpent"],"hair_highlight":["none","pink","acid","silver","blue","crimson","teal"],"outfit_patch":["none","skull","heart","lightning","cinder"],"ear_style":["human","elf","bat","cyber","demon"]};
const palettes={"skin":{"porcelain":"#f8dbe0","peach":"#efb28f","honey":"#c98258","olive":"#9b7655","cocoa":"#704938","violet":"#b997d2","frost":"#d5e8f0","ashen":"#9895aa","infernal":"#a14858"},"hair_color":{"ink":"#20182a","plum":"#71366e","pink":"#ff55d8","acid":"#a8ec42","silver":"#d9d4e3","copper":"#c66d45","blue":"#63b7ed","white":"#f6eef1","crimson":"#d53e65","teal":"#3bd0c7"},"background":{"void":"#171021","bubblegum":"#54294f","toxic":"#24391e","gravewave":"#16403f","ember":"#4a241c","lavender":"#36264d","sky":"#20364c","eclipse":"#101423","neon_city":"#22213b","storm":"#1b263d"},"outfit_color":{"plum":"#733b86","pink":"#be3c92","acid":"#557833","silver":"#7a788d","copper":"#a94f39","blue":"#315c87","black":"#292532","red":"#922c45","teal":"#167b84","gold":"#b58c35"},"eye_color":{"violet":"#8e56c7","green":"#53b65b","blue":"#4c9fea","pink":"#ec5ab7","gold":"#d2a83e","red":"#dc455e","ice":"#a3f6ff","amber":"#ed9938"}};

const safeAvatar=(input={})=>{const obj={...defaults};for(const k of Object.keys(defaults))if(choices[k]?.includes(input?.[k]))obj[k]=input[k];return obj;};
const from=(mapping,key,fallback)=>Object.prototype.hasOwnProperty.call(mapping,key)?mapping[key]:fallback;
const colors=(group,value,fallback)=>palettes[group]?.[value]||fallback;
const skins={porcelain:'porcelain',peach:'ivory',honey:'tan',olive:'medium',cocoa:'deep',violet:'porcelain',frost:'fair',ashen:'medium',infernal:'brown'};
const faces={round:'round',soft_square:'square',heart_face:'heart',long:'long',angular:'diamond',oval:'oval'};
const eyes={doe:'doe',sleepy:'hooded',mischief:'upturned',star:'wide',spiral:'wide',cat:'cat',cyber:'mono',hollow:'hooded'};
const brows={none:'thin',soft:'soft',raised:'feather',bold:'bold',sleepy:'straight'};
const noses={button:'button',sharp:'slim',hooked:'broad',minimal:'soft'};
const mouths={smile:'balanced',grin:'wide',pout:'full',fang:'wide',frown:'thin',tongue:'wide',smirk:'balanced',snarl:'wide'};
const expressions={smile:'happy',grin:'excited',pout:'thoughtful',fang:'confident',frown:'sad',tongue:'excited',smirk:'confident',snarl:'confident'};
const hairStyles={shag:'wavy-medium',spikes:'wavy-bob',bob:'bob-fringe',mohawk:'wavy-bob',horns:'wavy-medium',buns:'curly-medium',flop:'long-side',wolfcut:'wavy-medium',coils:'curly-long',braids:'long-center',long_messy:'wavy-long',buzzcut:'bob-fringe',slickback:'medium-straight',undercut:'bob-fringe',waves:'wavy-long',locs:'curly-long'};
const tops={hoodie:'hoodie',jacket:'tee',overalls:'long-sleeve',dress:'tee',sweater:'sweater',cape:'long-sleeve',armor:'turtleneck',punk:'crop-tee',techwear:'long-sleeve'};
const outers={hoodie:'none',jacket:'denim-jacket',overalls:'none',dress:'none',sweater:'none',cape:'long-coat',armor:'blazer',punk:'bomber',techwear:'puffer-vest'};
const headwear={none:'none',witch_hat:'beret',tiara:'none',antenna:'none',headphones:'none',flower:'none',spiked_cap:'cap'};
const glasses={none:'none',star_shades:'round-sun',round_specs:'round',visor:'aviator',monocle:'round',eyepatch:'none',cyber_lens:'cat-sun'};
const neckwear={none:'none',spike_choker:'choker',chain:'chain',bandana:'none',scarf:'none',pendant:'pendant'};
const palettesBg={void:['#0a0b1b','#362440'],bubblegum:['#2c1534','#744575'],toxic:['#0d211c','#38644a'],gravewave:['#0a2329','#315b5f'],ember:['#26131c','#78463e'],lavender:['#19152b','#5a4581'],sky:['#0b1c32','#37628a'],eclipse:['#0a0a16','#49374b'],neon_city:['#11142c','#353f67'],storm:['#091b2d','#365067']};
let forge=null,sequence=0;
const ready=import('https://esm.sh/humanforge@0.8.1/forge2d?bundle').then(module=>{
 if(typeof module.renderAvatarSvg!=='function'||!module.DEFAULT_CONFIG)throw Error('Forge2D library unavailable');
 forge=module;return module;
});
function toForge(value={}){
 if(!forge)throw Error('Forge2D not ready; await KnightfallMisfitAvatars.ready');
 const a=safeAvatar(value),d=forge.DEFAULT_CONFIG;
 const primary=colors('outfit_color',a.outfit_color,'#3b3149');
 const highlight={pink:'#ff55d8',acid:'#c6ff45',silver:'#d9d4e3',blue:'#4c9fea',crimson:'#d53e65',teal:'#3bd0c7'}[a.hair_highlight]||null;
 return {...d,
  face:{...d.face,shape:from(faces,a.face_shape,'oval'),skin:from(skins,a.skin,'medium'),
   eyes:from(eyes,a.eyes,'almond'),eyeColor:colors('eye_color',a.eye_color,'#7a4a26'),
   brows:from(brows,a.brow_style,'soft'),nose:from(noses,a.nose,'button'),
   mouth:from(mouths,a.expression,'balanced'),lipColor:a.expression==='pout'?'#bb5c82':'#99576c',
   freckles:a.face_mark==='freckles'?2:a.face_mark==='stars'?1:0,
   cheeks:a.makeup==='glitter'?2:1,eyeshadow:a.makeup==='none'?'#00000000':a.makeup==='glitter'?'#a157a0':'#312538',
   mole:a.face_mark==='heart'?'cheek':'none',lashes:a.eyes==='cat'||a.makeup!=='none'},
  hair:{...d.hair,style:from(hairStyles,a.hair,'wavy-medium'),color:colors('hair_color',a.hair_color,'#20182a'),highlight,highlightStyle:'streaks'},
  headwear:{...d.headwear,style:from(headwear,a.headwear,'none'),color:primary},
  outfit:{...d.outfit,top:from(tops,a.outfit,'tee'),topColor:primary,
   outer:from(outers,a.outfit,'none'),outerColor:a.outfit==='jacket'?'#25232f':primary,
   dress:a.outfit==='dress'?'shirt-dress':'none',dressColor:primary,
   bottom:a.outfit==='punk'?'skinny-jeans':a.outfit==='techwear'?'joggers':'straight-jeans',
   bottomColor:a.outfit==='overalls'?primary:'#292934',
   shoes:a.outfit==='armor'?'knee-boots':a.outfit==='punk'?'chunky-sneakers':'chelsea-boots',shoesColor:'#1b1923'},
  accessories:{...d.accessories,glasses:from(glasses,a.eyewear,'none'),
   glassesColor:a.eyewear==='cyber_lens'?'#70f4e2':'#302935',
   earrings:a.piercing==='ear'?'stud':a.piercing==='brow'?'huggie':'none',metal:'#c9d2dd',
   necklace:from(neckwear,a.neckwear,'none'),
   scarf:a.neckwear==='scarf'?'chunky':a.neckwear==='bandana'?'bandana':'none',
   bag:a.accessory==='safety_pin'?'crossbody':'none',
   hairAccessory:a.headwear==='flower'||a.accessory==='bow'?'flower':a.accessory==='bandage'?'headband':'none'},
  expression:from(expressions,a.expression,'neutral'),
  pose:a.expression==='fang'?'crossed':a.expression==='tongue'?'wave':'hip'
 };
}
function theme(a,uid){
 const [dark,light]=palettesBg[a.background]||palettesBg.void;
 const accent=a.background==='toxic'?'#c6ff62':a.background==='gravewave'?'#7feae7':'#f58fcf';
 const defs='<defs><linearGradient id="'+uid+'-bg" x1="0" y1="0" x2="0.8" y2="1"><stop stop-color="'+dark+'"/><stop offset="1" stop-color="'+light+'"/></linearGradient></defs>';
 let back=defs+'<rect width="400" height="700" fill="url(#'+uid+'-bg)"/><ellipse cx="200" cy="638" rx="159" ry="30" fill="'+accent+'" opacity=".15"/>';
 if(a.pattern==='sparkles'||a.pattern==='shards')back+='<path d="M70 125l8 20 20 7-20 9-8 20-8-20-20-9 20-7zM337 303l7 15 16 7-16 6-7 16-7-16-16-6 16-7z" fill="'+accent+'" opacity=".38"/>';
 if(a.pattern==='runes'||a.pattern==='static')back+='<g stroke="'+accent+'" opacity=".26" fill="none"><circle cx="200" cy="285" r="178"/><path d="M21 285h358M200 106v360M72 158l256 254"/></g>';
 if(a.pattern==='bats')back+='<path d="M52 139q17-25 36 0 16-20 33-1l-13-5-15 17-15-14-18 9z" fill="'+accent+'" opacity=".37"/>';
 if(a.pattern==='hearts')back+='<path d="M70 236q-35-25 0-40 16-6 21 10 17-26 35-5 17 18-23 45l-13 8z" fill="#e35dba" opacity=".3"/>';
 let front='';
 if(a.ear_style==='demon'||a.accessory==='horns'||a.hair==='horns')front+='<path d="M164 63q-37-23-21-56 14 23 37 42m55 14q37-23 21-56-14 23-37 42" fill="#ad82a1" stroke="#321d33" stroke-width="4"/>';
 if(a.accessory==='halo')front+='<ellipse cx="200" cy="16" rx="50" ry="12" fill="none" stroke="#c6ff62" stroke-width="7"/>';
 if(a.tattoo==='teardrop')front+='<path d="M258 147q-10 18-3 24 16 4 10-10z" fill="#354a67"/>';
 if(a.tattoo==='neon_sigil'||a.tattoo==='runes')front+='<path d="M264 149l10-19 7 18-17-8 17-4" fill="none" stroke="#c6ff62" stroke-width="3"/>';
 if(a.tattoo==='cracks')front+='<path d="M145 137l-8 12 12 9-5 12" fill="none" stroke="#5e4673" stroke-width="3"/>';
 if(a.tattoo==='serpent')front+='<path d="M266 148q21 8 1 20t-1 19" fill="none" stroke="#428b73" stroke-width="3"/>';
 if(a.piercing==='septum')front+='<path d="M192 161q8 14 16 0" fill="none" stroke="#cad5dc" stroke-width="3"/>';
 if(a.piercing==='nose')front+='<circle cx="212" cy="166" r="3" fill="#f5e3ff"/>';
 if(a.piercing==='lip')front+='<circle cx="200" cy="189" r="3.5" fill="#e4dee9"/>';
 if(a.eyewear==='eyepatch')front+='<path d="M145 112q30-7 54 0v28q-30 14-54 0z" fill="#171825"/><path d="M142 117l91-26" stroke="#171825" stroke-width="6"/>';
 if(a.headwear==='tiara'||a.accessory==='crown')front+='<path d="M160 64l-7-27 22 11 23-26 24 26 23-11-8 27z" fill="#c6ff62" stroke="#30233d" stroke-width="3"/>';

 // Knightfall-specific ink layers that Forge2D cannot express natively.
 // Fixed vector geometry keeps member designs deterministic across every surface.
 const ink='#302732',silver='#d5c6ce',skin=colors('skin',a.skin,'#efb28f');
 if(a.ear_style==='elf')front+='<path d="M119 148L87 108L103 171L123 184M281 148L313 108L297 171L277 184" fill="'+skin+'" stroke="'+ink+'" stroke-width="3"/>';
 if(a.ear_style==='bat')front+='<path d="M119 148L86 96L90 151L78 170L124 184M281 148L314 96L310 151L322 170L276 184" fill="#5c445f" stroke="#c496b7" stroke-width="3"/>';
 if(a.ear_style==='cyber')front+='<g fill="#292e3b" stroke="#70bcb6" stroke-width="3"><rect x="108" y="144" width="17" height="40" rx="5"/><rect x="275" y="144" width="17" height="40" rx="5"/></g>';
 if(a.face_mark==='scar')front+='<path d="M140 144l16 12-12 13 15 10" fill="none" stroke="#8d4b56" stroke-width="4" stroke-linecap="round"/><path d="M140 144l16 12-12 13 15 10" fill="none" stroke="#e9b6a4" stroke-width="1.4"/>';
 if(a.face_mark==='stitches')front+='<g stroke="#41313c" stroke-width="2.5" fill="none"><path d="M135 170q20 10 43 3M142 167l-6 11m18-8-4 11m17-9-3 10"/></g>';
 if(a.face_mark==='lightning')front+='<path d="M143 126l-11 25h14l-9 25 25-34h-13l8-16z" fill="#d8b58d" stroke="'+ink+'" stroke-width="2"/>';
 if(a.face_mark==='heart')front+='<path d="M148 177q-11-14-18-3-3 9 18 21 21-12 18-21-7-11-18 3z" fill="#b25571"/>';
 if(a.face_mark==='runes')front+='<g fill="none" stroke="#c6aac9" stroke-width="2.4"><path d="M134 140l17 19-10 20m-10-22 27-9m113-14-8 20 14 13"/></g>';
 if(a.eye_glimmer==='star'||a.eye_glimmer==='double')front+='<g fill="#fff5cf"><path d="M161 121l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM237 121l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>';
 if(a.eye_glimmer==='heart')front+='<g fill="#ff9abb"><path d="M162 130q-8-10-13 0 0 6 13 13 13-7 13-13-5-10-13 0zM237 130q-8-10-13 0 0 6 13 13 13-7 13-13-5-10-13 0z"/></g>';
 if(a.makeup==='corpse')front+='<g fill="none" stroke="#24202c" stroke-width="7" opacity=".75"><path d="M144 110l-11 43m124-43 11 43M170 188q31 14 61 0"/></g>';
 if(a.makeup==='winged')front+='<g fill="none" stroke="#2e2635" stroke-width="5" stroke-linecap="round"><path d="M147 136l-17-8m125 8 17-8"/></g>';
 if(a.facial_hair==='mustache'||a.facial_hair==='goatee'||a.facial_hair==='full_beard')front+='<path d="M178 180q15-12 22 2 7-14 22-2-11 21-22 7-11 14-22-7z" fill="'+colors('hair_color',a.hair_color,'#29232f')+'" opacity=".88"/>';
 if(a.facial_hair==='goatee'||a.facial_hair==='full_beard')front+='<path d="M186 211q14 25 28 0l-14 30z" fill="'+colors('hair_color',a.hair_color,'#29232f')+'" opacity=".9"/>';
 if(a.facial_hair==='stubble')front+='<path d="M158 205q42 35 84 0" fill="none" stroke="'+colors('hair_color',a.hair_color,'#29232f')+'" stroke-width="9" opacity=".28" stroke-dasharray="2 4"/>';
 if(a.outfit_patch!=='none'){
  const motifs={skull:'<circle cx="0" cy="-3" r="10"/><path d="M-7 5v9h14V5M-5-5h2m6 0h2"/>',heart:'<path d="M0 13Q-25-5-10-15 0-22 0-10 10-22 10-15 25-5 0 13Z"/>',lightning:'<path d="M-2-16L-13 4H-2L-7 16 13-7H3L8-16Z"/>',cinder:'<path d="M0-17Q18-2 8 13 0 21-9 12-18 1 0-17Z"/>'};
  front+='<g transform="translate(240 395)" fill="#bc9c7e" stroke="#2c2431" stroke-width="2.3">'+(motifs[a.outfit_patch]||'')+'</g>';
 }
 if(a.accessory==='safety_pin')front+='<path d="M145 393q-20 14-1 34 18 15 31-12l-12-15m-17 27 20-26" stroke="'+silver+'" stroke-width="4" fill="none"/>';
 if(a.aura==='moon')front+='<path d="M55 260q-37 92 32 139-100-10-85-108 7-52 53-84" fill="#d4b990" opacity=".5"/>';
 if(a.aura==='lightning')front+='<path d="M38 260L18 337H45L27 420 92 316H62L76 260M355 228l-22 74h25l-11 88 48-101h-29l17-61" fill="none" stroke="#d7a9d0" stroke-width="7" opacity=".68"/>';
 if(a.aura==='spark_ring')front+='<g fill="none" stroke="#c9b18a" stroke-width="4" opacity=".6"><ellipse cx="200" cy="370" rx="185" ry="68" transform="rotate(-21 200 370)"/></g>';
 if(a.aura!=='none')front+='<path d="M52 512q-38-99 17-188M348 512q38-99-17-188" fill="none" stroke="'+accent+'" stroke-width="5" opacity=".34" stroke-dasharray="12 22"/>';
 return {back,front};
}
function render(value={},options={}){
 if(!forge)throw Error('Forge2D not ready');
 const a=safeAvatar(value),uid='kf-forge-'+(++sequence);
 const svg=forge.renderAvatarSvg(toForge(a),{width:400,uid,fast:options.fast!==false,title:'Knightfall Misfit avatar'});
 if(!svg.startsWith('<svg')||!svg.endsWith('</svg>'))throw Error('Invalid Forge2D SVG output');
 const art=theme(a,uid);
 return svg.replace('<svg ','<svg data-render-engine="humanforge-forge2d" ')
  .replace(/(<svg[^>]*>)/,'$1'+art.back)
  .replace('</svg>',art.front+'</svg>');
}
window.KnightfallMisfitAvatars={defaults,choices,palettes,safeAvatar,toForge,render,ready,engine:'HumanForge Forge2D'};
})();
