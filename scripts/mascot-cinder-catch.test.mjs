import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Cinder Catch has canvas, responsive input, real movement and a timed obstacle loop',()=>{
 const html=read('public/mascot-pets.html'),js=read('public/mascot-cinder-catch.js');
 assert.match(html,/id="cinder-catch-canvas"[^>]*width="720" height="400"/);
 assert.match(html,/id="cinder-catch-pet"/);
 assert.match(js,/requestAnimationFrame\(tick\)/);
 assert.match(js,/pointermove/);
 assert.match(js,/ArrowLeft/);
 assert.match(js,/ArrowRight/);
 assert.match(js,/DURATION=35000/);
 assert.match(js,/GOAL=12/);
 assert.match(js,/lives<=0/);
});
test('Cinder Catch never mints Cinders and awards only normal server-controlled play care',()=>{
 const js=read('public/mascot-cinder-catch.js');
 assert.match(js,/\/api\/mascot-pets\//);
 assert.match(js,/credentials:'include'/);
 assert.match(js,/JSON\.stringify\(\{action:'play'\}\)/);
 assert.doesNotMatch(js,/wallet_ledger|UPDATE user_wallets|mascot_passport_claims|localStorage/);
 assert.match(js,/result\.status===429/);
});
test('Minigame completion refreshes pet XP, quests and Passport without repeated rewards',()=>{
 const game=read('public/mascot-cinder-catch.js');
 const pets=read('public/mascot-pets.js');
 const adventures=read('public/mascot-adventures.js');
 const passport=read('public/mascot-passport.js');
 assert.match(game,/source:'minigame'/);
 assert.match(pets,/source\)\)return;/);
 assert.match(adventures,/minigame/);
 assert.match(passport,/sanctuary-changed/);
});
