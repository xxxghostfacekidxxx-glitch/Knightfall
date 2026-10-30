import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const backend=readFileSync(new URL('../backend/src/index.js',import.meta.url),'utf8');
const dashboard=readFileSync(new URL('../public/god-bot-control.html',import.meta.url),'utf8');
const migration=readFileSync(new URL('../backend/migrations/0061_god_bot_service_accounts.sql',import.meta.url),'utf8');
const identities=JSON.parse(readFileSync(new URL('../backend/bot-identities.json',import.meta.url),'utf8'));
test('bot identity registry has approved names and complete Star Wars bio',()=>{
 assert.deepEqual(identities.bots.map(x=>x.display_name),['Order 66.6','Beelzebub']);
 assert.equal(identities.bots[0].bio.length,5);
 assert.ok(identities.bots.every(x=>x.automated===true&&x.enabled===false));
});
test('God-only bot APIs enforce authenticated role',()=>{
 for(const route of ['/api/god/bots','/api/god/bot-publish'])assert.ok(backend.includes(route));
 assert.match(backend,/if\(actor\.role!=="god"\)return json\(\{error:"God role required"\},403,origin\)/);
 assert.match(backend,/await audit\(env,actor,"god_bot_thread"/);
 assert.match(backend,/await audit\(env,actor,"god_bot_reply"/);
});
test('bot accounts cannot log in with ordinary credentials',()=>{
 assert.match(migration,/!service-account-no-password!/);
 assert.match(migration,/'suspended'/);
});
test('dashboard submits authenticated saves and manual publishing',()=>{
 assert.ok(dashboard.includes("credentials:'include'"));
 assert.ok(dashboard.includes("'/api/god/bot-publish'"));
 assert.ok(dashboard.includes("method:'PATCH'"));
});

test('God bot profile route uses full prefix length rather than a hard-coded offset',()=>{
 assert.match(backend,/url\.pathname\.slice\("\/api\/god\/bots\/".length\)/);
 assert.equal('/api/god/bots/'.length,14);
});
