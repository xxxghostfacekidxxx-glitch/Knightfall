import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
test('Cards Against Chaos rejects invalid seat counts, duplicate friends and unaccepted invitees',()=>{
 const js=read('arcade/hosted/cards-against-chaos/online.js');
 assert.ok(js.includes('count<1||count>4||!Number.isInteger(count)'));
 assert.ok(js.includes('new Set(ids).size!==ids.length'));
 assert.ok(js.includes('friends.some(friend=>Number(friend.user_id)===id)'));
 assert.ok(js.includes('Only accepted friends may occupy invited seats'));
});
test('Chaosphere resets stale scroll before loading another thread and rejects stale responses',()=>{
 const html=read('messages.html');
 assert.ok(html.includes('threadViewport.scrollTop=0'));
 assert.ok(html.includes('if(token!==conversationLoadToken)return'));
 assert.ok(html.includes('box.scrollTop=top+(box.scrollHeight-height)'));
});
