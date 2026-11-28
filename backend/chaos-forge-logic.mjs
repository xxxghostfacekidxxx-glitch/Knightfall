// Forge Logic v1: structured numeric programs, compiled to a bounded portable instruction tree.
import {compileFormula,decompileFormula,evaluateFormula} from "./chaos-forge-formula.mjs";
const ident=/^[a-z][a-z0-9_]{0,23}$/;
const reserved=new Set(["abs","sqrt","ceil","floor","trunc","min","max"]);
export function compileLogic(input,{earlier=null}={}){
 if(!input||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>12||!Array.isArray(input.locals)||input.locals.length>12)throw Error("Provide 1–12 fields and up to 12 local names.");
 const fields=[...input.fields],locals=[...input.locals],names=[...fields,...locals];
 if(names.some(n=>typeof n!=="string"||!ident.test(n)||reserved.has(n))||new Set(names).size!==names.length||names.length>12)throw Error("Use up to 12 distinct lowercase field/local names.");
 let count=0;
 const formula=s=>compileFormula(s,names).ops;
 function block(rows,depth=0){
  if(!Array.isArray(rows)||depth>6)throw Error("Invalid block or nesting limit");
  return rows.map(row=>{
   if(++count>64||!row||typeof row!=="object"||Array.isArray(row))throw Error("Statement limit or invalid statement");
   if(row.op==="set"){const slot=locals.indexOf(row.name);if(slot<0)throw Error("Assignment requires a declared local");return ["set",fields.length+slot,formula(row.expr)];}
   if(row.op==="if"){if(!["lt","le","eq","ne","ge","gt"].includes(row.compare))throw Error("Unknown comparison");return ["if",row.compare,formula(row.left),formula(row.right),block(row.then,depth+1),block(row.else??[],depth+1)];}
   if(row.op==="call"&&earlier instanceof Map){const slot=locals.indexOf(row.name),target=earlier.get(row.call);if(slot<0||!target||!Array.isArray(row.args)||row.args.length!==target.arity)throw Error("Call requires a local destination and earlier function with matching arity");return ["call",fields.length+slot,target.index,row.args.map(formula)];}
   if(row.op==="repeat")return ["repeat",formula(row.count),block(row.body,depth+1)];
   throw Error("Unknown statement: "+String(row.op));
  });
 }
 return {schema:"chaos-logic-v1",fields,locals,body:block(input.body),result:formula(input.result)};
}
// Self-contained portable VM; no eval, host calls, unbounded loops or recursion.
export function runLogic(program,values){
 const library=program?.schema==="chaos-logic-library-v1"?program:null;
 if(library&&(!Array.isArray(library.functions)||library.functions.length<1||library.functions.length>8||!Number.isInteger(library.entry)||library.entry<0||library.entry>=library.functions.length))throw Error("Invalid function library");
 let fuel=20000;
 const tick=()=>{if(--fuel<0)throw Error("Execution budget exceeded");};
 function execute(program,values,index=-1,callDepth=0){
 if(callDepth>8)throw Error("Call depth exceeded");
 if(!program||program.schema!=="chaos-logic-v1"||!Array.isArray(program.fields)||!Array.isArray(program.locals)||program.fields.length<1||program.fields.length+program.locals.length>12||!Array.isArray(values)||values.length!==program.fields.length||Array.from(values).some(v=>typeof v!=="number"||!Number.isFinite(v)))throw Error("Invalid program or inputs");
 const memory=[...values,...program.locals.map(()=>0)];
 function expr(ops){
  if(!Array.isArray(ops)||ops.length>256)throw Error("Invalid expression");const stack=[];
  const unary={neg:x=>-x,abs:Math.abs,sqrt:Math.sqrt,ceil:Math.ceil,floor:Math.floor,trunc:Math.trunc};
  const binary={add:(x,y)=>x+y,sub:(x,y)=>x-y,mul:(x,y)=>x*y,div:(x,y)=>x/y,mod:(x,y)=>x%y,pow:(x,y)=>x**y,min:Math.min,max:Math.max};
  for(const ins of ops){tick();if(!Array.isArray(ins))throw Error("Invalid instruction");const [op,n]=ins;let v;
   if(op==="const"&&ins.length===2&&typeof n==="number")v=n;
   else if(op==="input"&&ins.length===2&&Number.isInteger(n)&&n>=0&&n<memory.length)v=memory[n];
   else if(ins.length===1&&Object.hasOwn(unary,op)&&stack.length>=1)v=unary[op](stack.pop());
   else if(ins.length===1&&Object.hasOwn(binary,op)&&stack.length>=2){const y=stack.pop(),x=stack.pop();v=binary[op](x,y);}
   else throw Error("Invalid expression instruction");
   if(!Number.isFinite(v))throw Error("Nonfinite result");stack.push(v);
  }if(stack.length!==1)throw Error("Invalid expression stack");return stack[0];
 }
 function block(rows,depth=0){if(!Array.isArray(rows)||rows.length>64||depth>6)throw Error("Invalid block");
  for(const ins of rows){tick();if(!Array.isArray(ins))throw Error("Invalid instruction");const [op,a,b,c,d,e]=ins;
   if(op==="set"&&ins.length===3&&Number.isInteger(a)&&a>=values.length&&a<memory.length)memory[a]=expr(b);
   else if(op==="if"&&ins.length===6){const x=expr(b),y=expr(c);const cmp={lt:x<y,le:x<=y,eq:x===y,ne:x!==y,ge:x>=y,gt:x>y};if(!Object.hasOwn(cmp,a))throw Error("Invalid comparison");block(cmp[a]?d:e,depth+1);}
   else if(op==="call"&&ins.length===4&&library&&Number.isInteger(a)&&a>=values.length&&a<memory.length&&Number.isInteger(b)&&b>=0&&b<index&&Array.isArray(c)&&c.length<=12){const args=c.map(expr);memory[a]=execute(library.functions[b].program,args,b,callDepth+1);}
   else if(op==="repeat"&&ins.length===3){const n=expr(a);if(!Number.isInteger(n)||n<0||n>1000)throw Error("Loop count must be 0–1000");for(let i=0;i<n;i++){tick();block(b,depth+1);}}
   else throw Error("Invalid logic instruction");
  }
 }
 block(program.body);return expr(program.result);
 }
 return library?execute(library.functions[library.entry].program,values,library.entry):execute(program,values);
}
export function decompileLogic(program,{earlier=null}={}){
 if(!program||program.schema!=="chaos-logic-v1"||!Array.isArray(program.fields)||!Array.isArray(program.locals))throw Error("Invalid program");
 const fields=program.fields,locals=program.locals,names=[...fields,...locals];let count=0;
 const expr=ops=>decompileFormula({schema:"chaos-formula-v1",fields:names,ops}).expression;
 function block(rows,depth=0){if(!Array.isArray(rows)||depth>6)throw Error("Invalid block");
  return rows.map(ins=>{if(++count>64||!Array.isArray(ins))throw Error("Invalid instruction");const [op,a,b,c,d,e]=ins;
   if(op==="set"&&ins.length===3&&Number.isInteger(a)&&a>=fields.length&&a<names.length)return {op:"set",name:names[a],expr:expr(b)};
   if(op==="if"&&ins.length===6)return {op:"if",compare:a,left:expr(b),right:expr(c),then:block(d,depth+1),else:block(e,depth+1)};
   if(op==="call"&&ins.length===4&&earlier instanceof Map&&Number.isInteger(a)&&a>=fields.length&&a<names.length&&Array.isArray(c)){const target=[...earlier].find(([,v])=>v.index===b);if(!target||c.length!==target[1].arity)throw Error("Invalid function call");return {op:"call",name:names[a],call:target[0],args:c.map(expr)};}
   if(op==="repeat"&&ins.length===3)return {op:"repeat",count:expr(a),body:block(b,depth+1)};
   throw Error("Unknown instruction");
  });
 }
 const source={fields,locals,body:block(program.body),result:expr(program.result)};
 compileLogic(source,{earlier});return {source,executed:false,notice:"Equivalent structured source; original whitespace and comments are not preserved."};
}
export function verifyLogic(input){
 const program=compileLogic(input);
 if(!Array.isArray(input.examples)||input.examples.length<3||input.examples.length>16)throw Error("Provide 3–16 examples with values and expected numeric outputs.");
 const reconstructed=decompileLogic(program),roundtrip=compileLogic(reconstructed.source);
 const tests=input.examples.map(row=>{if(!row||typeof row.expected!=="number"||!Number.isFinite(row.expected))throw Error("Invalid example");const actual=runLogic(program,row.values),again=runLogic(roundtrip,row.values);if(actual!==row.expected||actual!==again)throw Error("Example failed: expected "+row.expected+", received "+actual);return {values:row.values,expected:row.expected,actual};});
 if(new Set(tests.map(t=>JSON.stringify(t.values))).size<3)throw Error("Provide three distinct examples");
 return {program,tests,reconstructed,externalInference:false};
}
