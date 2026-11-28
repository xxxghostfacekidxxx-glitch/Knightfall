// Human-readable Forge Data source: input, let, return. JSON strings are literals, never code.
import {compileData,decompileData,verifyData} from "./chaos-forge-data.mjs";
export function parseDataSource(source){
 if(typeof source!=="string"||source.length>16000||!source.trim())throw Error("Source must be 1–16000 characters.");
 const tokens=[];let i=0;
 while(i<source.length){
  const rest=source.slice(i),ws=rest.match(/^\s+/),comment=rest.match(/^\/\/[^\r\n]*/);
  if(ws||comment){i+=(ws||comment)[0].length;continue;}
  const start=i;let token;
  if(rest[0]==='"'){const m=rest.match(/^"(?:[^"\\\u0000-\u001f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/);if(!m)throw Error("Invalid string at "+(i+1));token={kind:"literal",value:JSON.parse(m[0]),at:start};i+=m[0].length;}
  else{const n=rest.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/),id=rest.match(/^[A-Za-z][A-Za-z0-9_]*/);
   if(n){const value=Number(n[0]);if(!Number.isFinite(value))throw Error("Nonfinite literal");token={kind:"literal",value,at:start};i+=n[0].length;}
   else if(id){token={kind:"id",value:id[0],at:start};i+=id[0].length;}
   else if(":;=(),".includes(rest[0])){token={kind:"punct",value:rest[0],at:start};i++;}
   else throw Error("Unexpected character at "+(i+1));
  }
  tokens.push(token);if(tokens.length>2048)throw Error("Token budget exceeded");
 }
 let pos=0;const peek=()=>tokens[pos],take=()=>tokens[pos++],fail=message=>{throw Error(message+" at character "+((peek()?.at??source.length)+1));};
 function expect(value,kind){const t=peek();if(!t||t.value!==value||t.kind!==kind)fail("Expected "+value);return take();}
 function identifier(){const t=peek();if(t?.kind!=="id")fail("Expected identifier");return take().value;}
 const is=value=>peek()?.value===value&&peek()?.kind==="id";
 function arg(){const t=peek();if(t?.kind==="literal")return take().value;if(is("true")||is("false"))return take().value==="true";return {ref:identifier()};}
 const fields=[],steps=[];
 while(is("input")){take();const name=identifier();expect(":","punct");const type=identifier();expect(";","punct");fields.push({name,type});}
 while(is("let")){take();const name=identifier();expect("=","punct");const op=identifier();expect("(","punct");const args=[];if(!(peek()?.value===")"&&peek()?.kind==="punct")){args.push(arg());while(peek()?.value===","&&peek().kind==="punct"){take();args.push(arg());}}expect(")","punct");expect(";","punct");steps.push({name,op,args});}
 expect("return","id");const result=identifier();expect(";","punct");if(pos!==tokens.length)fail("Unexpected trailing source");
 if([...fields,...steps].some(x=>["true","false"].includes(x.name)))throw Error("Boolean keywords are reserved.");
 const spec={fields,steps,result};compileData(spec);return spec;
}
export function emitDataSource(program){
 const {source}=decompileData(program),arg=a=>typeof a==="object"?a.ref:JSON.stringify(a);
 const names=[...source.fields,...source.steps].map(x=>x.name);
 if(names.some(x=>x==="true"||x==="false"))throw Error("Boolean keywords cannot be represented as source identifiers.");
 return [...source.fields.map(f=>"input "+f.name+": "+f.type+";"),...source.steps.map(s=>"let "+s.name+" = "+s.op+"("+s.args.map(arg).join(", ")+");"),"return "+source.result+";",""].join("\n");
}
export function verifyDataSource(input){
 if(!input||typeof input.source!=="string")throw Error("Provide source text and examples.");
 const spec=parseDataSource(input.source),report=verifyData({...spec,examples:input.examples});
 const reconstructed=emitDataSource(report.program);
 verifyData({...parseDataSource(reconstructed),examples:input.examples});
 return {...report,reconstructed};
}
