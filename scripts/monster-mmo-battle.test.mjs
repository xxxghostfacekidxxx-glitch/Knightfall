import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const source=readFileSync("backend/src/index.mmo-staging.js","utf8");
test("monster staging Worker parses",()=>assert.doesNotThrow(()=>new Script(source.replace(/^export /gm,""))));
test("battle damage can faint the lead and end the encounter",()=>{
 assert.match(source,/lead\\.hp=Math\\.max\\(0,lead\\.hp-counter\\)/);
 assert.match(source,/if\\(lead\\.hp===0\\)\\{battleFinished=true/);
 assert.match(source,/if\\(battleFinished\\)battle=null/);
});
test("fainted creatures cannot lead or start encounters",()=>{
 assert.match(source,/if\\(save\\.party\\[index\\]\\.hp<=0\\)/);
 assert.match(source,/if\\(lead\\.hp<=0\\)return json/);
});
test("capture odds are bounded and supply is consumed server-side",()=>{
 assert.match(source,/Math\\.min\\(\\.9,\\.35\\+/);
 assert.match(source,/save\\.bag--/);
});
test("staging cannot silently expose production origins",()=>{
 const header=source.slice(0,source.indexOf("function json"));
 assert.doesNotMatch(header,/https:\\/\\/(?:www\\.)?ash-fall\\.com/);
});
