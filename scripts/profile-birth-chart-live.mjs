// Read-only production checks. Signed-in lifecycle certification is deliberately separate.
import assert from 'node:assert/strict';
const base=process.env.KNIGHTFALL_API||'https://api.ash-fall.com';
for(const [path,status,validate] of [
 ['/health',200,data=>assert.equal(data.database,true)],
 ['/api/auth/me',200,data=>assert.equal(data.user,null)],
 ['/api/profile/birth-chart',401,data=>assert.equal(typeof data.error,'string')],
 ['/api/categories',200,data=>{
  console.log('Category gate evidence:',JSON.stringify({locked:data.adult_category_locked,astrology:data.categories?.some(c=>c.slug==='astrology'),adult:data.categories?.some(c=>c.slug==='adults-only'),keys:Object.keys(data)}));
  assert.equal(data.adult_category_locked,true,'Anonymous adult gate must be locked');
  assert.ok(data.categories.some(c=>c.slug==='astrology'),'Astrology category must exist');
  assert.ok(!data.categories.some(c=>c.slug==='adults-only'),'Adult category must not be disclosed to anonymous visitors');
 }],
 ['/api/adult/status',401,data=>assert.equal(typeof data.error,'string')]
]){
 const response=await fetch(base+path,{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
 console.log(path+' HTTP '+response.status);
 assert.equal(response.status,status,path+' unexpected HTTP status');
 const type=response.headers.get('content-type')||'';assert.ok(type.includes('application/json'),path+' must return JSON, received '+type);
 validate(await response.json());
}
for(const asset of ['profile.html','profile-edit.html','profile.js']){
 const response=await fetch('https://ash-fall.com/'+asset,{method:'HEAD',signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,asset+' is not publicly accessible');
 console.log(asset+' HTTP '+response.status);
}
console.log('Read-only birth-chart production checks passed. Signed-in lifecycle is not certified by this check.');
