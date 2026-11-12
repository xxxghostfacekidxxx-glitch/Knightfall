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
 assert.match(nav,/class="kf-sign-in-link"|kf-sign-in-link" href="\/index.html"/);
 assert.match(source,/if \(!user\) return;/);
});

test("consolidated navigation destinations exist, including deep links",()=>{
 const files = ["nav.js", "homepage.html", "account.html", "shops.html"];
 const disk = path=>readFileSync("public"+path,"utf8");
 for (const file of files) {
  for (const [,path,fragment] of disk("/"+file).matchAll(/href="(\/[^"#?\$]+)(?:#([^"]+))?"/g)) {
   const contents = disk(path);
   if (fragment) assert.ok(contents.includes('id="'+fragment+'"'),path+"#"+fragment);
  }
 }
 for (const file of ["chaos-cartridge.html","arcade-30-games.html"]) {
  const html = disk("/"+file);
  assert.match(html,/href="#game-shelf"/);
  assert.doesNotMatch(html,/href="Original Ash-Fall/);
 }
});
