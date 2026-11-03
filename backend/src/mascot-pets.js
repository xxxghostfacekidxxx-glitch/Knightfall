/**
 * Neon Nuisances Sanctuary: first-party, persistent member-owned profile pets.
 * Requires D1 migration 0103_mascot_pets.sql.
 * All mutations bind user_id to a validated Knightfall session.
 */
import {PET_MARKET,PET_ACCESSORIES,MAX_PET_SPECIES,petMarketPrice,petUnlockLevel} from './mascot-collectibles.js';
import {handleMascotAdventures,careQuestProgress,HABITAT_THEMES,HABITAT_DECORATIONS} from './mascot-adventures.js';
import {handleMascotPassport,publicPassportBadges} from './mascot-passport.js';
import {handleMascotRoom} from './mascot-room-api.js';
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
 cost_cinders:PET_MARKET[id][0],unlock_level:PET_MARKET[id][1],
 svg:'/assets/devil-tools/neon-nuisances/'+id+'.svg',
 portrait:'/assets/devil-tools/neon-nuisances/portraits/'+id+'.svg',
 idle:'/assets/devil-tools/neon-nuisances/'+id+'-idle.svg'}));
export const MASCOT_SPECIES = Object.freeze(SPECIES);
const BY_ID=new Map(SPECIES.map(species=>[species.id,species]));
const LIMIT=MAX_PET_SPECIES;
const CARE=Object.freeze({
 feed:{column:'fed_at',seconds:15*60,xp:12,label:'Fed a tasty midnight snack'},
 play:{column:'played_at',seconds:10*60,xp:18,label:'Played a little chaotic game'},
 rest:{column:'rested_at',seconds:20*60,xp:10,label:'Tucked in for an eerie nap'}
});
const ownSelect='SELECT id,user_id,species,nickname,adopted_at,fed_at,played_at,rested_at,experience,featured FROM mascot_pets';
async function petsFor(env,userId,publicView=false){
 const rows=await env.DB.prepare(ownSelect+' WHERE user_id=? ORDER BY featured DESC,adopted_at DESC,id DESC LIMIT 22').bind(userId).all();
 const [gear,rooms,layouts]=await Promise.all([
  env.DB.prepare('SELECT pet_id,slot,sku FROM mascot_equipment WHERE user_id=?').bind(userId).all(),
  env.DB.prepare('SELECT pet_id,theme,decoration FROM mascot_habitats WHERE user_id=?').bind(userId).all(),
  env.DB.prepare('SELECT pet_id,x_percent,y_percent,pose FROM mascot_room_layouts WHERE user_id=?').bind(userId).all()
 ]);
 return (rows.results||[]).map(p=>({...serializePet(p,Date.now(),publicView),
  equipment:(gear.results||[]).filter(g=>Number(g.pet_id)===Number(p.id)).map(g=>({slot:g.slot,sku:g.sku,asset:PET_ACCESSORIES[g.sku]?.asset||''})),
  room:(()=>{const layout=(layouts.results||[]).find(r=>Number(r.pet_id)===Number(p.id));
   return {x:Number(layout?.x_percent??50),y:Number(layout?.y_percent??65),pose:layout?.pose||'idle'};})(),
  habitat:(()=>{const room=(rooms.results||[]).find(r=>Number(r.pet_id)===Number(p.id));
   const theme=HABITAT_THEMES.find(t=>t.id===(room?.theme||'graveyard'))||HABITAT_THEMES[0];
   const decor=HABITAT_DECORATIONS.find(d=>d.id===(room?.decoration||'none'))||HABITAT_DECORATIONS[0];
   return {theme:theme.id,art:theme.art,decoration:decor.id,decoration_art:decor.art};})()}));
}
async function walletFor(env,user){
 await env.DB.prepare("INSERT OR IGNORE INTO user_wallets(user_id,balance) VALUES(?,?)").bind(user.id,
 (user.username==='knightfall'||['admin','moderator','god'].includes(user.role))?1000000:2000).run();
 const row=await env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id=?').bind(user.id).first();
 return Number(row?.balance||0);
}
const shop=Object.values(PET_ACCESSORIES);

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
  nickname:pet.nickname,image:species?.svg||'',portrait:species?.portrait||'',idle:species?.idle||'',
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
  return respond({species:MASCOT_SPECIES,max_owned:LIMIT,accessories:shop,premium_enabled:!!(env.STRIPE_SECRET_KEY&&env.STRIPE_WEBHOOK_SECRET),starter_price:0});
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
  return respond({username:owner.username,pets:await petsFor(env,owner.id,!self),badges:await publicPassportBadges(env,owner.id),own_profile:!!self});
 }
 const user=await getUser(request,env);
 if(!user)return respond({error:'Sign in to use your mascot sanctuary.'},401);
 const adventureResponse=await handleMascotAdventures(request,env,url,user,{json,rateLimit,origin,petLevel,speciesCatalog:MASCOT_SPECIES});
 if(adventureResponse)return adventureResponse;
 const passportResponse=await handleMascotPassport(request,env,url,user,{json,rateLimit,origin});
 if(passportResponse)return passportResponse;
 const roomResponse=await handleMascotRoom(request,env,url,user,{json,rateLimit,origin});
 if(roomResponse)return roomResponse;
 if(path==='/api/mascot-pets/me'&&request.method==='GET'){
  const [pets,bank,inventory]=await Promise.all([petsFor(env,user.id),walletFor(env,user),
    env.DB.prepare('SELECT sku,acquired_at FROM mascot_wardrobe WHERE user_id=? ORDER BY acquired_at DESC').bind(user.id).all()]);
  const level=Math.max(1,...pets.map(x=>x.level));
  return respond({pets,max_owned:LIMIT,wallet_balance:bank,wardrobe:inventory.results||[],
    sanctuary_level:level,accessories:shop,starter_price:0});
 }
 if(!['POST','PATCH','PUT','DELETE'].includes(request.method))return respond({error:'Unsupported pet request.'},405);
 if(!await rateLimit(env,request,'mascot-pet-actions',30,60,user.id))
  return respond({error:'Your sanctuary needs a moment. Try again shortly.'},429);
 let body={};try{body=await request.json()}catch{return respond({error:'Invalid JSON.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid pet request.'},400);
 if(path==='/api/mascot-pets/adopt'&&request.method==='POST'){
  const species=typeof body.species==='string'?BY_ID.get(body.species):null;
  if(!species)return respond({error:'Choose an available sanctuary mascot.'},400);
  const nickname=body.nickname===undefined?species.name:nameOf(body.nickname);
  if(!nickname)return respond({error:'Pet names must be 1–28 simple characters.'},400);
  const pending=await env.DB.prepare("SELECT id FROM mascot_rescue_eggs WHERE user_id=? AND species=? AND status='incubating'").bind(user.id,species.id).first();
  if(pending)return respond({error:'An egg for this species is incubating. Hatch it instead of spending Cinders.'},409);
  const countRow=await env.DB.prepare('SELECT COUNT(*) AS count,MAX(experience) AS max_xp FROM mascot_pets WHERE user_id=?').bind(user.id).first();
  const count=Number(countRow?.count||0),rank=petLevel(countRow?.max_xp||0);
  if(count>=LIMIT)return respond({error:'All 22 species are already in your collection.'},409);
  if(count>0&&rank<species.unlock_level)return respond({error:'Train a companion to level '+species.unlock_level+' before this rescue.'},409);
  const price=petMarketPrice(species.id,count);
  if(price>0&&await walletFor(env,user)<price)return respond({error:'Not enough Cinders. Earn more in the arcade or daily wallet rewards.'},409);
  try{
   await env.DB.prepare('INSERT INTO mascot_acquisitions(user_id,species,nickname,cost_cinders,acquired_at) VALUES(?,?,?,?,?)')
    .bind(user.id,species.id,nickname,price,new Date().toISOString()).run();
  }catch(error){console.warn('mascot_adoption_rejected',String(error).slice(0,160));return respond({error:'Rescue unavailable: already owned, locked, or insufficient Cinders.'},409)}
  const pet=await env.DB.prepare(ownSelect+' WHERE user_id=? AND species=?').bind(user.id,species.id).first();
  return respond({ok:true,pet:serializePet(pet),paid_cinders:price,message:'Welcome home, '+nickname+'!'},201);
 }
 if(path==='/api/mascot-pets/accessories/buy'&&request.method==='POST'){
  const item=typeof body.sku==='string'?PET_ACCESSORIES[body.sku]:null;
  if(!item)return respond({error:'Unknown accessory.'},400);
  if(item.premium)return respond({error:'This premium cosmetic requires verified Stripe checkout.'},400);
  if(await walletFor(env,user)<item.cinders_price)return respond({error:'Not enough Cinders for this accessory.'},409);
  try{await env.DB.prepare('INSERT INTO mascot_item_purchases(user_id,sku,cost_cinders,created_at) VALUES(?,?,?,?)')
   .bind(user.id,item.sku,item.cinders_price,new Date().toISOString()).run();}
  catch(error){console.warn('mascot_accessory_rejected',String(error).slice(0,160));return respond({error:'Accessory already owned, or insufficient Cinders.'},409)}
  return respond({ok:true,sku:item.sku,message:item.name+' added to your wardrobe.'},201);
 }
 const equipment=path.match(/^\/api\/mascot-pets\/(\d+)\/equipment$/);
 if(equipment&&['PUT','DELETE'].includes(request.method)){
  const petId=Number(equipment[1]);
  if(!Number.isSafeInteger(petId)||petId<1)return respond({error:'Invalid pet.'},400);
  const pet=await env.DB.prepare('SELECT id FROM mascot_pets WHERE id=? AND user_id=?').bind(petId,user.id).first();
  if(!pet)return respond({error:'Not your companion.'},404);
  const slot=String(body.slot||'');
  if(!['head','eyes','neck','aura'].includes(slot))return respond({error:'Invalid accessory slot.'},400);
  if(request.method==='DELETE'){
   await env.DB.prepare('DELETE FROM mascot_equipment WHERE user_id=? AND pet_id=? AND slot=?').bind(user.id,petId,slot).run();
   return respond({ok:true,message:'Accessory removed.'});
  }
  const item=typeof body.sku==='string'?PET_ACCESSORIES[body.sku]:null;
  if(!item||item.slot!==slot)return respond({error:'Accessory does not fit that slot.'},400);
  try{await env.DB.prepare(
    'INSERT INTO mascot_equipment(user_id,pet_id,slot,sku,equipped_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,pet_id,slot) DO UPDATE SET sku=excluded.sku,equipped_at=excluded.equipped_at'
   ).bind(user.id,petId,slot,item.sku,new Date().toISOString()).run();}
  catch{return respond({error:'Unlock this accessory in your wardrobe before equipping it.'},409)}
  return respond({ok:true,message:item.name+' equipped.'});
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
  try{await careQuestProgress(env,user.id,id,kind)}catch(error){console.error('sanctuary_quest_progress',error)}
  return respond({ok:true,pet:serializePet(pet),message:rule.label+'! +'+rule.xp+' XP'});
 }
 return respond({error:'Unsupported pet action.'},405);
}
