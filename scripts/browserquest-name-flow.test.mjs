import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("public/arcade/hosted/browserquest-solo/index.html","utf8");
const js=readFileSync("public/arcade/hosted/browserquest-solo/js/main.js","utf8");
test("BrowserQuest name form never navigates to a site login route",()=>{
 assert.doesNotMatch(html,/<form[^>]*action="none"/);
 assert.match(html,/id="browserquest-name-form"/);
 assert.match(html,/onsubmit="event\.preventDefault\(\)/);
});
test("BrowserQuest starts locally from name form and Enter",()=>{
 assert.match(js,/browserquest-name-form/);
 assert.match(js,/event\.preventDefault\(\)/);
 assert.match(js,/app\.tryStartingGame\(name\)/);
 assert.match(js,/nameinput'\)\.keypress/);
});
