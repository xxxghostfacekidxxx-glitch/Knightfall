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
 assert.ok(sw.includes('"/",'));
 assert.ok(manifest.shortcuts.some(s=>s.url.startsWith("/miss-chaos.html")));
});

test("push click reuses the exact inbox, but never hijacks an unrelated game or page",()=>{
 assert.match(sw,/const chat=windows\.find\(client=>/);
 assert.ok(sw.includes('["/messages","/messages.html"].includes(url.pathname)'),"both Pages pretty route and HTML route are recognized as inboxes");
 assert.match(sw,/if\(chat\.url!==target&&typeof chat\.navigate==="function"\)/);
 assert.match(sw,/const exact=windows\.find\(client=>client\.url===target\)/);
 assert.match(sw,/self\.clients\.openWindow\(target\)/);
 assert.doesNotMatch(sw,/existing\.navigate\(target\)/);
});
test("mobile navigation closes on Escape and outside interaction",()=>{
 assert.match(nav,/event\.key !== "Escape"/);
 assert.match(nav,/document\.addEventListener\("pointerdown"/);
 assert.match(nav,/window\.addEventListener\("popstate", \(\) => setDrawer\(false\)\)/);
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

test("iOS install precaches only essential files and survives storage/download failures", async () => {
  let onInstall;
  const fetched=[];
  const warnings=[];
  const serviceWorkerScope={
    addEventListener(type,callback) {
      if(type==="install") onInstall=callback;
    }
  };
  const fakeCache={
    async add(path) {
      fetched.push(path);
      if(path==="/nav.js") throw new Error("network temporarily unavailable");
    }
  };
  new Script(sw,{filename:"sw.js"}).runInNewContext({
    self:serviceWorkerScope,
    caches:{open:async()=>fakeCache},
    console:{warn:(...args)=>warnings.push(args)},
    Promise
  });
  assert.equal(typeof onInstall,"function");
  let installPromise;
  onInstall({waitUntil(promise){installPromise=promise;}});
  await assert.doesNotReject(installPromise);
  assert.deepEqual(fetched,[
    "/","/offline.html","/theme.css","/design-system.css",
    "/homepage.css","/nav.js","/icons/knightfall-crest-192.png"
  ]);
  assert.ok(warnings.some(args=>args[0]==="offline_shell_partial_cache"));
  assert.ok(sw.includes("APP_SHELL.includes(url.pathname)"),"other shell files still cache on demand");
  assert.ok(!sw.includes("APP_SHELL.map(resource=>cache.add(resource))"),"never flood iOS with full precache");
});

test("Safari fallback keeps mobile navigation and home-screen shell usable",()=>{
  const css=readFileSync(new URL("theme.css",root),"utf8");
  const home=readFileSync(new URL("index.html",root),"utf8");
  assert.ok(nav.includes("mobileNavViewport.addListener"),"older Safari MediaQueryList must be supported");
  assert.ok(css.includes("max-height:calc(100vh - 90px);max-height:calc(100dvh - 90px)"),
    "mobile drawer must have pre-dynamic-viewport fallback");
  assert.ok(css.includes("safe-area-inset-bottom"),"nav must respect iPhone home indicator");
  assert.ok(css.includes('input:not([type="range"]), textarea, select { font-size:16px; }'),
    "small inputs must not trigger Safari auto-zoom");
  assert.ok(home.includes('rel="apple-touch-icon"'),"Safari needs static icon markup");
  assert.ok(home.includes('name="apple-mobile-web-app-title"'),"installed app needs its own title");
});
