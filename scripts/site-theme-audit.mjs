import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
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
assert.match(theme,/knightfall-unified-theme\.css\?v=20261116-cascade4/);
assert.doesNotMatch(theme,/@import url\("\/neon-global\.css/);
assert.match(nav,/kfCanonicalTheme/,"Nav must deduplicate the canonical theme");
assert.doesNotMatch(nav,/#ff55d8|#c6ff45|#ba36c1/i,"Injected navigation must not revive neon palette");
for(const id of ["kf-nav-emergency-css","kf-pwa-navigation-recovery","kf-nav-stability-css","kf-shared-header-ext-css"]) assert.ok(!nav.includes(id),"Duplicate injected header CSS must remain retired: "+id);
assert.match(css,/Canonical navigation chrome/);
assert.match(nav,/DOMContentLoaded[^\n]*mountApprovedTheme/,"Approved theme must mount after page styles");
assert.match(nav,/document\.head\.appendChild\(link\)/,"Approved theme must be last in cascade");
assert.match(nav,/const target = "\/theme\.css";/,"Nav must use the canonical revalidated stylesheet URL");
assert.doesNotMatch(nav,/\/theme\.css\?v=/,"Do not revive hardcoded cache-busting on the shared stylesheet");
for(const old of ["/gravewave-takeover.js","/gravewave-decor.js","/neon-global.css","/gravewave-consistency.css"])
 assert.ok(!nav.includes(old),"Nav reintroduces legacy neon theme: "+old);
assert.doesNotMatch(home,/\/gravewave-takeover\.(js|css)/);
for (const path of ["auth.html","community.html"]) {
 const page=read("../public/"+path);
 assert.ok(!page.includes("gravewave-takeover."),"Retired Gravewave must not load on "+path);
 assert.ok(page.includes("/theme.css"),"Shared theme must use revalidated canonical asset on "+path);
 assert.ok(page.includes("/nav.js?v=20261115-gothic9"),"Current navigation must be versioned on "+path);
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
assert.match(sw,/const CACHE_NAME = "knightfall-shell-v\d+";/);
assert.match(sw,/"\/knightfall-unified-theme\.css"/);
assert.match(sw,/"\/icons\/knightfall-crest-192\.png"/);
assert.equal(manifest.background_color,"#0d1013");
assert.equal(manifest.theme_color,"#0d1013");
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
assert.match(arcadeHub,/arcade-catalog\.css\?v=20261115-gothic9/);

assert.ok(!foundryPage.includes('href="/arcade-polish.css'),"Creator Foundry must not load neon arcade game skin");

const sharedGothicFiles=["support.html","reset-password.html","auth.css","members.css","members.html",
  "shop-upgrade.css","shops.html","memo-pad.css","memo-pad.html","push-settings.css"];
for(const filename of sharedGothicFiles){
 const src=read("../public/"+filename);
 assert.ok(!src.includes("#ff55d8")&&!src.includes("#c6ff45")&&!src.includes("rgba(255,85,216"),"Legacy neon must not revive in "+filename);
}
assert.ok(read("../public/support.html").includes("/theme.css"),"Support page must load the approved shared theme");
assert.match(read("../public/memo-pad.html"),/\/memo-pad\.css\?v=20\d{6}-[a-z0-9-]+/,"Memo Pad styles must be cache busted");


// The dashboard used to override the global Gothic Creator palette with
// legacy neon locally, so testing only design-system.css was insufficient.
const adminCss=read("../public/admin.css");
assert.doesNotMatch(adminCss,/#ff55d8|#c6ff45|rgba\(255,85,216/i,"Admin must inherit Gothic Creator, not Gravewave");
assert.match(nav,/location\.pathname\.startsWith\("\/arcade\/hosted\/"\)/,"Playable arcade only may load glitch chrome");
assert.doesNotMatch(nav,/location\.pathname\.startsWith\("\/chaos-cartridge"\)/);
assert.match(read("../public/profile.css"),/--gw-panel-accent:var\(--profile-accent,#b25b68\)/);


// Secondary community, studio and link-hub chrome must not silently restore neon.
for (const filename of [
 "thread.html","create-thread.html","community-topic.html","admin-privacy-assistance.html",
 "arcade-open-source.html","profile-community-overhaul.css","profile-studio-next.css",
 "profile-links.css","profile-wall.css","profile-highlights.css"
]){
 const source=read("../public/"+filename);
 assert.doesNotMatch(source,/#ff55d8|#c6ff45|rgba\(255,85,216/i,filename+" revives retired Gravewave chrome");
}
for (const filename of ["profile-community-overhaul.css","profile-links.css","profile-wall.css","profile-highlights.css"]){
 assert.match(read("../public/"+filename),/var\(--profile-accent/,filename+" must respect member-selected accents");
}

// Permanent Gravewave retirement guard: chrome only, never recolor game canvas art
// or member-selected profile accents.
const retiredChrome=/#(?:ff55d8|c6ff45|e8b5f5|a8ff3e|d9ff51)(?:[0-9a-f]{2})?\b|rgba\(\s*255\s*,\s*85\s*,\s*216/i;
for (const filename of [
  "arcade-polish.css","chaos-cartridge-theme.css","chat-bubbles.css",
  "account-deletion.html","admin-deletion-requests.html","privacy.html",
  "terms.html","eula.html","offline.html","devil-tools.html"
]) assert.doesNotMatch(read("../public/"+filename),retiredChrome,"Retired palette returned in "+filename);
assert.ok(!existsSync(new URL("../public/gravewave-takeover.css",import.meta.url)),
  "Removed Gravewave takeover CSS must not be resurrected");
for(const filename of readdirSync(new URL("../public/",import.meta.url)).filter(name=>name.endsWith(".html"))){
  const source=read("../public/"+filename);
  assert.doesNotMatch(source,/<link\b[^>]*(?:gravewave-takeover|neon-global|gravewave-consistency)\.(?:css|js)/i,
    "Retired takeover asset loaded by "+filename);
}
for (const filename of ["chaos-glitch.css","miss-chaos-presence.css"]){
  assert.doesNotMatch(read("../public/"+filename),/#(?:ff55d8|c6ff45)/i,
    "Miss Chaos character skin must use its own colors, not Gravewave");
}
assert.match(nav,/chat-bubbles\.css\?v=20261117-imp2/);
assert.match(read("../public/miss-chaos-presence.js"),/miss-chaos-presence\.css\?v=20\d{6}-[a-z0-9-]+/);
for (const path of ["/arcade-polish.css","/chaos-cartridge-theme.css","/chat-bubbles.css","/miss-chaos-presence.css"]){
  assert.ok(read("../public/_headers").includes(path+"\n  Cache-Control: no-cache"),
    "Theme asset must revalidate: "+path);
}
console.log("Retired Gravewave chrome purge and PWA cache version checked.");

for(const filename of ["gravewave-takeover.js","gravewave-decor.js"]){
 assert.ok(!existsSync(new URL("../public/"+filename,import.meta.url)),
   "Retired global injection script must stay removed: "+filename);
}

// All first-party UI styles must use the approved palette. Keep creative game
// rendering, character art assets, and selectable member profile themes separate.
const auditedChromeStyles=["account.css","admin-command-center.css","arcade-cabinet-ui.css","avatar-studio.css","bot-public.css","bot-starter-chat.css","bots-starter.css","creator-motion-preview.css","creator-production-lab.css","devil-tools-vector-gallery.css","die-ary.css","directory.css","mascot-pets.css","mascot-room-furniture.css","mascot-room.css","mascot-trials.css","members.css","messages.css","moderation.css","creator-foundry.css","personal-bots.css","profile-mascots.css","profile.css","social-hub.css","vault.css","miss-chaos.css","miss-chaos-radar.css"];
for(const filename of auditedChromeStyles){
  assert.doesNotMatch(read("../public/"+filename),retiredChrome,
    "Retired Gravewave colors resurfaced in "+filename);
  assert.ok(read("../public/_headers").includes("/"+filename+"\n  Cache-Control: no-cache"),
    "Cached first-party chrome may stay stale: "+filename);
}
for(const filename of ["arcade-cabinet-ui.js","arcade-fullscreen.js","arcade-save.js"]){
  assert.doesNotMatch(read("../public/"+filename),retiredChrome,
    "UI script reintroduced an old color: "+filename);
}
