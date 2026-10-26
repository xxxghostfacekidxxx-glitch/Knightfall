import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const root=new URL("../public/",import.meta.url);
const js=readFileSync(new URL("profile.js",root),"utf8");
const css=readFileSync(new URL("profile.css",root),"utf8");
test("profile script is valid JavaScript",()=>{assert.doesNotThrow(()=>new Script(js,{filename:"profile.js"}));});
test("profile links reject unsafe URL schemes",()=>{
 const match=js.match(/const safeExternalUrl = ([^;]+);/);
 assert.ok(match,"URL sanitizer exists");
 assert.match(js,/\["https:","http:"\]/);
 assert.match(js,/const safeWebsite = safeExternalUrl\(u.website_url\)/);
});
test("profile jump links only target rendered sections",()=>{
 assert.match(js,/const section=root.querySelector\(selector\)/);
 assert.match(js,/if\(!section\)continue/);
 assert.match(js,/aria-label","Profile sections"/);
 assert.match(js,/if\(jump.children.length>1\)/);
});
test("profile navigation supports mobile and keyboard access",()=>{
 assert.match(css,/\.profile-jump a:focus-visible/);
 assert.match(css,/\.profile-jump\{flex-wrap:nowrap;overflow-x:auto/);
 assert.match(css,/scroll-margin-top/);
});
