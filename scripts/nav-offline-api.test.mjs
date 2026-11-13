import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const source=readFileSync("public/nav.js","utf8");
const match=source.match(/const cloudAccountAvailable = ([^;\n]+);/);
test("site navigation uses production APIs only on Ash-Fall's verified hosts",()=>{
 assert.ok(match,"Navigation must expose a domain gate for production account state");
 const testHost=hostname=>runInNewContext(match[1],{location:{hostname}}, {timeout:1000});
 for(const host of ["ash-fall.com","www.ash-fall.com","ASH-FALL.COM"])
  assert.equal(testHost(host),true,host);
 for(const host of ["127.0.0.1","localhost","localhost.localdomain","evilash-fall.com","ash-fall.com.evil.example","knightfall.pages.dev","",undefined])
  assert.equal(testHost(host),false,String(host));
});
test("account and settings bootstrap never make production network requests on localhost",()=>{
 assert.match(source,/\(cloudAccountAvailable \? fetch\("https:\/\/api\.ash-fall\.com\/api\/site-settings"/);
 assert.match(source,/\(cloudAccountAvailable \? fetch\("https:\/\/api\.ash-fall\.com\/api\/auth\/me"/);
 assert.match(source,/function refreshNotifications\(\) \{\s*if \(!cloudAccountAvailable\) return;/);
 assert.match(source,/Promise\.resolve\(null\)/);
});
test("navigation exposes one route per destination and starts signed out",()=>{
 const markup = source.split("header.innerHTML = `")[1].split("`")[0];
 const nav = markup.split('<nav id="kf-primary-nav"')[1].split("</nav>")[0];
 const routes = [...nav.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(routes.length,new Set(routes).size);
 assert.ok(routes.length<=15);
 assert.match(nav,/class="kf-nav-group kf-profile-group" hidden/);
 assert.match(nav,/class="kf-nav-group kf-staff-group" hidden/);
 assert.match(nav,/class="kf-sign-in-link"|kf-sign-in-link" href="\/auth.html"/);
 assert.match(source,/if \(!user\) return;/);
});

test("consolidated navigation destinations exist, including deep links",()=>{
 const files = ["nav.js", "index.html", "account.html", "shops.html"];
 const disk = path=>readFileSync("public"+path,"utf8");
 for (const file of files) {
  for (const [,path,fragment] of disk("/"+file).matchAll(/href="(\/[^"#?\$]+)(?:#([^"]+))?"/g)) {
   const contents = disk(path === "/" ? "/index.html" : path);
   if (fragment) assert.ok(contents.includes('id="'+fragment+'"'),path+"#"+fragment);
  }
 }
 for (const file of ["chaos-cartridge.html"]) {
  const html = disk("/"+file);
  assert.match(html,/href="#game-shelf"/);
  assert.doesNotMatch(html,/href="Original Ash-Fall/);
 }
});


test("canonical home retains one support footer and retired directories point to current hubs",()=>{
 const home=readFileSync("public/index.html","utf8");
 const nav=readFileSync("public/nav.js","utf8");
 const vault=readFileSync("public/arcade-vault.html","utf8");
 const redirects=readFileSync("public/_redirects","utf8");
 assert.match(home,/class="site-footer"/);
 assert.match(home,/href="\/support\.html"/);
 assert.match(home,/href="\/user-agreement\.html"/);
 assert.match(nav,/document\.querySelector\("\.site-footer"\)/);
 assert.match(home,/id="ecosystem"/);
 assert.match(vault,/\/chaos-cartridge\.html/);
 for(const legacy of ["#vault-mines","#vault-breakout","#vault-snake"])
  assert.ok(vault.includes(legacy),"Legacy arcade bookmark lost: "+legacy);
 assert.match(redirects,/\/homepage\.html \/ 301/);
});


test("arcade directory keeps one browse action without invalid nested-node insertions",()=>{
 const page=readFileSync("public/chaos-cartridge.html","utf8");
 const script=readFileSync("public/arcade-catalog.js","utf8");
 const hero=page.match(/<section class="cartridge-hero">([\s\S]*?)<\/section>/)?.[1];
 assert.ok(hero,"Arcade hero must exist");
 assert.equal([...hero.matchAll(/<a\b[^>]*href="#game-shelf"/g)].length,1);
 assert.doesNotMatch(script,/hero\.insertBefore\(/,"Arcade catalog must not insert before a nested descendant");
});

test("one public arcade directory with safe redirects and no duplicate browse menu",()=>{
 const redirects=readFileSync("public/_redirects","utf8");
 const primary=readFileSync("public/chaos-cartridge.html","utf8");
 const stylesheet=readFileSync("public/section-directory.css","utf8");
 assert.match(redirects,/\/arcade-30-games\.html \/chaos-cartridge\.html 301/);
 assert.match(redirects,/\/arcade-card-board\.html \/chaos-cartridge\.html 301/);
 assert.doesNotMatch(primary,/arcade-directory-links|href="\/arcade-card-board\.html"/);
 assert.doesNotMatch(stylesheet,/\.arcade-directory-links/);
 assert.match(primary,/href="\/arcade\/async-play\.html"/);
 assert.match(primary,/href="\/arcade\/arcade-license-guide\.html"/);
});
