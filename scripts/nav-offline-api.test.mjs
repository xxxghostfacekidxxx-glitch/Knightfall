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
test("navigation still shows signed-out fallback and keeps privileged links hidden",()=>{
 assert.match(source,/if \(!d\?\.user\) \{/);
 assert.match(source,/authResolved = true;/);
 assert.match(source,/\.kf-admin-link,.kf-admin-quick-link/);
 assert.match(source,/nav\.querySelector\("\.kf-profile-link"\)\?\.remove\(\)/);
});
