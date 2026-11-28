const ops=[
["x","x","x",x=>x],
["y","y","y",(_,y)=>y],
["negate","-x","-x",x=>-x],
["abs","Math.abs(x)","abs(x)",x=>Math.abs(x)],
["square","x * x","x * x",x=>x*x],
["cube","x * x * x","x * x * x",x=>x*x*x],
["add","x + y","x + y",(x,y)=>x+y],
["subtract","x - y","x - y",(x,y)=>x-y],
["reverse subtract","y - x","y - x",(x,y)=>y-x],
["multiply","x * y","x * y",(x,y)=>x*y],
["minimum","Math.min(x, y)","min(x, y)",(x,y)=>Math.min(x,y)],
["maximum","Math.max(x, y)","max(x, y)",(x,y)=>Math.max(x,y)],
["absolute difference","Math.abs(x - y)","abs(x - y)",(x,y)=>Math.abs(x-y)],
["sum squares","x * x + y * y","x * x + y * y",(x,y)=>x*x+y*y],
["difference squares","x * x - y * y","x * x - y * y",(x,y)=>x*x-y*y],
["even","x % 2 === 0 ? 1 : 0","1 if x % 2 == 0 else 0",x=>Number(x%2===0)],
["positive","x > 0 ? 1 : 0","1 if x > 0 else 0",x=>Number(x>0)],
["sign","Math.sign(x)","(x > 0) - (x < 0)",x=>Math.sign(x)]
];
function catalog(){const a=ops.map(([id,js,py,fn])=>({id,js,py,fn}));for(let k=-10;k<=10;k++){a.push({id:"constant "+k,js:String(k),py:String(k),fn:()=>k},{id:"offset "+k,js:"x + ("+k+")",py:"x + ("+k+")",fn:x=>x+k},{id:"scale "+k,js:"x * ("+k+")",py:"x * ("+k+")",fn:x=>x*k});}for(let k=-5;k<=5;k++)for(let b=-5;b<=5;b++){if(k===0||k===1||b===0)continue;a.push({id:"affine "+k+" "+b,js:"x * ("+k+") + ("+b+")",py:"x * ("+k+") + ("+b+")",fn:x=>x*k+b});}return a;}

function inputs(a){return Array.isArray(a)&&a.length===2&&a.every(x=>Number.isSafeInteger(x)&&Math.abs(x)<=1000);}

function validateRows(rows,min=3){if(!Array.isArray(rows)||rows.length<min||rows.length>16)throw Error("Provide "+min+" to 16 examples");const map=new Map();for(const r of rows){if(!r||!inputs(r.input)||!Number.isSafeInteger(r.output)||Math.abs(r.output)>1000000000)throw Error("Expected two bounded integer inputs and integer output");const k=JSON.stringify(r.input);if(map.has(k)&&map.get(k)!==r.output)throw Error("Conflicting examples");map.set(k,r.output);}if(map.size<min)throw Error("Not enough distinct input pairs");return rows.map(r=>({input:r.input.slice(),output:r.output}));}

function emit(op,language){if(language==="javascript")return "export function solve(x, y = 0) {\n  if (![x, y].every(v => Number.isSafeInteger(v) && Math.abs(v) <= 1000)) throw new Error('Invalid input');\n  return ("+op.js+") || 0;\n}\n";if(language==="python")return "def solve(x, y=0):\n    if any(type(v) is not int or abs(v) > 1000 for v in (x, y)):\n        raise ValueError('Invalid input')\n    return "+op.py+"\n";throw Error("Language must be javascript or python");}

function run(op,pair){if(!inputs(pair))throw Error("Invalid input pair");const r=op.fn(...pair);if(!Number.isSafeInteger(r))throw Error("Invalid arithmetic result");return Object.is(r,-0)?0:r;}

function probes(){return [[0,0],[1,2],[-1,3],[2,-3],[-4,-2],[7,0],[0,9],[11,-7],[-1000,1000],[1000,-1000],[5,5],[-5,-5]];}

