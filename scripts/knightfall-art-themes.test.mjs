import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {execFileSync} from "node:child_process";
import {Script} from "node:vm";
import {THEME_CREW_PRESETS,themePlan} from "../backend/src/theme-crew.js";

const root=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(resolve(root,p),"utf8");
const recipes=JSON.parse(read("public/assets/knightfall/theme-collections/theme-recipes.json"));
const images=JSON.parse(read("public/assets/knightfall/theme-collections/manifest.json")).assets;
const vectors=JSON.parse(read("public/assets/knightfall/theme-collections/ornaments.json")).assets;
const original=["egyptian_eclipse","dark_lord_ascendant","korriban_necropolis","mustafar_forge"];
const extended=original.slice(1),roles=["header","frame","divider","corner","emblem","panel","button","side-rail"];
const vars=read("public/knightfall-art-theme-variables.css");
const styles=read("public/knightfall-art-theme-template.css");
const backend=read("backend/src/theme-crew.js");
const runtime=read("public/theme-crew-runtime.js");
const ui=read("public/theme-crew-ui.js");

test("all four first-party collections are fully registered and can be published or rolled back with existing authorization",()=>{
 assert.deepEqual(recipes.themes.slice(0,4).map(x=>x.preset),original);
 assert.equal(Object.keys(THEME_CREW_PRESETS).length,5+recipes.themes.length);
 const known=runtime.match(/const KNOWN=new Set\((\[[^\n)]+\])\)/);
 assert.ok(known);
 assert.deepEqual(JSON.parse(known[1]).sort(),Object.keys(THEME_CREW_PRESETS).sort());
 for(const kit of recipes.themes){
  assert.ok(THEME_CREW_PRESETS[kit.preset],kit.preset+" missing authorized preset");
  assert.equal(THEME_CREW_PRESETS[kit.preset].name,kit.name);
  assert.ok(ui.includes(kit.preset+':"'+"/assets/knightfall/theme-collections/"+kit.collection+"/"),"Missing thumbnail "+kit.preset);
 }
 for(const preset of extended)assert.match(runtime,new RegExp('"'+preset+'"'));
 assert.match(runtime,/dataset\.kfArtTheme=String\(ART_KITS\.has\(chosen\)\)/);
 assert.match(backend,/expectedRevision!==state\.revision/);
 assert.match(backend,/acceptedAdminPartner\(env,user\)/);
 assert.equal(themePlan("dark lord crimson citadel").preset,"dark_lord_ascendant");
 assert.equal(themePlan("Korriban ancient tomb").preset,"korriban_necropolis");
 assert.equal(themePlan("Mustafar molten volcanic fortress").preset,"mustafar_forge");
});

test("all four designs preserve their original paintings and eight unique SVG ornaments",()=>{
 const expected=new Set(roles);
 for(const theme of recipes.themes){
  const group=images.filter(x=>x.collection===theme.collection),svg=vectors.filter(x=>x.collection===theme.collection);
  assert.equal(group.length,theme.showcase.length,theme.collection+" missing image(s)");
  assert.deepEqual(new Set(svg.map(x=>x.role)),expected,theme.collection+" ornament roles");
  assert.equal(svg.length,8);
  for(const img of group){
   const file=resolve(root,"public"+img.path);
   assert.ok(existsSync(file),img.path);
   const bytes=readFileSync(file);
   assert.equal(bytes.length,img.bytes,img.path+" byte integrity");
   assert.equal(createHash("sha256").update(bytes).digest("hex"),img.sha256,img.path+" original SHA");
  }
  for(const item of svg){
   assert.ok(existsSync(resolve(root,"public"+item.path)),item.path);
   assert.match(read("public"+item.path),/<\/svg>\s*$/);
   assert.doesNotMatch(read("public"+item.path),/<script\b|onload\s*=|foreignObject\b/i);
   if(!theme.legacyStandalone)assert.ok(vars.includes(item.path),"Generated kit omits "+item.path);
  }
  for(const pic of theme.showcase)
   assert.ok(group.some(x=>x.path.endsWith("/"+pic)),theme.collection+" missing "+pic);
 }
});

test("new art visual engine reuses one module without intrusive CSS or unsafe HTML injection",()=>{
 assert.ok(!styles.includes("!important"));
 assert.ok(!vars.includes("!important"));
 for(const css of [styles,vars]){
  assert.doesNotMatch(css,/\bcanvas\s*\{|\.message-bubble\s*\{|\biframe\s*\{/);
  assert.doesNotMatch(css,/https?:\/\//);
  assert.match(css,/:not\(\.profile-custom-theme\)/);
  assert.match(css,/:not\(\.kf-gameplay-page\)/);
 }
 for(const role of roles)assert.ok(styles.includes("var(--kf-kit-"+role+")"),"Unused vector role "+role);
 for(const key of extended)assert.ok(vars.includes('data-kf-theme="'+key+'"'));
 const rootCss=read("public/theme.css");
 const imports=[...rootCss.matchAll(/@import\s+url\(["']?\/([^"'?)]+)(?:\?[^)"']*)?["']?\);/g)].map(x=>x[1]);
 assert.deepEqual(imports.slice(-3),["egyptian-eclipse-theme.css","knightfall-art-theme-variables.css","knightfall-art-theme-template.css"]);
 const fallback=read("public/theme-crew.css");
 for(const preset of extended)assert.match(fallback,new RegExp(':not\\(\\[data-kf-theme="'+preset+'"\\]\\)'));
 const home=read("public/index.html"),gallery=read("public/knightfall-art-theme-showcase.js");
 for(const s of ['id="kf-theme-art-showcase"','id="kf-theme-art-showcase-grid"','knightfall-art-theme-showcase.js'])assert.ok(home.includes(s));
 assert.doesNotThrow(()=>new Script(gallery));
 assert.match(gallery,/kf:theme-change/);assert.match(gallery,/textContent/);
 assert.match(gallery,/gallery\.replaceChildren/);
 assert.doesNotMatch(gallery,/innerHTML\s*=/);
});

test("one editable artwork recipe compiles to the exact committed variable stylesheet without drift",()=>{
 const result=execFileSync(process.execPath,[resolve(root,"scripts/build-knightfall-theme-kits.mjs"),"--check"],{cwd:root,encoding:"utf8"});
 assert.match(result,/ART THEME TEMPLATE CHECK PASS: 4 reviewed recipes/);
 const shell=read("public/sw.js");
 assert.match(shell,/"\/knightfall-art-theme-variables.css"/);
 assert.match(shell,/"\/knightfall-art-theme-template.css"/);
 assert.doesNotMatch(shell,/\/theme-collections\/(?:korriban|mustafar|dark-lord-ascendant)\/[^"\n]+\.png/);
 const foundry=read("public/devil-tools.html");
 assert.match(foundry,/theme-blueprint-template\.json/);
 assert.match(foundry,/href="\/theme-crew\.html"/);
 assert.match(read("public/theme-crew.html"),/Dark Lord Ascendant/);
 const blueprint=JSON.parse(read("public/assets/knightfall/theme-collections/theme-blueprint-template.json"));
 assert.equal(blueprint.legacyStandalone,false);
 assert.deepEqual(blueprint.requiredSvgRoles,roles);
 assert.match(read("scripts/scaffold-knightfall-theme.mjs"),/already registered/);
});
