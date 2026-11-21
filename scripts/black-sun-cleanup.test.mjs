import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = file => readFileSync(new URL("../public/" + file, import.meta.url), "utf8");
const root = read("theme.css");
const final = read("knightfall-requiem.css");
const nav = read("nav.js");
const worker = read("sw.js");
const headers = read("_headers");
const count = (text, pattern) => [...text.matchAll(pattern)].length;

test("one mobile and one tablet navigation owner, without retired duplicate rules", () => {
  assert.equal(count(root, /@media\(max-width:760px\)/g), 1);
  assert.equal(count(root, /@media\(min-width:761px\) and \(max-width:1080px\)/g), 1);
  assert.doesNotMatch(root, /@media\(max-width:900px\) and \(min-width:761px\)/);
  assert.match(root, /\.kf-nav \[hidden\],\.kf-nav-menu \[hidden\]/);
  assert.match(root, /overscroll-behavior:contain/);
  assert.match(root, /\.kf-nav\.open\{display:grid\}/);
  assert.doesNotMatch(root, /rgba\(\s*178\s*,\s*91\s*,\s*104\s*,/);
  assert.match(root, /color-mix\(in srgb,var\(--kf-accent\)/);
});

test("Black Sun owns its readable headline and avoids the retired transparent ink", () => {
  assert.match(final, /BLACK SUN TEMPLE/);
  assert.match(final, /black-sun-temple\.svg/);
  assert.match(final, /black-sun-mobile\.svg/);
  assert.match(final, /eye-of-chaos-crest\.svg/);
  assert.match(final, /-webkit-text-fill-color:#f4c875!important/);
  assert.doesNotMatch(final, /-webkit-text-fill-color:transparent/);
  assert.doesNotMatch(final, /#80415f|#38273f|sanctum-stained-glass\.svg/);
  assert.match(final, /forced-colors:active/);
  assert.match(final, /-webkit-text-fill-color:CanvasText!important;color:CanvasText!important/);
  assert.match(final, /prefers-reduced-motion:reduce/);
  assert.equal(count(final, /\.home-intro \.home-sign-in\{/g), 1);
  assert.equal(count(final, /\.home-intro \.home-explore-link\{/g), 1);
});

test("Black Sun styling respects private palettes and hosted game canvas isolation", () => {
  assert.match(final, /:not\(\.profile-custom-theme\)/);
  assert.match(final, /:not\(:has\(#profile\[data-theme\]\)\)/);
  assert.match(final, /:not\(\.kf-gameplay-page\)/);
  assert.match(final, /:not\(\.chaos-glitch-arcade\)/);
  assert.doesNotMatch(final, /(^|\})\s*canvas\s*\{/m);
  assert.match(nav, /kfCanonicalTheme/);
  assert.match(root, /@import url\("\/knightfall-requiem\.css\?v=/);
});

test("illustrations exist locally, have accessible descriptions and are cached offline", () => {
  for(const asset of ["black-sun-temple.svg","black-sun-mobile.svg","eye-of-chaos-crest.svg","royal-cartouche.svg"]){
    const svg = read("assets/knightfall/" + asset);
    assert.match(svg, /<svg[^>]*viewBox=/, asset);
    assert.match(svg, /aria-label=/, asset);
    assert.match(svg, /<\/svg>/, asset);
    assert.ok(worker.includes('"/assets/knightfall/' + asset + '"'), asset);
  }
  assert.match(headers, /^\/assets\/knightfall\/\*$/m);
  assert.match(worker, /const CACHE_NAME = "knightfall-shell-v\d+"/);
});


test("Egyptian theme uses canonical amber and ember tokens instead of disconnected copies",()=>{
 assert.match(final,/--section-green:var\(--af-ember-light\)/);
 assert.match(final,/--section-pink:var\(--af-ember\)/);
 assert.match(final,/outline-color:var\(--af-ember-light\)/);
 assert.match(final,/--af-ember:#b95d35;--af-ember-light:#ecc17a/);
});
test("core theme CSS growth is bounded until scope and specificity are simplified",()=>{
 const shared=read("knightfall-section-foundations.css")+"\n"+read("knightfall-unified-theme.css");
 const countImportant=s=>(s.match(/!important\b/g)||[]).length;
 assert.ok(shared.length<=105000,"Canonical shared theme grew beyond reviewed budget; consolidate before expanding");
 assert.ok(countImportant(shared)<=500,"Canonical theme specificity budget exceeded");
 assert.ok(final.length<=22000,"Black Sun finishing layer grew too large; consolidate rather than append");
 assert.ok(countImportant(final)<=145,"Black Sun important-rule budget exceeded");
});


test("Black Sun default chrome no longer falls back to inherited magenta or stained-glass artwork",()=>{
 assert.doesNotMatch(final, /rose-window\.svg|#b4588c44|#a4507c19|#d67aa142/);
 assert.match(final, /--kf-start-art,url\('\/assets\/knightfall\/black-sun-temple\.svg'\)/);
 assert.match(final, /0 0 24px #b95d3544!important/);
 assert.match(root, /knightfall-requiem\.css\?v=20261120-black-sun6/);
});

test("profile foundation selectors keep their guard with lower specificity",()=>{
 const shared=read("knightfall-section-foundations.css")+"\n"+read("knightfall-unified-theme.css");
 const foundation=shared.slice(0,shared.indexOf("@media(max-width:800px){"));
 assert.ok(foundation.includes("body:where(:not(.profile-custom-theme)) .profile-shell .card"));
 const lowered=[...foundation.matchAll(/body:where\(:not\(\.profile-custom-theme\)\) \.profile-shell/g)];
 assert.equal(lowered.length,4,"only the reviewed four base profile rules are softened");
 assert.doesNotMatch(foundation,/body:not\(\.profile-custom-theme\) \.profile-shell/);
 // Leave member-created custom palettes and game-specific styling exclusions intact.
 assert.match(shared,/:not\(\.profile-custom-theme\)/);
 assert.match(shared,/:not\(:has\(#profile\[data-theme\]\)\)/);
});


test("Black Sun mobile rules have no redundant narrow breakpoint or duplicate forced color blocks",()=>{
 const start=final.indexOf("@media(max-width:520px){");
 const end=final.indexOf("\n@media(",start+1);
 assert.ok(start>0&&end>start,"Expected narrow breakpoint to remain");
 const narrow=final.slice(start,end);
 assert.doesNotMatch(narrow,/\.home-intro\{\s*min-height:0!important/);
 assert.equal((final.match(/@media\(forced-colors:active\)/g)||[]).length,1);
 assert.match(final,/\.home-intro::after\{display:none!important\}/);
 assert.match(final,/@media\(max-width:780px\)\{[\s\S]*?\.home-intro\{[\s\S]*?min-height:0!important/);
});


test("Black Sun compact cartouche inherits identical side coordinates instead of repeating them",()=>{
 const match=final.match(/@media\(max-width:420px\)\{([\s\S]*?)\n\}/);
 assert.ok(match,"Compact 420px design rule exists");
 assert.match(match[1],/\.home-intro::after\{\s*height:28px;opacity:\.65/);
 assert.doesNotMatch(match[1],/right:5%|left:5%|width:90%/);
 const tablet=final.match(/@media\(max-width:780px\)\{([\s\S]*?)\n\}/);
 assert.match(tablet?.[1]||"",/inset:auto 5% 8px;width:90%;height:35px;opacity:\.7/);
});
