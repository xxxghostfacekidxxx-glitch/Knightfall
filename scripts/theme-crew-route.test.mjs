import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const nav=read("public/nav.js"),base=read("public/theme.css"),runtime=read("public/theme-crew-runtime.js");
const css=read("public/theme-crew.css"),sw=read("public/sw.js"),backend=read("backend/src/index.js");
test("Theme Crew and final Cathedral Requiem use one canonical ordered cascade",()=>{
 assert.ok(base.indexOf('"/theme-crew.css?')>base.indexOf('"/knightfall-unified-theme.css?'));
 assert.ok(base.indexOf('"/knightfall-requiem.css?')>base.indexOf('"/theme-crew.css?'));
 assert.match(nav,/kfCanonicalTheme/);
 assert.match(nav,/themes\.shift\(\)/);
 assert.match(nav,/theme-crew-runtime\.js/);
 assert.match(base,/^@import url\("\/theme-crew\.css/m);
 assert.match(sw,/knightfall-shell-v74/);
 for(const asset of ["theme-crew.css","theme-crew-runtime.js","theme-crew.html","theme-crew-ui.js"])
  assert.ok(sw.includes('"/'+asset+'"'),asset+" not in offline shell");
});
test("Navigationless legal, account-recovery and staff views get the live switch",()=>{
 for(const file of ["admin-bot-archive.html","eula.html","moderation-accounts.html","reset-password.html","terms.html","verify-email.html"]){
  const html=read("public/"+file);
  assert.match(html,/theme-crew-runtime\.js\?v=20261116-crew2/,file+" missing fallback runtime");
  assert.ok(html.includes("/theme.css"),file+" must preserve shared styling");
 }
 for(const file of ["offline.html","personal-bots-offline.html"]){
  assert.doesNotMatch(read("public/"+file),/theme-crew-runtime\.js/,file+" must remain offline");
 }
 for(const key of ["admin-bot-archive","moderation-accounts","reset-password","verify-email","addFallbackRealm"])
  assert.ok(runtime.includes(key),"Navigationless realm missing: "+key);
});
test("Theme Crew management page does not load duplicate final CSS",()=>{
 const page=read("public/theme-crew.html");
 assert.ok(page.includes('/theme.css'),"Management page must load shared theme");
 assert.ok(page.includes('/nav.js'),"Management page must mount final stylesheet via navigation");
 assert.doesNotMatch(page,/<link[^>]+href="\/theme-crew\.css/,"Do not load the final theme stylesheet twice");
});
test("Only GOD may mutate the live recipe; custom member looks and gameplay are exempt",()=>{
 assert.match(backend,/handleThemeCrew\(request,env,url/);
 assert.match(css,/profile-custom-theme/);
 assert.match(css,/:has\(#profile\[data-theme\]\)/);
 assert.match(css,/kf-gameplay-page/);
 assert.doesNotMatch(css,/canvas\s*\{/i);
 assert.doesNotMatch(css,/\.message\.mine\s*\{/);
 for(const key of ["cathedral","blood_moon","verdant_crypt","iron_eclipse","royal_abyss"])
  assert.ok(runtime.includes(key)&&css.includes(key),"Preset not fully implemented: "+key);
});

test("Arcade atmospheric art stays inside the document viewport",()=>{
 const arcade=read("public/arcade-polish.css");
 assert.doesNotMatch(arcade,/main\.arcade:before,body>main:before\{[^}]*inset:0 -3vw auto/,
  "Gothic decoration must never create 3vw horizontal overflow on games");
 assert.match(arcade,/main\.arcade:before,body>main:before\{[^}]*inset:0 0 auto/,
  "Ambient artwork must remain clipped to the main shell");
});
