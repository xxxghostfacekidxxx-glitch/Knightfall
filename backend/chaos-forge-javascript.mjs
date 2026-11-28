// Compile a statically typed, pure subset of JavaScript into the independent data VM.
// Submitted JavaScript is parsed, never evaluated. Unsupported syntax is rejected, not guessed.
import {parse} from "acorn";
import {verifyData,emitDataModule,dataOperationCatalog} from "./chaos-forge-data.mjs";
import {emitDataSource} from "./chaos-forge-data-source.mjs";
const validName=n=>typeof n==="string"&&/^[a-z][a-z0-9_]{0,23}$/.test(n)&&!["true","false","null","undefined","let","const","return"].includes(n);
const types=["number","text","numbers","texts","boolean","record"];
const signatures=new Map(dataOperationCatalog().map(x=>[x.name,x]));
export function translateJavaScript(input){
 if(!input||typeof input.source!=="string"||!input.source.trim()||new TextEncoder().encode(input.source).length>10000||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>8)throw Error("Provide source (up to 10 KB) and 1–8 typed fields.");
 const ast=parse(input.source,{ecmaVersion:"latest",sourceType:"module",locations:true});
 if(ast.body.length!==1)throw Error("Exactly one function declaration or exported function required.");
 const top=ast.body[0],fn=top.type==="ExportNamedDeclaration"||top.type==="ExportDefaultDeclaration"?top.declaration:top;
 if(fn?.type!=="FunctionDeclaration"||fn.async||fn.generator||fn.params.length!==input.fields.length||fn.params.some(p=>p.type!=="Identifier"))throw Error("Use one synchronous function with named parameters.");
 const bindings=new Map(),fields=input.fields.map((f,i)=>{if(!f||!validName(f.name)||!types.includes(f.type)||fn.params[i].name!==f.name||bindings.has(f.name))throw Error("Field declarations must match parameters in order.");const field={name:f.name,type:f.type};bindings.set(f.name,{arg:{ref:f.name},type:f.type});return field;});
 const steps=[];let count=0,serial=0;
 const fail=(n,message)=>{throw Error(message+" (line "+(n?.loc?.start?.line??"?")+")");};
 const emit=(op,args,n)=>{
  const sig=signatures.get(op);if(!sig||args.length!==sig.inputs.length||args.some((a,i)=>a.type!==sig.inputs[i]))fail(n,"Unsupported operation or argument types: "+op);
  if(steps.length>=48)fail(n,"Program exceeds 48 instructions.");
  let name;do{name="temp_"+(++serial);}while(fields.some(f=>f.name===name));
  steps.push({name,op,args:args.map(a=>a.arg)});return {arg:{ref:name},type:sig.output};
 };
 function expr(n,depth=0){
  if(!n||++count>256||depth>20)fail(n,"Expression budget exceeded.");
  const sub=x=>expr(x,depth+1);
  if(n.type==="Identifier"){if(!bindings.has(n.name))fail(n,"Unknown local or parameter: "+n.name);return bindings.get(n.name);}
  if(n.type==="Literal"){
   const v=n.value,type=typeof v==="number"&&Number.isFinite(v)?"number":typeof v==="string"&&v.length<=8192?"text":typeof v==="boolean"?"boolean":null;
   if(!type||n.regex||n.bigint)fail(n,"Unsupported literal.");return {arg:v,type};
  }
  if(n.type==="UnaryExpression"&&["-","!"].includes(n.operator))return emit(n.operator==="-"?"negNumber":"notBoolean",[sub(n.argument)],n);
  if(n.type==="BinaryExpression"){
   const a=sub(n.left),b=sub(n.right);
   const op=n.operator==="+"?(a.type==="text"&&b.type==="text"?"concat":"add"):["===","!=="].includes(n.operator)?({text:"eq",number:"eqNumber",boolean:"eqBoolean"})[a.type]:({"-":"sub","*":"mul","/":"div",">":"gt","<":"lt","<=":"le",">=":"ge"})[n.operator];
   if(!op)fail(n,"Unsupported binary operator: "+n.operator);const result=emit(op,[a,b],n);return n.operator==="!=="?emit("notBoolean",[result],n):result;
  }
  if(n.type==="MemberExpression"&&!n.computed&&!n.optional&&n.property.name==="length"){const a=sub(n.object),op={text:"length",texts:"countTexts",numbers:"countNumbers"}[a.type];return emit(op,[a],n);}
  if(n.type==="CallExpression"&&!n.optional&&n.callee.type==="MemberExpression"&&!n.callee.computed&&!n.callee.optional){
   const method=n.callee.property.name;
   if(["reduce","filter","toSorted"].includes(method)){
    const a=sub(n.callee.object),callback=n.arguments[0];
    if(a.type!=="numbers"||callback?.type!=="ArrowFunctionExpression"||callback.async||callback.params.some(p=>p.type!=="Identifier")||new Set(callback.params.map(p=>p.name)).size!==callback.params.length)fail(n,"Unsupported numeric array callback.");
    const [x,y]=callback.params.map(p=>p.name),b=callback.body,is=(node,name)=>node?.type==="Identifier"&&node.name===name;
    if(method==="reduce"&&callback.params.length===2&&n.arguments.length===2&&n.arguments[1].type==="Literal"&&n.arguments[1].value===0&&b.type==="BinaryExpression"&&b.operator==="+"&&is(b.left,x)&&is(b.right,y))return emit("sum",[a],n);
    if(method==="filter"&&callback.params.length===1&&n.arguments.length===1&&b.type==="BinaryExpression"&&b.operator===">"&&is(b.left,x)&&b.right.type==="Literal"&&b.right.value===0)return emit("filterPositive",[a],n);
    if(method==="toSorted"&&callback.params.length===2&&n.arguments.length===1&&b.type==="BinaryExpression"&&b.operator==="-"&&is(b.left,x)&&is(b.right,y))return emit("sort",[a],n);
    fail(n,"Only sum reduction, positive filter and numeric ascending sort callbacks are supported.");
   }
   const a=sub(n.callee.object),args=n.arguments.map(sub);
   const methods={text:{trim:"trim",toLowerCase:"lower",toUpperCase:"upper",includes:"contains",split:"split"},texts:{join:"join",toReversed:"reverseTexts"},number:{toString:"toText"}};
   const op=methods[a.type]?.[method];if(!op||!Object.hasOwn(methods[a.type],method))fail(n,"Unsupported method: "+method);
   return emit(op,[a,...args],n);
  }
  fail(n,"Unsupported JavaScript syntax: "+n.type);
 }
 const statements=fn.body.body;
 if(!statements.length||statements.length>48||statements.at(-1).type!=="ReturnStatement")throw Error("Function must end with a return expression.");
 for(const statement of statements.slice(0,-1)){
  if(statement.type!=="VariableDeclaration"||statement.kind!=="const")fail(statement,"Only immutable const declarations before return are supported.");
  for(const item of statement.declarations){if(item.id.type!=="Identifier"||!validName(item.id.name)||bindings.has(item.id.name)||!item.init)fail(item,"Invalid or duplicate local declaration.");bindings.set(item.id.name,expr(item.init));}
 }
 const result=expr(statements.at(-1).argument);
 if(!result.arg||typeof result.arg!=="object")fail(statements.at(-1),"Returning a bare constant is unsupported; return a field or operation result.");
 return {fields,steps,result:result.arg.ref};
}
export function verifyJavaScript(input){
 const translated=translateJavaScript(input),report=verifyData({...translated,examples:input.examples});
 return {...report,translated,source:emitDataSource(report.program),module:emitDataModule(report.program),notice:"Pure typed JavaScript subset compiled to bounded Forge semantics (finite numeric values, bounded arrays and strings). Original JavaScript was not executed. Unsupported constructs and coercion are rejected."};
}
