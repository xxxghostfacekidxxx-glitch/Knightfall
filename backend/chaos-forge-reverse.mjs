// Read-only structural analysis. No execution, type checking, or claims of dynamic call resolution.
import {parse} from "acorn";
import {parse as parseBabel} from "@babel/parser";
import {inspectChaosCode} from "./chaos-code-inspect.mjs";
const limit=(s,n=160)=>String(s||"").slice(0,n);
export function reverseSource(code,language="javascript"){
 const report=inspectChaosCode({code,language});language=report.language;
 if(!report.syntax_valid||language==="json")return {...report,executed:false,notice:"Structural syntax report only for this input."};
 const ast=language==="javascript"?parse(code,{ecmaVersion:"latest",sourceType:"module",locations:true,allowHashBang:true}):parseBabel(code,{sourceType:"module",plugins:language==="typescript"?["typescript"]:language==="jsx"?["jsx"]:["typescript","jsx"]});
 const calls=[],modules=[],symbols=[],components=[],exports=[],edges=new Set();let nodes=0;
 const functionTypes=new Set(["FunctionDeclaration","FunctionExpression","ArrowFunctionExpression","ObjectMethod","ClassMethod","ClassPrivateMethod","MethodDefinition","TSDeclareFunction"]);
 const typeDeclarations=new Set(["TSInterfaceDeclaration","TSTypeAliasDeclaration","TSEnumDeclaration","TSModuleDeclaration"]);
 function add(list,value,max=80){if(list.length<max)list.push(value);}
 function callee(n,depth=0){
  if(!n||depth>12)return "<unknown>";
  if(["Identifier","JSXIdentifier","PrivateName"].includes(n.type))return n.name||n.id?.name||"<private>";
  if(n.type==="ThisExpression")return "this";
  if(n.type==="Super")return "super";
  if(["MemberExpression","OptionalMemberExpression","JSXMemberExpression"].includes(n.type))return callee(n.object,depth+1)+(n.computed?"[computed]":"."+limit(n.property?.name,80));
  if(n.type==="JSXNamespacedName")return callee(n.namespace,depth+1)+":"+callee(n.name,depth+1);
  return "<"+n.type+">";
 }
 const literal=n=>["Literal","StringLiteral"].includes(n?.type)&&typeof n.value==="string"?limit(n.value):"<dynamic>";
 const stack=[{node:ast,scope:"<module>",parent:null}];
 while(stack.length){const {node:n,scope,parent}=stack.pop();if(++nodes>22000)throw Error("AST traversal limit.");let current=scope;const line=n.loc?.start?.line??null;
  if(functionTypes.has(n.type)&&n.type!=="MethodDefinition"){
   const name=n.id?.name||n.key?.name||parent?.id?.name||parent?.key?.name||"<anonymous@"+line+">";
   current=limit(name,100);add(symbols,{name:current,kind:n.type,line,parameters:n.params?.length??0,async:n.async===true});
  }
  if(["ClassDeclaration","ClassExpression"].includes(n.type)){current=limit(n.id?.name||parent?.id?.name||"<class@"+line+">",100);add(symbols,{name:current,kind:n.type,line});}
  if(typeDeclarations.has(n.type))add(symbols,{name:limit(n.id?.name||n.id?.value),kind:n.type,line});
  if(n.type==="ImportDeclaration"||n.type==="ExportNamedDeclaration"&&n.source||n.type==="ExportAllDeclaration")add(modules,{kind:n.type,specifier:literal(n.source),line,typeOnly:n.importKind==="type"||n.exportKind==="type"});
  if(n.type==="ImportExpression")add(modules,{kind:n.type,specifier:literal(n.source),line});
  if(n.type.startsWith("Export")){const names=n.specifiers?.map(s=>s.exported?.name||s.exported?.value).filter(Boolean)||[];if(n.declaration?.id?.name)names.push(n.declaration.id.name);for(const d of n.declaration?.declarations||[])if(d.id?.name)names.push(d.id.name);add(exports,{kind:n.type,names: names.slice(0,30),line});}
  if(["CallExpression","OptionalCallExpression","NewExpression"].includes(n.type)){
   const target=limit(callee(n.callee));if(n.callee?.type==="Import")add(modules,{kind:"ImportExpression",specifier:literal(n.arguments?.[0]),line});
   if(target==="require")add(modules,{kind:"require (syntactic)",specifier:literal(n.arguments?.[0]),line});
   add(calls,{from:current,to:target,line,kind:n.type},160);if(edges.size<160)edges.add(current+" → "+target);
  }
  if(n.type==="JSXOpeningElement")add(components,{name:limit(callee(n.name)),scope:current,line,attributes:(n.attributes||[]).map(a=>a.type==="JSXSpreadAttribute"?"<spread>":callee(a.name)).slice(0,30)},100);
  for(const [k,v] of Object.entries(n)){if(["loc","start","end","raw","range","extra","comments","tokens","leadingComments","trailingComments","innerComments"].includes(k)||!v)continue;if(Array.isArray(v)){for(let i=v.length-1;i>=0;i--)if(v[i]?.type)stack.push({node:v[i],scope:current,parent:n});}else if(v?.type)stack.push({node:v,scope:current,parent:n});}
 }
 return {...report,symbols,modules,exports,components,calls,callGraph:[...edges],executed:false,notice:"Syntactic call graph, components and dependencies only; dynamic dispatch, runtime values, TypeScript type correctness and original intent cannot be recovered reliably."};
}
