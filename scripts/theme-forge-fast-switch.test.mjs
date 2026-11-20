import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {THEME_CREW_PRESETS} from "../backend/src/theme-crew.js";
const text=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const home=text("public/index.html");
const visual=text("public/knightfall-requiem.css");
const deck=text("public/theme-crew.html");
const ui=text("public/theme-crew-ui.js");
const css=text("public/theme-crew.css");
const runtime=text("public/theme-crew-runtime.js");
const root=text("public/theme.css");
const worker=text("public/sw.js");
const backend=text("backend/src/theme-crew.js");
const asset=new URL("../public/assets/knightfall/black-sun-hero-illustration.webp",import.meta.url);

test("original Egyptian hero is self-hosted, small, readable and accessible",()=>{
 const image=readFileSync(asset);
 assert.ok(image.length>20000 && image.length<150000,"Hero must be optimized for mobile");
 assert.equal(image.toString("ascii",0,4),"RIFF");
 assert.equal(image.toString("ascii",8,12),"WEBP");
 assert.match(home,/class="kf-black-sun-art"/);
 assert.match(home,/src="\/assets\/knightfall\/black-sun-hero-illustration\.webp"/);
 assert.match(home,/alt="Knightfall[^"]*Anubis guardians/);
 assert.match(home,/width="1200" height="675"/);
 assert.match(home,/fetchpriority="high"/);
 assert.ok(home.indexOf("kf-black-sun-art")<home.indexOf('id="home-title"'),"Art should precede the title");
 assert.match(visual,/\.kf-black-sun-art img\{/);
 assert.match(visual,/\.kf-black-sun-art\{display:none!important\}/);
 assert.match(visual,/:not\(\.profile-custom-theme\)/);
 assert.match(worker,/\/assets\/knightfall\/black-sun-hero-illustration\.webp/);
});

test("Theme Forge has accessible one-click preview and stable staff controls",()=>{
 for(const id of ["theme-crew-presets","theme-crew-preview","theme-crew-copy-preview",
  "theme-crew-publish","theme-crew-revert-preview","theme-crew-rollback",
  "theme-crew-selected","theme-crew-current"])
  assert.ok(deck.includes('id="'+id+'"'),"Missing control "+id);
 assert.match(ui,/const PREVIEW_ART=Object\.freeze/);
 assert.match(ui,/KnightfallThemeCrew\?\.preview\?\.\(preset===current\?\.preset\?null:preset\)/);
 assert.match(ui,/theme-crew-presets"\)\.addEventListener\("keydown"/);
 assert.match(ui,/navigator\.clipboard\.writeText/);
 assert.match(ui,/theme-crew-scene/);
 assert.match(ui,/announcePublished\?\.\(current\.revision\)/);
 assert.match(css,/\.theme-crew-scene\{/);
 assert.match(css,/\.theme-crew-header[\s\S]*?black-sun-hero-illustration\.webp/);
 assert.match(css,/\.theme-crew-choice:focus-visible/);
});

test("fast switching reuses the vetted API with rollback and revision protection",()=>{
 assert.match(runtime,/BroadcastChannel\("kf:theme-published"\)/);
 assert.match(runtime,/LIVE_CACHE/);
 assert.match(runtime,/if\(pendingRefresh\)return pendingRefresh/);
 assert.match(runtime,/channel\?\.addEventListener\("message"/);
 assert.match(runtime,/window\.setInterval\(refresh,20000\)/);
 assert.match(runtime,/Number\.isSafeInteger\(revision\)/);
 assert.match(runtime,/PREVIEW="kf:theme-crew-preview"/);
 assert.match(runtime,/arcade\\\/hosted/);
 assert.match(backend,/expectedRevision!==state\.revision/);
 assert.match(backend,/!allowedOrigin\.has\(request\.headers\.get\("Origin"\)\)/);
 assert.match(backend,/acceptedAdminPartner\(env,user\)/);
 assert.match(backend,/UPDATE site_settings SET value=/);
 assert.match(root,/\/theme-crew\.css\?v=20261120-theme-forge1/);
});

test("new visual identity does not introduce game canvas or custom profile overrides",()=>{
 for(const cssText of [visual,css]){
  assert.match(cssText,/:not\(\.profile-custom-theme\)/);
  assert.match(cssText,/:not\(\.kf-gameplay-page\)/);
  assert.doesNotMatch(cssText,/\bcanvas\s*\{/);
 }
});


test("backend presets, runtime allowlist and local preview assets never drift apart",()=>{
 const allowed=Object.keys(THEME_CREW_PRESETS).sort();
 const known=runtime.match(/const KNOWN=new Set\((\[[^\n)]+\])\)/);
 assert.ok(known,"Browser must keep an explicit vetted allowlist");
 assert.deepEqual(JSON.parse(known[1]).sort(),allowed);
 const block=ui.match(/const PREVIEW_ART=Object\.freeze\(\{([\s\S]*?)\}\);/);
 assert.ok(block,"Theme Forge must declare all preview thumbnails");
 const previews=[...block[1].matchAll(/^\s*([a-z_]+):"(\/assets\/knightfall\/[^"]+)"[,\s]*$/gm)];
 assert.deepEqual(previews.map(x=>x[1]).sort(),allowed);
 for(const [,key,file] of previews)readFileSync(new URL("../public"+file,import.meta.url));
 for(const key of allowed){
  assert.ok(css.includes('data-kf-theme="'+key+'"') || (key==="cathedral"&&visual.includes('data-kf-theme="cathedral"')),
   "Missing presentation recipe for "+key);
 }
});
