import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const html=readFileSync("public/arcade/hosted/tether-tangle/index.html","utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes("function init()"));
test("Tether Tangle exposes real score, not best stage, to account bridge",()=>{
 assert.ok(source);assert.doesNotThrow(()=>new Script(source));
 assert.ok(html.includes('id="score"'));
 assert.ok(html.includes('data-score-selector="#score"'));
 assert.ok(source.includes("ashfall:arcade-finished"));
 assert.ok(source.includes("ashfall:arcade-started"));
});
test("Tether Tangle restarts invalidate old physics frames and restore visible score",()=>{
 assert.ok(source.includes("if(token!==runToken||!running)return"));
 assert.ok(source.includes("runToken++"));
 assert.ok(source.includes("requestAnimationFrame(t=>loop(t,token))"));
 assert.ok(source.includes("$('score').textContent=score"));
});
