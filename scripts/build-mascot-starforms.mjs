// Adds bespoke companion accents and creates deluxe Starborn evolved portraits.
import fs from 'node:fs';
const dir='public/assets/devil-tools/neon-nuisances';
const edits={
 'minion-mouse':{
  desc:'A clever little lady mouse with giant stitched ears, mint goggles, a lucky ladybug patch and a pink bow, built for secret tunnels and bigger plans.',
  layer:'<g stroke-linejoin="round" stroke-linecap="round"><path d="m20 18q10-10 18 0l-9 8Zm18 0q10-10 18 0L47 26Z" fill="#ff55d8" stroke="#161421" stroke-width="2.8"/><circle cx="38" cy="18" r="3.5" fill="#c6ff45" stroke="#161421" stroke-width="2"/><path d="M27 92q8-7 16 0l-2 10-7 5-8-6Z" fill="#ec4b72" stroke="#171421" stroke-width="2.5"/><circle cx="32" cy="95" r="1.8" fill="#fff1c6"/><circle cx="39" cy="98" r="1.8" fill="#fff1c6"/><path d="m31 90 3-5m5 6 4-4" stroke="#c6ff45" stroke-width="1.8"/></g>'
 },
 'chunky-monkey':{
  desc:'A big-hearted punk monkey girl with bright cheeky eyes, a flower clip, tiny hoop earrings, a bold bandana and her trusty banana blade.',
  layer:'<g stroke-linecap="round" stroke-linejoin="round"><path d="M34 44q6-12 16 0m48 0q11-12 18 0" fill="none" stroke="#14121c" stroke-width="3.5"/><path d="m109 30 7-9 7 9-7 10Z" fill="#ff55d8" stroke="#211421" stroke-width="2.2"/><circle cx="116" cy="30" r="2.7" fill="#c6ff45"/><path d="M20 82q-9 9 0 17 9-8 0-17m120 0q9 9 0 17-9-8 0-17" fill="none" stroke="#f7c36b" stroke-width="3.2"/><path d="M52 30q24 13 56 0" fill="none" stroke="#ff55d8" stroke-width="4"/><path d="m63 31 5 4m10-2 5 3m10-4 5 3" stroke="#fff0c6" stroke-width="2"/></g>'
 },
 'boo-thang':{
  desc:'A sweetly spooky ghost girl with a moonlit veil, heart-shaped spectral glow and playful punk sparkle, haunting only the people she loves.',
  layer:'<g stroke-linecap="round" stroke-linejoin="round"><path d="M51 33q-7-14 4-19l8 9 9-14 7 15 11-10q9 10 0 20" fill="#f7c7fa" stroke="#25142b" stroke-width="3"/><path d="M28 112q22 14 41 4m33 0q17 9 34-3" fill="none" stroke="#fff4ff" stroke-width="2.7" opacity=".8"/><path d="M76 107q4-8 9 0 5-8 9 0 0 9-9 14-9-5-9-14Z" fill="#ff55d8" stroke="#27152b" stroke-width="2"/><circle cx="87" cy="111" r="2" fill="#fff"/><path d="m36 71-4-7m97 9 5-7" stroke="#c6ff45" stroke-width="2.5"/></g>'
 }
};
for(const [id,{desc,layer}] of Object.entries(edits)){
 for(const suffix of ['', '-idle','-blink','-bounce','-mischief']){
  const path=dir+'/'+id+suffix+'.svg';if(!fs.existsSync(path))continue;let svg=fs.readFileSync(path,'utf8');
  if(!svg.includes('data-starborn-ready="1"')){
   svg=svg.replace(/<svg\b/, '<svg data-starborn-ready="1"').replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/,m=>m.replace(/>[\s\S]*<\//,'>'+desc+'</'));
   svg=svg.replace('</svg>',layer+'</svg>');fs.writeFileSync(path,svg);
  }
 }
}
const forms={
 lydibug:{name:'Lydibloom',a:'#ffe38a',b:'#ff80c9',art:'<path d="M198 139q-32-50-67-10 29 38 68 28m48-18q32-50 67-10-29 38-68 28" fill="#c6ff45" fill-opacity=".75" stroke="#fff2a2" stroke-width="6"/><path d="M225 128q31-34 62 0l-7 18h-48Z" fill="#ff80c9" stroke="#fff2a2" stroke-width="5"/><circle cx="256" cy="137" r="8" fill="#ffe38a"/>'},
 'minion-mouse':{name:'Minion Mouse: Mastermind',a:'#ff55d8',b:'#c6ff45',art:'<path d="m191 148 14-37 14 27 23-44 12 47 24-36 10 42Z" fill="#ff55d8" stroke="#c6ff45" stroke-width="5"/><circle cx="218" cy="150" r="11" fill="#c6ff45" stroke="#171421" stroke-width="4"/><circle cx="294" cy="150" r="11" fill="#79ffe7" stroke="#171421" stroke-width="4"/><path d="M223 171q33-20 66 0" fill="none" stroke="#ff55d8" stroke-width="7"/>'},
 'mini-villain':{name:'Supreme Mini Villain',a:'#b78cff',b:'#ff55d8',art:'<path d="m185 147 17-50 24 31 30-62 29 62 24-31 18 50Z" fill="#b78cff" stroke="#f4dcff" stroke-width="6"/><path d="M192 177q64 24 128 0v56l-29-14-35 28-35-28-29 14Z" fill="#5d327c" fill-opacity=".87" stroke="#ff55d8" stroke-width="5"/><circle cx="256" cy="143" r="9" fill="#c6ff45"/>'},
 'mini-eddie':{name:'Everguard Eddie',a:'#c6ff45',b:'#79ffe7',art:'<path d="M256 94 289 112v30q-1 34-33 51-32-17-33-51v-30Z" fill="#182637" fill-opacity=".9" stroke="#c6ff45" stroke-width="7"/><path d="m256 112 8 15 17 2-13 11 4 17-16-9-16 9 4-17-13-11 17-2Z" fill="#ffe38a" stroke="#fff" stroke-width="2"/><path d="M189 170q-33 28-16 57m150-57q33 28 16 57" fill="none" stroke="#79ffe7" stroke-width="7" stroke-linecap="round"/>'},
 'boo-thang':{name:'Boo Thang: Heartlight',a:'#ff80c9',b:'#79ffe7',art:'<path d="M256 89q-28-30-52-4-21 28 52 79 73-51 52-79-24-26-52 4Z" fill="#ff80c9" fill-opacity=".72" stroke="#fff4ff" stroke-width="6"/><circle cx="256" cy="126" r="13" fill="#fff"/><path d="M196 168q60 33 120 0" fill="none" stroke="#79ffe7" stroke-width="7" stroke-linecap="round"/><circle cx="181" cy="143" r="7" fill="#c6ff45"/><circle cx="331" cy="143" r="7" fill="#c6ff45"/>'}
};
fs.mkdirSync(dir+'/evolutions',{recursive:true});
for(const [id,f] of Object.entries(forms)){
 const portrait=fs.readFileSync(dir+'/portraits/'+id+'.svg','utf8');
 const artwork='<svg x="0" y="0" width="512" height="512" viewBox="0 0 512 512">'+portrait.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')+'</svg>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="'+f.name+' evolved Starborn companion"><defs><radialGradient id="evolveAura"><stop stop-color="'+f.a+'" stop-opacity=".3"/><stop offset="1" stop-color="'+f.b+'" stop-opacity="0"/></radialGradient><filter id="evolveGlow"><feGaussianBlur stdDeviation="8"/></filter></defs>'+artwork+'<circle cx="256" cy="148" r="108" fill="url(#evolveAura)" filter="url(#evolveGlow)"/>'+f.art+'<rect x="28" y="28" width="456" height="456" rx="23" fill="none" stroke="'+f.a+'" stroke-width="4" opacity=".92"/><rect x="33" y="33" width="446" height="446" rx="19" fill="none" stroke="'+f.b+'" stroke-width="1.5" stroke-dasharray="4 12" opacity=".8"/><path d="M59 66 65 50l6 16 16 6-16 6-6 16-6-16-16-6Zm376 0 6-16 6 16 16 6-16 6-6 16-6-16-16-6Z" fill="'+f.a+'"/><rect x="127" y="405" width="258" height="36" rx="18" fill="#090d19" stroke="'+f.a+'" stroke-width="2"/><text x="256" y="429" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="2" fill="'+f.a+'">✦ STARBORN EVOLVED ✦</text></svg>';
 fs.writeFileSync(dir+'/evolutions/'+id+'.svg',svg);
}
const manifestPath=dir+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.version=14;
const descriptions={
 'minion-mouse':'Lydia-inspired clever little lady mouse with giant stitched ears, mint goggles, a lucky ladybug patch and a pink bow.',
 'chunky-monkey':'Big-hearted punk monkey girl with bright cheeky eyes, flower clip, tiny hoop earrings, bandana and trusty banana blade.',
 'boo-thang':'Sweetly spooky ghost girl with moonlit veil, heart-shaped spectral glow and playful punk sparkle.'
};
for(const c of manifest.characters){if(descriptions[c.id])c.description=descriptions[c.id];if(forms[c.id])c.evolved='/assets/devil-tools/neon-nuisances/evolutions/'+c.id+'.svg';}
manifest.artDirection='Deluxe Sanctuary v14: 28 original world portraits, expanded signature character design and five earned Starborn evolutions';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Refreshed three first forms and built five Starborn evolved portraits.');
