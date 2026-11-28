// Static inspection of bounded stored ZIP projects. Never executes uploaded code.
import {readProjectZip} from "./chaos-forge-zip.mjs";
import {reverseSource} from "./chaos-forge-reverse.mjs";
const langs={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",jsx:"jsx",tsx:"tsx"};
export function inspectProjectArchive(bytes){
 const files=readProjectZip(bytes),inventory=[],analyses=[],edges=[],warnings=[];
 for(const f of files){
  const extension=f.path.split(".").pop().toLowerCase(),language=Object.hasOwn(langs,extension)?langs[extension]:null;
  inventory.push({path:f.path,bytes:f.bytes,crc32:f.crc32,language});
  if(language){
   if(f.bytes>10000){warnings.push({path:f.path,message:"Source exceeds analysis limit."});continue;}
   try{const r=reverseSource(f.content,language);analyses.push({path:f.path,syntaxValid:r.syntax_valid,symbols:r.symbols?.slice(0,25)||[],findings:r.findings||[],errors:r.errors||[],calls:r.calls?.slice(0,25)||[],components:r.components?.slice(0,25)||[]});for(const m of r.modules||[])edges.push({from:f.path,to:m.specifier,kind:m.kind});}catch{warnings.push({path:f.path,message:"Source analysis unavailable."});}
  }
 }
 let manifest=null;
 const pkg=files.find(f=>f.path==="package.json");
 if(pkg){try{const p=JSON.parse(pkg.content);if(!p||typeof p!=="object"||Array.isArray(p))throw Error();manifest={name:typeof p.name==="string"?p.name.slice(0,100):null,version:typeof p.version==="string"?p.version.slice(0,40):null,scripts:Object.keys(p.scripts||{}).slice(0,30),dependencies:Object.keys(p.dependencies||{}).slice(0,50),devDependencies:Object.keys(p.devDependencies||{}).slice(0,50)};if(["preinstall","install","postinstall","prepare"].some(k=>manifest.scripts.includes(k)))warnings.push({path:"package.json",message:"Package has lifecycle scripts; review before installation."});}catch{warnings.push({path:"package.json",message:"Invalid package manifest."});}}
 return {format:"stored-zip",bytes:bytes.length,fileCount:files.length,inventory,manifest,analyses,dependencies:edges.slice(0,160),warnings,executed:false,notice:"CRC and directory consistency verified, not authenticity or security. Stored UTF-8 ZIP subset only; no extraction, installation, or source execution."};
}
