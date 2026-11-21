#!/usr/bin/env node
/** Import seven new exact-byte original theme paintings into first-party Foundry storage.
 * --import verifies the previous originals and appends only new, reviewed art.
 * --verify audits the seven new PNGs offline, without any external dependencies.
 * Never delete or replace an existing asset, even when a transport URL changes.
 */
import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve,relative,dirname,sep} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const base=resolve(root,"public/assets/knightfall/theme-collections");
const manifestPath=resolve(base,"manifest.json");
const config=JSON.parse(readFileSync(resolve(root,"scripts/knightfall-theme-art-expansion-sources.json"),"utf8"));
const mode=process.argv.includes("--import")?"import":process.argv.includes("--verify")?"verify":null;
if(!mode)throw Error("Use --import or --verify");
if(!Array.isArray(config.assets)||config.assets.length!==7)throw Error("Expected seven new original images");
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const report=[],seen=new Set();
if(!existsSync(manifestPath))throw Error("The first six theme originals must exist before expansion import");
const manifest=JSON.parse(readFileSync(manifestPath,"utf8"));
if(manifest.id!=="knightfall-2026-11-20-premium-theme-art"||!Array.isArray(manifest.assets)||manifest.assets.length<6)throw Error("Invalid base artwork inventory");
for(const asset of config.assets){
 if(!/^[a-z0-9-]+$/.test(asset.collection)||!/^[a-z0-9-]+\.png$/.test(asset.file)||
  !/^[a-f0-9]{64}$/.test(asset.sha256)||!Number.isInteger(asset.bytes)||asset.bytes<=0||asset.bytes>8000000||
  !Number.isInteger(asset.width)||!Number.isInteger(asset.height))
  throw Error("Unapproved asset metadata: "+JSON.stringify(asset).slice(0,150));
 const dest=resolve(base,asset.collection,asset.file);
 if(!dest.startsWith(base+sep)||seen.has(dest))throw Error("Unsafe or duplicate asset path");
 seen.add(dest);
 let bytes;
 if(existsSync(dest))bytes=readFileSync(dest);
 else if(mode==="import"){
  const source=new URL(asset.url);
  if(source.protocol!=="https:"||source.hostname!=="gcdn.picsart.com")throw Error("Unapproved transfer origin");
  const res=await fetch(source,{redirect:"error",signal:AbortSignal.timeout(90000)});
  if(!res.ok)throw Error("Artwork transport failed: "+asset.file+" HTTP "+res.status);
  const mime=res.headers.get("content-type")||"";
  if(mime&&!/image\/png|octet-stream/i.test(mime))throw Error("Invalid artwork transport MIME: "+mime);
  const declared=Number(res.headers.get("content-length")||0);
  if(declared&&declared!==asset.bytes)throw Error("Transport file size changed: "+asset.file);
  bytes=Buffer.from(await res.arrayBuffer());
 }else throw Error("Missing original file: "+relative(root,dest));
 if(bytes.length!==asset.bytes||hash(bytes)!==asset.sha256)throw Error("Artwork bytes were modified: "+asset.file);
 if(bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||
    bytes.subarray(12,16).toString("ascii")!=="IHDR"||
    bytes.readUInt32BE(16)!==asset.width||bytes.readUInt32BE(20)!==asset.height)
   throw Error("Unrecognized original PNG or dimensions: "+asset.file);
 if(!existsSync(dest)){
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,bytes,{flag:"wx"});
  console.log("Preserved original: "+relative(root,dest));
 }
 const item={
  id:asset.id,collection:asset.collection,title:asset.title,role:asset.role,
  path:"/assets/knightfall/theme-collections/"+asset.collection+"/"+asset.file,
  sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height,
  rights:"Original artwork created for Knightfall; no licensed third-party character artwork"
 };
 report.push(item);
 const existing=manifest.assets.find(x=>x.id===item.id);
 if(existing&&JSON.stringify(existing)!==JSON.stringify(item))throw Error("A previously preserved image cannot be replaced: "+item.id);
}
if(manifest.assets.slice(0,6).some(x=>!x.sha256||x.bytes<1))throw Error("Original six images are not intact");
const known=new Set(manifest.assets.map(a=>a.id));
if(known.size!==manifest.assets.length)throw Error("Artwork manifest contains duplicate IDs");
for(const item of report){
 if(mode==="verify"&&!known.has(item.id))throw Error("New artwork is not yet registered: "+item.id);
 if(mode==="import"&&!known.has(item.id)){manifest.assets.push(item);known.add(item.id)}
}
if(mode==="import"){
 const newManifest=JSON.stringify(manifest,null,2)+"\n";
 if(readFileSync(manifestPath,"utf8")!==newManifest)writeFileSync(manifestPath,newManifest);
}
console.log("KNIGHTFALL ART EXPANSION "+mode.toUpperCase()+" PASS: "+report.length+" new original PNGs, "+
 report.reduce((s,a)=>s+a.bytes,0)+" bytes verified. Total in inventory: "+manifest.assets.length);
