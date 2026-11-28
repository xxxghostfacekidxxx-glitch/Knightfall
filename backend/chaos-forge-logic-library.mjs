// Numeric function libraries: each call has isolated locals and a shared total VM fuel budget.
import {compileLogic,decompileLogic,runLogic} from "./chaos-forge-logic.mjs";
const nameOK=n=>typeof n==="string"&&/^[a-z][a-z0-9_]{0,23}$/.test(n);
export function compileLogicLibrary(input){
 if(!input||!Array.isArray(input.functions)||input.functions.length<1||input.functions.length>8||!nameOK(input.entry))throw Error("Provide 1–8 named numeric functions and an entry.");
 const earlier=new Map(),functions=[];
 for(const fn of input.functions){
  if(!fn||!nameOK(fn.name)||earlier.has(fn.name))throw Error("Invalid or duplicate function name.");
  const program=compileLogic(fn,{earlier});
  earlier.set(fn.name,{index:functions.length,arity:program.fields.length});functions.push({name:fn.name,program});
 }
 if(!earlier.has(input.entry))throw Error("Unknown entry function.");
 return {schema:"chaos-logic-library-v1",functions,entry:earlier.get(input.entry).index};
}
export function decompileLogicLibrary(program){
 if(!program||program.schema!=="chaos-logic-library-v1"||!Array.isArray(program.functions)||program.functions.length<1||program.functions.length>8||!Number.isInteger(program.entry)||program.entry<0||program.entry>=program.functions.length)throw Error("Invalid library bytecode.");
 const earlier=new Map(),functions=[];
 for(const fn of program.functions){
  if(!fn||!nameOK(fn.name)||earlier.has(fn.name))throw Error("Invalid function.");
  const source=decompileLogic(fn.program,{earlier}).source;
  earlier.set(fn.name,{index:functions.length,arity:source.fields.length});functions.push({name:fn.name,...source});
 }
 const source={functions,entry:functions[program.entry].name};return {source,program:compileLogicLibrary(source),executed:false};
}
export function verifyLogicLibrary(input){
 const program=compileLogicLibrary(input),rebuilt=decompileLogicLibrary(program).program;
 if(!Array.isArray(input.examples)||input.examples.length<3||input.examples.length>16||new Set(input.examples.map(e=>JSON.stringify(e.values))).size<3)throw Error("Provide 3–16 examples with three distinct inputs.");
 const tests=input.examples.map(e=>{if(!e||!Number.isFinite(e.expected))throw Error("Finite expected output required.");const actual=runLogic(program,e.values),again=runLogic(rebuilt,e.values);if(actual!==e.expected||actual!==again)throw Error("Library example mismatch.");return {values:e.values,expected:e.expected,actual};});
 return {program,tests,reconstructed:decompileLogicLibrary(program).source,module:runLogic.toString()+"\nconst program="+JSON.stringify(program)+";\nexport function solve(...values){return runLogic(program,values);}\n",notice:"Numeric functions use separate local frames and share one execution budget. Calls are limited to earlier functions; recursion and host calls are unsupported."};
}
