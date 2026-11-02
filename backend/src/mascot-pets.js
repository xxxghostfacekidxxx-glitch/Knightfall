/**
 * Neon Nuisances Sanctuary: first-party, persistent member-owned profile pets.
 * Requires D1 migration 0103_mascot_pets.sql.
 * All mutations bind user_id to a validated Knightfall session.
 */
const SPECIES = [
 ['moxie','Vexwing','moth'],['bloop','Gillrot','axolotl'],
 ['pippa','Hexgourd','pumpkin'],['nib','Nocturnib','bat'],
 ['glim','Cryptglow','ghost'],['zuzu','Sludgebyte','slime'],
 ['kiki','Riotpaws','cat'],['emberbun','Cinderfang','rabbit'],
 ['gravebyte','Gravebyte','robot'],['statichex','Statichex','alien'],
 ['rattlepop','Rattlepop','coffin ghoul'],['thornriot','Thornriot','cyclops'],
 ['volt-imp','Volt Imp','electric imp'],['crypt-koi','Crypt Koi','spectral koi'],
 ['casket-pup','Casket Pup','undead pup'],['void-sprout','Void Sprout','plant'],
 ['minion-mouse','Minion Mouse','punk mouse'],['mini-villain','Mini Villain','villain'],
 ['mini-eddie','The Eddie','guardian'],['gutterkit','Gutterkit','alley cat'],
 ['chunky-monkey','Chunky Monkey','monkey'],['boo-thang','Boo Thang','ghost'],
].map(([id,name,type])=>({id,name,type,
 svg:'/assets/devil-tools/neon-nuisances/'+id+'.svg',
 idle:'/assets/devil-tools/neon-nuisances/'+id+'-idle.svg'}));
