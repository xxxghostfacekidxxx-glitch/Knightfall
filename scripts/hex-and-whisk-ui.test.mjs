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
 assert.match(page,/id="quest-list"/);
 assert.match(page,/id="recipe-book"/);
 assert.match(page,/id="whisk"/);
 assert.match(page,/id="hint"/);
 assert.match(page,/id="next-whisk"/);
 assert.match(page,/id="shelf"/);
 assert.match(page,/id="refresh-order"/);
 assert.match(script,/refreshOrder\\(game/);
 assert.match(page,/id="shelf-counter"/);
 assert.match(script,/function renderShelf/);
 assert.match(script,/function tapShelf/);
 assert.match(script,/function parkIngredient/);
 assert.match(script,/function retrieveIngredient/);
 assert.match(script,/function shelfAt/);
 assert.match(stylesheet,/\.shelf-slot/);
 assert.match(stylesheet,/\.shelf-panel/);
 assert.match(page,/id="patron-bat"/);
 assert.match(page,/id="patron-ghost"/);
 assert.match(page,/id="patron-imp"/);
 assert.match(page,/id="patron-witch"/);
 assert.match(page,/src="\.\/game\.js\?v=13"/);
 assert.match(page,/href="\.\/game\.css\?v=13"/);
 assert.match(script,/function showMergeHint/);
 assert.match(script,/function useMagicWhisk/);
 assert.match(script,/magicWhisk\(game/);
 assert.match(script,/findMergePair\(game/);
 assert.match(stylesheet,/\.slot\.hint-source/);
 assert.match(stylesheet,/\.magic-actions/);
 assert.match(page,/id="discovery-count"/);
 assert.match(script,/function renderQuests/);
 assert.match(script,/function renderCookbook/);
 assert.match(script,/claimQuest\(game,kind/);
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
 assert.match(stylesheet,/\.quest-card\.complete\{/);
 assert.match(stylesheet,/\.recipe-grid\{/);
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
 assert.match(sw,/knightfall-shell-v72/);
 assert.match(sw,/if \(url\.pathname === "\/arcade\/hosted\/hex-and-whisk\/index\.html"\)/);
 assert.match(sw,/caches\.match\("\/arcade\/hosted\/hex-and-whisk\/index\.html", \{ ignoreSearch: true \}\)/);
 for(const asset of ["index.html","game.css","game.js","engine.mjs","sprites/icons.svg"])assert.ok(sw.includes("/"+prefix+asset),"Offline shell missing "+asset);
 assert.match(backend,/"hex-and-whisk"/);
 assert.match(backend,/"hex-and-whisk":1000000000/);
 const original=JSON.parse(read("arcade/original-creations.json")).games.find(x=>x.id==="hex-and-whisk");
 assert.ok(original);assert.equal(original.assets[0].path,"/"+prefix+"sprites/icons.svg");
});

test("kitchen keeps running with an older cached HTML shell and avoids redrawing unchanged recipe art",()=>{
 assert.match(script,/if\(!list\)return/);
 assert.match(script,/if\(!book\|\|!counter\)return/);
 assert.match(script,/lastCookbookSignature/);
 assert.match(script,/if\(signature===lastCookbookSignature\)return/);
});

test("moveable glowing generators, animated patrons and expanding pantry have accessible controls",()=>{
 assert.match(page,/id="next-storage"/);
 assert.match(page,/Level-up pantry storage/);
 assert.match(script,/generatorAt\\(game,index\\)/);
 assert.match(script,/generator-slot/);
 assert.match(script,/generator-move/);
 assert.match(script,/customer-speech/);
 assert.match(script,/customer-avatar/);
 assert.match(stylesheet,/\\.slot\\.generator-slot/);
 assert.match(stylesheet,/\\.customer-avatar/);
 assert.match(stylesheet,/prefers-reduced-motion:reduce/);
});

test("the mobile kitchen keeps orders and board visible with accessible slide-up tools",()=>{
 assert.match(page,/id="open-storage"/);
 assert.match(page,/id="open-kitchen-menu"/);
 assert.match(page,/id="kitchen-storage"/);
 assert.match(page,/id="kitchen-menu"/);
 assert.match(page,/id="game-overlay-scrim"/);
 assert.match(script,/function setKitchenDrawer/);
 assert.match(script,/aria-expanded/);
 assert.match(script,/energy-overflow/);
 assert.match(stylesheet,/\.mobile-game-actions/);
 assert.match(stylesheet,/grid-template-rows:auto auto auto minmax\(0,1fr\)/);
 assert.match(stylesheet,/\.merge-board \.slot:nth-child/);
 assert.match(stylesheet,/\.shelf-panel\.drawer-open/);
 assert.match(stylesheet,/\.secondary-column\.drawer-open/);
 assert.match(stylesheet,/@media\(max-width:890px\) and \(orientation:landscape\)/);
});

test("board tiles are square and never show tier-number badges",()=>{
 assert.match(stylesheet,/grid-template-rows:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(stylesheet,/\.merge-board \.slot\{[^}]*aspect-ratio:1/);
 assert.match(stylesheet,/\.tile-rank[^}]*display:none!important/);
 assert.doesNotMatch(script,/slot\.append\(text\("span",""\+item\.tier,"tile-rank"/);
 assert.match(script,/GENERATOR_ART/);
 assert.match(script,/function generatorArt\(chain\)/);
 assert.doesNotMatch(script,/function generatorArt\(chain\)\{const art=food/);
});

test("eight illustrated characters speak differently and earn favorite meal tips",()=>{
 for(const symbol of ["imp","bat","ghost","witch","gargoyle","moth","crow","slime"])
  assert.match(page,new RegExp('id="patron-'+symbol+'"'));
 assert.match(script,/CUSTOMER_LINES/);
 assert.match(script,/function customerLine\(order,ready\)/);
 assert.match(script,/data\.customer|dataset\.customer/);
 assert.match(script,/favoriteTipForOrder/);
 assert.match(script,/customer-speech/);
 assert.match(script,/favorite-tip/);
 assert.match(stylesheet,/\.order-card\[data-customer="moth"\]/);
 assert.match(stylesheet,/@keyframes patron-bloop/);
 assert.match(stylesheet,/\.order-card \.customer-speech\{display:block!important/);
});

test("art revision enhances all original recipes, portraits and generator equipment",()=>{
 const recipeArt=read(prefix+"sprites/icons.svg");
 const symbols=[...recipeArt.matchAll(/<symbol id="(?:garden|bakery|sweets)-[1-7]"/g)];
 assert.equal(symbols.length,21);
 assert.match(recipeArt,/hex-piece-sheen/);
 for(const character of ["imp","bat","ghost","witch","gargoyle","moth","crow","slime"]){
  const symbol=page.match(new RegExp('<symbol id="patron-'+character+'"[^>]*>([\\s\\S]*?)<\\/symbol>'));
  assert.ok(symbol,character+" portrait absent");
  assert.match(symbol[1],/class="patron-accents"/);
 }
 assert.match(script,/machineTrim/);
 assert.match(stylesheet,/V10 illustrated art direction/);
 assert.match(page,/game\.js\?v=13/);
 assert.match(page,/game\.css\?v=13/);
});

test("patron spotlights allow waiting dialogue and celebrate newly ready and served orders",()=>{
 assert.match(page,/id="customer-moment"/);
 assert.match(page,/class="moment-portrait"/);
 assert.match(page,/class="moment-line"/);
 assert.match(script,/function customerMoment\(patron,phrase,reward=/);
 assert.match(script,/function syncCustomerReactions\(\)/);
 assert.match(script,/if\(ready\)\{fulfill\(i\);return\}/);
 assert.match(script,/customerMoment\(patron,customerLine\(order,false\)/);
 assert.match(script,/customerMoment\(patron,lines\[game\.served%lines\.length\]/);
 assert.match(script,/button\.disabled=false/);
 assert.match(stylesheet,/\.customer-moment\.moment-show/);
 assert.match(stylesheet,/@keyframes customer-stage-enter/);
 assert.match(stylesheet,/@media\(prefers-reduced-motion:reduce\)/);
});

test("free-standing ingredient sprites retain the seamless checkerboard and customers display return visits",()=>{
 assert.match(page,/game\.js\?v=13/);
 assert.match(page,/game\.css\?v=13/);
 assert.match(script,/svg\.classList\.add\("food","food-object"\)/);
 assert.match(stylesheet,/V12: ONE uninterrupted stone checkerboard/);
 assert.match(stylesheet,/background:conic-gradient/);
 assert.match(stylesheet,/\.slot\[data-family\] \.food-object/);
 assert.match(stylesheet,/background:transparent!important;background-image:none!important/);
 assert.match(script,/loyaltyStamps\(game,patron\)/);
 assert.match(script,/regular-customer/);
 assert.match(stylesheet,/\.loyalty-mark/);
 assert.match(stylesheet,/@keyframes expression-joy/);
});

test("focused customer orders guide ingredient matching and merges animate food objects",()=>{
 assert.match(page,/game\.js\?v=13/);
 assert.match(page,/game\.css\?v=13/);
 assert.match(script,/focusedOrderId/);
 assert.match(script,/function mergeFlight\(from,to,chain,tier\)/);
 assert.match(script,/focusedOrderId===order\.id\?null:order\.id/);
 assert.match(script,/slot\.classList\.add\(item\.tier===focusedOrder\.tier\?"focus-exact":"focus-ingredient"\)/);
 assert.match(script,/slot\.classList\.add\("focus-generator"\)/);
 assert.match(script,/mergeFlight\(a,b,origin\.chain,origin\.tier\)/);
 assert.match(stylesheet,/\.order-card\.order-focused/);
 assert.match(stylesheet,/\.merge-board \.slot\.focus-exact/);
 assert.match(stylesheet,/@keyframes merge-flight-travel/);
 assert.match(stylesheet,/@media\(prefers-reduced-motion:reduce\)\{\.merge-flight\{display:none!important\}\}/);
});
