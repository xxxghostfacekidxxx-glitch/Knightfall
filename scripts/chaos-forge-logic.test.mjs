import test from "node:test";
import assert from "node:assert/strict";
import {compileLogic,verifyLogic,decompileLogic,runLogic} from "../backend/chaos-forge-logic.mjs";
import {buildApplet} from "../backend/chaos-forge-applets.mjs";
import {createHash} from "node:crypto";
export const factorial={fields:["n"],locals:["i","total"],body:[{op:"set",name:"total",expr:"1"},{op:"repeat",count:"n",body:[{op:"set",name:"i",expr:"i+1"},{op:"set",name:"total",expr:"total*i"}]}],result:"total",examples:[{values:[0],expected:1},{values:[5],expected:120},{values:[8],expected:40320}]};
export const sum={fields:["n"],locals:["i","total"],body:[{op:"repeat",count:"n",body:[{op:"set",name:"i",expr:"i+1"},{op:"if",compare:"eq",left:"i%2",right:"0",then:[{op:"set",name:"total",expr:"total+i"}]}]}],result:"total",examples:[{values:[0],expected:0},{values:[5],expected:6},{values:[10],expected:30}]};
test("structured compiler reconstructs programs with local variables, loops and branches",()=>{
 for(const source of [factorial,sum]){const a=verifyLogic(source),b=compileLogic(decompileLogic(a.program).source);assert.equal(a.tests.length,3);for(const e of source.examples)assert.equal(runLogic(b,e.values),e.expected);}
 for(let n=0;n<100;n++)assert.equal(runLogic(compileLogic(sum),[n]),Math.floor(n/2)*(Math.floor(n/2)+1));
 for(let n=0;n<15;n++){let expected=1;for(let i=1;i<=n;i++)expected*=i;assert.equal(runLogic(compileLogic(factorial),[n]),expected);}
});
test("bounded interpreter rejects runaway loops, host calls and failed examples",()=>{
 for(const n of [-1,1.5,1001])assert.throws(()=>runLogic(compileLogic(factorial),[n]),/Loop count/);
 assert.throws(()=>compileLogic({...sum,result:"fetch(n)"}));
 assert.throws(()=>verifyLogic({...sum,examples:[{values:[0],expected:9},{values:[5],expected:6},{values:[10],expected:30}]}),/Example failed/);
 assert.throws(()=>runLogic(compileLogic({...sum,body:[{op:"repeat",count:"1000",body:[{op:"repeat",count:"1000",body:[{op:"set",name:"i",expr:"i+1"}]}]}]}),[1]),/budget/);
});
test("generated standalone logic applet has matching CSP and working inputs",async()=>{
 const a=await buildApplet("logic: "+JSON.stringify({...sum,title:"Even sum"}));
 const script=a.content.match(/<script>([\s\S]*?)<\/script>/)[1];
 assert.equal(a.report.scriptHash,createHash("sha256").update(script).digest("base64"));
 const dom={"field-0":{value:"10"},output:{textContent:""},run:{}};
 new Function("document",script)({getElementById:id=>dom[id]});dom.run.onclick();assert.equal(dom.output.textContent,"30");
 dom["field-0"].value="1001";dom.run.onclick();assert.match(dom.output.textContent,/Loop count/);
});
