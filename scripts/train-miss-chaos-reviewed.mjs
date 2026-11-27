// Reviewed export -> candidate checkpoint; never deploys or replaces serving weights.
import {readFileSync,writeFileSync} from "node:fs";
import {initModel,train,evaluate,generate} from "../public/miss-chaos-native-core.mjs";
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error("Usage: node scripts/train-miss-chaos-reviewed.mjs reviewed.json output.json");
const d=JSON.parse(readFileSync(input,"utf8"));if(d.schema!=="miss-chaos-reviewed-cc0-v1"||!Array.isArray(d.rows))throw Error("Expected reviewed export");
const unique=new Map();for(const r of d.rows){if(!/^Q[1-9][0-9]{0,14}$/.test(r.entity_id)||r.license!=="CC0-1.0"||r.source_url!=="https://www.wikidata.org/wiki/"+r.entity_id||!r.reviewed_at||typeof r.title!=="string"||typeof r.description!=="string")throw Error("Invalid approved row");if(!unique.has(r.entity_id))unique.set(r.entity_id,["learn",r.title.slice(0,150)+": "+r.description.slice(0,300)]);}
if(unique.size<20||unique.size>200)throw Error("Research experiment requires 20–200 approved entities; larger corpus needs a scalable tokenizer and trainer.");
const rows=[...unique.values()],held=rows.filter((_,i)=>i%5===0),knowledge=rows.filter((_,i)=>i%5!==0),original=JSON.parse(readFileSync(new URL("../training/miss-chaos-original-v1.json",import.meta.url),"utf8")),training=original.filter((_,i)=>i%6!==5).concat(knowledge);
const m=initModel(training,24,491),before=evaluate(m,training);train(m,training,9000,712);for(const key of ["emb","topic","out","bias"])m[key]=m[key].map(x=>+x.toFixed(6));
const after=evaluate(m,training),validation=evaluate(m,held);if(!Number.isFinite(after.loss)||after.loss>=before.loss)throw Error("Training failed to improve");
writeFileSync(output,JSON.stringify({checkpoint:m,metrics:{before,after,heldout:validation,entities:unique.size},sample:generate(m,{topic:"learn"})}),{flag:"wx"});console.log({before,after,heldout:validation,entities:unique.size,promotion:"not approved"});
