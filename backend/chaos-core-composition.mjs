function compose(spec){
 if(!spec||!Array.isArray(spec.steps)||spec.steps.length<1||spec.steps.length>12)throw Error("Require 1–12 steps");
 const ops={add:(a,b)=>a+b,sub:(a,b)=>a-b,mul:(a,b)=>a*b,min:Math.min,max:Math.max};
 const steps=spec.steps.map((s,i)=>{if(!s||!Object.hasOwn(ops,s.op)||![s.a,s.b].every(v=>Number.isInteger(v)&&v>=0&&v<i+2))throw Error("Invalid operation or forward reference");return {op:s.op,a:s.a,b:s.b};});
 const run=input=>{if(!Array.isArray(input)||input.length!==2||!input.every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000))throw Error("Invalid input");const m=input.slice();for(const s of steps){const v=ops[s.op](m[s.a],m[s.b]);if(!Number.isSafeInteger(v))throw Error("Overflow");m.push(v||0);}return m.at(-1);};
 const check=(rows,min)=>{if(!Array.isArray(rows)||rows.length<min||rows.length>16||new Set(rows.map(r=>JSON.stringify(r.input))).size!==rows.length)throw Error("Invalid examples");return rows.map(r=>{const actual=run(r.input);if(actual!==r.output)throw Error("Example mismatch");return {input:r.input,actual};});};
 const training=check(spec.examples,3),validation=check(spec.validation,1);if(validation.some(r=>training.some(t=>JSON.stringify(t.input)===JSON.stringify(r.input))))throw Error("Overlapping validation");
 const language=spec.language??"javascript";if(!["javascript","python"].includes(language))throw Error("Invalid language");
 const js=language==="javascript",lines=js?["export function solve(x,y) {","  if (![x,y].every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000)) throw Error('Invalid input');","  const v0=x,v1=y;"]:["def solve(x,y):","    if any(type(v) is not int or abs(v)>1000 for v in (x,y)):","        raise ValueError('Invalid input')","    v0,v1=x,y"];
 steps.forEach((s,i)=>{const a="v"+s.a,b="v"+s.b,n="v"+(i+2),expr=["min","max"].includes(s.op)?(js?"Math.":"")+s.op+"("+a+","+b+")":a+({add:"+",sub:"-",mul:"*"})[s.op]+b;lines.push(js?"  const "+n+"="+expr+";":"    "+n+"="+expr,js?"  if (!Number.isSafeInteger("+n+")) throw Error('Overflow');":"    if abs("+n+")>9007199254740991: raise ValueError('Overflow')");});lines.push(js?"  return v"+(steps.length+1)+" || 0;":"    return v"+(steps.length+1));if(js)lines.push("}");
 return {source:lines.join("\n")+"\n",language,steps,training,validation,externalInference:false,notice:"Explicit acyclic numeric composition, interpreter checked; emitted source not executed."};
}
export {compose};
