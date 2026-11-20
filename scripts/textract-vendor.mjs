/**
 * Freeze Textract runtime dependencies as first-party Cloudflare Pages assets.
 * Runs during the Pages build, not in any visitor's browser.
 * Versions are pinned; if a required asset cannot be obtained, the build fails.
 */
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {join,dirname,resolve} from "node:path";
import {createHash} from "node:crypto";

export const TEXTRACT_VENDOR_ROOT = "public/vendor/textract";
const cdn="https://cdn.jsdelivr.net/npm/";
const assets=[
 ["pdf.min.mjs","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs","js"],
 ["pdf.worker.min.mjs","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs","js"],
 ["jszip.min.js",cdn+"jszip@3.10.1/dist/jszip.min.js","js"],
 ["tesseract.min.js",cdn+"tesseract.js@5.1.1/dist/tesseract.min.js","js"],
 ["worker.min.js",cdn+"tesseract.js@5.1.1/dist/worker.min.js","js"],
 ...["tesseract-core.wasm","tesseract-core-simd.wasm","tesseract-core-lstm.wasm","tesseract-core-simd-lstm.wasm"].flatMap(name=>[
  ["core/"+name+".js",cdn+"tesseract.js-core@5.0.0/"+name+".js","js"],
  ["core/"+name,cdn+"tesseract.js-core@5.0.0/"+name,"wasm"]
 ]),
 ["lang/eng.traineddata.gz",cdn+"@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz","gzip"],
 ["licenses/pdfjs.LICENSE",cdn+"pdfjs-dist@4.10.38/LICENSE","license"],
 ["licenses/jszip.LICENSE.markdown",cdn+"jszip@3.10.1/LICENSE.markdown","license"],
 ["licenses/tesseract.LICENSE",cdn+"tesseract.js@5.1.1/LICENSE","license"],
 ["licenses/tesseract-core.LICENSE",cdn+"tesseract.js-core@5.0.0/LICENSE","license"],
 ["licenses/eng.LICENSE","https://raw.githubusercontent.com/naptha/tessdata/master/LICENSE","license"]
];
export const TEXTRACT_VENDOR_ASSETS=Object.freeze(assets.map(([path,url,kind])=>Object.freeze({path,url,kind})));
export function inspectVendorAsset(name,buffer,kind){
 if(!(buffer instanceof Uint8Array)||buffer.length<12||buffer.length>25*1024*1024)
  throw Error(name+": missing, empty or exceeds Cloudflare static asset limit");
 if(kind==="wasm"&&!(buffer[0]===0&&buffer[1]===97&&buffer[2]===115&&buffer[3]===109))
  throw Error(name+": WebAssembly magic header missing");
 if(kind==="gzip"&&!(buffer[0]===31&&buffer[1]===139))
  throw Error(name+": gzip language data header missing");
 if(["js","license"].includes(kind)){
  const head=new TextDecoder().decode(buffer.slice(0,128)).trimStart();
  if(head.startsWith("<!")||head.startsWith("<html"))
   throw Error(name+": received an HTML error page instead of a library");
 }
 if(kind==="js"&&buffer.length<500)
  throw Error(name+": JavaScript bundle is unexpectedly small");
 return createHash("sha256").update(buffer).digest("hex");
}
async function download(url,maxAttempts=3){
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(90000),redirect:"follow",headers:{"Accept":"*/*"}});
   if(!response.ok)throw Error("HTTP "+response.status+" from "+new URL(url).host);
   const length=Number(response.headers.get("content-length")||"0");
   if(length>25*1024*1024)throw Error("Asset exceeds 25 MiB");
   const data=new Uint8Array(await response.arrayBuffer());
   return data;
  }catch(error){
   if(attempt===maxAttempts)throw Error(url+": "+String(error?.message||error));
   await new Promise(done=>setTimeout(done,900*attempt));
  }
 }
}
export async function installTextractVendors({root=TEXTRACT_VENDOR_ROOT}={}){
 const destination=resolve(root);
 const results=[];
 for(const asset of TEXTRACT_VENDOR_ASSETS){
  const bytes=await download(asset.url);
  const sha256=inspectVendorAsset(asset.path,bytes,asset.kind);
  const path=join(destination,asset.path);
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,bytes);
  results.push({path:asset.path,source:asset.url,bytes:bytes.length,sha256});
  console.log("TEXTRACT VENDOR",asset.path,bytes.length+" bytes");
 }
 const manifest={name:"Knightfall Textract self-hosted dependencies",builtAt:new Date().toISOString(),
  note:"Retained upstream licenses; see licenses/ and docs/MISS-CHAOS-TEXTRACT.md.",
  assets:results};
 await writeFile(join(destination,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
 return manifest;
}
if(process.argv[1]&&import.meta.url===new URL("file://"+resolve(process.argv[1])).href){
 await installTextractVendors();
}
