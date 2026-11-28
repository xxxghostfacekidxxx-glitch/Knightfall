// A bounded expression language with named inputs; compiler emits typed stack instructions.
const nameOK=/^[a-z][a-z0-9_]{0,23}$/;
const funcs=Object.freeze({abs:1,sqrt:1,ceil:1,floor:1,trunc:1,min:2,max:2});
const unary=new Set(["neg","abs","sqrt","ceil","floor","trunc"]);
const binary=new Set(["add","sub","mul","div","mod","pow","min","max"]);
export function compileFormula(expression,fields){
 if(typeof expression!=="string"||!expression.trim()||expression.length>256)throw Error("Formula must contain 1–256 characters.");
 if(!Array.isArray(fields)||fields.length<1||fields.length>12||fields.some(f=>typeof f!=="string"||!nameOK.test(f)||Object.hasOwn(funcs,f))||new Set(fields).size!==fields.length)throw Error("Use 1–12 unique lowercase field names.");
 const tokens=[];let i=0;
 while(i<expression.length){if(/\s/.test(expression[i])){i++;continue;}const rest=expression.slice(i),num=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/),id=rest.match(/^[a-z][a-z0-9_]*/);
 if(num){const value=Number(num[0]);if(!Number.isFinite(value))throw Error("Nonfinite literal.");tokens.push(value);i+=num[0].length;}else if(id){tokens.push(id[0]);i+=id[0].length;}else if("+-*/%^(),".includes(expression[i]))tokens.push(expression[i++]);else throw Error("Unsupported character at "+(i+1));}
 let p=0,depth=0;const ops=[],peek=()=>tokens[p],take=()=>tokens[p++],expect=v=>{if(take()!==v)throw Error("Expected "+v+" at token "+p);};
 const nested=fn=>{if(++depth>32)throw Error("Expression nesting limit.");try{fn();}finally{depth--;}};
 function atom(){const t=take();if(typeof t==="number"){ops.push(["const",t]);return;}if(t==="("){nested(expr);expect(")");return;}if(fields.includes(t)){ops.push(["input",fields.indexOf(t)]);return;}if(Object.hasOwn(funcs,t)){expect("(");nested(expr);if(funcs[t]===2){expect(",");nested(expr);}expect(")");ops.push([t]);return;}throw Error("Unknown input or invalid atom: "+String(t));}
 function power(){atom();if(peek()==="^"){take();nested(prefix);ops.push(["pow"]);}}
 function prefix(){if(peek()==="+"||peek()==="-"){const t=take();nested(prefix);if(t==="-")ops.push(["neg"]);}else power();}
 function term(){prefix();while(["*","/","%"].includes(peek())){const t=take();prefix();ops.push([{ "*":"mul","/":"div","%":"mod"}[t]]);}}
 function expr(){term();while(["+","-"].includes(peek())){const t=take();term();ops.push([t==="+"?"add":"sub"]);}}
 expr();if(p!==tokens.length||ops.length>256)throw Error("Unexpected token or instruction limit.");return {schema:"chaos-formula-v1",fields:fields.slice(),ops};
}
// Self-contained interpreter is also embedded verbatim in generated offline applets.
export function evaluateFormula(program,values){
 if(!program||program.schema!=="chaos-formula-v1"||!Array.isArray(program.fields)||program.fields.length<1||program.fields.length>12||!Array.isArray(program.ops)||program.ops.length>256||!Array.isArray(values)||values.length!==program.fields.length||values.some(x=>typeof x!=="number"||!Number.isFinite(x)))throw Error("Invalid formula or inputs.");
 const stack=[],u={neg:x=>-x,abs:Math.abs,sqrt:Math.sqrt,ceil:Math.ceil,floor:Math.floor,trunc:Math.trunc},b={add:(a,b)=>a+b,sub:(a,b)=>a-b,mul:(a,b)=>a*b,div:(a,b)=>a/b,mod:(a,b)=>a%b,pow:(a,b)=>a**b,min:Math.min,max:Math.max};
 for(const ins of program.ops){if(!Array.isArray(ins))throw Error("Invalid instruction.");const [op,arg]=ins;let v;if(op==="const"&&ins.length===2&&typeof arg==="number")v=arg;else if(op==="input"&&ins.length===2&&Number.isInteger(arg)&&arg>=0&&arg<values.length)v=values[arg];else if(ins.length===1&&Object.hasOwn(u,op)&&stack.length>=1)v=u[op](stack.pop());else if(ins.length===1&&Object.hasOwn(b,op)&&stack.length>=2){const y=stack.pop(),x=stack.pop();if((op==="div"||op==="mod")&&y===0)throw Error("Division by zero.");v=b[op](x,y);}else throw Error("Invalid operation or stack.");if(!Number.isFinite(v))throw Error("Nonfinite result.");stack.push(v);}
 if(stack.length!==1)throw Error("Invalid final stack.");return stack[0];
}
export function decompileFormula(program){
 if(!program||program.schema!=="chaos-formula-v1"||!Array.isArray(program.fields)||program.fields.length<1||program.fields.length>12||program.fields.some(x=>typeof x!=="string"||!nameOK.test(x)||Object.hasOwn(funcs,x))||new Set(program.fields).size!==program.fields.length||!Array.isArray(program.ops)||program.ops.length>256)throw Error("Invalid formula bytecode.");
 const stack=[],symbols={add:"+",sub:"-",mul:"*",div:"/",mod:"%",pow:"^"};
 for(const ins of program.ops){if(!Array.isArray(ins))throw Error("Invalid instruction.");const [op,arg]=ins;let v;if(op==="const"&&ins.length===2&&typeof arg==="number"&&Number.isFinite(arg))v=Object.is(arg,-0)?"-0":String(arg);else if(op==="input"&&ins.length===2&&Number.isInteger(arg)&&arg>=0&&arg<program.fields.length)v=program.fields[arg];else if(ins.length===1&&unary.has(op)&&stack.length){const a=stack.pop();v=op==="neg"?"(-("+a+"))":op+"("+a+")";}else if(ins.length===1&&binary.has(op)&&stack.length>=2){const b=stack.pop(),a=stack.pop();v=Object.hasOwn(symbols,op)?"("+a+" "+symbols[op]+" "+b+")":op+"("+a+", "+b+")";}else throw Error("Invalid operation or stack.");if(v.length>8192)throw Error("Reconstruction exceeds limit.");stack.push(v);}
 if(stack.length!==1)throw Error("Invalid final stack.");return {format:"chaos-formula-v1",expression:stack[0],fields:program.fields.slice(),executed:false};
}
export function formulaSpec(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||typeof input.title!=="string"||!input.title.trim()||input.title.length>80||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>12)throw Error("Formula requires a title and 1–12 fields.");
 const fields=input.fields.map(f=>{if(!f||typeof f.name!=="string"||!nameOK.test(f.name)||typeof f.label!=="string"||!f.label.trim()||f.label.length>80||typeof f.default!=="number"||!Number.isFinite(f.default))throw Error("Every field needs a name, label and finite numeric default.");return {name:f.name,label:f.label,default:f.default};});
 const program=compileFormula(input.expression,fields.map(f=>f.name)),result=evaluateFormula(program,fields.map(f=>f.default));
 return {kind:"formula",title:input.title.trim(),fields,program,result};
}
