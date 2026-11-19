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
 assert.match(html,/Your selected image and QR design stay in your browser/);
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

test("licensed browser libraries are bundled locally and primary advanced controls are real",()=>{
 const pica=read("public/vendor/visual-lab/pica.min.mjs");
 const qr=read("public/vendor/visual-lab/qrcode.mjs");
 const tracer=read("public/vendor/visual-lab/imagetracer.js");
 const notices=read("public/vendor/visual-lab/LICENSES.txt");
 assert.ok(pica.length>10000&&qr.length>10000&&tracer.length>10000);
 assert.match(notices,/Pica[\s\S]*MIT/);
 assert.match(notices,/QRCode Generator[\s\S]*MIT/);
 assert.match(notices,/ImageTracerJS[\s\S]*Unlicense/);
 assert.match(js,/import pica from "\.\/vendor\/visual-lab\/pica\.min\.mjs"/);
 assert.match(js,/import qrcode from "\.\/vendor\/visual-lab\/qrcode\.mjs"/);
 assert.match(html,/src="\/vendor\/visual-lab\/imagetracer\.js"/);
 for(const id of ["visual-engine","visual-effect","visual-trace","visual-svg","visual-trace-style",
  "visual-trace-detail","visual-svg-preview","visual-qr-url","visual-qr-label","visual-qr-generate",
  "visual-qr-preview","visual-qr-png","visual-qr-svg","visual-commons-query",
  "visual-commons-search","visual-commons-results","visual-commons-license"]){
  assert.ok(html.includes('id="'+id+'"'),"advanced control missing "+id);
 }
 assert.match(js,/resizer\.resize\(from,canvas,\{filter:"lanczos3",alpha:true\}\)/);
 assert.match(js,/window\.ImageTracer\.imagedataToSVG/);
 assert.match(js,/code\.addData\(urlString\)/);
 assert.match(js,/code\.getModuleCount\(\)/);
 assert.match(js,/new Blob\(\[traceSvg\]/);
 assert.match(js,/showCommons\(result\.items\)/);
});
test("private artwork and QR never call third-party services",()=>{
 const openverse=read("public/chaos-openverse.mjs");
 assert.doesNotMatch(js,/\bfetch\s*\(/);
 assert.doesNotMatch(js,/XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|\.innerHTML\s*=/);
 assert.match(openverse,/https:\/\/api\.openverse\.org\/v1\/images\//);
 assert.match(openverse,/credentials:"omit"/);
 assert.match(openverse,/referrerPolicy:"no-referrer"/);
 assert.doesNotMatch(openverse,/getImageData|FileReader|createImageBitmap|\.innerHTML/);
 assert.match(js,/show\.addEventListener\("click",\(\)=>/);
 assert.match(js,/image\.src=item\.thumbnail_url/);
 assert.match(js,/image\.referrerPolicy="no-referrer"/);
});
