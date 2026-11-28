import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {buildProject} from "../backend/chaos-forge-project.mjs";
import {zipProject} from "../backend/chaos-forge-zip.mjs";
import {reverseSource} from "../backend/chaos-forge-reverse.mjs";
const ref=ref=>({ref});
const examples=[{values:[" A "],expected:"a"},{values:["HELLO"],expected:"hello"},{values:[""],expected:""}];
const data={fields:[{name:"text",type:"text"}],steps:[{name:"clean",op:"trim",args:[ref("text")]},{name:"out",op:"lower",args:[ref("clean")]}],result:"out",examples};
const specs=[
 {name:"data-app",kind:"data",spec:data},
 {name:"source-app",kind:"source",spec:{source:"input text: text; let clean = trim(text); let out = lower(clean); return out;",examples}},
 {name:"library-app",kind:"library",spec:{functions:[{name:"normalize",fields:data.fields,steps:data.steps,result:data.result}],entry:"normalize",examples}},
 {name:"logic-app",kind:"logic",spec:{fields:["n"],locals:["total"],body:[{op:"repeat",count:"n",body:[{op:"set",name:"total",expr:"total+2"}]}],result:"total",examples:[{values:[0],expected:0},{values:[3],expected:6},{values:[10],expected:20}]}}
];
function unpack(bytes){
 const files=new Map(),v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),dec=new TextDecoder();let p=0;
 while(v.getUint32(p,true)===0x04034b50){
  const size=v.getUint32(p+18,true),len=v.getUint16(p+26,true),extra=v.getUint16(p+28,true),name=dec.decode(bytes.slice(p+30,p+30+len)),start=p+30+len+extra;
  assert.equal(v.getUint16(p+8,true),0);files.set(name,bytes.slice(start,start+size));p=start+size;
 }
 assert.equal(v.getUint32(p,true),0x02014b50);assert.equal(v.getUint32(bytes.length-22,true),0x06054b50);assert.equal(v.getUint16(bytes.length-12,true),files.size);return files;
}
test("all four project builders produce runnable Node packages with eight files",()=>{
 for(const spec of specs){
  const a=buildProject(spec),files=unpack(a.bytes),dir=mkdtempSync(join(tmpdir(),"forge-project-"));
  try{assert.equal(files.size,8);assert.ok(a.bytes.length<=32768);
   for(const [path,data] of files){const target=join(dir,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data);}
   const tests=spawnSync(process.execPath,["--test","test/program.test.mjs"],{cwd:dir,encoding:"utf8"});assert.equal(tests.status,0,tests.stdout+tests.stderr);
   const cli=spawnSync(process.execPath,["src/cli.mjs",JSON.stringify(spec.spec.examples[0].values)],{cwd:dir,encoding:"utf8"});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),spec.spec.examples[0].expected);
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});
test("ZIP writer blocks traversal, duplicate paths, and oversized packages",()=>{
 for(const path of ["../bad","/root","a/../../b","a\\b"])assert.throws(()=>zipProject([{path,content:"x"}]));
 assert.throws(()=>zipProject([{path:"A.txt",content:"x"},{path:"a.txt",content:"y"}]));assert.throws(()=>zipProject([{path:"a.txt",content:"x".repeat(33000)}]));
});
test("TypeScript and JSX analysis recovers symbols, dependencies and component usage without execution",()=>{
 const code='import type {User} from "./types"; import {Card} from "./ui"; interface Props { user: User }; export function Profile(p: Props){ return <Card title={p.user.name}>{format(p.user)}</Card>; }';
 const r=reverseSource(code,"tsx");assert.equal(r.syntax_valid,true);assert.equal(r.executed,false);assert.ok(r.symbols.some(x=>x.name==="Props"));assert.ok(r.symbols.some(x=>x.name==="Profile"));assert.ok(r.modules.some(x=>x.specifier==="./types"&&x.typeOnly));assert.ok(r.components.some(x=>x.name==="Card"&&x.attributes.includes("title")));assert.ok(r.calls.some(x=>x.to==="format"));assert.ok(r.exports.some(x=>x.names.includes("Profile")));
 const js=reverseSource('const View = () => <section><Card /></section>',"jsx");assert.ok(js.components.some(x=>x.name==="section"));
 const ts=reverseSource('type ID = string; export const fetcher = async () => client?.load();',"typescript");assert.ok(ts.symbols.some(x=>x.name==="ID"));assert.ok(ts.calls.some(x=>x.to==="client.load"));
});
