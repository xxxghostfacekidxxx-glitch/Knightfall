import {readFileSync,writeFileSync} from "node:fs";
import {init,train,evaluate,generate,personas} from "../public/miss-chaos-native-v3.mjs";
const rows=JSON.parse(readFileSync(new URL("../training/miss-chaos-original-v3.json",import.meta.url),"utf8"));
const held=rows.filter((_,i)=>i%6===5),training=rows.filter((_,i)=>i%6!==5),m=init(),before=evaluate(m,held);train(m,training);for(const key of ["e","persona","topic","o","b"])m[key]=m[key].map(x=>+x.toFixed(6));const metrics={experiment:3,trainingRows:training.length,heldoutRows:held.length,parameters:["e","persona","topic","o","b"].reduce((n,k)=>n+m[k].length,0),steps:24000,before,after:evaluate(m,held),training:evaluate(m,training),samples:personas.map((name,i)=>({name,text:generate(m,{persona:i,seed:42+i})}))};
if(!Number.isFinite(metrics.after.loss)||metrics.after.loss>=before.loss)throw Error("evaluation failed");
writeFileSync(new URL("../public/assets/knightfall/miss-chaos/native-model-v3.json",import.meta.url),JSON.stringify({model:m,metrics}));console.log(JSON.stringify(metrics,null,2));
