import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const runtime=read("public/theme-crew-runtime.js");
const css=read("public/realm-theme-engine.css");
const root=read("public/theme.css");
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
