import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {signs,transliterate,readGlyphs,pickSign,soundSamples,voiceFor} from "../public/language-core.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("all Egyptian uniliteral signs round-trip and unsupported input is explicit",()=>{
 assert.equal(signs.length,24);assert.equal(new Set(signs.map(s=>s[2])).size,24);
 for(const [reading,,glyph] of signs){assert.deepEqual(transliterate(reading),{text:glyph,unknown:[]});assert.deepEqual(readGlyphs(glyph),{text:reading,unknown:[]});}
 assert.equal(transliterate("m n r").text,"𓅓 𓈖 𓂋");
 assert.deepEqual(transliterate("x"),{text:"□",unknown:["x"]});
 assert.equal(transliterate("h\u0323").text,"𓎛");
 assert.throws(()=>pickSign(-1));assert.throws(()=>pickSign(24));
});
test("sound samples prefer exact locale, never substitute unrelated language",()=>{
 assert.equal(soundSamples.length,6);
 assert.equal(voiceFor([{lang:"en-US"}],"de-DE"),null);
 assert.equal(voiceFor([{lang:"de-AT"},{lang:"de-DE"}],"de-DE").lang,"de-DE");
 assert.equal(voiceFor([{lang:"de-AT"}],"de-DE").lang,"de-AT");
});
test("independent sections expose complete source inventories and anchors",()=>{
 for(const [page,count] of [["philosophy",25],["nietzsche",29],["languages",0]]){
  const h=read("public/"+page+".html"),ids=[...h.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal((h.match(/data-study-record/g)||[]).length,count);
  for(const [,id] of h.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(id));
 }
 const h=read("public/languages.html"),js=read("public/language-studio.mjs");
 for(const [,id] of js.matchAll(/\$\("([^"]+)"\)/g))assert.ok(h.includes('id="'+id+'"'),id);
 for(const path of ["public/nav.js","public/index.html"]){const source=read(path);assert.ok(source.includes('/philosophy.html'));assert.ok(source.includes('/languages.html'));}
});
