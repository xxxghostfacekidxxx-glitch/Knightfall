#!/usr/bin/env node
/* Checksum-pinned import for the five recovered Knightfall theme art packs. */
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {dirname,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const base=resolve(root,"public/assets/knightfall/theme-collections");
const manifestPath=resolve(base,"recovered-artwork-manifest.json");
const sources=JSON.parse(readFileSync(resolve(root,"scripts/knightfall-recovered-theme-art-sources.json"),"utf8"));
const mode=process.argv.includes("--import")?"import":process.argv.includes("--verify")?"verify":null;
if(!mode||process.argv.includes("--import")&&process.argv.includes("--verify"))throw Error("Use --import --archive <zip> or --verify");
const archiveArg=process.argv.indexOf("--archive");
const archive=archiveArg>=0?resolve(process.argv[archiveArg+1]||""):null;
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const readArchive=member=>execFileSync("unzip",["-p",archive,member],{encoding:null,maxBuffer:12*1024*1024});
const imageAssets=sources.assets;
const vectorAssets=sources.existingVectorAssets;
if(sources.id!=="knightfall-recovered-theme-art-2026-11-25"||Object.keys(sources.collections).length!==5||imageAssets.length!==15||vectorAssets.length!==25)
 throw Error("Recovered artwork inventory is incomplete or unexpected");
const ids=new Set(),paths=new Set(),report=[];
if(mode==="import"){
 if(!archive||!existsSync(archive))throw Error("Pass the recovered artwork ZIP with --archive");
 const members=execFileSync("unzip",["-Z1",archive],{encoding:"utf8",maxBuffer:1024*1024}).trim().split(/\r?\n/).filter(Boolean);
 const expectedMembers=["inventory.json",...imageAssets.map(item=>item.member)].sort();
 if(members.slice().sort().join("\n")!==expectedMembers.join("\n"))throw Error("ZIP member list does not match the approved five-theme inventory");
 const inventory=JSON.parse(readArchive("inventory.json").toString("utf8"));
 const packed=new Map(inventory.flatMap(group=>group.assets.map(item=>[group.collection+"/"+item.name,item])));
 if(packed.size!==imageAssets.length)throw Error("ZIP inventory has missing or duplicate artwork entries");
 for(const item of imageAssets){
  const entry=packed.get(item.member);
  if(!entry||entry.bytes!==item.bytes||entry.sha256!==item.sha256)throw Error("ZIP inventory metadata differs for "+item.member);
 }
}
for(const item of imageAssets){
 if(!Object.hasOwn(sources.collections,item.collection)||!/^([a-z0-9-]+)\/(asset-sheet\.webp|environment-preview\.webp|original-sheet\.png)$/.test(item.member)||
  !/^[a-f0-9]{64}$/.test(item.sha256)||!Number.isInteger(item.bytes)||!Number.isInteger(item.width)||!Number.isInteger(item.height))throw Error("Invalid recovered image metadata");
 const destination=resolve(base,item.collection,item.file),id=item.collection+"-"+item.file.replace(/\./g,"-");
 if(!destination.startsWith(base+sep)||ids.has(id)||paths.has(destination))throw Error("Duplicate or unsafe recovered image path");
 ids.add(id);paths.add(destination);
 let bytes;
 if(mode==="import")bytes=readArchive(item.member);
 else if(existsSync(destination))bytes=readFileSync(destination);
 else throw Error("Recovered theme artwork missing: "+item.collection+"/"+item.file);
 if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error("Recovered artwork checksum mismatch: "+item.member);
 if(item.format==="png"&&bytes.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")throw Error("Invalid PNG signature: "+item.member);
 if(item.format==="webp"&&(bytes.subarray(0,4).toString("ascii")!=="RIFF"||bytes.subarray(8,12).toString("ascii")!=="WEBP"))throw Error("Invalid WebP signature: "+item.member);
 if(!existsSync(destination)){
  mkdirSync(dirname(destination),{recursive:true});
  writeFileSync(destination,bytes,{flag:"wx"});
  console.log("Preserved recovered original: "+item.collection+"/"+item.file);
 }
 report.push({id,collection:item.collection,title:item.title,role:item.role,format:item.format,
  path:"/assets/knightfall/theme-collections/"+item.collection+"/"+item.file,
  sha256:item.sha256,bytes:item.bytes,width:item.width,height:item.height,
  rights:"Recovered Knightfall theme artwork; checksum-pinned from the supplied original archive."});
}
for(const item of vectorAssets){
 const destination=resolve(base,item.collection,item.file),id=item.collection+"-"+item.file.replace(/\./g,"-");
 if(!Object.hasOwn(sources.collections,item.collection)||!/^[a-z0-9-]+\.svg$/.test(item.file)||!/^([a-f0-9]{64})$/.test(item.sha256)||
  !Number.isInteger(item.bytes)||ids.has(id)||paths.has(destination))throw Error("Invalid or duplicate vector artwork metadata");
 ids.add(id);paths.add(destination);
 if(!existsSync(destination))throw Error("Existing vector theme asset is missing: "+item.collection+"/"+item.file);
 const bytes=readFileSync(destination),markup=bytes.toString("utf8");
 if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error("Existing vector checksum mismatch: "+item.collection+"/"+item.file);
 if(!/^<svg\b/.test(markup)||/<(?:script|foreignObject|iframe)\b|on(?:load|error|click)\s*=|href=["'](?:https?:|data:)/i.test(markup))throw Error("Unsafe or invalid vector artwork: "+item.file);
 report.push({id,collection:item.collection,title:item.title,role:item.role,format:"svg",
  path:"/assets/knightfall/theme-collections/"+item.collection+"/"+item.file,
  sha256:item.sha256,bytes:item.bytes,rights:"Existing first-party Knightfall theme ornament; preserved and checksum-verified."});
}
const manifest={id:sources.id,version:sources.version,status:"preserved-and-integrated",
 description:"Five original Knightfall theme collections with checksum-verified environment previews, art sheets, and existing vector ornaments.",
 collections:sources.collections,assets:report};
if(mode==="import"){
 const encoded=JSON.stringify(manifest,null,2)+"\n";
 if(existsSync(manifestPath)){
  if(readFileSync(manifestPath,"utf8")!==encoded)throw Error("Recovered Artwork Vault manifest already exists with different contents");
 }else writeFileSync(manifestPath,encoded,{flag:"wx"});
}
if(mode==="verify"){
 if(!existsSync(manifestPath)||readFileSync(manifestPath,"utf8")!==JSON.stringify(manifest,null,2)+"\n")
  throw Error("Recovered Artwork Vault manifest is missing or out of sync");
}
console.log("RECOVERED THEME ART "+mode.toUpperCase()+" PASS: "+imageAssets.length+" archive images + "+vectorAssets.length+" vectors across "+Object.keys(sources.collections).length+" themes; "+report.reduce((n,x)=>n+x.bytes,0)+" bytes verified.");
