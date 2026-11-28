import test from "node:test";
import assert from "node:assert/strict";
import {buildWebProject} from "../backend/chaos-forge-web-project.mjs";
import {zipProject,readProjectZip} from "../backend/chaos-forge-zip.mjs";
import {inspectProjectArchive} from "../backend/chaos-forge-project-inspect.mjs";
const spec={name:"price-calculator",kind:"source",title:"Price Calculator",theme:"neon",labels:{price:"Unit price",quantity:"Quantity"},spec:{source:"input price: number; input quantity: number; let total = mul(price, quantity); return total;",examples:[{values:[10,3],expected:30},{values:[2.5,4],expected:10},{values:[0,1],expected:0}]}};
test("browser project has nine files and functional typed form, reset and error handling",async()=>{
 const a=buildWebProject(spec),files=new Map(readProjectZip(a.bytes).map(f=>[f.path,f.content]));
 assert.equal(files.size,9);assert.match(files.get("index.html"),/Unit price/);assert.match(files.get("index.html"),/script src="app.js"/);
 const dom=Object.fromEntries(["field-0","field-1","form","reset","copy","output","status"].map(id=>[id,{value:"",textContent:""}]));
 let clipboard="";new Function("document","navigator",files.get("app.js"))({getElementById:id=>dom[id]},{clipboard:{async writeText(v){clipboard=v;}}});
 for(let n=0;n<100;n++){dom["field-0"].value=String(n/2);dom["field-1"].value="3";dom.form.onsubmit({preventDefault(){}});assert.equal(dom.output.textContent,String(n*1.5));}
 await dom.copy.onclick();assert.equal(clipboard,"148.5");
 dom["field-0"].value="";dom.form.onsubmit({preventDefault(){}});assert.match(dom.output.textContent,/Number required/);
 await dom.copy.onclick();assert.match(dom.status.textContent,/valid program/);
 dom.reset.onclick();assert.equal(dom.output.textContent,"30");assert.equal(dom["field-0"].value,"10");
 const module=await import("data:text/javascript;base64,"+Buffer.from(files.get("src/program.mjs")).toString("base64"));assert.equal(module.solve(7,4),28);
});
test("project inspector verifies directory and CRC without executing archive source",()=>{
 const a=buildWebProject(spec),r=inspectProjectArchive(a.bytes);
 assert.equal(r.executed,false);assert.equal(r.fileCount,9);assert.equal(r.manifest.name,"price-calculator");assert.ok(r.dependencies.some(x=>x.to==="../src/program.mjs"));assert.ok(r.analyses.every(x=>x.syntaxValid));
 const bad=a.bytes.slice();const nameLength=new DataView(bad.buffer).getUint16(26,true);bad[30+nameLength]^=1;assert.throws(()=>readProjectZip(bad),/CRC/);
 const mismatch=a.bytes.slice(),v=new DataView(mismatch.buffer),c=v.getUint32(mismatch.length-6,true);mismatch[c+46]^=1;assert.throws(()=>readProjectZip(mismatch),/Unsafe|duplicate/);
 assert.throws(()=>readProjectZip(a.bytes.slice(0,-1)));
 const hostile=zipProject([{path:"package.json",content:'{"name":"fixture","scripts":{"postinstall":"not executed"}}'},{path:"index.js",content:'throw Error("must not execute");'}]);const h=inspectProjectArchive(hostile);assert.equal(h.executed,false);assert.ok(h.warnings.some(x=>x.message.includes("lifecycle")));
});
test("browser source escapes labels and literal script-like input",()=>{
 const input={name:"escape",kind:"data",title:"<script>bad()</script>",labels:{text:"<img src=x>"},spec:{fields:[{name:"text",type:"text"}],steps:[],result:"text",examples:[{values:["</textarea><script>bad()</script>"],expected:"</textarea><script>bad()</script>"},{values:["a"],expected:"a"},{values:[""],expected:""}]}};
 const files=new Map(readProjectZip(buildWebProject(input).bytes).map(f=>[f.path,f.content]));
 assert.ok(!files.get("index.html").includes("<script>bad"));assert.match(files.get("index.html"),/&lt;img src=x&gt;/);
});
