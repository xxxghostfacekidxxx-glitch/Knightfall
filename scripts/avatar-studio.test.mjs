import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const read=path=>readFileSync(resolve(fileURLToPath(new URL('..',import.meta.url)),path),'utf8');
const sample={schema:'humanforge.avatar2d',version:1,style:'forge-2d-v2',face:{shape:'oval',skin:'golden',eyes:'almond',eyeColor:'#7a4a26',brows:'soft',nose:'soft',mouth:'balanced',lipColor:'#c8727d',cheeks:2,freckles:0,mole:'none',eyeshadow:'#00000000',lashes:true},hair:{style:'long-center',color:'#8a5a34',highlight:null,highlightStyle:'balayage'},headwear:{style:'none',color:'#9db69b',fabric:'jersey',undercap:false},outfit:{top:'long-sleeve',topColor:'#2a2b30',bottom:'wide-jeans',bottomColor:'#9a9da3',dress:'none',dressColor:'#2f5b4a',outer:'puffer-crop',outerColor:'#e6dcc8',shoes:'fluffy-boots',shoesColor:'#7a5236'},accessories:{glasses:'none',glassesColor:'#25252a',earrings:'none',metal:'#e0b24c',necklace:'none',bag:'none',bagColor:'#7a5236',scarf:'none',scarfColor:'#c4b6e6',hairAccessory:'none',hairAccessoryColor:'#f3f0ea'},expression:'neutral',pose:'relaxed'};
async function getKit(){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700"><g data-layer="face"></g></svg>';
 const mock='Promise.resolve({DEFAULT_CONFIG:'+JSON.stringify(sample)+',renderAvatarSvg:()=>'+JSON.stringify(svg)+'})';
 const src=read('public/misfit-avatar.js').replace("import('https://esm.sh/humanforge@0.8.1/forge2d?bundle')",mock);
 const context={window:{},console};
 vm.runInNewContext(src,context,{timeout:2000});
 const kit=context.window.KnightfallMisfitAvatars;await kit.ready;return kit;
}
function validator(){
 const context={};
 vm.runInNewContext(read('backend/src/personal-avatars.js').replace(/^export\s+/gm,'')+'\nthis.validate=cleanAvatar;',context,{timeout:3000});
 return context.validate;
}
test('single production renderer is HumanForge Forge2D',async()=>{
 const kit=await getKit(),svg=kit.render(kit.defaults);
 assert.equal(kit.engine,'HumanForge Forge2D');
 assert.match(svg,/data-render-engine="humanforge-forge2d"/);
 assert.match(svg,/data-layer="face"/);
 assert.doesNotMatch(read('public/misfit-avatar.js'),/storybook-comic-v3|noir-face-sculpt/);
});
test('all saved avatar option values remain supported by backend',async()=>{
 const kit=await getKit(),clean=validator();
 for(const [field,values] of Object.entries(kit.choices))for(const value of values){
  const data={...kit.defaults,[field]:value};
  assert.ok(clean(data),field+':'+value+' rejected by Worker');
  assert.equal(kit.safeAvatar(data)[field],value);
  assert.match(kit.render(data),/data-render-engine/);
 }
 assert.equal(kit.safeAvatar({hair:'invalid'}).hair,kit.defaults.hair);
});
test('Forge2D converts legacy shape, outfit, hair and face settings',async()=>{
 const kit=await getKit();
 const a=kit.toForge({...kit.defaults,skin:'cocoa',face_shape:'angular',hair:'coils',eyes:'cat',expression:'grin',outfit:'jacket',piercing:'ear',neckwear:'spike_choker'});
 assert.equal(a.face.skin,'deep');assert.equal(a.face.shape,'diamond');assert.equal(a.face.eyes,'cat');
 assert.equal(a.hair.style,'curly-long');assert.equal(a.outfit.outer,'denim-jacket');
 assert.equal(a.accessories.earrings,'stud');assert.equal(a.accessories.necklace,'choker');
});
test('every display surface loads Forge2D and waits until ready',()=>{
 for(const path of ['public/avatar-studio.html','public/profile.html','public/profile-edit.html','public/mascot-pets.html']){
  const text=read(path);
  assert.match(text,/misfit-avatar\.js\?v=20261115-forge2d1/);
  assert.match(text,/forge2d-avatar\.css/);
  assert.doesNotMatch(text,/avatar-cartoon\.css|misfit-renderer-lab/);
 }
 assert.match(read('public/avatar-studio.js'),/await kit\.ready/);
 assert.match(read('public/profile-misfit-editor.js'),/await kit\.ready/);
 assert.match(read('public/profile.js'),/await window\.KnightfallMisfitAvatars\.ready/);
 assert.match(read('public/mascot-pet-life.js'),/await kit\.ready/);
});

test('Misfit Studio searches all 27 traits and defers offscreen thumbnails',()=>{
 const markup=read('public/avatar-studio.html'),editor=read('public/avatar-studio.js'),styles=read('public/avatar-studio.css');
 assert.match(markup,/id="trait-search-input"/);
 assert.match(markup,/id="trait-search-count"/);
 assert.match(editor,/kit\.choices\[key\]/);
 assert.match(editor,/IntersectionObserver/);
 assert.match(editor,/thumbObserver\.observe\(image\)/);
 assert.match(editor,/thumbnailCache\.size>120/);
 assert.match(styles,/trait-no-results/);
});
