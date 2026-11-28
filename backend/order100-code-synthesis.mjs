// Original bounded program synthesis for numeric array transformations. No eval, network, or dependencies.
// Programs are composable typed operations. User examples are data, never executable code.
const arrayOps=Object.freeze({
 even:{f:a=>a.filter(x=>x%2===0),js:"a.filter(x => x % 2 === 0)"},
 odd:{f:a=>a.filter(x=>x%2!==0),js:"a.filter(x => x % 2 !== 0)"},
 positive:{f:a=>a.filter(x=>x>0),js:"a.filter(x => x > 0)"},
 negative:{f:a=>a.filter(x=>x<0),js:"a.filter(x => x < 0)"},
 nonzero:{f:a=>a.filter(x=>x!==0),js:"a.filter(x => x !== 0)"},
 abs:{f:a=>a.map(Math.abs),js:"a.map(Math.abs)"},
 double:{f:a=>a.map(x=>x*2),js:"a.map(x => x * 2)"},
 square:{f:a=>a.map(x=>x*x),js:"a.map(x => x * x)"},
 increment:{f:a=>a.map(x=>x+1),js:"a.map(x => x + 1)"},
 negate:{f:a=>a.map(x=>-x),js:"a.map(x => -x)"},
 ascending:{f:a=>a.slice().sort((x,y)=>x-y),js:"a.slice().sort((x, y) => x - y)"},
 descending:{f:a=>a.slice().sort((x,y)=>y-x),js:"a.slice().sort((x, y) => y - x)"},
 unique:{f:a=>[...new Set(a)],js:"[...new Set(a)]"},
 reverse:{f:a=>a.slice().reverse(),js:"a.slice().reverse()"}
});
const scalarOps=Object.freeze({
 sum:{f:a=>a.reduce((s,x)=>s+x,0),js:"a.reduce((s, x) => s + x, 0)"},
 count:{f:a=>a.length,js:"a.length"},
 min:{f:a=>a.length?Math.min(...a):null,js:"a.length ? Math.min(...a) : null"},
 max:{f:a=>a.length?Math.max(...a):null,js:"a.length ? Math.max(...a) : null"}
});
export const OP_NAMES=Object.freeze([...Object.keys(arrayOps),...Object.keys(scalarOps)]);
const scalar=name=>Object.hasOwn(scalarOps,name);
const op=name=>Object.hasOwn(arrayOps,name)?arrayOps[name]:scalar(name)?scalarOps[name]:null;
const integer=x=>Number.isSafeInteger(x);
const inputOK=a=>Array.isArray(a)&&a.length<=64&&a.every(x=>integer(x)&&Math.abs(x)<=10000);
const resultOK=x=>x===null||integer(x)||Array.isArray(x)&&x.length<=64&&x.every(integer);
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)?a.length===b.length&&a.every((v,i)=>v===b[i]):a===b;
export function validateProgram(program){
 if(!Array.isArray(program)||!program.length||program.length>3||program.some((p,i)=>typeof p!=="string"||!op(p)||scalar(p)&&i!==program.length-1))throw Error("Use one to three known operations; scalar reductions must be last.");
 return program.slice();
}
export function runProgram(program,input){
 const names=validateProgram(program);if(!inputOK(input))throw Error("Expected up to 64 safe integers between -10000 and 10000.");
 let result=input.slice();for(const name of names){result=op(name).f(result);if(!resultOK(result))throw Error("Arithmetic overflow.");}return result;
}
export function emitProgram(program){
 const names=validateProgram(program);
 const lines=["export function solve(input) {","  if (!Array.isArray(input) || input.length > 64 || !input.every(x => Number.isSafeInteger(x) && Math.abs(x) <= 10000)) throw new Error('Invalid input');","  let a = input.slice();"];
 for(const name of names){lines.push("  a = "+op(name).js+";","  if (!(a === null || Number.isSafeInteger(a) || (Array.isArray(a) && a.every(Number.isSafeInteger)))) throw new Error('Arithmetic overflow');");}
 return [...lines,"  return a;","}",""].join("\n");
}
export function parseProgram(text){
 if(typeof text!=="string"||text.length>180)throw Error("Invalid program specification.");
 const alias={"filter even":"even","filter odd":"odd","filter positive":"positive","filter negative":"negative","remove zero":"nonzero","absolute value":"abs","sort ascending":"ascending","sort descending":"descending","deduplicate":"unique","length":"count","minimum":"min","maximum":"max"};
 return validateProgram(text.toLowerCase().split("|").map(s=>s.trim()).map(s=>Object.hasOwn(alias,s)?alias[s]:s));
}
export function validateExamples(examples){
 if(!Array.isArray(examples)||examples.length<3||examples.length>8)throw Error("Provide three to eight input/output examples.");
 const out=examples.map(e=>{if(!e||!inputOK(e.input)||!resultOK(e.output))throw Error("Invalid example.");return {input:e.input.slice(),output:Array.isArray(e.output)?e.output.slice():e.output};});
 const unique=new Map();for(const e of out){const key=JSON.stringify(e.input);if(unique.has(key)&&!equal(unique.get(key),e.output))throw Error("Conflicting expected outputs.");unique.set(key,e.output);}
 if(unique.size<3)throw Error("Provide three distinct input arrays.");
 return out;
}
export function emptyPrior(){return {schema:"order100-code-prior-v1",samples:0,counts:{}};}
export function learnPrograms(programs,prior=emptyPrior()){
 const model=emptyPrior();model.samples=Number.isSafeInteger(prior.samples)&&prior.samples>=0?prior.samples:0;
 for(const [k,v] of Object.entries(prior.counts||{})){if(/^(?:START|[a-z]+)>[a-z]+$/.test(k)&&Number.isSafeInteger(v)&&v>0&&v<=1000000)model.counts[k]=v;}
 if(!Array.isArray(programs)||programs.length>1000)throw Error("Training batch exceeds budget.");
 for(const p of programs){const names=validateProgram(p);let prev="START";for(const name of names){const key=prev+">"+name;model.counts[key]=Math.min(1000000,(model.counts[key]||0)+1);prev=name;}model.samples=Math.min(1000000,model.samples+1);}
 return model;
}
export function programScore(program,prior=emptyPrior()){
 let prev="START",score=0;for(const name of program){const v=prior.counts?.[prev+">"+name];score+=Math.log1p(Number.isSafeInteger(v)&&v>0?Math.min(1000000,v):0);prev=name;}return score/program.length;
}
export function candidates(maxSteps=3,outputKind="array",prior=emptyPrior()){
 if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>3||!["array","scalar"].includes(outputKind))throw Error("Invalid search bounds.");
 const out=[];function walk(prefix){for(const name of OP_NAMES){const p=[...prefix,name];if(scalar(name)){if(outputKind==="scalar")out.push(p);continue;}if(outputKind==="array")out.push(p);if(p.length<maxSteps)walk(p);}}walk([]);
 return out.map(p=>({p,score:programScore(p,prior)})).sort((a,b)=>a.p.length-b.p.length||b.score-a.score||a.p.join("|").localeCompare(b.p.join("|"))).map(x=>x.p);
}
export function synthesize(examples,{maxSteps=3,budget=512,prior=emptyPrior()}={}){
 const rows=validateExamples(examples),kind=Array.isArray(rows[0].output)?"array":"scalar";
 if(rows.some(e=>(Array.isArray(e.output)?"array":"scalar")!==kind))throw Error("Example output types disagree.");
 if(!Number.isInteger(budget)||budget<1||budget>4096)throw Error("Search budget must be 1–4096.");
 const space=candidates(maxSteps,kind,prior),matches=[];let checked=0;
 for(const p of space.slice(0,budget)){checked++;try{if(rows.every(e=>equal(runProgram(p,e.input),e.output)))matches.push(p);}catch{}}
 const first=matches[0];
 const probes=[[],[0],[0,0],[-5,-2],[-3,-3,2,0,1],[5,4,3,2,1],[10000,-10000,0],[1,1,2,2,3]];
 let counterexample=null;
 if(first&&matches.length>1){outer:for(const input of probes){let baseline;try{baseline=runProgram(first,input);}catch{continue;}for(const alternative of matches.slice(1,32)){try{const output=runProgram(alternative,input);if(!equal(baseline,output)){counterexample={input,first:{program:first,output:baseline},alternative:{program:alternative,output}};break outer;}}catch{}}}}
 return {counterexample,status:!first?"no-match":matches.length>1?"ambiguous":"example-match",program:first||null,source:first?emitProgram(first):null,alternatives:matches.slice(1,6),matchingPrograms:matches.length,checked,total:space.length,exhaustive:checked===space.length,externalInference:false,note:"Matches provided examples only; a bounded search cannot prove uniqueness or unsatisfiability. A counterexample distinguishes candidate behavior, not the intended answer. No source was executed or deployed."};
}
export function verifyProgram(program,examples){const rows=validateExamples(examples);return rows.map(e=>{try{const actual=runProgram(program,e.input);return {expected:e.output,actual,passed:equal(actual,e.output)};}catch{return {expected:e.output,actual:null,passed:false};}});}
