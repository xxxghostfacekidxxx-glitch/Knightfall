// Renderer evaluation only. HumanForge Forge2D is MIT licensed; see its upstream license and asset manifest before production adoption.
const status=document.getElementById('status');
const error=document.getElementById('error');
const set=(base,patch)=>({
 ...base,
 face:{...base.face,...patch.face},
 hair:{...base.hair,...patch.hair},
 headwear:{...base.headwear,...patch.headwear},
 outfit:{...base.outfit,...patch.outfit},
 accessories:{...base.accessories,...patch.accessories},
 ...(patch.expression?{expression:patch.expression}:{}),
 ...(patch.pose?{pose:patch.pose}:{})
});
try{
 const engine=await import('https://esm.sh/humanforge@0.8.1/forge2d?bundle');
 const {DEFAULT_CONFIG,renderAvatarSvg}=engine;
 const looks=[
  {id:'night',patch:{face:{shape:'round',skin:'porcelain',eyes:'cat',eyeColor:'#7a91d9',brows:'soft',nose:'soft',mouth:'balanced',lipColor:'#a44d70',cheeks:1,freckles:1,mole:'none',eyeshadow:'#34243f',lashes:true},hair:{style:'wavy-long',color:'#211a29',highlight:'#b8a9d2',highlightStyle:'streaks'},outfit:{top:'tee',topColor:'#17151e',bottom:'skinny-jeans',bottomColor:'#24232b',dress:'none',dressColor:'#693565',outer:'denim-jacket',outerColor:'#25232f',shoes:'chelsea-boots',shoesColor:'#18171e'},accessories:{glasses:'none',glassesColor:'#25252a',earrings:'hoop',metal:'#cfd3da',necklace:'layered',bag:'none',bagColor:'#7a5236',scarf:'none',scarfColor:'#c4b6e6',hairAccessory:'none',hairAccessoryColor:'#f3f0ea'},expression:'confident',pose:'crossed'}},
  {id:'riot',patch:{face:{shape:'heart',skin:'caramel',eyes:'upturned',eyeColor:'#5a9b6a',brows:'soft',nose:'soft',mouth:'balanced',lipColor:'#a64b65',cheeks:2,freckles:2,mole:'cheek',eyeshadow:'#4c3150',lashes:true},hair:{style:'curly-long',color:'#6a245e',highlight:'#c6ff62',highlightStyle:'balayage'},outfit:{top:'tee',topColor:'#29371f',bottom:'flare-jeans',bottomColor:'#242a34',dress:'none',dressColor:'#693565',outer:'bomber',outerColor:'#334226',shoes:'chunky-sneakers',shoesColor:'#202126'},accessories:{glasses:'cat-eye',glassesColor:'#c6ff62',earrings:'huggie',metal:'#c6ff62',necklace:'choker',bag:'crossbody',bagColor:'#2b3022',scarf:'none',scarfColor:'#c4b6e6',hairAccessory:'clip',hairAccessoryColor:'#c6ff62'},expression:'happy',pose:'hip'}},
  {id:'static',patch:{face:{shape:'square',skin:'ivory',eyes:'hooded',eyeColor:'#55c9d0',brows:'soft',nose:'soft',mouth:'balanced',lipColor:'#a65e7a',cheeks:0,freckles:0,mole:'none',eyeshadow:'#172f42',lashes:true},hair:{style:'bob-fringe',color:'#e8e0d9',highlight:'#40d8d1',highlightStyle:'tips'},outfit:{top:'crop-long',topColor:'#163f47',bottom:'straight-jeans',bottomColor:'#28323e',dress:'none',dressColor:'#693565',outer:'bomber',outerColor:'#1a5154',shoes:'knee-boots',shoesColor:'#1b2028'},accessories:{glasses:'round-sun',glassesColor:'#7be8df',earrings:'stud',metal:'#cfd3da',necklace:'chain',bag:'none',bagColor:'#7a5236',scarf:'none',scarfColor:'#c4b6e6',hairAccessory:'headband',hairAccessoryColor:'#45d7d1'},expression:'thoughtful',pose:'wave'}}
 ];
 for(const look of looks){
  const config=set(DEFAULT_CONFIG,look.patch);
  const svg=renderAvatarSvg(config,{width:420,uid:'knightfall-'+look.id});
  if(!svg.startsWith('<svg')||!svg.includes('</svg>'))throw new Error('Renderer returned invalid SVG for '+look.id);
  document.getElementById('art-'+look.id).innerHTML=svg;
 }
 status.textContent='Artwork engine loaded · 3 looks rendered';
}catch(err){
 status.textContent='Prototype engine unavailable';
 error.style.display='block';
 error.textContent='The external prototype module could not load: '+String(err?.message||err)+'. The live avatar creator is unaffected.';
}
