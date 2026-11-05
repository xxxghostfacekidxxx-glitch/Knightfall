import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// Guard independent input state for all four fish-table positions.
// This structural check supplements, but does not replace, browser playthroughs.
const tables=["abyssal-arsenal","neon-kelp-reef-rush","magma-trench-relic-hunt"];
for(const name of tables)test(name+" releases held fire for all four seats",()=>{
 const html=readFileSync("public/"+name+".html","utf8");
 assert.match(html,/seatHeld\s*=\s*\[false,false,false,false\]/,"four independent held-fire flags");
 assert.match(html,/pointerSeats\s*=\s*new Map\(\)/,"track each pointer separately");
 assert.match(html,/function syncHeld\(seat\)/,"combine simultaneous keyboard/touch holds");
 assert.match(html,/pointerSeats\.values\(\)\)\.includes\(seat\)/,"touch holds survive another pointer releasing");
 assert.match(html,/keyboardSeat===seat/,"keyboard holds survive touch release");
 assert.match(html,/cv\.setPointerCapture\?\.\(e\.pointerId\)/,"pointer stays associated with its seat");
 assert.match(html,/pointerSeats\.delete\(e\.pointerId\);syncHeld\(sid\)/,"release the original seat only");
 for(const type of ["pointerup","pointercancel","lostpointercapture"]){
  assert.ok(html.includes("cv.addEventListener('"+type+"',releaseSeat)"),"missing "+type+" release");
 }
 assert.ok(html.includes("window.addEventListener('blur',clearSeats)"),"blur must release all fire");
 assert.match(html,/keyboardSeat=null;syncHeld\(seat\)/,"space-key release must update seat");
 assert.match(html,/requestFullscreen\(/,"fullscreen must address a real element");
});
