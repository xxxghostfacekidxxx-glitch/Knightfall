import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
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

test("push click never navigates away from an unrelated open chat or game",()=>{
 assert.match(sw,/clients\.find\(client => client\.url === target\)/);
 assert.doesNotMatch(sw,/existing\.navigate\(target\)/);
 assert.match(sw,/clients\.openWindow\(target\)/);
});
test("mobile navigation closes on Escape and outside interaction",()=>{
 assert.match(nav,/event\.key !== "Escape"/);
 assert.match(nav,/document\.addEventListener\("pointerdown"/);
 assert.match(nav,/window\.addEventListener\("popstate", closeMobileMenu\)/);
});
test("service worker does not contain escaped newline syntax errors",()=>{
 assert.ok(!sw.includes(String.raw`\\n  if (event.data`));
});

test("notification settings script parses and refuses unsafe alert destinations",()=>{
 const html=readFileSync(new URL("notifications.html",root),"utf8");
 const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
 assert.ok(inline.length,"notification settings inline script must exist");
 for(const code of inline)new Script(code,{filename:"notifications.html"});
 assert.ok(html.includes('function safeNoticeUrl(value)'));
 assert.ok(html.includes('safeNoticeUrl(n.url)'));
 assert.match(html,/visibilitychange/);
});
