import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../public/_headers",import.meta.url),"utf8");
test("Cloudflare Pages header rules remain under the 100-rule limit",()=>{
 const rules=source.split(/\r?\n/).filter(line=>line.startsWith("/")&&!line.startsWith("//"));
 assert.ok(rules.length<=100,"Cloudflare supports at most 100 custom header rules, found "+rules.length);
 assert.equal(new Set(rules).size,rules.length,"Duplicate path headers waste the Cloudflare rule budget");
 assert.ok(rules.includes("/chaos-crucible*"),"Crucible assets must share a single wildcard cache rule");
 assert.ok(rules.some(x=>x==="/miss-chaos-presence.js"));
 assert.ok(rules.some(x=>x==="/miss-chaos-dock.js"));
});
