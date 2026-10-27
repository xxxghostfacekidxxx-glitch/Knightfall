import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync("public/arcade/hosted/words-of-wonder/ash-lexicon.js","utf8");
test("Ashen Lexicon parses and has a local score bridge",()=>{
 assert.doesNotThrow(()=>new Script(source));
 const page=readFileSync("public/arcade/hosted/words-of-wonder/index.html","utf8");
 assert.ok(page.includes('data-game-id="cabinet-words-of-wonder"'));
 assert.ok(page.includes("ash-lexicon.js"));
});
test("duplicate letters are graded only once when the answer has one copy",()=>{
 const match=source.match(/function grade\(guess,answer\)\{[^}]*\}[^}]*\}/);
 assert.ok(match,"grading function must exist");
 const grade=runInNewContext(match[0]+";grade",{}, {timeout:1000});
 assert.deepEqual(Array.from(grade("EEEEE","EMBER")),["hit","near","miss","miss","miss"]);
 assert.deepEqual(Array.from(grade("EMBER","EMBER")),["hit","hit","hit","hit","hit"]);
});
