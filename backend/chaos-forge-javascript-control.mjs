// Numeric JavaScript control-flow frontend. Parse source, lower to bounded Forge Logic, never eval source.
import {parse} from "acorn";
import {verifyLogic,runLogic} from "./chaos-forge-logic.mjs";
const nameOK=n=>typeof n==="string"&&/^[a-z][a-z0-9_]{0,23}$/.test(n)&&!["abs","sqrt","ceil","floor","trunc","min","max"].includes(n);
const comparisons={"<":"lt","<=":"le","===":"eq","!==":"ne",">=":"ge",">":"gt"};
export function translateControlJavaScript(input){
 if(!input||typeof input.source!=="string"||input.source.length>10000||!Array.isArray(input.fields)||input.fields.length<1||input.fields.length>12)throw Error("Provide numeric fields and up to 10,000 source characters.");
 const ast=parse(input.source,{ecmaVersion:"latest",sourceType:"module",locations:true}),top=ast.body[0],fn=top?.type==="ExportNamedDeclaration"||top?.type==="ExportDefaultDeclaration"?top.declaration:top;
 if(ast.body.length!==1||fn?.type!=="FunctionDeclaration"||fn.async||fn.generator||fn.params.length!==input.fields.length||fn.params.some((p,i)=>p.type!=="Identifier"||p.name!==input.fields[i])||input.fields.some(n=>!nameOK(n))||new Set(input.fields).size!==input.fields.length)throw Error("Exactly one synchronous numeric function with matching parameters is required.");
 const fields=input.fields.slice(),locals=[],active=new Set(fields),counters=new Set();let nodes=0;
 const fail=(n,msg)=>{throw Error(msg+" (line "+(n?.loc?.start?.line??"?")+")");};
 function declare(n,name){if(!nameOK(name)||fields.includes(name)||locals.includes(name)||fields.length+locals.length>=12)fail(n,"Invalid, duplicate or excessive local");locals.push(name);active.add(name);}
 function expr(n,depth=0){
  if(!n||++nodes>512||depth>18)fail(n,"Expression limit");
  const sub=x=>expr(x,depth+1);
  if(n.type==="Identifier"&&active.has(n.name))return n.name;
  if(n.type==="Literal"&&typeof n.value==="number"&&Number.isFinite(n.value)&&!n.bigint)return String(n.value);
  if(n.type==="UnaryExpression"&&["+","-"].includes(n.operator))return "("+n.operator+sub(n.argument)+")";
  if(n.type==="BinaryExpression"&&["+","-","*","/","%","**"].includes(n.operator))return "("+sub(n.left)+(n.operator==="**"?"^":n.operator)+sub(n.right)+")";
  fail(n,"Unsupported numeric expression: "+n.type);
 }
 const assign=(n,name,value)=>{if(!active.has(name)||!locals.includes(name)||counters.has(name))fail(n,"Only declared non-counter locals may be assigned");return {op:"set",name,expr:value};};
 function block(statements,depth=0,topLevel=false){
  if(depth>5||!Array.isArray(statements)||statements.length>64)throw Error("Block limit");
  const out=[];
  for(const n of statements){
   if(n.type==="VariableDeclaration"&&topLevel&&["let","var"].includes(n.kind)){
    for(const d of n.declarations){if(d.id.type!=="Identifier"||!d.init)fail(d,"Initialized numeric local required");const value=expr(d.init);declare(d,d.id.name);out.push({op:"set",name:d.id.name,expr:value});}
   }else if(n.type==="ExpressionStatement"&&n.expression.type==="AssignmentExpression"){
    const a=n.expression;if(a.left.type!=="Identifier"||!["=","+=","-=","*=","/="].includes(a.operator))fail(a,"Unsupported assignment");
    const name=a.left.name,value=expr(a.right);out.push(assign(a,name,a.operator==="="?value:"("+name+a.operator[0]+value+")"));
   }else if(n.type==="IfStatement"){
    const t=n.test;if(t.type!=="BinaryExpression"||!Object.hasOwn(comparisons,t.operator)||n.consequent.type!=="BlockStatement"||n.alternate&&n.alternate.type!=="BlockStatement")fail(n,"Use numeric comparison and braced if/else blocks");
    out.push({op:"if",compare:comparisons[t.operator],left:expr(t.left),right:expr(t.right),then:block(n.consequent.body,depth+1),else:n.alternate?block(n.alternate.body,depth+1):[]});
   }else if(n.type==="ForStatement"){
    const d=n.init?.type==="VariableDeclaration"&&n.init.kind==="let"&&n.init.declarations.length===1?n.init.declarations[0]:null,name=d?.id?.name,t=n.test,u=n.update;
    if(!d||d.id.type!=="Identifier"||d.init?.type!=="Literal"||d.init.value!==0||t?.type!=="BinaryExpression"||t.operator!=="<"||t.left.type!=="Identifier"||t.left.name!==name||!(t.right.type==="Identifier"&&fields.includes(t.right.name)||t.right.type==="Literal"&&Number.isInteger(t.right.value)&&t.right.value>=0&&t.right.value<=1000)||u?.type!=="UpdateExpression"||u.operator!=="++"||u.argument.type!=="Identifier"||u.argument.name!==name||n.body.type!=="BlockStatement")fail(n,"Use for (let i=0; i<parameter; i++) with a braced body and integer bound");
    const count=expr(t.right);declare(d,name);counters.add(name);const body=block(n.body.body,depth+1);counters.delete(name);active.delete(name);
    out.push({op:"set",name,expr:"0"},{op:"repeat",count,body:[...body,{op:"set",name,expr:name+"+1"}]});
   }else fail(n,"Unsupported control statement: "+n.type);
  }return out;
 }
 const statements=fn.body.body;if(!statements.length||statements.at(-1).type!=="ReturnStatement")throw Error("Function must end with one numeric return.");
 const body=block(statements.slice(0,-1),0,true),result=expr(statements.at(-1).argument);
 return {fields,locals,body,result};
}
export function verifyControlJavaScript(input){
 const translated=translateControlJavaScript(input),r=verifyLogic({...translated,examples:input.examples});
 return {...r,translated,module:runLogic.toString()+"\nconst program="+JSON.stringify(r.program)+";\nexport function solve(...values){return runLogic(program,values);}\n",notice:"Bounded finite numeric JavaScript subset; loops require immutable nonnegative integer bounds (0–1000). Submitted code never executed."};
}
