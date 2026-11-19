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

test("staff review packet binds a verified read-only main excerpt to a non-executing diff",()=>{
 for(const id of ["studio-repo-propose","studio-proposal-export","studio-proposal-status","studio-proposal-output"]){
  assert.ok(html.includes('id="'+id+'"'),"missing proposal control "+id);
 }
 assert.match(html,/Stage review proposal from edited excerpt/);
 assert.match(html,/Partial excerpts are not ready-to-apply patches/);
 assert.match(js,/if\(result\.branch!=="main"\)/);
 assert.match(js,/proposalSnapshot=.*original:snippet/);
 assert.match(js,/utility\("dev\.code_diff",\{before:snapshot\.original,after:candidate\}\)/);
 assert.match(js,/base commit SHA not locked/);
 assert.match(js,/NOT an apply-ready full-file patch/);
 assert.match(js,/code\.value!==reviewCandidate/);
 assert.match(js,/reviewPacket=.*join/);
 assert.doesNotMatch(js,/github\.com\/repos\/[^\s]*\/contents\/.*method:\s*"PUT"/);
});
