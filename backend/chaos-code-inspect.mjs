import {parse} from "acorn";
import {parse as parseBabel} from "@babel/parser";
/** Acorn-backed, read-only syntax inspector. Never executes or persists submitted code. */
const clip=(s,n=160)=>String(s||"").slice(0,n);
export function inspectChaosCode(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Invalid code input.");
 const code=input.code;
 if(typeof code!=="string"||!code.trim()||new TextEncoder().encode(code).length>10000)
   throw Error("Provide up to 10,000 bytes of code.");
 const language=String(input.language||"javascript").toLowerCase();
 if(!["javascript","json","typescript","jsx","tsx"].includes(language))throw Error("Only JavaScript, TypeScript, JSX, TSX and JSON are supported.");
 const line_count=code.split(/\r\n|\n|\r/).length;
 if(language==="json"){
   try{
     const value=JSON.parse(code);
     const root_type=Array.isArray(value)?"array":value===null?"null":typeof value;
     return {source:"Native JSON.parse",syntax_valid:true,language,line_count,root_type,
       root_entries:root_type==="array"?value.length:root_type==="object"?Object.keys(value).length:null,
       errors:[],limits:"JSON syntax check only. No JSON Schema verification."};
   }catch(error){return {source:"Native JSON.parse",syntax_valid:false,language,line_count,
     errors:[{message:clip(error?.message)}],limits:"JSON syntax check only."};}
 }
 const source_type=["script","module"].includes(input.source_type)?input.source_type:"module";
 let ast;
 try{
  ast=["typescript","jsx","tsx"].includes(language)?parseBabel(code,{sourceType:source_type,
    plugins:language==="typescript"?["typescript"]:language==="jsx"?["jsx"]:["typescript","jsx"],
    allowReturnOutsideFunction:false,errorRecovery:false}):
    parse(code,{ecmaVersion:"latest",sourceType:source_type,locations:true,allowHashBang:true});
 }
 catch(error){
   return {source:language==="javascript"?"Acorn 8.19.0 (MIT)":"Babel parser 7.28.5 (MIT)",language,source_type,syntax_valid:false,line_count,
     errors:[{message:clip(error?.message),line:error?.loc?.line||null,
       column:Number.isInteger(error?.loc?.column)?error.loc.column+1:null}],
     limits:"Syntax inspection only, no code execution or type checking."};
 }
 const findings=[],stack=[ast];let parsed_nodes=0;
 const report=(node,rule,severity,message)=>{
   if(findings.length<16)findings.push({rule,severity,message,
      line:node.loc?.start?.line||null,column:Number.isInteger(node.loc?.start?.column)?node.loc.start.column+1:null});
 };
 while(stack.length){
   const n=stack.pop();if(!n||typeof n!=="object"||typeof n.type!=="string")continue;
   if(++parsed_nodes>22000)throw Error("Exceeded safe AST node limit.");
   if(n.type==="CallExpression"&&n.callee?.name==="eval")report(n,"eval","high","eval can execute untrusted code.");
   if(n.type==="NewExpression"&&n.callee?.name==="Function")report(n,"new-function","high","Function constructor executes generated code.");
   if(n.type==="CallExpression"&&n.callee?.type==="MemberExpression"&&!n.callee.computed&&n.callee.object?.name==="document"&&n.callee.property?.name==="write")
     report(n,"document-write","medium","document.write is unsafe with untrusted text.");
   if(n.type==="AssignmentExpression"&&n.left?.type==="MemberExpression"&&!n.left.computed&&n.left.property?.name==="innerHTML")
     report(n,"inner-html","medium","Avoid assigning untrusted strings to innerHTML.");
   if(n.type==="CallExpression"&&["setTimeout","setInterval"].includes(n.callee?.name)&&typeof n.arguments?.[0]?.value==="string")
     report(n,"string-timer","high","String timers evaluate code. Use callbacks.");
   if(n.type==="VariableDeclarator"&&n.id?.type==="Identifier"&&/(api[_-]?key|access[_-]?token|client[_-]?secret|password|private[_-]?key)/i.test(n.id.name)&&
      n.init?.type==="Literal"&&typeof n.init.value==="string"&&n.init.value.length>6)
     report(n,"possible-secret","high","Possible hardcoded secret; use server-side secret storage.");
   for(const [key,v] of Object.entries(n)){
     if(["loc","start","end","raw","range"].includes(key)||!v)continue;
     if(Array.isArray(v)){for(let i=v.length-1;i>=0;i--)if(v[i]?.type)stack.push(v[i]);}
     else if(v?.type)stack.push(v);
   }
 }
 return {source:language==="javascript"?"Acorn 8.19.0 (MIT)":"Babel parser 7.28.5 (MIT)",language,source_type,syntax_valid:true,line_count,parsed_nodes,
   findings,errors:[],limits:"Bounded syntax validation and limited heuristic warnings; not a full lint/security or TypeScript type-checking audit. No code execution."};
}
