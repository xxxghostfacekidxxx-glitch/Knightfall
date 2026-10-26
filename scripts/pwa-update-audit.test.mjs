import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../public/",import.meta.url);
const sw=readFileSync(new URL("sw.js",root),"utf8");
const nav=readFileSync(new URL("nav.js",root),"utf8");
const manifest=JSON.parse(readFileSync(new URL("manifest.webmanifest",root),"utf8"));
test("service worker defers updates until a user explicitly chooses",()=>{
 assert.doesNotMatch(sw,/cache\.addAll\(APP_SHELL\)\)\.then\(\(\) => self\.skipWaiting\(\)\)/);
 assert.match(sw,/event\.data\?\.type === "SKIP_WAITING"/);
 assert.match(nav,/registration\.waiting\?\.postMessage\(\{type:"SKIP_WAITING"\}\)/);
 assert.match(nav,/updateToast\) location\.reload\(\)/);
});
test("private messages, profiles, and adult content are never cached",()=>{
 for(const path of ["/profile","/miss-chaos","/adult","/dating","/messages","/account","/vault"])
   assert.ok(sw.includes('url.pathname.startsWith("'+path+'")'),path);
 assert.match(sw,/request\.method !== "GET"/);
 assert.match(sw,/url\.origin !== self\.location\.origin/);
});
test("app provides offline shell and quick Miss Chaos launch",()=>{
 assert.ok(sw.includes('"/offline.html"'));
 assert.ok(sw.includes('"/homepage.html"'));
 assert.ok(manifest.shortcuts.some(s=>s.url.startsWith("/miss-chaos.html")));
});
