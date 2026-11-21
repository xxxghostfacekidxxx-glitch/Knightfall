#!/usr/bin/env node
/**
 * Knightfall Creator Foundry: one-time, checksum-verified transfer of the
 * original Egyptian Eclipse and Dark Lord Ascendant theme artwork.
 *
 * --import  Download six exact originals from their temporary transport copy,
 *           keep original bytes, write a first-party public theme-art manifest.
 * --verify  Offline integrity audit of the six locally stored PNG originals.
 *
 * No third-party dependency or external image URL remains in the public gallery.
 * Never delete or silently replace artwork. Never commit secrets or API keys.
 */
import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve,dirname,relative,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const config=JSON.parse(readFileSync(resolve(root,"scripts/knightfall-theme-art-sources.json"),"utf8"));
const base=resolve(root,"public/assets/knightfall/theme-collections");
const file=asset=>resolve(base,asset.collection,asset.file);
const digest=buffer=>createHash("sha256").update(buffer).digest("hex");
const report=[];
const mode=process.argv.includes("--import")?"import":process.argv.includes("--verify")?"verify":null;
if(!mode)throw Error("Use --import or --verify");
if(!Array.isArray(config.assets)||config.assets.length!==6)throw Error("Unexpected original artwork count");
const seen=new Set();
for(const asset of config.assets){
 if(!/^[a-z0-9-]+$/.test(asset.collection)||!/^[a-z0-9-]+\.png$/.test(asset.file))
  throw Error("Unsafe image path: "+asset.file);
 const destination=file(asset);
 if(!destination.startsWith(base+sep)||seen.has(destination))throw Error("Unsafe or duplicate destination");
 seen.add(destination);
 if(!/^[a-f\d]{64}$/.test(asset.sha256)||!Number.isSafeInteger(asset.bytes)||asset.bytes>8000000)
  throw Error("Invalid original artwork checksum/size");
 let bytes;
 if(existsSync(destination))bytes=readFileSync(destination);
 else if(mode==="import"){
  const source=new URL(asset.url);
  if(source.protocol!=="https:"||source.hostname!=="gcdn.picsart.com")throw Error("Unapproved transfer host");
  const response=await fetch(source,{redirect:"error",signal:AbortSignal.timeout(90000)});
  if(!response.ok)throw Error("Download failed "+asset.file+": "+response.status);
  const type=String(response.headers.get("content-type")||"");
  if(type&&!type.includes("image/png")&&!type.includes("octet-stream"))throw Error("Unexpected MIME for "+asset.file+": "+type);
  const declared=Number(response.headers.get("content-length")||0);
  if(declared&&declared!==asset.bytes)throw Error("Original file size mismatch for "+asset.file);
  bytes=Buffer.from(await response.arrayBuffer());
 }else throw Error("Missing Creator Foundry original: "+relative(root,destination));
 if(bytes.length!==asset.bytes||digest(bytes)!==asset.sha256)
  throw Error("Artwork checksum mismatch; refusing to overwrite: "+asset.file);
 if(bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||
    bytes.subarray(12,16).toString("ascii")!=="IHDR"||
    bytes.readUInt32BE(16)!==asset.width||bytes.readUInt32BE(20)!==asset.height)
  throw Error("Not the expected PNG dimensions: "+asset.file);
 if(!existsSync(destination)){
  mkdirSync(dirname(destination),{recursive:true});
  writeFileSync(destination,bytes,{flag:"wx"});
  console.log("Saved original image: "+relative(root,destination));
 }
 report.push({
  id:asset.id,collection:asset.collection,title:asset.title,role:asset.role,
  path:"/assets/knightfall/theme-collections/"+asset.collection+"/"+asset.file,
  sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height,
  rights:"Original artwork created for Knightfall; no licensed third-party character artwork"
 });
}
const manifestPath=resolve(base,"manifest.json");
const publicManifest={
 id:config.id,version:"2026-11-20",status:"originals-preserved",
 origin:"Original Egyptian-inspired and dark-space-fantasy artwork created for Knightfall; no franchise names or official character assets.",
 usage:"Reusable Creator Foundry artwork. Concept images are reference art, not functional interfaces or proof of installed themes.",
 assets:report
};
if(mode==="import"){
 mkdirSync(base,{recursive:true});
 const text=JSON.stringify(publicManifest,null,2)+"\n";
 if(existsSync(manifestPath)&&readFileSync(manifestPath,"utf8")!==text)
  throw Error("Existing public manifest differs: review before replacing");
 if(!existsSync(manifestPath))writeFileSync(manifestPath,text,{flag:"wx"});
}else{
 if(!existsSync(manifestPath))throw Error("First-party theme artwork manifest missing");
 const committed=JSON.parse(readFileSync(manifestPath,"utf8"));
 if(JSON.stringify(committed)!==JSON.stringify(publicManifest))
  throw Error("Theme artwork manifest does not match actual original images");
}
console.log("KNIGHTFALL THEME ART "+mode.toUpperCase()+" PASS: "+report.length+" originals, "+report.reduce((n,a)=>n+a.bytes,0)+" verified bytes.");
