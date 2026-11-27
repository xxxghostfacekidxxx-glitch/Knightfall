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
 "knightfall-gothic-chrome.css",
 "knightfall-illustrated-realms.css",
 "knightfall-unified-theme.css",
 "theme-crew.css",
 "theme-crew-dashboard.css",
 "knightfall-requiem.css",
 "realm-theme-engine.css",
 "global-design-controls.css",
 "egyptian-eclipse-theme.css",
 "knightfall-art-theme-variables.css",
 "knightfall-art-theme-template.css",
 "home-responsive.css"
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
 assert.equal(important(read("egyptian-eclipse-theme.css")),0,"Egyptian Eclipse must not create forced override debt");
 assert.equal(important(read("knightfall-art-theme-variables.css")),0,"Generated themes must use proper scoped tokens");
 assert.equal(important(read("knightfall-art-theme-template.css")),0,"Art theme template cannot add forced overrides");
 assert.ok(important(read("theme-crew.css"))<=28,"Approved preset specificity must not grow");
 assert.ok(important(read("theme-crew-dashboard.css"))<=2,"Staff CSS should avoid forced declarations");
 assert.ok(important(read("knightfall-section-foundations.css"))<=14,"Foundation forced styles may only shrink");
 assert.ok(important(read("knightfall-gothic-chrome.css"))<=157,"Gothic overrides may only shrink");
 assert.ok(important(read("knightfall-illustrated-realms.css"))<=67,"Illustration overrides may only shrink");
 assert.ok(important(read("knightfall-unified-theme.css"))<=231,"Cathedral legacy sheet may only shrink");
 assert.ok(["knightfall-section-foundations.css","knightfall-gothic-chrome.css","knightfall-illustrated-realms.css","knightfall-unified-theme.css"].reduce((sum,file)=>sum+important(read(file)),0)<=468,"Combined legacy override total may only shrink");
 assert.ok(important(read("knightfall-requiem.css"))<=132,"Black Sun layer may only shrink");
 for(const text of [global,realm]){
  assert.doesNotMatch(text,/\bcanvas\s*\{/);
  assert.match(text,/:not\(\.profile-custom-theme\)/);
  assert.match(text,/:not\(\.kf-gameplay-page\)/);
 }
});

test("Moonology no longer forces an obsolete palette over published site themes",()=>{
 const lunar=read("knightfall-unified-theme.css");
 const start=lunar.indexOf("/* Moon: symbolic atmosphere");
 const end=lunar.indexOf("/* The Diary:",start);
 assert.ok(start>=0&&end>start);
 const block=lunar.slice(start,end);
 assert.doesNotMatch(block,/!important\b/);
 assert.match(block,/var\(--kf-realm-metal/);
 assert.match(block,/var\(--kf-realm-glow/);
 assert.match(block,/var\(--kf-global-panel-corner/);
});

test("Chaosphere owns its switched composer palette, without old global color overrides",()=>{
 const foundation=read("knightfall-section-foundations.css");
 const gothic=read("knightfall-unified-theme.css");
 assert.match(foundation,/--kf-msg-accent:var\(--kf-realm-metal/);
 assert.match(foundation,/\.messages-shell \.composer textarea\{background:var\(--kf-msg-base\)!important/);
 assert.match(foundation,/background:linear-gradient\(180deg,var\(--kf-msg-surface\),var\(--kf-msg-depth\)\)/);
 assert.doesNotMatch(gothic,/\.messages-shell \.composer\{\s*border-top-color:#8e7372/);
 assert.doesNotMatch(gothic,/\.messages-shell \.composer textarea\{\s*color:var\(--kf-bone\)!important;background:#16181e/);
});

test("installed PWA and edge cache recognize each CSS owner",()=>{
 const shell=read("sw.js"),headers=read("_headers");
 for(const file of ordered){
  assert.ok(shell.includes('"/'+file+'"'),"Missing offline cache entry: "+file);
  // Cloudflare Pages has a strict 100-header-rule limit. Newly authored Egyptian
  // layer is cache-versioned at its single canonical import, while PWA shell
  // revalidates theme.css. Do not add a 100th duplicate rule just for this asset.
  const named=headers.includes("/"+file+"\n  Cache-Control: no-cache");
  const group=file.startsWith("knightfall-")&&headers.includes("/knightfall-*\n  Cache-Control: no-cache");
  const versioned=(file==="egyptian-eclipse-theme.css"&&read("theme.css").includes('/egyptian-eclipse-theme.css?v=20261126-theme-owner2'))||
   (file==="home-responsive.css"&&read("theme.css").includes('/home-responsive.css?v=20261121-mobile1'));
  assert.ok(named||group||versioned,"Missing cache revalidation or pinned import version: "+file);
 }
});
