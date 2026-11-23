import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canAccessCreatorFoundry,canAccessOwnerMailbox} from './staff-capabilities.js';
const handler=readFileSync(new URL('./creator-art-submissions.js',import.meta.url),'utf8');
test('creator submissions enforce active user and canonical server-side role policy',()=>{
 assert.match(handler,/user\.status==='active'&&canAccessCreatorFoundry\(user\)/);
 assert.match(handler,/if\(!isCreator\(user\)\)return json\(\{error:'Creator Foundry access required\.'/);
});
test('creator roles and owner-only correspondence stay separate',()=>{
 const active={status:'active'};
 for(const user of [{...active,role:'god'},{...active,role:'admin'},{...active,role:'moderator'},{...active,role:'member',public_title:'Digital Creator'}]){
  assert.equal(canAccessCreatorFoundry(user),true);
 }
 assert.equal(canAccessCreatorFoundry({...active,role:'member'}),false);
 assert.equal(canAccessOwnerMailbox({...active,role:'god'}),true);
 assert.equal(canAccessOwnerMailbox({...active,role:'GOD'}),false, 'only canonical GOD role grants private correspondence');
 for(const user of [{...active,role:'admin',is_isis:1},{...active,role:'admin'},{...active,role:'moderator'},{...active,role:'member',public_title:'Digital Creator'},{status:'disabled',role:'god'}]){
  assert.equal(canAccessOwnerMailbox(user),false);
 }
});
