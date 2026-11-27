// Original restricted arithmetic compiler. No eval, functions, filesystem or network.
export function compileExpression(source){
 if(typeof source!=="string"||source.length>256)throw Error("Expression must be at most 256 characters");
 const tokens=[];let i=0;
 const fail=(message,at)=>{throw Error(message+" at column "+(at+1));};
 while(i<source.length){if(/\s/.test(source[i])){i++;continue;}const m=source.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);if(m){const n=Number(m[0]);if(!Number.isFinite(n))fail("Invalid number",i);tokens.push({value:n,at:i});i+=m[0].length;continue;}const c=source[i];if(!"+-*/%^()".includes(c))fail("Unsupported character",i);tokens.push({value:c,at:i++});}
 let pos=0,depth=0;const ops=[];
 const peek=()=>tokens[pos]?.value;
 const location=()=>tokens[pos]?.at??source.length;
 function nested(fn){if(++depth>32)fail("Expression too deeply nested",location());try{fn();}finally{depth--;}}
 function atom(){const token=tokens[pos++];if(typeof token?.value==="number")ops.push(["const",token.value]);else if(token?.value==="("){nested(expr);if(peek()!==")")fail("Expected closing parenthesis",location());pos++;}else fail("Expected number",token?.at??source.length);}
 function power(){atom();if(peek()==="^"){pos++;nested(unary);ops.push(["pow"]);}}
 function unary(){if(peek()==="-"||peek()==="+"){const sign=tokens[pos++].value;nested(unary);if(sign==="-")ops.push(["neg"]);}else power();}
 function term(){unary();while(["*","/","%"].includes(peek())){const op=tokens[pos++].value;unary();ops.push([{ "*":"mul","/":"div","%":"mod"}[op]]);}}
 function expr(){term();while(peek()==="+"||peek()==="-"){const op=tokens[pos++].value;term();ops.push([op==="+"?"add":"sub"]);}}
 expr();if(pos!==tokens.length)fail("Unexpected token",location());return ops;
}
function execute(ops,withTrace=false){if(!Array.isArray(ops)||ops.length>256)throw Error("Invalid bytecode");const stack=[],trace=[];for(const instruction of ops){if(!Array.isArray(instruction))throw Error("Invalid instruction");const [op,arg]=instruction;if(op==="const"&&instruction.length===2&&typeof arg==="number"&&Number.isFinite(arg))stack.push(arg);else if(op==="neg"&&instruction.length===1&&stack.length>=1)stack.push(-stack.pop());else{if(instruction.length!==1||!["add","sub","mul","div","mod","pow"].includes(op)||stack.length<2)throw Error("Invalid instruction or stack");const b=stack.pop(),a=stack.pop();if((op==="div"||op==="mod")&&b===0)throw Error("Division by zero");const n=op==="add"?a+b:op==="sub"?a-b:op==="mul"?a*b:op==="div"?a/b:op==="mod"?a%b:a**b;if(!Number.isFinite(n))throw Error("Nonfinite result");stack.push(n);}if(withTrace)trace.push({instruction:op==="const"?"const "+arg:op,stack:stack.slice()});}if(stack.length!==1)throw Error("Invalid stack");return {result:stack[0],trace};}
export function runExpression(ops){return execute(ops).result;}
export function decodeData(format,input){if(typeof input!=="string"||input.length>4096)throw Error("Input too long");if(format==="json")return JSON.stringify(JSON.parse(input),null,2);let bytes;if(format==="hex"){if(!/^(?:[0-9a-fA-F]{2})*$/.test(input))throw Error("Invalid hex");bytes=Uint8Array.from(input.match(/../g)||[],x=>parseInt(x,16));}else if(format==="base64"){if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input))throw Error("Invalid base64");bytes=Uint8Array.from(atob(input),c=>c.charCodeAt(0));}else throw Error("Unknown format");return new TextDecoder("utf-8",{fatal:true}).decode(bytes);}
export function traceExpression(source){const ops=compileExpression(source);return {ops,...execute(ops,true)};}

 // Real WebAssembly binary emitter, no imports or host privileges.
 function uleb(n){const bytes=[];do{let b=n&127;n>>>=7;if(n)b|=128;bytes.push(b);}while(n);return bytes;}
 function section(id,payload){return [id,...uleb(payload.length),...payload];}
 export function compileWasm(source){
   const ops=compileExpression(source);runExpression(ops);
   const code=[],opcodes={add:0xa0,sub:0xa1,mul:0xa2,div:0xa3,neg:0x9a};
   for(const [op,value] of ops){
     if(op==="const"){const bytes=new Uint8Array(8);new DataView(bytes.buffer).setFloat64(0,value,true);code.push(0x44,...bytes);}
     else if(Object.hasOwn(opcodes,op))code.push(opcodes[op]);
     else throw Error("WebAssembly target does not yet support "+op+"; use the stack VM.");
   }
   const body=[0,...code,0x0b];
   return Uint8Array.from([0,97,115,109,1,0,0,0,...section(1,[1,0x60,0,1,0x7c]),...section(3,[1,0]),...section(7,[1,3,114,117,110,0,0]),...section(10,[1,...uleb(body.length),...body])]);
 }
 export function runWasm(source){
   const bytes=compileWasm(source);
   if(!WebAssembly.validate(bytes))throw Error("Generated module failed native validation.");
   const module=new WebAssembly.Module(bytes);
   if(WebAssembly.Module.imports(module).length!==0)throw Error("Unexpected host imports.");
   const result=new WebAssembly.Instance(module).exports.run();
   const expected=runExpression(compileExpression(source));
   if(!Object.is(result,expected))throw Error("Native result differs from stack VM.");
   return {bytes,result};
 }
