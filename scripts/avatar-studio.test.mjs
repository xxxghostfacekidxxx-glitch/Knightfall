import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const read=file=>readFileSync(resolve(root,file),'utf8');

function loadRenderer(){
  const context={window:{}};
  vm.runInNewContext(read('public/misfit-avatar.js'),context,{timeout:2000});
  return context.window.KnightfallMisfitAvatars;
}
function loadApiValidator(){
  const context={};
  const script=read('backend/src/personal-avatars.js').replace(/^export\s+/gm,'');
  vm.runInNewContext(script+'\nthis.cleanAvatar=cleanAvatar;',context,{timeout:2000});
  return context.cleanAvatar;
}

test('Misfit Studio mounts all essential live editing controls',()=>{
 const html=read('public/avatar-studio.html');
 const expected=['avatar-preview','category-tabs','controls','preset-list','slot-list',
  'avatar-name','undo-avatar','redo-avatar','reset-avatar','preview-compare',
  'download-svg','download-avatar','save-avatar','set-active','studio-status',
  'unsaved-indicator','clear-avatar','slot-products','remove-active-avatar'];
 for(const id of expected)assert.match(html,new RegExp('id="'+id+'"'),id+' missing');
 for(const path of ['avatar-studio.css','misfit-avatar.js','avatar-studio.js'])assert.ok(html.includes('/'+path+'?v=20261111-misfit-pro3'),path+' cache token missing');
 const js=read('public/avatar-studio.js');
 assert.match(js,/paintTabs\(\)/);
 assert.match(js,/applyAvatar\(next/);
 assert.match(js,/function moveHistory/);
 assert.match(js,/savedSnapshot&&Number\(slotNo\)!==selected/);
 assert.match(js,/Boolean\(selectedSlot\(\)\?\.is_active\)/);
});

test('existing looks stay valid, with all designer choices accepted on server',()=>{
 const kit=loadRenderer(),cleanAvatar=loadApiValidator();
 assert.ok(kit&&kit.defaults&&kit.choices&&kit.palettes);
 const defaults={...kit.defaults};
 assert.deepEqual({...cleanAvatar(defaults)},defaults);
 for(const [field,values] of Object.entries(kit.choices)){
  assert.ok(values.length>=2,field+' has no meaningful selection');
  assert.equal(values.length,new Set(values).size,field+' has duplicate choices');
  for(const value of values){
   const candidate={...defaults,[field]:value};
   const cleaned=cleanAvatar(candidate);
   assert.ok(cleaned,field+':'+value+' rejected by Worker validation');
   assert.equal(cleaned[field],value);
   const markup=kit.render(candidate);
   assert.ok(markup.startsWith('<svg'),field+':'+value+' missing SVG');
   assert.ok(markup.endsWith('</svg>'),field+':'+value+' closing SVG missing');
   assert.ok(!markup.includes('undefined'),field+':'+value+' contains an unresolved art layer');
  }
 }
 assert.equal(cleanAvatar({...defaults,skin:'javascript:alert(1)'}),null,'untrusted avatar values must be rejected');
 assert.equal(kit.safeAvatar({skin:'illegal'}).skin,defaults.skin,'client must sanitize invalid values');
});

test('fine-detail layers and remix locks have matching controls',()=>{
 const kit=loadRenderer();
 for(const key of ['nose','facial_hair','makeup','tattoo','hair_highlight','outfit_patch']){
  assert.ok(kit.choices[key]?.length>=4,key+' not registered');
  assert.match(read('public/avatar-studio.js'),new RegExp("\\['"+key+"','"),key+' missing from editor');
 }
 const source=read('public/avatar-studio.js');
 for(const marker of ['lockedTraits=new Set','lockedTraits.has(key)','trait-toolbar','trait-tool','previousScroll','dataset.choice','window.addEventListener(\'beforeunload\'']){
  assert.ok(source.includes(marker),'missing editor behavior: '+marker);
 }
 const svg=kit.render({...kit.defaults,nose:'sharp',facial_hair:'goatee',makeup:'winged',tattoo:'neon_sigil',hair_highlight:'pink',outfit_patch:'skull'});
 for(const detail of ['#784758','#392432','#26192d','#d460e9','#ff55d8','translate(144 219)'])assert.ok(svg.includes(detail),'Missing visual detail '+detail);
});

test('every background renders an actual scene, not only a color swatch',()=>{
 const kit=loadRenderer();
 const seen=new Set();
 for(const background of kit.choices.background){
  const svg=kit.render({...kit.defaults,background});
  assert.ok(svg.includes('data-scene="'+background+'"'),background+' scene missing');
  const begin=svg.indexOf('<g data-scene="'+background+'">');
  const scene=svg.slice(begin,svg.indexOf('</g>',begin));
  assert.ok(scene.length>=110,background+' scene has insufficient detail');
  seen.add(scene);
 }
 assert.equal(seen.size,kit.choices.background.length,'Different background choices must render different scenes');
});

test('single-trait edits use fast updates without rebuilding entire SVG galleries',()=>{
 const code=read('public/avatar-studio.js');
 assert.match(code,/function refreshSelectedTrait/);
 assert.match(code,/changed\.length!==1\|\|category!==activeGroup/);
 assert.match(code,/kit\.render\(\{\.\.\.kit\.defaults,\[key\]:choice\}\)/);
 assert.match(code,/if\(busy\)\{status\.textContent='Finish the current save/);
 assert.match(read('public/avatar-studio.css'),/position:sticky;bottom:8px/);
});

test('renderer has unique gradient namespaces for simultaneous gallery previews',()=>{
 const kit=loadRenderer();
 const a=kit.render(),b=kit.render({background:'neon_city',hair:'undercut'});
 const id1=a.match(/id="(kf-misfit-\d+-ambient)"/)?.[1];
 const id2=b.match(/id="(kf-misfit-\d+-ambient)"/)?.[1];
 assert.ok(id1&&id2);assert.notEqual(id1,id2);
 assert.ok(a.includes('url(#'+id1+')'));
 assert.ok(b.includes('url(#'+id2+')'));
 assert.match(a,/<feDropShadow/);
 assert.match(b,/linearGradient/);
});

test('profile and mascot pages load the refreshed renderer',()=>{
 for(const page of ['public/profile.html','public/profile-edit.html','public/mascot-pets.html']){
  assert.match(read(page),/\/misfit-avatar\.js\?v=20261111-misfit-pro3/,page+' has stale artwork');
 }
 const css=read('public/avatar-studio.css');
 for(const cls of ['.avatar-stage','.trait-option','.category-tabs','.preset-chip','.unsaved-indicator'])assert.ok(css.includes(cls),cls+' missing');
});
