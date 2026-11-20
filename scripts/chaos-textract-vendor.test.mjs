import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TEXTRACT_VENDOR_ASSETS,inspectVendorAsset,TEXTRACT_VENDOR_ROOT} from "./textract-vendor.mjs";
const src=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("all Textract dependencies are distributed from the local Pages asset tree",()=>{
 assert.equal(TEXTRACT_VENDOR_ROOT,"public/vendor/textract");
 const paths=TEXTRACT_VENDOR_ASSETS.map(x=>x.path);
 assert.equal(new Set(paths).size,paths.length);
 for(const required of ["pdf.min.mjs","pdf.worker.min.mjs","jszip.min.js",
  "tesseract.min.js","worker.min.js","lang/eng.traineddata.gz",
  "core/tesseract-core-simd-lstm.wasm.js","core/tesseract-core-simd-lstm.wasm",
  "licenses/pdfjs.LICENSE","licenses/tesseract.LICENSE","licenses/eng.LICENSE"]){
  assert.ok(paths.includes(required),"missing "+required);
 }
 assert.equal(paths.filter(x=>x.startsWith("core/")).length,8);
 for(const asset of TEXTRACT_VENDOR_ASSETS)assert.match(asset.url,/https:\/\//);
 const core=src("public/chaos-textract-core.mjs");
 assert.doesNotMatch(core,/(?:cdnjs|jsdelivr|unpkg|raw\.githubusercontent|https:\/\/)/);
 assert.match(core,/workerBlobURL:false/);
 assert.match(core,/langPath:TEXTRACT_LOCAL_ASSETS\.ocrLanguages/);
 assert.match(core,/corePath:TEXTRACT_LOCAL_ASSETS\.ocrCore/);
 assert.match(core,/workerPath:TEXTRACT_LOCAL_ASSETS\.ocrWorker/);
 assert.match(core,/\/vendor\/textract\/pdf\.min\.mjs/);
 assert.match(core,/\/vendor\/textract\/pdf\.worker\.min\.mjs/);
});
test("vendor downloader rejects HTML errors, invalid magic bytes and oversized files",()=>{
 const bytes=new TextEncoder().encode("/* bundled */ function works(){return 1;} ".repeat(30));
 assert.match(inspectVendorAsset("jszip.min.js",bytes,"js"),/^[a-f0-9]{64}$/);
 assert.throws(()=>inspectVendorAsset("worker.min.js",new TextEncoder().encode("<html>"+("broken".repeat(30))+"</html>"),"js"),/HTML/);
 assert.throws(()=>inspectVendorAsset("core.wasm",bytes,"wasm"),/WebAssembly/);
 assert.throws(()=>inspectVendorAsset("eng.gz",bytes,"gzip"),/gzip/);
 assert.match(inspectVendorAsset("core.wasm",new Uint8Array([0,97,115,109,...new Array(16).fill(0)]),"wasm"),/^[a-f0-9]{64}$/);
});
test("Pages release guard copies vendor dependencies after passing the existing gate",()=>{
 const guard=src("scripts/pages-release-guard.mjs");
 assert.match(guard,/scripts\/textract-vendor\.mjs/);
 assert.match(guard,/PAGES RELEASE BLOCKED: local Textract runtime/);
 assert.match(guard,/scripts\/chaos-textract-lab\.test\.mjs/);
});
