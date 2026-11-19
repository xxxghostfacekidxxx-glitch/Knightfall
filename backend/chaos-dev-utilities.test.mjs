import test from "node:test";
import assert from "node:assert/strict";
import {inspectChaosCode} from "./chaos-code-inspect.mjs";
import {formatChaosCode} from "./chaos-code-format.mjs";
import {compareChaosCode,validateChaosJSON} from "./chaos-dev-utilities.mjs";
import {dispatchChaosTool,describeChaosTools} from "./chaos-tool-dispatch.mjs";
import {inferWithChaosTools} from "./chaos-model-tools.mjs";

test("Babel parser extends syntax inspection to TypeScript, JSX and TSX",()=>{
 for(const [language,code] of [
  ["typescript","interface User { name: string }; const read=(u:User):string=>u.name;"],
  ["jsx","const card=<article>Hello</article>;"],
  ["tsx","type Props={name:string}; export const View=({name}:Props)=><strong>{name}</strong>;"]
 ]){
  const result=inspectChaosCode({code,language});
  assert.equal(result.syntax_valid,true,language+":"+JSON.stringify(result.errors));
  assert.ok(result.parsed_nodes>=3);
 }
 const bad=inspectChaosCode({code:"const count: number = ;",language:"typescript"});
 assert.equal(bad.syntax_valid,false);
 assert.equal(bad.errors[0].line,1);
 assert.throws(()=>inspectChaosCode({code:"print(1)",language:"python"}),/JavaScript, TypeScript/);
});
test("Prettier formats TypeScript and TSX without executing input",async()=>{
 const ts=await formatChaosCode({language:"typescript",code:"interface User{name:string}\nconst name=(u:User):string=>u.name"});
 assert.equal(ts.valid,true);
 assert.match(ts.formatted,/name: string/);
 const tsx=await formatChaosCode({language:"tsx",code:"const View=()=> <span>Hello</span>"});
 assert.equal(tsx.valid,true);
 assert.match(tsx.formatted,/const View =/);
});
test("Code diff reports actual additions, returns unified patch and does not modify inputs",()=>{
 const before="const a=1;\n",after="const a=2;\nconst b=3;\n";
 const result=compareChaosCode({before,after});
 assert.equal(result.identical,false);
 assert.ok(result.added_lines>=2);
 assert.ok(result.removed_lines>=1);
 assert.match(result.unified_diff,/@@/);
 assert.equal(compareChaosCode({before,after:before}).identical,true);
 assert.throws(()=>compareChaosCode({before:"a".repeat(5001),after:"b"}),/5,000/);
});
test("JSON shape validation catches missing, mistyped and unknown fields without returning private values",()=>{
 const schema=JSON.stringify({type:"object",required:["name","count"],additionalProperties:false,properties:{
  name:{type:"string",minLength:2},count:{type:"integer",minimum:1}
 }});
 const valid=validateChaosJSON({document:'{"name":"Nny","count":2}',schema});
 assert.equal(valid.valid,true);
 const invalid=validateChaosJSON({document:'{"name":"x","count":"secretvalue","extra":true}',schema});
 assert.equal(invalid.valid,false);
 assert.ok(invalid.errors.some(x=>x.path==="/count"));
 assert.ok(invalid.errors.some(x=>x.path==="/extra"));
 assert.ok(!JSON.stringify(invalid).includes("secretvalue"));
});
test("Validator refuses unsafe schema keywords and deep structures",()=>{
 for(const field of [{"$ref":"http://example.com"},{"pattern":"(a+)+"},{anyOf:[{type:"string"}]}])
 assert.throws(()=>validateChaosJSON({document:'"abc"',schema:JSON.stringify({type:"string",...field})}),/Unsupported schema/);
 const tooDeep=Array.from({length:13}).reduceRight((acc)=>({type:"array",items:acc}),{type:"string"});
 assert.throws(()=>validateChaosJSON({document:'[]',schema:JSON.stringify(tooDeep)}),/nested/);
});
test("New tool capability gates and model intent paths use real results",async()=>{
 const names=describeChaosTools(null);
 for(const name of ["dev.code_diff","dev.json_shape"])assert.ok(names.includes(name));
 const diff=await dispatchChaosTool({name:"dev.code_diff",input:{before:"a\n",after:"b\n"}});
 assert.equal(diff.identical,false);
 const valid=await dispatchChaosTool({name:"dev.json_shape",input:{document:"[1,2]",schema:'{"type":"array","items":{"type":"integer"}}'}});
 assert.equal(valid.valid,true);
 for(const [request,key] of [
  ["Compare code versions:\nOLD:\nconst a=1;\nNEW:\nconst a=2;", "unified_diff"],
  ["Validate JSON schema:\nSCHEMA:\n{\"type\":\"object\"}\nDOCUMENT:\n{}", "valid"]
 ]){
  let calls=0,opts;
  const ai={run:async(_,p)=>{calls++;opts=p;return {response:"Checked"};}};
  await inferWithChaosTools({ai,model:"fast",messages:[{role:"system",content:"base"},{role:"user",content:request}]});
  assert.equal(calls,1);
  assert.match(opts.messages[0].content,new RegExp(key));
 }
});
