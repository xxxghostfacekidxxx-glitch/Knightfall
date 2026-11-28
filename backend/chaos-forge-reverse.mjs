// Static source reverse engineering. No eval, imports of submitted code, or execution.
import {parse} from "acorn";
import {inspectChaosCode} from "./chaos-code-inspect.mjs";
const limit=(s,n=160)=>String(s||"").slice(0,n);
export function reverseSource(code,language="javascript"){
 const report=inspectChaosCode({code,language});
 if(!report.syntax_valid||language!=="javascript")return {...report,executed:false,notice:"Structural syntax report only for this language."};
 const ast=parse(code,{ecmaVersion:"latest",sourceType:"module",locations:true,allowHashBang:true});
 const calls=[],modules=[],symbols=[],edges=new Set();let nodes=0;
 function add(list,value,max=80){if(list.length<max)list.push(value);}
 function callee(n){if(!n)return "<unknown>";if(n.type==="Identifier")return n.name;if(n.type==="MemberExpression"){const object=callee(n.object);if(n.computed)return object+"[computed]";return object+"."+limit(n.property?.name,80);}return "<"+n.type+">";}
 const stack=[{node:ast,scope:"<module>",parent:null}];
 while(stack.length){const {node:n,scope,parent}=stack.pop();if(++nodes>22000)throw Error("AST traversal limit.");let current=scope;
  if(["FunctionDeclaration","FunctionExpression","ArrowFunctionExpression"].includes(n.type)){current=limit(n.id?.name||parent?.id?.name||parent?.key?.name||"<anonymous@"+n.loc.start.line+">",100);add(symbols,{name:current,kind:n.type,line:n.loc.start.line,parameters:n.params.length,async:n.async===true});}
  if(n.type==="ClassDeclaration")add(symbols,{name:limit(n.id?.name),kind:n.type,line:n.loc.start.line});
  if(n.type==="ImportDeclaration"||n.type==="ExportNamedDeclaration"&&n.source||n.type==="ExportAllDeclaration")add(modules,{kind:n.type,specifier:limit(n.source?.value),line:n.loc.start.line});
  if(n.type==="ImportExpression")add(modules,{kind:n.type,specifier:n.source?.type==="Literal"?limit(n.source.value):"<dynamic>",line:n.loc.start.line});
  if(n.type==="CallExpression"||n.type==="NewExpression"){const target=limit(callee(n.callee));const edge=current+" → "+target;add(calls,{from:current,to:target,line:n.loc.start.line,kind:n.type},160);if(edges.size<160)edges.add(edge);}
  for(const [k,v] of Object.entries(n)){if(["loc","start","end","raw","range"].includes(k)||!v)continue;if(Array.isArray(v)){for(let i=v.length-1;i>=0;i--)if(v[i]?.type)stack.push({node:v[i],scope:current,parent:n});}else if(v?.type)stack.push({node:v,scope:current,parent:n});}
 }
 return {...report,symbols,modules,calls,callGraph:[...edges],executed:false,notice:"Syntactic call graph and dependencies only; dynamic dispatch, runtime values and original intent cannot be recovered reliably."};
}
