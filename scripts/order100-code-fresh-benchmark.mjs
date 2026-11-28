// Second evaluation family, separate from the ten training families and six development tasks.
import {synthesize,verifyProgram,emptyPrior} from "../backend/order100-code-synthesis.mjs";
const cases=[
 {name:"maximum distinct even integer",oracle:a=>{const b=a.filter(x=>x%2===0);return b.length?Math.max(...b):null;}},
 {name:"sum unique absolute values",oracle:a=>[...new Set(a.map(Math.abs))].reduce((x,y)=>x+y,0)},
 {name:"descending magnitudes of negatives",oracle:a=>a.filter(x=>x<0).map(x=>-x).sort((x,y)=>y-x)},
 {name:"minimum incremented positive",oracle:a=>{const b=a.filter(x=>x>0);return b.length?Math.min(...b)+1:null;}},
 {name:"unique odd values from right to left",oracle:a=>[...new Set(a.slice().reverse())].filter(x=>x%2!==0)},
 {name:"ascending doubled odd values",oracle:a=>a.filter(x=>x%2!==0).map(x=>x*2).sort((x,y)=>x-y)},
 {name:"count unique squares of nonzero integers",oracle:a=>new Set(a.filter(x=>x!==0).map(x=>x*x)).size}, // Four operations; deliberately outside 3-step grammar.
 {name:"sum of consecutive pair differences",oracle:a=>a.slice(1).reduce((n,x,i)=>n+Math.abs(x-a[i]),0)} // No pairwise operation in the grammar.
];
const demos=[[],[0,0],[-7,-2,-2],[1,3,5],[-4,4,3,-3,0,2],[5,1,5,4,-5,2],[8,8,0,-6,-6],[-5,6,4,-1,3]];
const heldout=[[],[0],[-3,3,3,0],[-1,-9,-4],[2,2,1,7,1],[10,-10,0,7,2,7],[-1,1,-1,1],[-8,-8,4,-2,9,3]];
export function freshCodingBenchmark(prior=emptyPrior(),budget=512){
 const rows=cases.map((task,i)=>{
  const examples=demos.map(input=>({input,output:task.oracle(input)})),validation=heldout.map(input=>({input,output:task.oracle(input)}));
  const r=synthesize(examples,{maxSteps:3,budget,prior});
  const checks=r.program?verifyProgram(r.program,validation):[];
  const correct=checks.length===validation.length&&checks.every(c=>c.passed);
  return {name:task.name,inGrammar:i<6,status:r.status,program:r.program,passed:checks.filter(c=>c.passed).length,tests:validation.length,solved:correct,abstained:!r.program};
 });
 return {budget,tasks:rows.length,inGrammar:6,solved:rows.filter(x=>x.inGrammar&&x.solved).length,outOfGrammarAbstentions:rows.filter(x=>!x.inGrammar&&x.abstained).length,rows};
}
