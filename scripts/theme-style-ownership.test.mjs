import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const publicDir=fileURLToPath(new URL("../public/",import.meta.url));
const read=file=>readFileSync(join(publicDir,file),"utf8");
const ordered=[
 "design-system.css",
 "visual-refresh.css",
 "knightfall-section-foundations.css",
 "knightfall-section-foundations.css",
 "knightfall-unified-theme.css",
 "theme-crew.css",
 "theme-crew-dashboard.css",
 "knightfall-requiem.css",
 "realm-theme-engine.css",
 "global-design-controls.css"
];
const important=css=>(css.match(/!important\b/g)||[]).length;

test("one canonical, ordered CSS owner for shared chrome, realm recipes and staff editor",()=>{
 const root=read("theme.css");
 const imports=[...root.matchAll(/@import\s+url\(["']?\/([^"'?)]+)(?:\?[^)"']*)?["']?\);/g)].map(x=>x[1]);
 assert.deepEqual(imports,ordered,"Shared CSS imports must stay single and in reviewed order");
 assert.equal(new Set(imports).size,imports.length);
 assert.match(read("theme-crew.css"),/data-kf-theme="blood_moon"/);
 assert.doesNotMatch(read("theme-crew.css"),/\.theme-crew-(?:panel|header|choice|workspace|presets)\s*\{/,
  "Preset recipes cannot own staff dashboard layouts");
 const staff=read("theme-crew-dashboard.css");
 for(const token of [".theme-crew-header",".theme-crew-panel",".theme-crew-choice",".theme-crew-workspace"])
  assert.ok(staff.includes(token),"Staff CSS needs "+token);
 assert.doesNotMatch(staff,/data-kf-theme="(?:cathedral|blood_moon|verdant_crypt|iron_eclipse|royal_abyss)"/,
  "Staff UI CSS may not choose a sitewide palette");
});

test("no top-level page duplicates theme.css or directly loads its internal layers",()=>{
 const internal=new Set(ordered);
 for(const name of readdirSync(publicDir).filter(name=>name.endsWith(".html"))){
  const html=read(name);
  const links=[...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi)];
  const urls=links.map(m=>m[0].match(/\bhref=["']([^"']+)/i)?.[1]).filter(Boolean);
  const cssNames=urls.filter(href=>href.startsWith("/")&&!href.startsWith("//"))
   .map(href=>href.split(/[?#]/)[0].slice(1));
  const rootCount=cssNames.filter(x=>x==="theme.css").length;
  assert.ok(rootCount<=1,name+" includes multiple theme.css links");
  if(!rootCount)continue;
  for(const nameOfImport of cssNames.filter(x=>internal.has(x)))
   assert.fail(name+" directly imports "+nameOfImport+" AND theme.css");
 }
});

test("new global and realm architecture does not grow fresh forced overrides",()=>{
 const global=read("global-design-controls.css"),realm=read("realm-theme-engine.css");
 assert.equal(important(global),0,"Global controls should use ordinary scoped declarations");
 assert.equal(important(realm),0,"Realm boundaries should not become a new important war");
 assert.ok(important(read("theme-crew.css"))<=28,"Approved preset specificity must not grow");
 assert.ok(important(read("theme-crew-dashboard.css"))<=2,"Staff CSS should avoid forced declarations");
 assert.ok(important(read("knightfall-section-foundations.css"))<=14,"Foundation forced styles may only shrink");
 assert.ok(important(read("knightfall-unified-theme.css"))<=468,"Old monolith may only shrink");
 assert.ok(important(read("knightfall-section-foundations.css"))+important(read("knightfall-unified-theme.css"))<=482,"Legacy shared override total may only shrink");
 assert.ok(important(read("knightfall-requiem.css"))<=132,"Black Sun layer may only shrink");
 for(const text of [global,realm]){
  assert.doesNotMatch(text,/\bcanvas\s*\{/);
  assert.match(text,/:not\(\.profile-custom-theme\)/);
  assert.match(text,/:not\(\.kf-gameplay-page\)/);
 }
});

test("installed PWA and edge cache recognize each CSS owner",()=>{
 const shell=read("sw.js"),headers=read("_headers");
 for(const file of ordered){
  assert.ok(shell.includes('"/'+file+'"'),"Missing offline cache entry: "+file);
  assert.ok(headers.includes("/"+file+"\n  Cache-Control: no-cache"),"Missing cache revalidation: "+file);
 }
});
