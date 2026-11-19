import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../public/miss-chaos.html",import.meta.url),"utf8");
const script=readFileSync(new URL("../public/miss-chaos.js",import.meta.url),"utf8");
test("photo analysis is opt-in and clearly labeled in chat",()=>{
 assert.match(html,/id="chaos-reference-photo"/);
 assert.match(html,/id="chaos-reference-input"/);
 assert.match(html,/id="chaos-reference-status"/);
 assert.match(html,/Review generated notes before sending/);
 assert.match(script,/referenceButton\.addEventListener\("click"/);
 assert.match(script,/referenceInput\.addEventListener\("change"/);
 assert.match(script,/\/api\/chaos\/forge\/analyze/);
 assert.match(script,/kind:"craft"/);
});
test("photo is compressed locally and only analyzed result is staged for review",()=>{
 assert.match(script,/image\.naturalWidth\*image\.naturalHeight>16000000/);
 assert.match(script,/768\/Math\.max/);
 assert.match(script,/canvas\.toDataURL\("image\/jpeg"/);
 assert.match(script,/file\.size>8\*1024\*1024/);
 assert.match(script,/original\?original\+"\\n\\n":""/);
 assert.match(script,/press Send when you're ready/);
 assert.doesNotMatch(script,/localStorage\.setItem\("chaos-reference/);
});
