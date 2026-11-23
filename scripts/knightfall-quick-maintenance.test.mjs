import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
test('mobile drawer restores focus to toggle on close',()=>{
 const nav=source('nav.js');
 assert.match(nav,/nav\.contains\(document\.activeElement\)\) toggle\.focus/);
});
test('notification badge refreshes on PWA page restore',()=>{
 assert.match(source('nav.js'),/addEventListener\("pageshow", refreshNotifications\)/);
});
test('push click falls back to existing chat window if navigation fails',()=>{
 const sw=source('sw.js');
 assert.match(sw,/notification_chat_navigation_unavailable/);
 assert.match(sw,/chat\.postMessage\(\{type:"KF_OPEN_CONVERSATION",conversationId,reply:wantsReply\}\);return chat\.focus\(\)/);
});
test('profile controls remain usable on narrow screens',()=>{
 const css=source('profile.css');
 assert.match(css,/@media\(max-width:420px\)/);
 assert.match(css,/\.profile-actions button,\.profile-actions a\{min-height:44px/);
});
