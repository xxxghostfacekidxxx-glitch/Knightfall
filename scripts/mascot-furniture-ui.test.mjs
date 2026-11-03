import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const file=path=>new URL('../'+path,import.meta.url);
test('all eight first-party SVG furniture pieces are self-contained, clean vectors',()=>{
 const keys=['lantern','skull_pile','bone_tree','grave_marker','glitch_console','neon_throne','spirit_fountain','chaos_portal'];
 for(const key of keys){
  const asset=file('public/assets/devil-tools/neon-nuisances/furniture/'+key+'.svg');
  assert.ok(existsSync(asset),'missing furniture '+key);
  const svg=readFileSync(asset,'utf8');
  assert.match(svg,/^<svg/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert.doesNotMatch(svg,/<image\b|<script\b|xlink:href|<foreignObject\b/i);
 }
});
test('room editor joins existing pet selector and allows keyboard, mouse and touch furniture movement',()=>{
 const html=readFileSync(file('public/mascot-room.html'),'utf8');
 const code=readFileSync(file('public/mascot-room-furniture.js'),'utf8');
 assert.match(html,/\/mascot-room-furniture\.js\?/);
 assert.match(html,/\/mascot-room-furniture\.css\?/);
 assert.match(code,/sanctuary-room-selected/);
 assert.match(code,/pointerdown/);assert.match(code,/pointermove/);
 assert.match(code,/ArrowLeft/);assert.match(code,/ArrowRight/);
 assert.match(code,/setPointerCapture/);
 assert.doesNotMatch(code,/localStorage\.setItem|wallet_ledger|UPDATE user_wallets/);
});
test('all furniture spending and placement goes to authenticated server routes',()=>{
 const client=readFileSync(file('public/mascot-room-furniture.js'),'utf8');
 const backend=readFileSync(file('backend/src/mascot-furniture.js'),'utf8');
 const router=readFileSync(file('backend/src/mascot-pets.js'),'utf8');
 assert.match(client,/credentials:'include'/);
 assert.match(client,/api\/mascot-pets\/furniture\/buy/);
 assert.match(client,/\/furniture'/);
 assert.match(backend,/INSERT INTO mascot_room_furniture_purchases/);
 assert.match(backend,/SELECT id,experience FROM mascot_pets WHERE id=\? AND user_id=\?/);
 assert.match(router,/handleMascotFurniture\(request,env,url,user/);
});
