// Fixed-scope scheduled fallback: no external code execution or private user data.
import {runKnowledgeResearch} from "../backend/src/chaos-knowledge-fleet.mjs";
import {refreshAlienCatalog} from "../backend/src/alien-eyes-core.mjs";
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_D1_TOKEN;
if(!/^[a-f0-9]{32}$/i.test(account||"")||!token)throw Error("D1 credentials unavailable");
const url="https://api.cloudflare.com/client/v4/accounts/"+account+"/d1/database/c64617c2-ac78-44ba-b107-a17e10638a57/query";
async function query(body){const r=await fetch(url,{method:"POST",redirect:"error",headers:{authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error("D1 query failed: HTTP "+r.status);const x=await r.json();if(!x.success||!Array.isArray(x.result)||x.result.some(v=>!v.success))throw Error("D1 query rejected");return x.result;}
function statement(sql,params=[]){return{sql,params,bind(...values){return statement(sql,values);},async first(){return (await query({sql,params}))[0].results?.[0]||null;},async all(){return (await query({sql,params}))[0];},async run(){return (await query({sql,params}))[0];}};}
const env={DB:{prepare:statement,async batch(statements){return query({batch:statements.map(({sql,params})=>({sql,params}))});}}};
const now=Date.now();
const research=await runKnowledgeResearch(env,now,{retryFailed:true});
let catalog;try{catalog=await refreshAlienCatalog(env,now);}catch{catalog={status:"failed"};}
console.log(JSON.stringify({research,catalog}));
if(research.failed>0&&research.completed===0)process.exitCode=1;
