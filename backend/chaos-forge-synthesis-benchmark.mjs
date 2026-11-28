// Novel example-driven coding benchmark, with separate hidden inputs.
// The synthesizer sees three training examples, never the hidden expected outputs.
import {synthesizeData} from "./chaos-forge-data-synthesis.mjs";
import {runData} from "./chaos-forge-data.mjs";
export function evaluateSynthesis(index){
 if(!Number.isInteger(index)||index<0||index>=100)throw Error("Invalid benchmark index");
 const k=index+1,kind=index%5;
 let inputType,outputType,train,hidden,oracle;
 if(kind===0){inputType="text";outputType="text";train=[" A"+k+" ","  B "," C "];hidden=["Hello WORLD "+k," X y ","", " a\tb "];oracle=s=>s.trim().toLowerCase();}
 else if(kind===1){inputType="numbers";outputType="number";train=[[k,k,-1,2],[4,4,-2],[2,3,-5]];hidden=[[3,3,1,-9],[],[-2,-3],[k,k,k]];oracle=a=>[...new Set(a.filter(x=>x>0))].reduce((s,x)=>s+x,0);}
 else if(kind===2){inputType="texts";outputType="texts";train=[["a","b","a"],["b","b","c"],["x"+k,"y","x"+k]];hidden=[[],["a","A","a"],["b","a"],["x","x","x"]];oracle=a=>[...new Set(a)];}
 else if(kind===3){inputType="text";outputType="number";train=["one two","a b c","x"+k];hidden=["", "  one  two ","one two one","a\tb"];oracle=s=>s.trim()?s.trim().split(/\s+/).length:0;}
 else{inputType="numbers";outputType="numbers";train=[[k,0,-1],[3,2,1],[-1,0,2]];hidden=[[3,1,3],[],[-2,-1],[0,3,-4]];oracle=a=>a.slice().sort((x,y)=>x-y);}
 const examples=train.map(a=>({values:[a],expected:oracle(a)}));
 const result=synthesizeData({inputType,outputType,examples,maxDepth:3,budget:256});
 const checks=hidden.map(a=>{const expected=oracle(a);let actual=null;try{if(result.program)actual=runData(result.program,[a]);}catch{}return {expected,actual,passed:JSON.stringify(expected)===JSON.stringify(actual)};});
 return {index,kind,matched:!!result.program,status:result.status,checked:result.checked,passed:checks.filter(x=>x.passed).length,total:checks.length,checks,source:result.source};
}
export function synthesisBenchmark(){
 const rows=Array.from({length:100},(_,i)=>evaluateSynthesis(i));
 return {tasks:rows.length,solved:rows.filter(r=>r.passed===r.total).length,passed:rows.reduce((n,r)=>n+r.passed,0),total:rows.reduce((n,r)=>n+r.total,0),ambiguous:rows.filter(r=>r.status==="ambiguous").length,rows,notice:"Five authored task families, 100 parameterized cases; not a broad independent software engineering benchmark."};
}
