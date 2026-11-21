import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {THEME_CREW_PRESETS,themePlan} from "../backend/src/theme-crew.js";

const root=fileURLToPath(new URL("../",import.meta.url));
const read=path=>readFileSync(resolve(root,path),"utf8");
const base="/assets/knightfall/theme-collections/egyptian-eclipse/";
const pngs=JSON.parse(read("public/assets/knightfall/theme-collections/manifest.json")).assets.filter(a=>a.collection==="egyptian-eclipse");
const svg=JSON.parse(read("public/assets/knightfall/theme-collections/ornaments.json")).assets.filter(a=>a.collection==="egyptian-eclipse");
const sheet=read("public/egyptian-eclipse-theme.css"),home=read("public/index.html");

test("Egyptian Eclipse exists as approved switchable, published and reversible realm preset",()=>{
 assert.ok(Object.hasOwn(THEME_CREW_PRESETS,"egyptian_eclipse"));
 assert.equal(THEME_CREW_PRESETS.egyptian_eclipse.name,"Egyptian Eclipse");
 assert.equal(themePlan("egyptian temple with turquoise and anubis").preset,"egyptian_eclipse");
 const known=read("public/theme-crew-runtime.js");
 assert.ok(known.includes('"egyptian_eclipse"'));
 assert.match(known,/kf_theme_preview/);
 const ui=read("public/theme-crew-ui.js");
 assert.match(ui,/egyptian_eclipse:"\/assets\/knightfall\/theme-collections\/egyptian-eclipse\/egyptian-eclipse-temple-gateway.png"/);
 assert.match(read("backend/src/theme-crew.js"),/expectedRevision!==state.revision/);
 assert.match(read("backend/src/theme-crew.js"),/acceptedAdminPartner\(env,user\)/);
});

test("canonical cascade has exactly one Egyptian module last, isolated from obsolete important selectors",()=>{
 const rootCss=read("public/theme.css");
 const imports=[...rootCss.matchAll(/@import\s+url\(["']?\/([^"'?)]+)(?:\?[^)"']*)?["']?\);/g)].map(m=>m[1]);
 assert.equal(imports.at(-1),"egyptian-eclipse-theme.css");
 assert.equal(imports.filter(x=>x==="egyptian-eclipse-theme.css").length,1);
 assert.doesNotMatch(sheet,/!important\b/);
 assert.match(sheet,/data-kf-theme="egyptian_eclipse"/);
 assert.match(sheet,/:not\(\.profile-custom-theme\)/);
 assert.match(sheet,/:not\(\.kf-gameplay-page\)/);
 assert.doesNotMatch(sheet,/\bcanvas\s*\{/);
 assert.doesNotMatch(sheet,/\.message-bubble\s*\{/);
 const historic=read("public/theme-crew.css");
 assert.match(historic,/:not\(\[data-kf-theme="cathedral"\]\):not\(\[data-kf-theme="egyptian_eclipse"\]\)/);
 assert.match(read("public/sw.js"),/"\/egyptian-eclipse-theme.css"/);
 // The 4 full-resolution paintings should NOT be preloaded to every PWA installation.
 assert.doesNotMatch(read("public/sw.js"),/\/theme-collections\/egyptian-eclipse\/.*\.png/);
});

test("all four original PNGs are used by the selected site theme without changing historical originals",()=>{
 assert.equal(pngs.length,4);
 const roles=new Set(pngs.map(a=>a.role));
 assert.ok(roles.has("hero")&&roles.has("concept"));
 for(const entry of pngs){
  const path="public"+entry.path,bytes=readFileSync(resolve(root,path));
  assert.ok(existsSync(resolve(root,path)),path);
  assert.equal(bytes.length,entry.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sha256);
  assert.ok(sheet.includes(entry.path)||home.includes(entry.path),"Painting not connected to selected site: "+entry.path);
 }
 assert.match(home,/class="kf-egyptian-feature"/);
 assert.match(home,/class="kf-egyptian-pavilion"/);
 assert.match(home,/id="egyptian-eclipse-art-title"/);
 assert.match(home,/loading="lazy"/);
 assert.match(sheet,/\.kf-egyptian-feature,\.kf-egyptian-pavilion\{display:none\}/);
 assert.match(sheet,/body\.home-page\[data-kf-theme="egyptian_eclipse"\]/);
});

test("all eight original SVG roles appear in live Egyptian chrome, not just the Foundry gallery",()=>{
 assert.equal(svg.length,8);
 const expected=["header","frame","divider","corner","emblem","panel","button","side-rail"];
 assert.deepEqual(svg.map(x=>x.role).sort(),expected.sort());
 for(const a of svg){
  assert.ok(existsSync(resolve(root,"public"+a.path)),"Missing vector "+a.role);
  assert.ok(sheet.includes(a.path)||home.includes(a.path),"Unused live theme SVG: "+a.role);
  const raw=read("public"+a.path);
  assert.match(raw,/<svg\b/);assert.match(raw,/<title\b/);assert.match(raw,/<\/svg>/);
  assert.doesNotMatch(raw,/<script\b|<foreignObject\b|onload\s*=/i);
 }
 assert.match(sheet,/pointer-events:none/);
 assert.match(sheet,/@media\(max-width:580px\)/);
 assert.match(sheet,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(sheet,/@media\(forced-colors:active\)/);
});
