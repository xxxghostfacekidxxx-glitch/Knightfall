import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

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
 for(const path of ['avatar-studio.css','misfit-avatar.js','avatar-studio.js'])assert.ok(html.includes('/'+path+'?v=20261111-misfit-pro'),path+' cache token missing');
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
  assert.match(read(page),/\/misfit-avatar\.js\?v=20261111-misfit-pro/,page+' has stale artwork');
 }
 const css=read('public/avatar-studio.css');
 for(const cls of ['.avatar-stage','.trait-option','.category-tabs','.preset-chip','.unsaved-indicator'])assert.ok(css.includes(cls),cls+' missing');
});
