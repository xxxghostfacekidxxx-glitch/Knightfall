import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("public/chaos-visual-lab.html");
const js=read("public/chaos-visual-lab.js");
const css=read("public/chaos-visual-lab.css");
const foundry=read("public/devil-tools.html");
const publicPages=read("backend/chaos-public-tools.mjs");

test("local art lab is discoverable, usable without staff login, and responsive",()=>{
 assert.match(foundry,/href="\/chaos-visual-lab\.html"/);
 assert.match(publicPages,/Chaos Visual Lab/);
 for(const id of ["visual-file","visual-grid","visual-output-size","visual-process","visual-png","visual-webp",
  "visual-status","visual-drop","visual-preview","visual-swatches","visual-css","visual-copy-colors","visual-save-colors"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/Your selected image stays in your browser/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(html,/src="\/nav.js"/);
});
test("art imports are locally bounded, with real image and color exports",()=>{
 assert.match(js,/createImageBitmap\(file\)/);
 assert.match(js,/file\.size>12\*1024\*1024/);
 assert.match(js,/candidate\.width\*candidate\.height>20_000_000/);
 assert.match(js,/ctx\.imageSmoothingEnabled=false/);
 assert.match(js,/getImageData/);
 assert.match(js,/outputCanvas\.toBlob/);
 assert.match(js,/URL\.revokeObjectURL/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/bitmap\?\.close/);
 assert.doesNotMatch(js,/\bfetch\s*\(/);
 assert.doesNotMatch(js,/XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|\.innerHTML\s*=/);
 assert.doesNotMatch(js,/\beval\s*\(|new Function/);
});
