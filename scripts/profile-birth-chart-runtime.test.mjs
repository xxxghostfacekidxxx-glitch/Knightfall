import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Wrangler bundles JSON in the unrelated archive-download module. Stub only that
// handler for Node; all authentication, validation, chart calculation and SQL below
// execute directly from the production Worker source.
const workerUrl=new URL('../backend/src/index.js',import.meta.url);
const source=readFileSync(workerUrl,'utf8')
 .replace("import { serveAdminGameArchive } from './admin-game-downloads.js';", "const serveAdminGameArchive=()=>{throw Error('Archive handler is outside this test')};")
 .replace(/from "(\.\/[^"]+)"/g,(_,file)=>'from '+JSON.stringify(new URL(file,workerUrl).href));
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

// Exercise the real Worker handler with isolated test storage; no production accounts or records.
function fixture(){
 const charts=new Map(),kv=new Map();
 for(const [token,id] of [['owner',1],['other',2]])kv.set('session:'+token,JSON.stringify({user_id:id,expires_at:Date.now()+60000}));
 const env={SESSIONS:{async get(key,type){const value=kv.get(key)??null;return type==='json'&&value?JSON.parse(value):value;},async put(key,value){kv.set(key,value);},async delete(key){kv.delete(key);}},DB:{prepare(sql){let values=[];return {
  bind(...args){values=args;return this;},
  async first(){
   if(sql.includes('FROM site_settings'))return {value:'false'};
   if(sql.includes('FROM users WHERE id = ?'))return {id:values[0],username:'test-'+values[0],role:'member',status:'active'};
   if(sql.includes('FROM profile_birth_charts'))return charts.get(values[0])??null;
   throw Error('Unexpected test query: '+sql);
  },
  async run(){
   if(sql.startsWith('INSERT INTO profile_birth_charts'))charts.set(values[0],{visible:values[1],chart_json:values[2]});
   else if(sql.startsWith('DELETE FROM profile_birth_charts'))charts.delete(values[0]);
   else throw Error('Unexpected test mutation: '+sql);
   return {success:true};
  }
 };}}};
 async function request(method='GET',body,token='owner',origin='https://ash-fall.com'){
  const headers={'Origin':origin};if(token)headers.Cookie='knightfall_session='+token;
  if(body!==undefined)headers['content-type']='application/json';
  const response=await worker.fetch(new Request('https://api.ash-fall.com/api/profile/birth-chart',{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),env,{waitUntil(){}});
  return {status:response.status,data:await response.json()};
 }
 return {charts,request};
}
const input={visible:false,utc:'1990-06-15T12:00:00Z',latitude:41.59,longitude:-93.62,house_system:'equal'};
test('owner calculates, saves privately, publishes, hides, and deletes a chart',async()=>{
 const {request,charts}=fixture();
 assert.deepEqual((await request()).data,{visible:false,chart:null});
 const saved=await request('PUT',input);assert.equal(saved.status,200);assert.equal(saved.data.visible,false);assert.ok(saved.data.chart.bodies.Sun);
 const stored=JSON.parse(charts.get(1).chart_json);for(const key of ['utc','latitude','longitude'])assert.equal(key in stored,false);
 assert.equal((await request('PUT',{visible:true})).data.visible,true);
 assert.deepEqual((await request()).data.chart,saved.data.chart);
 assert.equal((await request('PUT',{visible:false})).data.visible,false);
 assert.equal((await request('DELETE')).status,200);assert.equal(charts.size,0);assert.equal((await request()).data.chart,null);
});
test('anonymous, expired, and cross-origin requests cannot mutate charts',async()=>{
 const {request,charts}=fixture();
 for(const method of ['GET','PUT','DELETE'])assert.equal((await request(method,method==='PUT'?input:undefined,null)).status,401);
 assert.equal((await request('PUT',input,'missing-session')).status,401);
 assert.equal((await request('PUT',input,'owner','https://attacker.invalid')).status,403);assert.equal(charts.size,0);
});
test('member-supplied user IDs cannot read, overwrite, or delete another owner chart',async()=>{
 const {request,charts}=fixture();await request('PUT',input);
 assert.equal((await request('GET',undefined,'other')).data.chart,null);
 assert.equal((await request('PUT',{visible:true,user_id:1},'other')).status,400);
 await request('PUT',{...input,user_id:1},'other');assert.equal(charts.size,2);assert.equal(charts.get(1).visible,0);
 await request('DELETE',{user_id:1},'other');assert.equal(charts.size,1);assert.ok(charts.has(1));
});
test('invalid date, coordinates, house system, and visibility never save a chart',async()=>{
 const {request,charts}=fixture();
 for(const patch of [{utc:'invalid'},{latitude:91},{longitude:181},{house_system:'unsupported'},{visible:'true'}])assert.equal((await request('PUT',{...input,...patch})).status,400);
 assert.equal(charts.size,0);assert.equal((await request('PUT',{visible:true})).status,400);
});
