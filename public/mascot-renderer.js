/* Knightfall Sanctuary art compositor v2.
 * Existing character drawings remain the silhouette layer while each type has
 * its own environment, paper/grain lighting, color grade and earned form effects.
 * No CDN, WebGL dependency or fake local evolution state.
 */
(()=>{'use strict';
const byType={
 wildwood:'thornriot lydibug chunky-monkey',
 tidal:'crypt-koi prismare crush',
 ember:'pippa emberbun sootsnoot',
 dusk:'nib mini-villain gutterkit',
 spectral:'glim rattlepop casket-pup boo-thang',
 stone:'mini-eddie glittergob craggle',
 storm:'volt-imp rumblefluff',
 celestial:'moxie void-sprout',
 feral:'kiki minion-mouse butters trouble',
 toxic:'bloop zuzu',
 neon:'gravebyte statichex skunk-riot'
};
const affinity=Object.fromEntries(Object.entries(byType).flatMap(([key,ids])=>ids.split(' ').map(id=>[id,key])));
const landscapes={
 wildwood:'<path d="M0 300Q64 252 125 299T255 292T400 309V400H0Z" fill="#31523a" opacity=".48"/><path d="M36 310Q10 235 54 130M360 320Q393 232 341 109" fill="none" stroke="#76976c" stroke-width="17" opacity=".45"/><path d="M55 208Q14 170 23 130Q73 144 55 208M341 171Q391 132 391 90Q332 98 341 171" fill="#759a60" opacity=".45"/><path d="M0 350Q80 326 166 353T400 349" fill="none" stroke="#d1a96b" stroke-width="3" opacity=".45"/>',
 tidal:'<circle cx="319" cy="88" r="44" fill="#e7dec6" opacity=".4"/><path d="M0 290Q52 263 100 292T200 291T300 287T400 292V400H0Z" fill="#3c8591" opacity=".38"/><path d="M0 331Q53 306 100 332T200 331T300 330T400 328M0 352Q48 327 99 352T199 351T299 350T400 351" fill="none" stroke="#a9d9d0" stroke-width="4" opacity=".45"/><circle cx="49" cy="214" r="12" fill="none" stroke="#bbdedc" stroke-width="3"/><circle cx="361" cy="234" r="8" fill="none" stroke="#bbdedc" stroke-width="2"/>',
 ember:'<path d="M0 364Q55 314 94 341T211 327T318 337T400 319V400H0Z" fill="#763928" opacity=".55"/><path d="M35 323Q4 275 45 220Q51 270 69 257Q88 216 80 182Q141 247 96 324M335 323Q307 272 345 219Q363 271 378 246Q394 225 388 192Q435 275 387 331" fill="#e2a05f" opacity=".32"/><path d="M0 362Q97 342 200 360T400 358" fill="none" stroke="#edbb79" stroke-width="4" opacity=".55"/>',
 dusk:'<circle cx="311" cy="103" r="51" fill="#d9d2c6" opacity=".35"/><path d="M0 321V274h48v-87h58v134h32v-72h60v72h30v-116h74v116h45v-51h53v130H0Z" fill="#21283d" opacity=".55"/><path d="M20 338Q107 299 199 334T400 325" stroke="#a6aec8" stroke-width="3" fill="none" opacity=".35"/>',
 spectral:'<circle cx="304" cy="101" r="64" fill="#d5d1e1" opacity=".24"/><path d="M0 340Q74 314 156 341T302 337T400 341V400H0Z" fill="#575469" opacity=".4"/><path d="M54 337v-85q0-31 28-31t28 31v85m172-5v-99q0-34 32-34t32 34v99" fill="#514b63" stroke="#b6adc6" stroke-width="4" opacity=".38"/><path d="M0 354Q116 328 200 360T400 352" fill="none" stroke="#e0d9e5" stroke-width="12" opacity=".15"/>',
 stone:'<path d="M0 354 45 284 95 315l53-75 68 76 64-65 50 58 70-42v133H0Z" fill="#766e61" opacity=".43"/><path d="m49 275 32-102 43 98-43 35Zm245 33 36-123 39 87-42 46Z" fill="#a5a098" opacity=".35" stroke="#d6bf93" stroke-width="3"/><path d="M0 365q92-37 202-7t198-4" fill="none" stroke="#c3b8a5" opacity=".4" stroke-width="5"/>',
 storm:'<path d="M0 140Q50 71 105 105Q169 44 235 112Q316 59 400 117V0H0Z" fill="#8f9bab" opacity=".26"/><path d="m68 123-26 89 49-43-19 99m251-154-24 83 43-37-19 93" fill="none" stroke="#d4d9c4" stroke-width="6" opacity=".52"/><path d="M0 324q95-64 202-2t198 0v78H0Z" fill="#5c6877" opacity=".36"/>',
 celestial:'<circle cx="200" cy="181" r="125" fill="none" stroke="#aaa7c6" stroke-width="3" opacity=".4"/><circle cx="200" cy="181" r="170" fill="none" stroke="#d0b19e" stroke-width="2" stroke-dasharray="7 22" opacity=".28"/><path d="M0 358Q87 318 200 352T400 342V400H0Z" fill="#4a425c" opacity=".33"/><path d="m48 107 6 20 20 6-20 6-6 20-6-20-20-6 20-6Zm298 40 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="#e7dfd7" opacity=".56"/>',
 feral:'<circle cx="323" cy="99" r="53" fill="#f2d3a5" opacity=".36"/><path d="M0 344Q50 292 109 335T217 319T400 331V400H0Z" fill="#806345" opacity=".42"/><path d="M19 347 36 286l17 61m283 1 22-78 20 81M70 349l-7-39m240 40 11-39" stroke="#baac83" stroke-width="7" opacity=".34"/><path d="m64 113 17-11m252 62 20-15" stroke="#e5c8ab" stroke-width="5" opacity=".32"/>',
 toxic:'<circle cx="294" cy="116" r="70" fill="#9db474" opacity=".19"/><path d="M0 340Q72 296 135 328T266 332T400 313V400H0Z" fill="#59764e" opacity=".48"/><path d="M47 326q-28-87 32-110m265 103q34-98-23-128" fill="none" stroke="#91a47d" stroke-width="16" opacity=".35"/><circle cx="77" cy="191" r="10" fill="#c7d4a5" opacity=".4"/><circle cx="355" cy="161" r="16" fill="#c7d4a5" opacity=".28"/>',
 neon:'<path d="M0 300H400M0 336H400M0 370H400M54 295V400m90-105v105m90-105v105m90-105v105" stroke="#8d8daa" stroke-width="2" opacity=".37"/><path d="M0 331V214h42v117h40V146h72v185h48V186h56v145h31V245h61v86h50v69H0Z" fill="#272039" opacity=".59" stroke="#a84f91" stroke-width="3"/><path d="m42 260 19-11m48-36 28-4m155 70 22-13" stroke="#f3c0db" stroke-width="5"/>'
};
function seedDots(id){
 let n=0;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;
 let out='';for(let i=0;i<15;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;const x=10+n%380;n=(Math.imul(n,1664525)+1013904223)>>>0;const y=25+n%260;
 out+='<circle cx="'+x+'" cy="'+y+'" r="'+(i%3+1)+'" fill="#f9f0dc" opacity="'+(i%4===0?'.48':'.22')+'"/>'}
 return out;
}
function scene(type,id){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 400 400');
 svg.setAttribute('preserveAspectRatio','xMidYMid slice');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 svg.classList.add('pet-world-illustration');
 svg.innerHTML=(landscapes[type]||landscapes.feral)+seedDots(id);
 return svg;
}
function decorate(visual,item){
 if(!visual)return visual;
 const id=String(item?.species||item?.id||'');
 const type=landscapes[item?.affinity]?item.affinity:(affinity[id]||'feral');
 const stage=Math.max(1,Math.min(3,Number(item?.growth?.stage)||1));
 visual.classList.add('pet-render-v2');
 visual.dataset.affinity=type;visual.dataset.form=String(stage);
 const parent=visual.closest('.pet-card');
 if(parent){parent.dataset.affinity=type;parent.dataset.form=String(stage)}
 visual.prepend(scene(type,id));
 const light=document.createElement('span');light.className='pet-world-light';light.setAttribute('aria-hidden','true');
 const texture=document.createElement('span');texture.className='pet-world-texture';texture.setAttribute('aria-hidden','true');
 visual.append(light,texture);
 if(stage>1){const mark=document.createElement('span');mark.className='pet-growth-crown';mark.setAttribute('aria-hidden','true');visual.append(mark)}
 return visual;
}
window.KnightfallPetRenderer=Object.freeze({decorate,typeFor:id=>affinity[id]||'feral'});
})();
