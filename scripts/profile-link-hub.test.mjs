import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const editor=read('public/profile-edit.html'),studio=read('public/profile-studio-next.js'),links=read('public/profile-links-editor.js');
const publicPage=read('public/profile.html'),viewer=read('public/profile-links-view.js'),profile=read('public/profile.js');
const styles=read('public/profile-links.css'),themes=read('public/profile-theme-library.css');
const api=read('backend/src/index.js'),migration=read('backend/migrations/0112_profile_links.sql');
test('Profile Link Hub scripts parse and dedicated editing section is reachable from navigation',()=>{
 assert.doesNotThrow(()=>new Script(links));
 assert.doesNotThrow(()=>new Script(viewer));
 assert.match(editor,/id="link-studio"/);
 assert.match(editor,/href="#link-studio"/);
 assert.match(editor,/id="studio-link-rows"/);
 assert.match(editor,/id="studio-link-add"/);
 assert.match(editor,/profile-links-editor\.js\?v=20261103-links2/);
 assert.match(editor,/profile-links\.css\?v=20261103-links2/);
 assert.match(editor,/window\.KnightfallProfileLinks\.save\(\)/);
});
test('Link Hub mutations stay private until confirmed Save profile or intentional discard',()=>{
 assert.match(editor,/if\(window\.KnightfallProfileLinks\?\.hasChanges\(\)\)/);
 assert.match(studio,/kf:profile-links-changed/);
 assert.match(studio,/kf:profile-discard-links/);
 assert.match(studio,/kf:profile-links-saved/);
 assert.match(studio,/linksDirty/);
 assert.match(studio,/saving\|\|pendingMedia>0\|\|layoutDirty\|\|linksDirty/);
 assert.match(links,/hasChanges,save,discard,validate/);
 assert.match(links,/event\.stopImmediatePropagation\(\)/);
 assert.match(links,/new CustomEvent\("kf:profile-links-saved"/);
 assert.doesNotMatch(links,/\blocalStorage\s*[.\[]/);
});
test('Profile Link Hub privacy is enforced on backend, not merely hidden in the browser',()=>{
 assert.match(api,/handleProfileLinks\(request,env,url/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS member_profile_links/);
 assert.match(migration,/PRIMARY KEY\(user_id,position\)/);
 assert.match(publicPage,/profile-links-view\.js\?v=20261103-links2/);
 assert.match(publicPage,/profile-links\.css\?v=20261103-links2/);
 assert.match(profile,/await window\.KnightfallRenderProfileLinks\?\.\(d\.user\.username,root\)/);
 assert.match(profile,/\["#profile-link-hub","Links"\]/);
 assert.match(viewer,/new URL\(link\.url\)/);
 assert.match(viewer,/u\.protocol==="https:"/);
 assert.match(viewer,/card\.rel="noopener noreferrer nofollow"/);
 assert.doesNotMatch(viewer,/\.innerHTML\s*=/);
 assert.match(styles,/#profile-link-hub/);
 assert.match(styles,/@media\(max-width:610px\)/);
});
test('All nine profile themes have a complete editor, API and public rendering path',()=>{
 const expected=['ember','midnight','toxic','bubblegum','mono','gravewave','bloodmoon','spectral','void'];
 for(const id of expected){
  assert.match(editor,new RegExp('value="'+id+'"'));
  assert.match(api,new RegExp('"'+id+'"'));
  assert.match(profile,new RegExp(id+':"#'));
  assert.match(themes,new RegExp('#profile\\[data-theme="'+id+'"\\]'));
  assert.match(themes,new RegExp('studio-preview-card\\[data-theme="'+id+'"\\]'));
 }
 assert.match(publicPage,/profile-theme-library\.css\?v=20261103-theme3/);
 assert.match(editor,/profile-theme-library\.css\?v=20261103-theme3/);
});
