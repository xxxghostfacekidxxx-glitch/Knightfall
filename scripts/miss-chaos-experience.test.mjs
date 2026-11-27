import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("character-first chat keeps account controls, privacy and existing tools",()=>{
 const html=read("public/miss-chaos.html"),js=read("public/miss-chaos.js");
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ["mc-history-panel","mc-history-toggle","chat-messages","message-input","send-button","memory-form","chaos-radar-open","admin-chaos-archive"])assert.ok(ids.includes(id),id);
 assert.match(html,/aria-controls="mc-history-panel" aria-expanded="false"/);
 for(const id of ["talk","create","laugh","help"])assert.ok(html.includes('data-mc-starter="'+id+'"'));
 assert.match(js,/setHistory\(false\)/);
 assert.match(js,/mc-tool-drawer/);
 assert.match(html,/mc-privacy-disclosure/);
 assert.match(html,/Authorized administrators may review conversations/);
 assert.match(js,/portrait\.alt=""/);
 assert.match(js,/if \(role === "user"\) text\.textContent = content/);
});
test("Bubblegum Havoc uses consistent selectable theme key and separate artwork",()=>{
 for(const path of ["public/miss-chaos.html","public/miss-chaos-realm.html","public/profile-edit.html","public/miss-chaos-presence.js"]){
  const source=read(path);assert.ok(source.includes('value="bubblegum-havoc"'),path);assert.ok(source.includes('"obsidian","bubblegum-havoc","hellfire"'),path);
 }
 assert.match(read("public/realm-theme-engine.css"),/data-mc-theme="bubblegum-havoc"/);
 assert.match(read("public/assets/knightfall/miss-chaos/bubblegum-realm.svg"),/<svg/);
 assert.match(read("public/miss-chaos-presence.js"),/miss-chaos-experience\.css/);
 assert.match(read("public/miss-chaos.html"),/miss-chaos-experience\.css/);
 const css=read("public/miss-chaos-experience.css");assert.match(css,/prefers-reduced-motion/);assert.match(css,/min-height:0;height:0/);
});
test("persona guidance supports casual conversation without compulsory task intake",()=>{
 const voice=read("backend/chaos-voice.mjs");
 assert.match(voice,/Match the user's energy/);
 assert.match(voice,/do not turn it into a task intake form/);
 assert.match(voice,/Never make someone earn kindness/);
});
