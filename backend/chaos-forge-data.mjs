// Portable typed data-flow compiler. No host imports, dynamic evaluation or arbitrary property access.
const ident=/^[a-z][a-z0-9_]{0,23}$/;
const types=["number","text","numbers","texts","boolean","record"];
const signatures={
 add:[["number","number"],"number"],sub:[["number","number"],"number"],mul:[["number","number"],"number"],div:[["number","number"],"number"],
 trim:[["text"],"text"],lower:[["text"],"text"],upper:[["text"],"text"],concat:[["text","text"],"text"],replace:[["text","text","text"],"text"],
 split:[["text","text"],"texts"],join:[["texts","text"],"text"],words:[["text"],"texts"],length:[["text"],"number"],
 countNumbers:[["numbers"],"number"],countTexts:[["texts"],"number"],sum:[["numbers"],"number"],mean:[["numbers"],"number"],sort:[["numbers"],"numbers"],
 uniqueNumbers:[["numbers"],"numbers"],uniqueTexts:[["texts"],"texts"],reverseTexts:[["texts"],"texts"],filterPositive:[["numbers"],"numbers"],
 toText:[["number"],"text"],parseNumber:[["text"],"number"],contains:[["text","text"],"boolean"],gt:[["number","number"],"boolean"],eq:[["text","text"],"boolean"],
 ifNumber:[["boolean","number","number"],"number"],ifText:[["boolean","text","text"],"text"],
 getText:[["record","text"],"text"],getNumber:[["record","text"],"number"],getBoolean:[["record","text"],"boolean"],hasKey:[["record","text"],"boolean"],setText:[["record","text","text"],"record"],setNumber:[["record","text","number"],"record"],setBoolean:[["record","text","boolean"],"record"],removeKey:[["record","text"],"record"],recordKeys:[["record"],"texts"]
};
export function compileData(input){
 if(!input||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>8||!Array.isArray(input.steps)||input.steps.length>48)throw Error("Provide 1–8 fields and up to 48 steps.");
 const slots=[],fields=input.fields.map(f=>{if(!f||typeof f.name!=="string"||!ident.test(f.name)||!types.includes(f.type)||slots.some(s=>s.name===f.name))throw Error("Invalid or duplicate field");const row={name:f.name,type:f.type};slots.push(row);return row;});
 const valueType=v=>typeof v==="number"&&Number.isFinite(v)?"number":typeof v==="string"&&v.length<=8192?"text":typeof v==="boolean"?"boolean":null;
 const argument=(a,type)=>{if(a&&typeof a==="object"&&!Array.isArray(a)&&Object.keys(a).length===1&&typeof a.ref==="string"){const i=slots.findIndex(s=>s.name===a.ref);if(i<0||slots[i].type!==type)throw Error("Unknown reference or type mismatch: "+a.ref);return ["ref",i];}if(valueType(a)!==type)throw Error("Invalid literal or argument type");return ["literal",a];};
 const steps=input.steps.map(s=>{if(!s||typeof s.name!=="string"||!ident.test(s.name)||slots.some(v=>v.name===s.name)||!Object.hasOwn(signatures,s.op))throw Error("Invalid step or duplicate name");const [args,result]=signatures[s.op];if(!Array.isArray(s.args)||s.args.length!==args.length)throw Error("Wrong argument count");const row={name:s.name,type:result,op:s.op,args:s.args.map((a,i)=>argument(a,args[i]))};slots.push(row);return row;});
 const result=slots.findIndex(s=>s.name===input.result);if(result<0)throw Error("Unknown result reference");
 return {schema:"chaos-data-v1",fields,steps,result};
}
// Self-contained interpreter is embedded in standalone applets and ES modules.
export function runData(program,values){
 const keyOK=k=>typeof k==="string"&&/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(k)&&!["__proto__","constructor","prototype"].includes(k);
 const scalar=v=>typeof v==="boolean"||typeof v==="number"&&Number.isFinite(v)||typeof v==="string"&&v.length<=8192;
 const recordOK=v=>v!==null&&typeof v==="object"&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.keys(v).length<=64&&Object.keys(v).every(k=>keyOK(k)&&scalar(v[k]))&&JSON.stringify(v).length<=16384;
 const check=(v,t)=>t==="record"?recordOK(v):t==="number"?typeof v==="number"&&Number.isFinite(v):t==="boolean"?typeof v==="boolean":t==="text"?typeof v==="string"&&v.length<=8192:["numbers","texts"].includes(t)&&Array.isArray(v)&&v.length<=256&&Array.from(v).every(x=>t==="numbers"?typeof x==="number"&&Number.isFinite(x):t==="texts"&&typeof x==="string"&&x.length<=8192)&&JSON.stringify(v).length<=16384;
 if(!program||program.schema!=="chaos-data-v1"||!Array.isArray(program.fields)||program.fields.length<1||program.fields.length>8||!Array.isArray(program.steps)||program.steps.length>48||!Array.isArray(values)||values.length!==program.fields.length)throw Error("Invalid data program or input");
 const memory=Array.from(values,(v,i)=>{if(!check(v,program.fields[i].type))throw Error("Invalid input: "+program.fields[i].name);return Array.isArray(v)?v.slice():program.fields[i].type==="record"?{...v}:v;});
 const read=(r,k)=>{if(!keyOK(k)||!Object.hasOwn(r,k))throw Error("Missing or invalid record key");return r[k];};
 const write=(r,k,v)=>{if(!keyOK(k))throw Error("Invalid record key");return {...r,[k]:v};};
 const ops={getText:read,getNumber:read,getBoolean:read,hasKey:(r,k)=>keyOK(k)&&Object.hasOwn(r,k),setText:write,setNumber:write,setBoolean:write,removeKey:(r,k)=>{if(!keyOK(k))throw Error("Invalid record key");const result={...r};delete result[k];return result;},recordKeys:r=>Object.keys(r).sort(),add:(a,b)=>a+b,sub:(a,b)=>a-b,mul:(a,b)=>a*b,div:(a,b)=>a/b,trim:a=>a.trim(),lower:a=>a.toLowerCase(),upper:a=>a.toUpperCase(),concat:(a,b)=>a+b,replace:(a,b,c)=>{if(!b)throw Error("Empty search");if(a.length+Math.floor(a.length/b.length)*c.length>16384)throw Error("Replacement budget exceeded");return a.split(b).join(c);},split:(a,b)=>{if(!b)throw Error("Empty separator");return a.split(b);},join:(a,b)=>{if(a.reduce((n,x)=>n+x.length,0)+Math.max(0,a.length-1)*b.length>8192)throw Error("Join budget exceeded");return a.join(b);},words:a=>a.trim()?a.trim().split(/\s+/):[],length:a=>a.length,countNumbers:a=>a.length,countTexts:a=>a.length,sum:a=>a.reduce((s,x)=>s+x,0),mean:a=>{if(!a.length)throw Error("Empty array");return a.reduce((s,x)=>s+x,0)/a.length;},sort:a=>a.slice().sort((x,y)=>x-y),uniqueNumbers:a=>[...new Set(a)],uniqueTexts:a=>[...new Set(a)],reverseTexts:a=>a.slice().reverse(),filterPositive:a=>a.filter(x=>x>0),toText:a=>String(a),parseNumber:a=>{if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(a.trim()))throw Error("Invalid numeric text");return Number(a);},contains:(a,b)=>a.includes(b),gt:(a,b)=>a>b,eq:(a,b)=>a===b,ifNumber:(a,b,c)=>a?b:c,ifText:(a,b,c)=>a?b:c};
 for(const s of program.steps){if(!s||!Object.hasOwn(ops,s.op)||!Array.isArray(s.args)||s.args.length>3)throw Error("Invalid instruction");const args=s.args.map(a=>{if(!Array.isArray(a)||a.length!==2)throw Error("Invalid operand");if(a[0]==="ref"&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<memory.length)return memory[a[1]];if(a[0]==="literal"&&["number","string","boolean"].includes(typeof a[1]))return a[1];throw Error("Invalid operand");});const v=ops[s.op](...args);if(!check(v,s.type))throw Error("Output type or size exceeded: "+s.name);memory.push(v);}
 if(!Number.isInteger(program.result)||program.result<0||program.result>=memory.length)throw Error("Invalid result");
 return memory[program.result];
}
export function decompileData(program){
 if(!program||program.schema!=="chaos-data-v1"||!Array.isArray(program.fields)||program.fields.length>8||!Array.isArray(program.steps)||program.steps.length>48)throw Error("Invalid bytecode");
 const names=program.fields.map(f=>f.name),steps=program.steps.map(s=>{if(!Array.isArray(s.args))throw Error("Invalid operands");const args=s.args.map(a=>{if(!Array.isArray(a)||a.length!==2)throw Error("Invalid operand");if(a[0]==="ref"&&Number.isInteger(a[1])&&a[1]>=0&&a[1]<names.length)return {ref:names[a[1]]};if(a[0]==="literal")return a[1];throw Error("Invalid operand");});names.push(s.name);return {name:s.name,op:s.op,args};});
 const source={fields:program.fields,steps,result:names[program.result]};const rebuilt=compileData(source);
 return {source,program:rebuilt,executed:false};
}
const comparable=v=>v&&typeof v==="object"&&!Array.isArray(v)?JSON.stringify(Object.keys(v).sort().map(k=>[k,v[k]])):JSON.stringify(v);
export function verifyData(input){
 const program=compileData(input),rebuilt=decompileData(program).program;
 if(!Array.isArray(input.examples)||input.examples.length<3||input.examples.length>16)throw Error("Provide 3–16 examples");
 const tests=input.examples.map(e=>{if(!e||!Object.hasOwn(e,"expected"))throw Error("Expected output required");const actual=runData(program,e.values),again=runData(rebuilt,e.values);if(comparable(actual)!==comparable(e.expected)||comparable(actual)!==comparable(again))throw Error("Example failed: "+JSON.stringify(e.values).slice(0,100));return {values:e.values,expected:e.expected,actual};});
 if(new Set(tests.map(t=>JSON.stringify(t.values))).size<3)throw Error("Three distinct input examples required");
 return {program,tests,externalInference:false};
}
export function emitDataModule(program){
 const p=decompileData(program).program;
 return "// Miss Chaos independent typed data program\n"+runData.toString()+"\nconst program = "+JSON.stringify(p,null,2)+";\nexport function solve(...values) { return runData(program, values); }\n";
}
