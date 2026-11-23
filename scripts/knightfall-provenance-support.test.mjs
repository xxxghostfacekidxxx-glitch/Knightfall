import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('public/arcade/import-manifest.json'));
const catalog=JSON.parse(read('toolkit/catalog.json'));
test('upstream candidates are not silently marked as imported',()=>{
 for(const candidate of manifest.notYetImported||[]){
  assert.notEqual(candidate.status,'imported',candidate.title||candidate.gameId);
 }
});
test('every active imported game has an upstream and a license declaration',()=>{
 for(const game of manifest.imports||[]){
  if(game.status!=='imported')continue;
  assert.match(game.upstream||'',/^https:\/\//,game.title);
  assert.ok(game.license&&game.license!=='VERIFY-UPSTREAM',game.title);
 }
});
test('reference-only catalog entries cannot trigger automated cloning',()=>{
 assert.equal(catalog.policy.neverDeployThirdPartyCodeAutomatically,true);
 assert.equal(catalog.policy.curatedEntriesAreReferenceOnlyUntilApproved,true);
 for(const p of catalog.projects.filter(p=>['pterodactyl-panel','pelican-panel','mindustry'].includes(p.id))){
  assert.equal(p.mode,'reference-only',p.id);
 }
});
test('local imported source licenses remain in repository',()=>{
 for(const folder of ['browserquest-solo','openfront-solo','terravia']){
  assert.ok(existsSync(path.join(root,'public/arcade/hosted',folder,'LICENSE')),folder);
 }
 assert.ok(existsSync(path.join(root,'public/arcade/hosted/openfront-solo/LICENSE-ASSETS')));
});
test('donation page avoids promising purchases and discloses recipient checks',()=>{
 const html=read('public/support.html');
 assert.match(html,/Recipient ownership has not been independently verified/);
 assert.match(html,/does not buy arcade credits/);
 assert.match(html,/rel="noopener noreferrer"/);
 assert.doesNotMatch(html,/<h2>Support Ash-Fall<\/h2>/);
});
