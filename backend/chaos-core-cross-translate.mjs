import {normalizeTask} from "./chaos-core-source-repair.mjs";
function emitPortable(program,target){
 if(!["javascript","python"].includes(target)||program?.schema!=="chaos-logic-v1")throw Error("Invalid portable program");
 // Compile from validated VM instruction arrays. No raw source fragments.
 const js=target==="javascript",fields=program.fields.map((_,i)=>"arg"+i),locals=program.locals.map((_,i)=>"local"+i),names=[...fields,...locals],lines=[],pad=n=>" ".repeat(n*(js?2:4)),add=(n,s)=>lines.push(pad(n)+s);let loop=0;
 const expr=ops=>{const s=[];for(const ins of ops){const [op,v]=ins;if(op==="const"&&Number.isFinite(v))s.push(String(v));else if(op==="input"&&names[v])s.push(names[v]);else if(op==="neg"&&s.length)s.push("(-"+s.pop()+")");else if(["add","sub","mul","div","pow"].includes(op)&&s.length>=2){const b=s.pop(),a=s.pop(),symbol={add:"+",sub:"-",mul:"*",div:"/",pow:"**"}[op];s.push("("+a+symbol+b+")");}else throw Error("Opcode outside common numeric subset: "+op);}if(s.length!==1)throw Error("Invalid expression");return s[0];};
 const cmp={lt:"<",le:"<=",eq:js?"===":"==",ne:js?"!==":"!=",ge:">=",gt:">"};
 function block(rows,n){if(!rows.length&&!js&&n>1)throw Error("Empty nested block outside common subset");for(const ins of rows){const [op,a,b,c,d,e]=ins;if(op==="set")add(n,names[a]+" = "+expr(b)+(js?";":""));else if(op==="if"){const test=expr(b)+" "+cmp[a]+" "+expr(c);add(n,js?"if ("+test+") {":"if "+test+":");block(d,n+1);if(e.length){add(n,js?"} else {":"else:");block(e,n+1);}if(js)add(n,"}");}else if(op==="repeat"){const id="loop"+loop++,bound=expr(a);add(n,js?"for (let "+id+" = 0; "+id+" < "+bound+"; "+id+"++) {":"for "+id+" in range("+bound+"):");block(b,n+1);if(js)add(n,"}");}else throw Error("Statement outside common subset: "+op);}}
 add(0,js?"export function solve("+fields.join(", ")+") {":"def solve("+fields.join(", ")+"):");for(const name of locals)add(1,(js?"let ":"")+name+" = 0"+(js?";":""));block(program.body,1);add(1,"return "+expr(program.result)+(js?";":""));if(js)add(0,"}");return {source:lines.join("\n")+"\n",fields};
}

function crossTranslate(task,compileSource,compileTarget,vm){
 if(!task||!["javascript","python"].includes(task.language)||!["javascript","python"].includes(task.target)||task.language===task.target)throw Error("Choose different source and target languages");
 const t=normalizeTask(task),p=compileSource({source:t.source,fields:t.fields});const emitted=emitPortable(p,task.target),q=compileTarget(emitted);
 const checks=[...t.examples,...t.validation].map(r=>{const a=vm(p,r.values),b=vm(q,r.values);return {values:r.values,expected:r.expected,original:a,translated:b,passed:a===r.expected&&b===a};});
 if(checks.some(r=>!r.passed))throw Error("Cross-language validation mismatch");
 return {...emitted,language:task.target,sourceLanguage:t.language,checks,validationPassed:t.validation.length,externalInference:false,notice:"Restricted common numeric subset. Both source and translated program compiled to bounded VM instructions; examples checked, not proof of native runtime equivalence."};
}
export {emitPortable,crossTranslate};