export const MASCOT_SPECIES = Object.freeze(SPECIES);
const BY_ID=new Map(SPECIES.map(species=>[species.id,species]));
const LIMIT=6;
const CARE=Object.freeze({
 feed:{column:'fed_at',seconds:15*60,xp:12,label:'Fed a tasty midnight snack'},
 play:{column:'played_at',seconds:10*60,xp:18,label:'Played a little chaotic game'},
 rest:{column:'rested_at',seconds:20*60,xp:10,label:'Tucked in for an eerie nap'}
});
const ownSelect='SELECT id,user_id,species,nickname,adopted_at,fed_at,played_at,rested_at,experience,featured FROM mascot_pets';
export function petLevel(experience){return 1+Math.floor(Math.sqrt(Math.max(0,Number(experience)||0)/40));}
export function petVitals(pet,now=Date.now()){
 const ago=(stamp,baseline=pet.adopted_at)=>{
  const t=Date.parse(stamp||baseline);
  return Number.isFinite(t)?Math.max(0,(now-t)/3600000):0;
 };
 const meter=(stamp,loss)=>Math.max(15,Math.min(100,Math.floor(90-ago(stamp)*loss)));
 return {hunger:meter(pet.fed_at,3.4),joy:meter(pet.played_at,4.2),energy:meter(pet.rested_at,2.8)};
}
export function serializePet(pet,now=Date.now(),publicView=false){
 const species=BY_ID.get(pet.species);
 const experience=Number(pet.experience)||0;
 const base={id:Number(pet.id),species:pet.species,species_name:species?.name||pet.species,
  nickname:pet.nickname,image:species?.svg||'',idle:species?.idle||'',
  level:petLevel(experience),featured:!!pet.featured,adopted_at:pet.adopted_at};
 return publicView?base:{...base,experience,vitals:petVitals(pet,now),
  next_care:Object.fromEntries(Object.entries(CARE).map(([key,rule])=>{
   const at=pet[rule.column]?Date.parse(pet[rule.column])+rule.seconds*1000:0;
   return [key,Number.isFinite(at)?Math.max(0,at-now):0];
  }))};
}
function nameOf(value){
 if(typeof value!=='string')return null;
 const clean=value.replace(/\s+/g,' ').trim();
 if(clean.length<1||clean.length>28||!/^[\p{L}\p{N}][\p{L}\p{N} ._'!?-]*$/u.test(clean))return null;
 return clean;
}
export async function handleMascotPets(request,env,url,{getUser,json,rateLimit,origin}){
 const path=url.pathname;
 if(!path.startsWith('/api/mascot-pets'))return null;
 const respond=(v,s=200)=>json(v,s,origin);
 if(path==='/api/mascot-pets/catalog'&&request.method==='GET')
  return respond({species:MASCOT_SPECIES,max_owned:LIMIT,adoption_cost:0});
 const pub=path.match(/^\/api\/mascot-pets\/profile\/([a-zA-Z0-9_-]{1,32})$/);
 if(pub&&request.method==='GET'){
  const owner=await env.DB.prepare(
   "SELECT id,username,profile_visibility,status FROM users WHERE username=? COLLATE NOCASE AND status='active'"
  ).bind(pub[1]).first();
  if(!owner)return respond({error:'Profile not found.'},404);
  const viewer=await getUser(request,env),self=viewer&&Number(viewer.id)===Number(owner.id);
  const staff=viewer&&['moderator','admin','god'].includes(viewer.role);
  if(!self&&!staff){
   const blocked=viewer?await env.DB.prepare(
    'SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) UNION SELECT 1 FROM social_user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1'
   ).bind(viewer.id,owner.id,owner.id,viewer.id,viewer.id,owner.id,owner.id,viewer.id).first():null;
   if(blocked||owner.profile_visibility==='private')return respond({error:'Profile not found.'},404);
   if(owner.profile_visibility==='friends'){
    if(!viewer)return respond({error:'Sign in to view this profile.'},401);
    const friend=await env.DB.prepare(
     "SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1"
    ).bind(viewer.id,owner.id,owner.id,viewer.id).first();
    if(!friend)return respond({error:'Profile unavailable.'},403);
   }
  }
  const results=await env.DB.prepare(ownSelect+' WHERE user_id=? ORDER BY featured DESC,adopted_at DESC,id DESC LIMIT 6').bind(owner.id).all();
  return respond({username:owner.username,pets:(results.results||[]).map(x=>serializePet(x,Date.now(),!self)),own_profile:!!self});
 }
 const user=await getUser(request,env);
 if(!user)return respond({error:'Sign in to use your mascot sanctuary.'},401);
 if(path==='/api/mascot-pets/me'&&request.method==='GET'){
  const found=await env.DB.prepare(ownSelect+' WHERE user_id=? ORDER BY featured DESC,adopted_at DESC,id DESC LIMIT 6').bind(user.id).all();
  return respond({pets:(found.results||[]).map(x=>serializePet(x)),max_owned:LIMIT,adoption_cost:0});
 }
 if(!['POST','PATCH','PUT'].includes(request.method))return respond({error:'Unsupported pet request.'},405);
 if(!await rateLimit(env,request,'mascot-pet-actions',30,60,user.id))
  return respond({error:'Your sanctuary needs a moment. Try again shortly.'},429);
 let body={};try{body=await request.json()}catch{return respond({error:'Invalid JSON.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid pet request.'},400);
 if(path==='/api/mascot-pets/adopt'&&request.method==='POST'){
  const species=typeof body.species==='string'?BY_ID.get(body.species):null;
  if(!species)return respond({error:'Choose an available sanctuary mascot.'},400);
  const nickname=body.nickname===undefined?species.name:nameOf(body.nickname);
  if(!nickname)return respond({error:'Pet names must be 1–28 simple characters.'},400);
  const added=await env.DB.prepare(
   'INSERT INTO mascot_pets(user_id,species,nickname,adopted_at,featured) '+
   'SELECT ?,?,?,?,CASE WHEN NOT EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=?) THEN 1 ELSE 0 END '+
   'WHERE (SELECT COUNT(*) FROM mascot_pets WHERE user_id=?) < ? '+
   'AND NOT EXISTS(SELECT 1 FROM mascot_pets WHERE user_id=? AND species=?) RETURNING *'
  ).bind(user.id,species.id,nickname,new Date().toISOString(),user.id,user.id,LIMIT,user.id,species.id).first();
  if(!added)return respond({error:'This species is already yours, or your six pet slots are full.'},409);
  return respond({ok:true,pet:serializePet(added),message:'Welcome home, '+nickname+'!'},201);
 }
 const match=path.match(/^\/api\/mascot-pets\/(\d+)\/(care|nickname|feature)$/);
 if(!match)return respond({error:'Unknown pet action.'},404);
 const id=Number(match[1]);if(!Number.isSafeInteger(id)||id<=0)return respond({error:'Invalid pet.'},400);
 const existing=await env.DB.prepare(ownSelect+' WHERE id=? AND user_id=?').bind(id,user.id).first();
 if(!existing)return respond({error:'Your mascot was not found.'},404);
 const action=match[2];
 if(action==='nickname'&&request.method==='PATCH'){
  const nickname=nameOf(body.nickname);
  if(!nickname)return respond({error:'Pet names must be 1–28 simple characters.'},400);
  const pet=await env.DB.prepare('UPDATE mascot_pets SET nickname=? WHERE id=? AND user_id=? RETURNING *').bind(nickname,id,user.id).first();
  return respond({ok:true,pet:serializePet(pet)});
 }
 if(action==='feature'&&request.method==='PUT'){
  await env.DB.batch([
   env.DB.prepare('UPDATE mascot_pets SET featured=0 WHERE user_id=? AND featured=1').bind(user.id),
   env.DB.prepare('UPDATE mascot_pets SET featured=1 WHERE user_id=? AND id=?').bind(user.id,id)
  ]);
  const pet=await env.DB.prepare(ownSelect+' WHERE id=? AND user_id=?').bind(id,user.id).first();
  return respond({ok:true,pet:serializePet(pet)});
 }
 if(action==='care'&&request.method==='POST'){
  const kind=String(body.action||''),rule=CARE[kind];
  if(!rule)return respond({error:'Choose feed, play, or rest.'},400);
  const now=Date.now(),stamp=new Date(now).toISOString(),cutoff=new Date(now-rule.seconds*1000).toISOString();
  const pet=await env.DB.prepare(
   'UPDATE mascot_pets SET '+rule.column+'=?,experience=MIN(experience+?,500000) WHERE id=? AND user_id=? AND ('+rule.column+' IS NULL OR '+rule.column+'<=?) RETURNING *'
  ).bind(stamp,rule.xp,id,user.id,cutoff).first();
  if(!pet){
   const current=await env.DB.prepare(ownSelect+' WHERE id=? AND user_id=?').bind(id,user.id).first();
   return respond({error:'Your companion needs a short cooldown.',pet:serializePet(current)},429);
  }
  return respond({ok:true,pet:serializePet(pet),message:rule.label+'! +'+rule.xp+' XP'});
 }
 return respond({error:'Unsupported pet action.'},405);
}
