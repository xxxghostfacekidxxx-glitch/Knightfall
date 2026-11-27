import test from "node:test";
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../public/",import.meta.url));
const read=path=>readFileSync(join(root,path),"utf8");
const files=readdirSync(root).filter(f=>f.endsWith(".html"));

test("Page-level theme links have one stable, revalidated URL",()=>{
  let examined=0;
  for(const page of files){
    const source=read(page);
    if(source.includes("/theme.css"))examined++;
    assert.doesNotMatch(source,/\/theme\.css\?v=/,page+" has obsolete style cache-buster");
    assert.doesNotMatch(source,/\/theme-crew-runtime\.js\?v=/,page+" has obsolete crew runtime cache-buster");
    assert.doesNotMatch(source,/\/nav\.js\?v=/,page+" has obsolete global navigation cache-buster");
  }
  assert.ok(examined>=40,"Expected sitewide HTML audit to cover the major pages");
});

test("Shared navigation owns one root stylesheet and one runtime",()=>{
 const nav=read("nav.js");
 assert.match(nav,/const target = "\/theme\.css";/);
 assert.match(nav,/script\.src="\/theme-crew-runtime\.js";/);
 assert.match(nav,/const themes = sheets\.filter/);
 assert.match(nav,/for \(const duplicate of themes\) duplicate\.remove\(\)/);
 assert.doesNotMatch(nav,/\/theme\.css\?v=|\/theme-crew-runtime\.js\?v=/);
});

test("Cloudflare and the PWA revalidate theme files instead of freezing old URLs",()=>{
 const headers=read("_headers");
 const worker=read("sw.js");
 assert.match(headers,/\/theme\.css\s*\n\s*Cache-Control: no-cache, max-age=0, must-revalidate/);
 assert.match(headers,/\/theme-crew-runtime\.js\s*\n\s*Cache-Control: no-cache, max-age=0, must-revalidate/);
 assert.match(headers,/\/nav\.js\s*\n\s*Cache-Control: no-cache, max-age=0, must-revalidate/);
 assert.match(worker,/const CACHE_NAME = "knightfall-shell-v\d+";/);
 assert.match(worker,/"\/theme\.css"/);
 assert.match(worker,/"\/theme-crew-runtime\.js"/);
 assert.match(worker,/const response=await fetch\(request\)/);
 assert.match(worker,/event.respondWith\(responseReady\)/);
 assert.match(worker,/event.waitUntil\(responseReady.then\(\(\)=>write/);
});

test("Arcade catalog builder does not resurrect obsolete shared-theme paths",()=>{
 const build=readFileSync(new URL("./build-arcade-catalog.mjs",import.meta.url),"utf8");
 assert.ok(build.includes('href="/theme.css"'));
 assert.ok(build.includes('src="/nav.js"'));
 assert.doesNotMatch(build,/\/nav\.js\?v=/);
 assert.doesNotMatch(build,/\/theme\.css\?v=/);
});
