import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {dirname,resolve,sep} from "node:path";
import {Script} from "node:vm";
const root=resolve("public");
const manifest=JSON.parse(readFileSync(resolve(root,"arcade/original-creations.json"),"utf8"));
const pending=manifest.games.filter(g=>/provenance/.test(g.status)&&!/engine replacement/.test(g.status));
test("provenance audit selects only genuinely pending entries",()=>{assert.ok(pending.length>0);assert.ok(pending.every(g=>/provenance/.test(g.status)))});
for(const game of pending){
 test(game.id+" is self-hosted and has syntactically valid inline gameplay",()=>{
  const page=resolve(root,"arcade/hosted",game.id,"index.html");
  assert.ok(existsSync(page),game.id+" page missing");
  const html=readFileSync(page,"utf8");
  assert.doesNotMatch(html,/<iframe\b/i,"Remote frame not allowed in first-party arcade");
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  for(const [i,m] of scripts.entries()){
   const src=m[1].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
   if(src){
    assert.ok(!/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(src)&&!/^[a-z][a-z0-9+.-]*:/i.test(src),"Remote script in "+game.id+": "+src);
    const scriptPath=src.startsWith("/")?resolve(root,"."+src.split(/[?#]/)[0]):resolve(dirname(page),src.split(/[?#]/)[0]);
    assert.ok(scriptPath.startsWith(root+sep),"Script escapes public assets in "+game.id+": "+src);
    assert.ok(existsSync(scriptPath),"Missing local script "+src);
   }else if(!/type\s*=\s*["']application\/(?:json|ld\+json)/i.test(m[1])){
    assert.doesNotThrow(()=>new Script(m[2],{filename:game.id+" inline "+i}),"Invalid inline script in "+game.id);
   }
  }
  assert.ok(scripts.length>0,"Game has no JavaScript");
 });
}
