import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../public/chaos-code-studio.html",import.meta.url),"utf8");
const js=readFileSync(new URL("../public/chaos-code-studio.js",import.meta.url),"utf8");
const chat=readFileSync(new URL("../public/miss-chaos.html",import.meta.url),"utf8");
test("Code Studio exposes editor, inspect, formatting, exports and local diagram UI",()=>{
 for(const id of ["studio-code","studio-language","studio-inspect","studio-format","studio-save","studio-undo",
  "studio-steps","studio-diagram-build","studio-diagram-svg","studio-diagram-mermaid","studio-diagram-preview","studio-mermaid",
  "studio-diff-before","studio-diff-after","studio-diff-run","studio-diff-export","studio-diff-output","studio-schema","studio-json-data","studio-schema-check","studio-schema-output"]){
  assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 }
 assert.match(chat,/\/chaos-code-studio\.html/);
 assert.match(html,/type="module" src="\/chaos-code-studio\.js/);
});
test("Studio escapes content through text and SVG nodes, never executes or persists source",()=>{
 assert.match(js,/\.textContent=/);
 assert.match(js,/createElementNS/);
 assert.match(js,/credentials:"include"/);
 assert.match(js,/api\/chaos\/tools\/execute/);
 assert.doesNotMatch(js,/\beval\s*\(/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.doesNotMatch(js,/localStorage|sessionStorage/);
 assert.doesNotMatch(js,/new Function/);
 assert.match(js,/URL\.revokeObjectURL/);
});
