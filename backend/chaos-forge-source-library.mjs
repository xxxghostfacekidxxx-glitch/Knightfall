// Multiple real source functions, lowered into isolated Forge Logic function frames.
import {parse} from "acorn";
import {translateControlJavaScript} from "./chaos-forge-javascript-control.mjs";
import {translatePython} from "./chaos-forge-python.mjs";
import {verifyLogicLibrary} from "./chaos-forge-logic-library.mjs";
export function translateSourceLibrary(input){
 if(!input||typeof input.source!=="string"||!input.source.trim()||input.source.length>16000||!["python","javascript"].includes(input.language)||typeof input.entry!=="string")throw Error("Provide language, source and entry name.");
 const source=input.source,definitions=[];
 if(input.language==="javascript"){
  const ast=parse(source,{ecmaVersion:"latest",sourceType:"module"});
  for(const top of ast.body){const fn=top.type==="ExportNamedDeclaration"||top.type==="ExportDefaultDeclaration"?top.declaration:top;
   if(fn?.type!=="FunctionDeclaration"||!fn.id||fn.async||fn.generator||!fn.params.length||fn.params.some(p=>p.type!=="Identifier"))throw Error("Only named synchronous numeric functions are supported.");
   definitions.push({name:fn.id.name,fields:fn.params.map(p=>p.name),source:source.slice(fn.start,fn.end)});
  }
 }else{
  let current=null;
  for(const line of source.split(/\r?\n/)){
   const clean=line.split("#")[0].trimEnd();if(!clean.trim())continue;
   const header=/^def ([a-z][a-z0-9_]*)\(([^()]*)\):$/.exec(clean);
   if(header){current={name:header[1],fields:header[2].split(",").map(s=>s.trim()),source:clean+"\n"};definitions.push(current);}
   else{if(!current||!/^ {4}/.test(clean))throw Error("Only top-level numeric functions are supported.");current.source+=clean+"\n";}
  }
 }
 if(!definitions.length||definitions.length>8)throw Error("Provide 1–8 functions.");
 const earlier=new Map(),functions=[];
 for(const def of definitions){
  if(earlier.has(def.name)||!def.fields.length)throw Error("Duplicate or empty function signature.");
  const translated=(input.language==="python"?translatePython:translateControlJavaScript)(def,{earlier});functions.push({name:def.name,...translated});earlier.set(def.name,def.fields.length);
 }
 if(!earlier.has(input.entry))throw Error("Unknown entry.");
 return {functions,entry:input.entry};
}
export function verifySourceLibrary(input){
 const translated=translateSourceLibrary(input),r=verifyLogicLibrary({...translated,examples:input.examples});
 return {...r,translated,language:input.language,notice:r.notice+" Nested helper calls are supported in numeric expressions, conditions and return values; globals and arbitrary runtime features are unsupported."};
}
