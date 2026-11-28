// Static disassembly of the arithmetic Wasm subset and lossless stack-expression reconstruction.
import {compileExpression,compileWasm,runExpression} from "../public/order66-code-lab.mjs";
const binary={add:"+",sub:"-",mul:"*",div:"/",mod:"%",pow:"^",min:"min",max:"max"};
const unary=new Set(["neg","abs","sqrt","ceil","floor","trunc"]);
const native={0x99:"abs",0x9a:"neg",0x9b:"ceil",0x9c:"floor",0x9d:"trunc",0x9f:"sqrt",0xa0:"add",0xa1:"sub",0xa2:"mul",0xa3:"div",0xa4:"min",0xa5:"max"};
export function decompileStack(ops){
 if(!Array.isArray(ops)||!ops.length||ops.length>256)throw Error("Invalid stack bytecode.");
 const stack=[],listing=[];
 for(const [i,ins] of ops.entries()){
  if(!Array.isArray(ins))throw Error("Invalid instruction.");
  const [op,arg]=ins;let expression;
  if(op==="const"&&ins.length===2&&typeof arg==="number"&&Number.isFinite(arg))expression=Object.is(arg,-0)?"-0":String(arg);
  else if(ins.length===1&&unary.has(op)&&stack.length){const a=stack.pop();expression=op==="neg"?"(-("+a+"))":op+"("+a+")";}
  else if(ins.length===1&&Object.hasOwn(binary,op)&&stack.length>=2){const b=stack.pop(),a=stack.pop();expression=["min","max"].includes(op)?op+"("+a+", "+b+")":"("+a+" "+binary[op]+" "+b+")";}
  else throw Error("Unsupported instruction or stack underflow at "+i);
  if(expression.length>8192)throw Error("Expression exceeds reconstruction budget.");
  stack.push(expression);listing.push({index:i,instruction:ins.slice(),stackDepth:stack.length});
 }
 if(stack.length!==1)throw Error("Invalid final stack.");
 return {expression:stack[0],instructions:listing,format:"order66-stack",executed:false,notice:"Equivalent expression for this instruction subset; original identifiers, comments and formatting cannot be recovered."};
}
export function hexBytes(text){if(typeof text!=="string"||text.length>65536)throw Error("Hex input too large.");const clean=text.replace(/\s/g,"").replace(/^0x/i,"");if(!clean.length||clean.length%2||!/^[0-9a-f]+$/i.test(clean))throw Error("Invalid hexadecimal input.");return Uint8Array.from(clean.match(/../g),x=>parseInt(x,16));}
export const bytesHex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
export function inspectWasm(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<8||bytes.length>32768)throw Error("Expected 8–32768 Wasm bytes.");
 if(bytesHex(bytes.subarray(0,8))!=="0061736d01000000")throw Error("Not a WebAssembly v1 module.");
 let pos=8;
 const take=end=>{if(pos>=end)throw Error("Unexpected end of Wasm.");return bytes[pos++];};
 const leb=end=>{let n=0,m=1;for(let i=0;i<5;i++){const b=take(end);n+=(b&127)*m;if(n>0xffffffff)throw Error("Invalid unsigned LEB128.");if(!(b&128))return n;m*=128;}throw Error("Invalid unsigned LEB128.");};
 const name=end=>{const len=leb(end);if(len>256||pos+len>end)throw Error("Invalid name.");const s=new TextDecoder("utf-8",{fatal:true}).decode(bytes.subarray(pos,pos+len));pos+=len;return s;};
 const sections=[],exports=[],bodies=[];let imports=0,functions=0,types=[],functionTypes=[],other=false;
 while(pos<bytes.length){if(sections.length>=64)throw Error("Too many sections.");const id=take(bytes.length),length=leb(bytes.length),start=pos,end=pos+length;if(end>bytes.length)throw Error("Truncated section.");sections.push({id,offset:start,length});
  if(id===1){const n=leb(end);if(n>128)throw Error("Too many types.");for(let i=0;i<n;i++){if(take(end)!==0x60)throw Error("Unsupported type.");const p=leb(end);if(p>32)throw Error("Too many parameters.");const params=[];for(let j=0;j<p;j++)params.push(take(end));const r=leb(end);if(r>8)throw Error("Too many results.");const results=[];for(let j=0;j<r;j++)results.push(take(end));types.push({params,results});}}
  else if(id===2){imports=leb(end);other=true;pos=end;}
  else if(id===3){functions=leb(end);if(functions>128)throw Error("Too many functions.");for(let i=0;i<functions;i++)functionTypes.push(leb(end));}
  else if(id===7){const n=leb(end);if(n>128)throw Error("Too many exports.");for(let i=0;i<n;i++)exports.push({name:name(end),kind:take(end),index:leb(end)});}
  else if(id===10){const n=leb(end);if(n>128)throw Error("Too many code bodies.");for(let i=0;i<n;i++){const size=leb(end),bodyEnd=pos+size;if(bodyEnd>end)throw Error("Truncated function.");const locals=leb(bodyEnd),ops=[];let supported=locals===0;let terminated=false;
   if(supported){while(pos<bodyEnd){const offset=pos,opcode=take(bodyEnd);if(opcode===0x0b){terminated=pos===bodyEnd;break;}if(opcode===0x44){if(pos+8>bodyEnd)throw Error("Truncated f64.");const v=new DataView(bytes.buffer,bytes.byteOffset+pos,8).getFloat64(0,true);pos+=8;if(!Number.isFinite(v)){supported=false;break;}ops.push(["const",v]);}else if(Object.hasOwn(native,opcode))ops.push([native[opcode]]);else{supported=false;break;}if(ops.length>256)throw Error("Too many instructions.");}}
   let reconstruction=null;if(supported&&terminated){try{reconstruction=decompileStack(ops);}catch{supported=false;}}
   bodies.push({index:i,supported:!!reconstruction,ops:reconstruction?ops:null,expression:reconstruction?.expression??null});pos=bodyEnd;
  }}
  else {if(id!==0)other=true;pos=end;}
  if(pos!==end)throw Error("Invalid section length.");
 }
 let validated=null;try{if(typeof WebAssembly!=="undefined"&&typeof WebAssembly.validate==="function")validated=WebAssembly.validate(bytes);}catch{}
 const exact=validated!==false&&!other&&imports===0&&functions===1&&bodies.length===1&&bodies[0].supported&&types[functionTypes[0]]?.params.length===0&&types[functionTypes[0]]?.results.join(",")==="124"&&exports.length===1&&exports[0].name==="run"&&exports[0].kind===0&&exports[0].index===0;
 return {format:"wasm-v1",bytes:bytes.length,validated,sections,exports,imports,functions,bodies,expression:exact?bodies[0].expression:null,executed:false,notice:"Static inspection only. Unsupported instructions are not guessed; imported or complex modules are not instantiated."};
}
export function compileArtifact(expression,target="wasm",{nativeTest=false}={}){
 if(typeof expression!=="string"||expression.length>256)throw Error("Expression up to 256 characters required.");
 const ops=compileExpression(expression),result=runExpression(ops);
 if(target==="stack"){const content=JSON.stringify({schema:"order66-stack-v1",ops},null,2);return {filename:"miss-chaos-program.json",mime:"application/json",content,report:{target,result,ops,reconstruction:decompileStack(ops).expression}};}
 if(target!=="wasm")throw Error("Use wasm or stack.");
 const bytes=compileWasm(expression),report=inspectWasm(bytes);if(report.validated===false||!report.expression)throw Error("Generated module failed static verification.");
 // Only compiler-produced, import-free modules are instantiated.
 const reconstructedResult=runExpression(report.bodies[0].ops);if(!Object.is(reconstructedResult,result))throw Error("Compiler round-trip mismatch");
 if(nativeTest){const nativeResult=new WebAssembly.Instance(new WebAssembly.Module(bytes)).exports.run();if(!Object.is(nativeResult,result))throw Error("Compiler result mismatch.");}
 return {filename:"miss-chaos-program.wasm",mime:"application/wasm",bytes,report:{target,result,hex:bytesHex(bytes),...report,compilerOutputExecuted:nativeTest,verification:nativeTest?"native and stack VM":"static round-trip and stack VM"}};
}
