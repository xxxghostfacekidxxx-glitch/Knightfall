import {compileFormula,evaluateFormula,decompileFormula} from "./chaos-forge-formula.mjs";
const ops={abs:153,neg:154,ceil:155,floor:156,trunc:157,sqrt:159,add:160,sub:161,mul:162,div:163,min:164,max:165};
const leb=n=>{const a=[];do{a.push((n&127)|(n>127?128:0));n>>>=7;}while(n);return a;};
const sec=(id,a)=>[id,...leb(a.length),...a];
export function compileFunction(input){
 const p=compileFormula(input.expression,input.fields),code=[];
 for(const [op,arg] of p.ops){if(op==="input")code.push(32,...leb(arg));else if(op==="const"){const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,arg,true);code.push(68,...b);}else if(Object.hasOwn(ops,op))code.push(ops[op]);else throw Error("Unsupported native operation: "+op);}
 const body=[0,...code,11],bytes=Uint8Array.from([0,97,115,109,1,0,0,0,...sec(1,[1,96,p.fields.length,...p.fields.map(()=>124),1,124]),...sec(3,[1,0]),...sec(7,[1,3,114,117,110,0,0]),...sec(10,[1,...leb(body.length),...body])]);
 if(!WebAssembly.validate(bytes))throw Error("Native validation failed");
 const module=new WebAssembly.Module(bytes);if(WebAssembly.Module.imports(module).length)throw Error("Unexpected imports");
 const run=new WebAssembly.Instance(module).exports.run;
 if(!Array.isArray(input.examples)||input.examples.length<3||input.examples.length>16)throw Error("Provide 3–16 example input arrays.");
 const tests=input.examples.map(values=>{const expected=evaluateFormula(p,values),actual=run(...values);if(!Object.is(expected,actual))throw Error("Native/VM mismatch");return {values,expected,actual};});
 return {filename:"miss-chaos-function.wasm",bytes,report:{fields:p.fields,expression:decompileFormula(p).expression,tests,hex:Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join(""),notice:"Native IEEE-754 arithmetic; callers must validate finite inputs and results. Only supplied examples tested."}};
}
export function decompileFunction(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length>32768||!WebAssembly.validate(bytes))throw Error("Invalid Wasm");
 let i=8;const take=end=>{if(i>=end)throw Error("Truncated module");return bytes[i++];};const read=end=>{let n=0;for(let j=0;j<5;j++){const b=take(end);n+=(b&127)*2**(7*j);if(!(b&128)){if(n>4294967295)throw Error("Invalid LEB");return n;}}throw Error("Invalid LEB");};
 let fields=null,program=null;const seen=[];
 while(i<bytes.length){const id=take(bytes.length),len=read(bytes.length),end=i+len;if(end>bytes.length)throw Error("Truncated section");seen.push(id);
 if(id===1){if(read(end)!==1||take(end)!==96)throw Error("Unsupported signature");const n=read(end);if(n<1||n>12)throw Error("Unsupported arity");fields=Array.from({length:n},(_,j)=>"arg"+j);for(let j=0;j<n;j++)if(take(end)!==124)throw Error("Expected f64");if(read(end)!==1||take(end)!==124)throw Error("Expected f64 result");}
 else if(id===3){if(read(end)!==1||read(end)!==0)throw Error("Unsupported functions");}
 else if(id===7){if(read(end)!==1||read(end)!==3||take(end)!==114||take(end)!==117||take(end)!==110||take(end)!==0||read(end)!==0)throw Error("Unsupported export");}
 else if(id===10){if(!fields||read(end)!==1)throw Error("Unsupported code");const size=read(end);if(i+size!==end||read(end)!==0)throw Error("Unsupported locals");const instructions=[];while(i<end){const b=take(end);if(b===11){if(i!==end)throw Error("Unexpected end");break;}if(b===32)instructions.push(["input",read(end)]);else if(b===68){if(i+8>end)throw Error("Truncated constant");instructions.push(["const",new DataView(bytes.buffer,bytes.byteOffset+i,8).getFloat64(0,true)]);i+=8;}else{const op=Object.keys(ops).find(k=>ops[k]===b);if(!op)throw Error("Unsupported opcode");instructions.push([op]);}if(instructions.length>256)throw Error("Instruction limit");}program={schema:"chaos-formula-v1",fields,ops:instructions};}
 else throw Error("Unsupported section "+id);
 if(i!==end)throw Error("Section length mismatch");}
 if(seen.join(",")!=="1,3,7,10"||!program)throw Error("Unsupported module layout");return {...decompileFormula(program),program,notice:"Equivalent expression; original names and comments unavailable."};
}