function synthesizeScalar(request){if(!request||typeof request!=="object"||Array.isArray(request))throw Error("Object required");const language=request.language??"javascript";if(!["javascript","python"].includes(language))throw Error("Unsupported language");const examples=validateRows(request.examples),validation=request.validation===undefined?[]:validateRows(request.validation,1);const keys=new Set(examples.map(r=>JSON.stringify(r.input)));if(validation.some(r=>keys.has(JSON.stringify(r.input))))throw Error("Validation inputs must be distinct from training inputs");const all=catalog(),matches=all.filter(op=>examples.every(r=>run(op,r.input)===r.output)),verified=matches.filter(op=>validation.every(r=>run(op,r.input)===r.output));const first=verified[0];let counterexample=null;if(first){outer:for(const input of probes())for(const other of verified.slice(1)){const a=run(first,input),b=run(other,input);if(a!==b){counterexample={input,first:{operation:first.id,output:a},alternative:{operation:other.id,output:b}};break outer;}}}const ambiguous=verified.length>1;return {status:!first?"no-match":ambiguous?"ambiguous":"example-match",language,operation:first?.id??null,source:first?emit(first,language):null,trainingMatches:matches.length,validationMatches:verified.length,candidates:all.length,trainingCases:examples.length,validationCases:validation.length,validationPassed:first?validation.length:0,alternatives:verified.slice(1,6).map(x=>x.id),counterexample,externalInference:false,notice:"Bounded scalar grammar; interpreter evaluated typed candidates against examples. Emitted source was not executed by this request. Multiple candidates may be equivalent or diverge outside tested inputs."};}

function curriculum(index){if(!Number.isSafeInteger(index)||index<0||index>=100)throw Error("Invalid learner");const k=index%9-4,b=Math.floor(index/9)%9-4,kind=index%10;let oracle;switch(kind){case 0:oracle=(x,y)=>x+y;break;case 1:oracle=(x,y)=>x-y;break;case 2:oracle=(x,y)=>x*y;break;case 3:oracle=(x,y)=>x<y?x:y;break;case 4:oracle=(x,y)=>x>y?x:y;break;case 5:oracle=x=>x*x;break;case 6:oracle=(x,y)=>Math.sqrt((x-y)**2);break;case 7:oracle=x=>k*x+b;break;case 8:oracle=x=>x+k;break;default:oracle=x=>x*k;}const points=[[-8,3],[0,-4],[2,7],[5,-2],[-3,-6],[9,1]].map(([x,y],i)=>[x+index%3,y+(index+i)%4]);const checks=[[-19,11],[17,-13],[0,0],[-1,-1],[101,-99],[-1000,1000]].filter(p=>!points.some(x=>x[0]===p[0]&&x[1]===p[1]));return {agent:"mc-"+String(index+1).padStart(2,"0"),examples:points.map(input=>({input,output:oracle(...input)})),validation:checks.map(input=>({input,output:oracle(...input)}))};}

function peerBenchmark(round=0){if(!Number.isSafeInteger(round)||round<0)throw Error("Invalid round");const reports=[];for(let i=0;i<100;i++){const teacher=(i+1+round%99)%100,lesson=curriculum(teacher),r=synthesizeScalar({examples:lesson.examples,validation:lesson.validation,language:i%2?"python":"javascript"});reports.push({learner:curriculum(i).agent,teacher:lesson.agent,operation:r.operation,language:r.language,passed:r.validationPassed,tests:r.validationCases,status:r.status,verified:!!r.source&&r.validationPassed===r.validationCases});}return {round,learners:100,verified:reports.filter(r=>r.verified).length,cases:reports.reduce((n,r)=>n+r.tests,0),passed:reports.reduce((n,r)=>n+r.passed,0),ambiguous:reports.filter(r=>r.status==="ambiguous").length,reports,externalInference:false,method:"simulated peer exercise rotation, not live agent activity or neural training"};}
export {catalog,synthesizeScalar,curriculum,peerBenchmark};
