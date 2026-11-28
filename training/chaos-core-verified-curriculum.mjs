import {diagnostic} from "../backend/chaos-core-repair.mjs";
const specs=[
["sum of inputs",[{"op":"add","a":0,"b":1}],(x,y)=>x+y],
["difference of inputs",[{"op":"sub","a":0,"b":1}],(x,y)=>x-y],
["product of inputs",[{"op":"mul","a":0,"b":1}],(x,y)=>x*y],
["minimum of inputs",[{"op":"min","a":0,"b":1}],(x,y)=>x<y?x:y],
["maximum of inputs",[{"op":"max","a":0,"b":1}],(x,y)=>x>y?x:y],
["square of sum",[{"op":"add","a":0,"b":1},{"op":"mul","a":2,"b":2}],(x,y)=>(x+y)**2],
["square of difference",[{"op":"sub","a":0,"b":1},{"op":"mul","a":2,"b":2}],(x,y)=>(x-y)**2],
["sum of squares",[{"op":"mul","a":0,"b":0},{"op":"mul","a":1,"b":1},{"op":"add","a":2,"b":3}],(x,y)=>x*x+y*y],
["difference of squares",[{"op":"mul","a":0,"b":0},{"op":"mul","a":1,"b":1},{"op":"sub","a":2,"b":3}],(x,y)=>x*x-y*y],
["product plus first",[{"op":"mul","a":0,"b":1},{"op":"add","a":2,"b":0}],(x,y)=>x*(y+1)],
["product plus second",[{"op":"mul","a":0,"b":1},{"op":"add","a":2,"b":1}],(x,y)=>y*(x+1)],
["product minus first",[{"op":"mul","a":0,"b":1},{"op":"sub","a":2,"b":0}],(x,y)=>x*(y-1)],
["absolute difference",[{"op":"max","a":0,"b":1},{"op":"min","a":0,"b":1},{"op":"sub","a":2,"b":3}],(x,y)=>Math.abs(x-y)],
["double first plus second",[{"op":"add","a":0,"b":0},{"op":"add","a":2,"b":1}],(x,y)=>2*x+y],
["double second plus first",[{"op":"add","a":1,"b":1},{"op":"add","a":2,"b":0}],(x,y)=>2*y+x],
["cube of first",[{"op":"mul","a":0,"b":0},{"op":"mul","a":2,"b":0}],x=>x**3],
["cube of second",[{"op":"mul","a":1,"b":1},{"op":"mul","a":2,"b":1}],(x,y)=>y**3],
["sum times first",[{"op":"add","a":0,"b":1},{"op":"mul","a":2,"b":0}],(x,y)=>x*x+x*y],
["sum times second",[{"op":"add","a":0,"b":1},{"op":"mul","a":2,"b":1}],(x,y)=>y*y+x*y],
["maximum squared",[{"op":"max","a":0,"b":1},{"op":"mul","a":2,"b":2}],(x,y)=>Math.max(x,y)**2]
];
function lesson(index,seed){if(!Number.isInteger(index)||index<0||index>=specs.length||!Number.isInteger(seed)||seed<0||seed>1000000)throw Error("Invalid lesson");const [name,steps,oracle]=specs[index];let state=(seed+1)*7919+index*71;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%41-20;};const used=new Set(),points=[];while(points.length<10){const a=[rand(),rand()],key=a.join(",");if(!used.has(key)){used.add(key);points.push({input:a,output:oracle(...a)||0});}}return {id:"composition-"+index,name,steps:steps.map(s=>({...s})),examples:points.slice(0,6),validation:points.slice(6)};}

function curriculum(){const result={training:[],validation:[],test:[]};for(let i=0;i<specs.length;i++)for(let k=0;k<12;k++){const l=lesson(i,k+100),split=k<8?"training":k<10?"validation":"test";const checks=diagnostic(l.steps,[...l.examples,...l.validation]);if(!checks.every(c=>c.passed))throw Error("Oracle mismatch");result[split].push({id:l.id+"-"+k,classId:i,prompt:"Find a numeric program from these examples: "+JSON.stringify(l.examples),answer:JSON.stringify(l.steps),examples:l.examples,validation:l.validation});}return result;}
export {lesson,curriculum};
