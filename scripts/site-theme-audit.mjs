import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const css=read("../public/knightfall-unified-theme.css"),tokens=read("../public/design-system.css");
const theme=read("../public/theme.css"),nav=read("../public/nav.js"),home=read("../public/index.html");
const base=read("../public/theme.css");
assert.doesNotMatch(base,/255,85,216|#ff55d8|#c6ff45|#e8b5f5/i,"Legacy neon must not return in shared theme");
assert.match(css,/responsive integrity/,"Responsive shared chrome guard missing");
assert.match(css,/safe-area-inset-bottom/,"Mobile composer safe area missing");
const sw=read("../public/sw.js"),manifest=JSON.parse(read("../public/manifest.webmanifest"));
for(const color of ["#0d1013","#ece1d3","#b25b68","#c7a77c","#92a18a"])
 assert.ok(css.includes(color),"Missing approved Gothic color "+color);
assert.match(tokens,/--af-bg:#0d1013/);
assert.match(tokens,/body\{min-width:0;margin:0\}/,"Shared body reset must remove 8px browser margin");
assert.match(tokens,/--af-ember:#b25b68/);
assert.match(tokens,/--af-ember-light:#c7a77c/);
assert.match(theme,/knightfall-unified-theme\.css\?v=20261115-gothic6/);
assert.doesNotMatch(theme,/@import url\("\/neon-global\.css/);
assert.match(nav,/knightfall-unified-theme/);
assert.doesNotMatch(nav,/#ff55d8|#c6ff45|#ba36c1/i,"Injected navigation must not revive neon palette");
for(const id of ["kf-nav-emergency-css","kf-pwa-navigation-recovery","kf-nav-stability-css","kf-shared-header-ext-css"]) assert.ok(!nav.includes(id),"Duplicate injected header CSS must remain retired: "+id);
assert.match(css,/Canonical navigation chrome/);
assert.match(nav,/DOMContentLoaded[^\n]*mountApprovedTheme/,"Approved theme must mount after page styles");
assert.match(nav,/document\.head\.appendChild\(link\)/,"Approved theme must be last in cascade");
assert.match(nav,/knightfall-unified-theme\.css\?v=20261115-gothic6/);
for(const old of ["/gravewave-takeover.js","/gravewave-decor.js","/neon-global.css","/gravewave-consistency.css"])
 assert.ok(!nav.includes(old),"Nav reintroduces legacy neon theme: "+old);
assert.doesNotMatch(home,/\/gravewave-takeover\.(js|css)/);
for (const path of ["auth.html","community.html"]) {
 const page=read("../public/"+path);
 assert.doesNotMatch(page,/gravewave-takeover\\.(js|css)/,"Retired Gravewave must not load on "+path);
 assert.match(page,/\\/theme\\.css\\?v=20261115-gothic7/,"Gothic theme must be versioned on "+path);
 assert.match(page,/\\/nav\\.js\\?v=20261115-gothic7/,"Current navigation must be versioned on "+path);
}
assert.doesNotMatch(read("../public/auth.html"),/#ff55d8|#c6ff45|#a8ff3e/i,"Neon auth styling must not return");
assert.doesNotMatch(read("../public/realm-polish.css"),/inset:0 -4vw auto/,"Directory decorations must not overflow mobile viewport");
assert.match(css,/knightfall-crest-192\.png/);
assert.match(css,/knightfall-crest-512\.png/);
assert.match(css,/body:not\(\.profile-custom-theme\)/);
assert.match(css,/:not\(:has\(#profile\[data-theme\]\)\)/,"Member profile color themes must not be overwritten");
assert.match(css,/\.messages-shell \.conversation\.active/);
assert.match(css,/\.admin-shell \.admin-tabs \.active/);
assert.match(css,/\.cartridge-shelf \.cartridge-number/);
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(css,/^\s*canvas\s*\{/m);
assert.match(sw,/const CACHE_NAME = "knightfall-shell-v44";/);
assert.match(sw,/"\/knightfall-unified-theme\.css"/);
assert.match(sw,/"\/icons\/knightfall-crest-192\.png"/);
assert.equal(manifest.background_color,"#0d1013");
assert.equal(manifest.theme_color,"#111217");
assert.ok(manifest.icons.some(i=>i.src==="/icons/knightfall-crest-maskable.png"));
let depth=0;for(const c of css){if(c==="{")depth++;if(c==="}")depth--;assert.ok(depth>=0)}
assert.equal(depth,0,"Invalid CSS nesting");
console.log("Approved Gothic Creator theme, crest, and offline refresh verified.");

const foundryCSS=read("../public/creator-foundry.css");
const foundryPage=read("../public/devil-tools.html");
const catalogCSS=read("../public/arcade-catalog.css");
const leaderboardsCSS=read("../public/arcade-leaderboards.css");
const arcadeHub=read("../public/chaos-cartridge.html");
assert.doesNotMatch(foundryCSS,/#c6ff45|#ff55d8/i,"Foundry CSS must use the Gothic color system");
const foundryStyle=foundryPage.match(/<style>([\s\S]*?)<\/style>/)?.[1]||"";
assert.doesNotMatch(foundryStyle,/#c6ff45|#ff55d8/i,"Foundry inline chrome must not revive neon");
assert.doesNotMatch(catalogCSS,/#c6ff45|#ff55d8/i,"Arcade catalog must use Gothic color system");
assert.doesNotMatch(leaderboardsCSS,/#c6ff45|#ff55d8/i,"Leaderboards must use Gothic color system");
assert.doesNotMatch(arcadeHub,/chaos-cartridge-theme\.css/,"Hub must not load per-game neon skins");
assert.match(arcadeHub,/arcade-catalog\.css\?v=20261115-gothic7/);

assert.doesNotMatch(foundryPage,/href="\\/arcade-polish\\.css/,"Creator Foundry must not load neon arcade game skin");
