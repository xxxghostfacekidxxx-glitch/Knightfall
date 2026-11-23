import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const backend=readFileSync(new URL('../backend/src/index.js',import.meta.url),'utf8');
const docs=readFileSync(new URL('../docs/RESEND-EMAIL-ROLL-OUT.md',import.meta.url),'utf8');
test('global private message archive remains restricted to GOD, not administrator or Isis',()=>{
 for(const path of ['/api/admin/messages','/api/admin/conversations']){
  const start=backend.indexOf('if(url.pathname==="'+path+'"&&request.method==="GET")');
  assert.ok(start>=0,path+' route must exist');
  const guard=backend.slice(start,start+220);
  assert.ok(guard.includes('user?.role!=="god"'),path+' must deny non-GOD identities');
  assert.ok(guard.includes('403'),path+' must return forbidden');
 }
});
test('mail rollout never represents forwarding as a Resend receiving inbox',()=>{
 assert.ok(docs.includes('receiving remains disabled'));
 assert.ok(docs.includes('OSIRIS-ONLY'));
 assert.ok(docs.includes('Never auto-enroll all accounts'));
});
