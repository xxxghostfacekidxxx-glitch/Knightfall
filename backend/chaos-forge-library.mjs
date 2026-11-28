// Typed function composition. Earlier functions may be called by later functions.
// Calls are statically inlined into the existing bounded data VM; recursion is not supported.
import {compileData,decompileData,runData,verifyData,emitDataModule} from "./chaos-forge-data.mjs";
const nameOK=n=>typeof n==="string"&&/^[a-z][a-z0-9_]{0,23}$/.test(n);
export function compileLibrary(input){
 if(!input||!Array.isArray(input.functions)||input.functions.length<1||input.functions.length>8||!nameOK(input.entry))throw Error("Provide 1–8 named functions and an entry function.");
 const defs=new Map();
 for(const fn of input.functions){
  if(!fn||!nameOK(fn.name)||defs.has(fn.name)||!Array.isArray(fn.fields)||fn.fields.length<1||fn.fields.length>8||!Array.isArray(fn.steps)||fn.steps.length>48)throw Error("Invalid or duplicate function");
  const names=new Map(),fields=fn.fields.map(f=>{if(!f||!nameOK(f.name)||names.has(f.name))throw Error("Invalid field");names.set(f.name,{ref:f.name});return {name:f.name,type:f.type};});
  const steps=[];let counter=0;
  const fresh=()=>{let n;do{n="local_"+(++counter);}while(fields.some(f=>f.name===n));return n;};
  const arg=a=>{if(a&&typeof a==="object"){if(Array.isArray(a)||Object.keys(a).length!==1||!names.has(a.ref))throw Error("Unknown reference");return names.get(a.ref);}return a;};
  for(const s of fn.steps){
   if(!s||!nameOK(s.name)||names.has(s.name)||!Array.isArray(s.args))throw Error("Invalid or duplicate step");
   const args=s.args.map(arg);
   if(s.call!==undefined){
    const called=defs.get(s.call);if(!called||args.length!==called.fields.length)throw Error("Call must reference an earlier function with matching arity");
    // Compile a synthetic bridge to check declared argument types, even for unused parameters.
    const partial=compileData({fields,steps,result:fields[0].name});
    const available=new Map([...partial.fields,...partial.steps].map(x=>[x.name,x.type]));
    const kind=a=>a&&typeof a==="object"?available.get(a.ref):typeof a==="string"?"text":typeof a==="number"?"number":typeof a==="boolean"?"boolean":null;
    if(args.some((a,i)=>kind(a)!==called.fields[i].type))throw Error("Function argument type mismatch");
    const map=new Map(called.fields.map((f,i)=>[f.name,args[i]]));
    for(const inner of called.steps){const n=fresh(),mapped=inner.args.map(a=>a&&typeof a==="object"?map.get(a.ref):a);steps.push({name:n,op:inner.op,args:mapped});map.set(inner.name,{ref:n});if(steps.length>48)throw Error("Expanded program exceeds 48 operations");}
    names.set(s.name,map.get(called.result));
   }else{const n=fresh();steps.push({name:n,op:s.op,args});names.set(s.name,{ref:n});}
   if(steps.length>48)throw Error("Expanded program exceeds 48 operations");
  }
  const result=names.get(fn.result);
  if(!result||typeof result!=="object")throw Error("Result must reference a field or computed value");
  const program=compileData({fields,steps,result:result.ref});
  defs.set(fn.name,decompileData(program).source);
 }
 const source=defs.get(input.entry);if(!source)throw Error("Unknown entry function");
 return {program:compileData(source),functions:defs.size,entry:input.entry,expandedOperations:source.steps.length};
}
export function verifyLibrary(input){
 const compiled=compileLibrary(input),source=decompileData(compiled.program).source;
 const report=verifyData({...source,examples:input.examples});
 return {...compiled,tests:report.tests,module:emitDataModule(compiled.program),externalInference:false,notice:"Functions statically inlined; decompilation recovers flattened operations, not original function boundaries."};
}
