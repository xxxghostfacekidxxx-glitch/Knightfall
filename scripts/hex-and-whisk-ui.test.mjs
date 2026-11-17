import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {renderPage} from "./build-arcade-catalog.mjs";
const root=new URL("../public/",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const prefix="arcade/hosted/hex-and-whisk/";
const page=read(prefix+"index.html");
const script=read(prefix+"game.js");
const stylesheet=read(prefix+"game.css");
const icons=read(prefix+"sprites/icons.svg");
const catalog=JSON.parse(read("arcade/catalog.json"));
test("Hex & Whisk launches from the generated canonical arcade and has one original game id",()=>{
 const entry=catalog.games.filter(g=>g.id==="hex-and-whisk");
 assert.equal(entry.length,1);assert.equal(entry[0].collection,"games");assert.equal(entry[0].device,"touch");
 assert.equal(entry[0].featured,true);
 assert.equal(read("chaos-cartridge.html"),renderPage(false));
 assert.match(read("chaos-cartridge.html"),/data-game-id="hex-and-whisk"/);
 for(const asset of ["index.html","game.css","game.js","engine.mjs","sprites/icons.svg","SOURCE.md"])
  assert.ok(existsSync(new URL(prefix+asset,root)),"Missing offline asset: "+asset);
});
test("game uses original vector cooking pieces and accessible touch/keyboard semantics",()=>{
 assert.match(page,/role="grid"/);
 assert.match(page,/aria-live="polite"/);
 assert.match(page,/id="energy-track"/);
 assert.match(page,/href="\.\/sprites\/icons\.svg#garden-6"/);
 assert.match(page,/issues\/new\?title=/);
 assert.match(stylesheet,/\.order-card:disabled\{opacity:1/);
 assert.match(script,/pointerdown/);assert.match(script,/pointermove/);assert.match(script,/pointerup/);
 assert.match(script,/setPointerCapture/);
 assert.match(script,/keydown/);assert.match(script,/function tapCell/);
 assert.match(script,/cloud-save/);assert.match(script,/cloud-load/);
 assert.match(script,/recordScore\("hex-and-whisk"/);
 assert.match(script,/sprites\/icons\.svg#/);
 assert.match(stylesheet,/prefers-reduced-motion:reduce/);
 assert.match(stylesheet,/max-width:600px/);
 assert.match(stylesheet,/\.spark\{/);
 assert.doesNotMatch(page,/<script[^>]*src="https?:/i);
 assert.doesNotMatch(stylesheet,/@import\s+url\(https?:/i);
});
test("all 21 original illustrated food tiers ship without external image requests",()=>{
 const symbols=[...icons.matchAll(/<symbol id="([a-z]+-[1-7])"/g)].map(x=>x[1]);
 assert.equal(symbols.length,21);
 for(const chain of ["garden","bakery","sweets"])for(let tier=1;tier<=7;tier++)assert.ok(symbols.includes(chain+"-"+tier));
 assert.match(icons,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.doesNotMatch(icons,/<script\b|onload\s*=|href="https?:/i);
});
test("the offline shell and authenticated arcade registry both know the new game",()=>{
 const sw=read("sw.js"),backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
 assert.match(sw,/knightfall-shell-v68/);
 for(const asset of ["index.html","game.css","game.js","engine.mjs","sprites/icons.svg"])assert.ok(sw.includes("/"+prefix+asset),"Offline shell missing "+asset);
 assert.match(backend,/"hex-and-whisk"/);
 assert.match(backend,/"hex-and-whisk":1000000000/);
 const original=JSON.parse(read("arcade/original-creations.json")).games.find(x=>x.id==="hex-and-whisk");
 assert.ok(original);assert.equal(original.assets[0].path,"/"+prefix+"sprites/icons.svg");
});
