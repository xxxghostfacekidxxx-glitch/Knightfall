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
