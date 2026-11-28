// Strict numeric Python subset frontend. No Python subprocess or submitted code execution.
// Indentation is four spaces; range(n) is restricted to immutable nonnegative integer bounds.
import {verifyLogic,runLogic} from "./chaos-forge-logic.mjs";
const reserved=new Set(["abs","sqrt","ceil","floor","trunc","min","max","def","if","else","elif","for","in","range","return","while","import","from","class","lambda","pass","break","continue","and","or","not","is","assert","yield","raise","try","except","finally","with","as","global","nonlocal","del","async","await","match","case"]);
const nameOK=n=>typeof n==="string"&&/^[a-z][a-z0-9_]{0,23}$/.test(n)&&!reserved.has(n);
const compare={"<":"lt","<=":"le","==":"eq","!=":"ne",">=":"ge",">":"gt"};
export function translatePython(input){
 if(!input||typeof input.source!=="string"||input.source.length>10000||!input.source.trim()||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>12||input.fields.some(n=>!nameOK(n))||new Set(input.fields).size!==input.fields.length)throw Error("Provide numeric fields and up to 10,000 Python source characters.");
 const lines=input.source.split(/\r?\n/).map((raw,i)=>{if(raw.includes("\t"))throw Error("Tabs unsupported (line "+(i+1)+")");const line=raw.split("#")[0].trimEnd(),spaces=line.length-line.trimStart().length;return {text:line.trimStart(),indent:spaces,line:i+1};}).filter(x=>x.text);
 if(lines.length>100)throw Error("Source line limit");
 const header=/^def ([a-z][a-z0-9_]*)\(([^()]*)\):$/.exec(lines[0]?.text||"");
 if(!header||lines[0].indent!==0||!nameOK(header[1])||header[2].split(",").map(x=>x.trim()).join(",")!==input.fields.join(","))throw Error("Use one def with matching numeric parameters.");
 const fields=input.fields.slice(),locals=[],active=new Set(fields),counters=new Set();let pos=1,nodes=0;
 const fail=(line,msg)=>{throw Error(msg+" (line "+line.line+")");};
 function declare(line,name){if(!nameOK(name)||fields.includes(name)||locals.includes(name)||fields.length+locals.length>=12)fail(line,"Invalid, duplicate or excessive local");locals.push(name);active.add(name);}
 function expression(text,line){
  const tokens=[];let p=0;
  while(p<text.length){if(/\s/.test(text[p])){p++;continue;}const m=/^(?:(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?|[a-z][a-z0-9_]*|\*\*|[()+\-*/])/.exec(text.slice(p));if(!m)fail(line,"Unsupported expression token");tokens.push(m[0]);p+=m[0].length;if(tokens.length>128)fail(line,"Expression token limit");}
  let i=0,depth=0;const peek=()=>tokens[i],take=()=>tokens[i++],nested=fn=>{if(++depth>18||++nodes>512)fail(line,"Expression budget");try{return fn();}finally{depth--;}};
  function atom(){const t=take();if(t==="("){const x=nested(sum);if(take()!==")")fail(line,"Expected closing parenthesis");return "("+x+")";}if(t&&/^(?:\d|\.)/.test(t)&&Number.isFinite(Number(t)))return String(Number(t));if(active.has(t))return t;fail(line,"Unknown variable or invalid numeric literal");}
  function power(){let x=atom();if(peek()==="**"){take();x="("+x+"^"+nested(unary)+")";}return x;}
  function unary(){if(peek()==="+"||peek()==="-"){const op=take();return "("+op+nested(unary)+")";}return power();}
  function product(){let x=unary();while(peek()==="*"||peek()==="/"){const op=take();x="("+x+op+unary()+")";}return x;}
  function sum(){let x=product();while(peek()==="+"||peek()==="-"){const op=take();x="("+x+op+product()+")";}return x;}
  const result=sum();if(i!==tokens.length)fail(line,"Unexpected expression token");return result;
 }
 function block(indent,depth=0,top=false){
  if(depth>5)throw Error("Block depth limit");
  const out=[];
  while(pos<lines.length&&lines[pos].indent===indent){
   const line=lines[pos],t=line.text;if(t.startsWith("return ")||t==="else:")break;
   pos++;
   const condition=/^if (.+):$/.exec(t),whileLoop=/^while (.+):$/.exec(t),loop=/^for ([a-z][a-z0-9_]*) in range\(([^()]*)\):$/.exec(t),assignment=/^([a-z][a-z0-9_]*)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/.exec(t);
   if(condition){
    const parts=condition[1].split(/(<=|>=|==|!=|<|>)/);if(parts.length!==3)fail(line,"Use a single numeric comparison");
    const left=expression(parts[0],line),right=expression(parts[2],line);
    if(lines[pos]?.indent!==indent+4)fail(line,"Expected indented if body");
    const yes=block(indent+4,depth+1);if(!yes.length)fail(line,"Empty if body");
    let no=[];if(lines[pos]?.indent===indent&&lines[pos].text==="else:"){pos++;if(lines[pos]?.indent!==indent+4)fail(line,"Expected indented else body");no=block(indent+4,depth+1);if(!no.length)fail(line,"Empty else body");}
    out.push({op:"if",compare:compare[parts[1]],left,right,then:yes,else:no});
   }else if(whileLoop){
    const parts=whileLoop[1].split(/(<=|>=|==|!=|<|>)/);if(parts.length!==3)fail(line,"Use a single numeric comparison");const left=expression(parts[0],line),right=expression(parts[2],line);if(lines[pos]?.indent!==indent+4)fail(line,"Expected indented while body");const body=block(indent+4,depth+1);if(!body.length)fail(line,"Empty while body");out.push({op:"while",compare:compare[parts[1]],left,right,body});
   }else if(loop){
    const name=loop[1],bound=loop[2].trim();if(!(fields.includes(bound)||/^(?:0|[1-9]\d{0,3})$/.test(bound)&&Number(bound)<=1000))fail(line,"range requires an immutable numeric parameter or 0–1000 integer");
    declare(line,name);counters.add(name);if(lines[pos]?.indent!==indent+4)fail(line,"Expected indented loop body");const body=block(indent+4,depth+1);if(!body.length)fail(line,"Empty loop body");counters.delete(name);active.delete(name);
    out.push({op:"set",name,expr:"0"},{op:"repeat",count:bound,body:[...body,{op:"set",name,expr:name+"+1"}]});
   }else if(assignment){
    const [,name,op,rhs]=assignment,value=expression(rhs,line);
    if(!active.has(name)){if(!top||op!=="=")fail(line,"Declare locals at function level before use");declare(line,name);}
    if(fields.includes(name)||counters.has(name))fail(line,"Parameters and loop counters are immutable");
    out.push({op:"set",name,expr:op==="="?value:"("+name+op[0]+value+")"});
   }else fail(line,"Unsupported Python statement");
   if(pos<lines.length&&lines[pos].indent>indent)fail(lines[pos],"Unexpected indentation or nested return");
  }
  return out;
 }
 if(lines[pos]?.indent!==4)throw Error("Use four-space indentation.");
 const body=block(4,0,true),last=lines[pos];
 if(!last||last.indent!==4||!last.text.startsWith("return ")||pos!==lines.length-1)throw Error("Function must end in one numeric return at four-space indentation.");
 return {fields,locals,body,result:expression(last.text.slice(7),last)};
}
export function verifyPython(input){
 const translated=translatePython(input),r=verifyLogic({...translated,examples:input.examples});
 return {...r,translated,module:runLogic.toString()+"\nconst program="+JSON.stringify(r.program)+";\nexport function solve(...values){return runLogic(program,values);}\n",notice:"Restricted numeric Python syntax compiled to finite JavaScript-number semantics. No arbitrary precision integers, imports, Python runtime, floor division, or submitted-source execution. range bounds 0–1000; while loops capped at 1000 iterations and shared VM fuel."};
}
