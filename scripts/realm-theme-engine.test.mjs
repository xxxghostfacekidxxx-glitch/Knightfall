import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const runtime=read("public/theme-crew-runtime.js");
const css=read("public/realm-theme-engine.css");
const root=read("public/theme.css");
const globalCss=read("public/global-design-controls.css");
const deck=read("public/theme-crew.html");
const ui=read("public/theme-crew-ui.js");

function browser(pathname,payload,sharedSession=new Map(),search=""){
 const local=new Map(),events=[];
 const body={dataset:{}};
 const document={
  body,readyState:"complete",visibilityState:"visible",
  addEventListener(){},dispatchEvent(event){events.push(event)}
 };
 const window={addEventListener(){},setInterval(){},};
 const storage=map=>({
  getItem:key=>map.get(key)??null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key)
 });
 const ctx={
  location:{pathname,search,hostname:"ash-fall.com"},
  document,window,URLSearchParams,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}},
  localStorage:storage(local),sessionStorage:storage(sharedSession),
  fetch:async()=>({ok:true,json:async()=>payload}),
 };
 vm.runInNewContext(runtime,ctx,{filename:"theme-crew-runtime.js"});
 return {window,document,body,events,session:sharedSession};
}
const published={
 preset:"blood_moon",revision:9,
 realms:{
  madhouse:{preset:"verdant_crypt",revision:2},
  arcade:{preset:"iron_eclipse",revision:3},
  chaosphere:{preset:"royal_abyss",revision:1},
  admin:{preset:"cathedral",revision:4}
 }
};
test("each of five routes paints its own persisted theme, without cross-realm leaks",async()=>{
 for(const [path,scope,expected] of [
  ["/","site","blood_moon"],
  ["/community.html","madhouse","verdant_crypt"],
  ["/chaos-cartridge.html","arcade","iron_eclipse"],
  ["/chaosphere.html","chaosphere","royal_abyss"],
  ["/eye-of-chaos.html","admin","cathedral"],
  ["/theme-crew.html","admin","cathedral"]
 ]){
  const b=browser(path,published);
  await b.window.KnightfallThemeCrew.refresh();
  assert.equal(b.body.dataset.kfThemeScope,scope,path+" must use correct domain");
  assert.equal(b.body.dataset.kfTheme,expected,path+" must not inherit other domain's published preset");
 }
});
test("Casino and Miss Chaos pages inherit their owning realm, not the global default",async()=>{
 const routes=[
  ["/casino.html","arcade","iron_eclipse"],
  ["/casino","arcade","iron_eclipse"],
  ["/arcade-card-room.html","arcade","iron_eclipse"],
  ["/miss-chaos-guide.html","chaosphere","royal_abyss"],
  ["/miss-chaos.html","chaosphere","royal_abyss"],
  ["/notifications.html","chaosphere","royal_abyss"],
  ["/moderation-accounts.html","admin","cathedral"],
  ["/community-topic.html","madhouse","verdant_crypt"]
 ];
 for(const [path,scope,preset] of routes){
  const b=browser(path,published);
  await b.window.KnightfallThemeCrew.refresh();
  assert.equal(b.body.dataset.kfThemeScope,scope,path);
  assert.equal(b.body.dataset.kfTheme,preset,path);
 }
 for(const path of ["/arcade/hosted/imp-inferno/index.html","/casino/classic-floor.html"]){
  const b=browser(path,published);
  assert.equal(b.window.KnightfallThemeCrew,undefined,"Independent hosted games must remain untouched: "+path);
 }
});
test("previews are session-scoped, never become server state, and reject unknown presets",async()=>{
 const session=new Map();
 const madhouse=browser("/community.html",published,session);
 await madhouse.window.KnightfallThemeCrew.refresh();
 const runtimeApi=madhouse.window.KnightfallThemeCrew;
 assert.equal(runtimeApi.preview("blood_moon","arcade"),true);
 assert.equal(madhouse.body.dataset.kfTheme,"verdant_crypt","Preview of arcade does not repaint forums");
 assert.equal(runtimeApi.preview("royal_abyss","madhouse"),true);
 assert.equal(madhouse.body.dataset.kfTheme,"royal_abyss");
 assert.equal(runtimeApi.current().published,"verdant_crypt");
 assert.equal(runtimeApi.preview("malicious_css","madhouse"),false);
 const arcade=browser("/chaos-cartridge.html",published,session);
 await arcade.window.KnightfallThemeCrew.refresh();
 assert.equal(arcade.body.dataset.kfTheme,"blood_moon","Arcade uses only its own private preview");
 assert.equal(arcade.window.KnightfallThemeCrew.current().published,"iron_eclipse");
 assert.equal(arcade.window.KnightfallThemeCrew.preview(null,"arcade"),true);
 assert.equal(arcade.body.dataset.kfTheme,"iron_eclipse");
});
test("preview URLs are constrained to the matching realm",async()=>{
 const admin=browser("/eye-of-chaos.html",published,new Map(),"?kf_theme_preview=verdant_crypt&kf_theme_scope=madhouse");
 await admin.window.KnightfallThemeCrew.refresh();
 assert.equal(admin.body.dataset.kfTheme,"cathedral","Forum preview link cannot repaint private admin UI");
 const community=browser("/community.html",published,new Map(),"?kf_theme_preview=blood_moon&kf_theme_scope=madhouse");
 await community.window.KnightfallThemeCrew.refresh();
 assert.equal(community.body.dataset.kfTheme,"blood_moon");
 assert.equal(community.window.KnightfallThemeCrew.current().published,"verdant_crypt");
});
test("scope styling is independently owned, no canvas overrides or new important wars",()=>{
 for(const scope of ["madhouse","arcade","chaosphere","admin"])assert.ok(css.includes('data-kf-theme-scope="'+scope+'"'));
 assert.ok(root.includes('"/realm-theme-engine.css?'));
 assert.ok(deck.includes('id="theme-crew-scope"'));
 for(const scope of ["site","madhouse","arcade","chaosphere","admin"])assert.ok(deck.includes('value="'+scope+'"'));
 assert.match(ui,/realm:scope,expectedRevision:current\.revision/);
 assert.match(ui,/announcePublished\?\.\(current\.revision,scope\)/);
 assert.doesNotMatch(css,/!important\b/);
 assert.doesNotMatch(css,/\bcanvas\s*\{/);
 assert.match(css,/:not\(\.profile-custom-theme\)/);
 assert.match(css,/:not\(\.kf-gameplay-page\)/);
});

test("global controls follow all realms without touching independent published presets",async()=>{
 const pub={preset:"blood_moon",revision:9,realms:{
  madhouse:{preset:"verdant_crypt",revision:2},
  arcade:{preset:"iron_eclipse",revision:3},
  chaosphere:{preset:"royal_abyss",revision:1},
  admin:{preset:"cathedral",revision:4}
 },globalControls:{density:"compact",corners:"square",typography:"large",effects:"subtle",revision:5}};
 for(const [path,preset] of [
  ["/community.html","verdant_crypt"],["/chaos-cartridge.html","iron_eclipse"],
  ["/chaosphere.html","royal_abyss"],["/eye-of-chaos.html","cathedral"]
 ]){
  const b=browser(path,pub);
  await b.window.KnightfallThemeCrew.refresh();
  assert.equal(b.body.dataset.kfTheme,preset);
  assert.equal(b.body.dataset.kfGlobalDensity,"compact");
  assert.equal(b.body.dataset.kfGlobalCorners,"square");
  assert.equal(b.body.dataset.kfGlobalTypography,"large");
  assert.equal(b.body.dataset.kfGlobalEffects,"subtle");
 }
 const madhouse=browser("/community.html",pub);
 await madhouse.window.KnightfallThemeCrew.refresh();
 const before=madhouse.body.dataset.kfTheme;
 const sample={density:"relaxed",corners:"rounded",typography:"extra_large",effects:"minimal"};
 assert.equal(madhouse.window.KnightfallThemeCrew.previewGlobal(sample),true);
 assert.equal(madhouse.body.dataset.kfGlobalDensity,"relaxed");
 assert.equal(madhouse.body.dataset.kfTheme,before,"Shared preview cannot override the forum preset");
 assert.equal(madhouse.window.KnightfallThemeCrew.currentGlobal().published.corners,"square");
 assert.equal(madhouse.window.KnightfallThemeCrew.currentGlobal().preview,true);
 assert.equal(madhouse.window.KnightfallThemeCrew.previewGlobal({...sample,css:"*{display:none}"}),false);
 assert.equal(madhouse.window.KnightfallThemeCrew.previewGlobal({...sample,typography:"script"}),false);
 assert.equal(madhouse.window.KnightfallThemeCrew.previewGlobal(null),true);
 assert.equal(madhouse.body.dataset.kfGlobalCorners,"square");
 assert.equal(madhouse.window.KnightfallThemeCrew.currentGlobal().preview,false);
});
test("shared chrome controls preserve gameplay, profile themes, and zero important battles",()=>{
 assert.match(root,/global-design-controls\.css\?/);
 assert.match(globalCss,/data-kf-global-density="compact"/);
 assert.match(globalCss,/data-kf-global-corners="rounded"/);
 assert.match(globalCss,/data-kf-global-typography="extra_large"/);
 assert.match(globalCss,/data-kf-global-effects="minimal"/);
 assert.match(globalCss,/:not\(\.profile-custom-theme\)/);
 assert.match(globalCss,/:not\(\.kf-gameplay-page\)/);
 assert.match(globalCss,/:not\(\.chaos-glitch-arcade\)/);
 assert.doesNotMatch(globalCss,/!important\b/);
 assert.doesNotMatch(globalCss,/\bcanvas\s*\{/);
 for(const id of ["kf-global-density","kf-global-corners","kf-global-typography","kf-global-effects",
  "theme-crew-global-publish","theme-crew-global-rollback"])
  assert.ok(deck.includes('id="'+id+'"'),"Missing global control "+id);
 assert.match(ui,/announceGlobalPublished/);
 assert.match(ui,/\/global\/rollback/);
});
