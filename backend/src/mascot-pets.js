/**
 * Neon Nuisances Sanctuary: first-party, persistent member-owned profile pets.
 * Requires D1 migration 0103_mascot_pets.sql.
 * All mutations bind user_id to a validated Knightfall session.
 */
import {PET_MARKET,PET_ACCESSORIES,MAX_PET_SPECIES,petMarketPrice,petUnlockLevel} from './mascot-collectibles.js';
import {handleMascotAdventures,careQuestProgress,HABITAT_THEMES,HABITAT_DECORATIONS} from './mascot-adventures.js';
import {handleMascotPassport,publicPassportBadges} from './mascot-passport.js';
import {handleMascotRoom} from './mascot-room-api.js';
import {handleMascotFurniture,FURNITURE} from './mascot-furniture.js';
export const SPECIES_PERSONALITIES=Object.freeze({
 moxie:['Curious','Moonlight and abandoned lanterns','A velvet-winged scout who finds the beauty in forgotten places.'],
 bloop:['Mischievous','Shimmering puddles','A gilled little troublemaker who treats every pool as a portal.'],
 pippa:['Cheerful','Autumn nights','A jack-o-lantern prankster with a heart bigger than its grin.'],
 nib:['Shy','Quiet corners','This tiny night watcher hears secrets before anyone else.'],
 glim:['Gentle','Glow-in-the-dark trinkets','A wandering ghost whose lantern always guides friends home.'],
 zuzu:['Chaotic','Strange experiments','A bouncing puddle of glitches with extremely questionable ideas.'],
 kiki:['Fearless','Rooftop adventures','A streetwise cat with sharp claws and fierce loyalty.'],
 emberbun:['Energetic','Warm sparks','A fiery little hopper who races every sunrise.'],
 gravebyte:['Analytical','Puzzles and signals','A lost machine looking for meaning among the living.'],
 statichex:['Unpredictable','Cosmic static','An extraterrestrial signal that grew legs and opinions.'],
 rattlepop:['Playful','Spooky treats','A cheerful coffin ghoul obsessed with ridiculous surprises.'],
 thornriot:['Stubborn','Untamed gardens','A one-eyed guardian who grows stronger after every storm.'],
 'volt-imp':['Hyperactive','Lightning storms','A crackling imp who never walks if it can zip.'],
 'crypt-koi':['Serene','Moonlit water','A spectral swimmer that brings calm to the chaos.'],
 'casket-pup':['Loyal','Old graveyards','A brave little hound who refuses to leave a friend behind.'],
 'void-sprout':['Patient','Eclipses and starlight','A tiny bloom from the dark spaces between stars.'],
 'minion-mouse':['Clever','Secret tunnels','A mastermind small enough to fit through your plans.'],
 'mini-villain':['Dramatic','Elaborate schemes','A pint-sized schemer whose evil speeches are longer than the schemes.'],
 'mini-eddie':['Protective','Midnight patrols','A little guardian who keeps watch when everyone else sleeps.'],
 gutterkit:['Scrappy','Treasure hunting','An alley cat who can turn yesterday’s junk into tomorrow’s treasure.'],
 'chunky-monkey':['Affectionate','Jungle games','A lovable troublemaker who turns every room into a playground.'],
 'boo-thang':['Romantic','Ghost stories','A mischievous spirit who is always haunting someone’s heart.'],
 lydibug:['Sunny','Garden lanterns and star stickers','A bright little beetle whose spotted wings glow like tiny lanterns.'],
 sootsnoot:['Resourceful','Warm stones and lost buttons','A soot-soft badger who turns scraps and cinders into clever little treasures.'],
 rumblefluff:['Bouncy','Thunderstorms and soft blankets','A cloud-wool lamb who stores gentle thunder in its curled horns.'],
 glittergob:['Mischievous','Shiny rocks and secret pockets','A pocket-sized crystal goblin who collects bright things and shares the best ones.'],
 craggle:['Steadfast','Moonlit rooftops and old stone','A small gargoyle guardian with a brave heart and glowing runic freckles.'],
 prismare:['Dreamy','Rainbows and deep-sea lights','A floating prism jelly who paints the dark with shifting ribbons of color.']
});
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
 ['lydibug','Lydibug','starlight beetle'],['sootsnoot','Sootsnoot','ember badger'],
 ['rumblefluff','Rumblefluff','storm lamb'],['glittergob','Glittergob','crystal goblin'],
 ['craggle','Craggle','moonstone gargoyle'],['prismare','Prismare','prism jelly'],
].map(([id,name,type])=>({id,name,type,
  temperament:SPECIES_PERSONALITIES[id][0],favorite:SPECIES_PERSONALITIES[id][1],lore:SPECIES_PERSONALITIES[id][2],
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
const INTERACTIONS=Object.freeze({
 talk:{column:'talked_at',seconds:20*60,bond:8},
 cuddle:{column:'cuddled_at',seconds:45*60,bond:12},
 groom:{column:'groomed_at',seconds:3*60*60,bond:15}
});
const ownSelect='SELECT id,user_id,species,nickname,adopted_at,fed_at,played_at,rested_at,experience,featured,bond_experience,talked_at,cuddled_at,groomed_at FROM mascot_pets';
async function petsFor(env,userId,publicView=false){
 const rows=await env.DB.prepare(ownSelect+' WHERE user_id=? ORDER BY featured DESC,adopted_at DESC,id DESC LIMIT 22').bind(userId).all();
 const [gear,rooms,layouts,furniture]=await Promise.all([
  env.DB.prepare('SELECT pet_id,slot,sku FROM mascot_equipment WHERE user_id=?').bind(userId).all(),
  env.DB.prepare('SELECT pet_id,theme,decoration FROM mascot_habitats WHERE user_id=?').bind(userId).all(),
  env.DB.prepare('SELECT pet_id,x_percent,y_percent,pose FROM mascot_room_layouts WHERE user_id=?').bind(userId).all(),
  env.DB.prepare('SELECT pet_id,item_key,x_pct,y_pct,flipped FROM mascot_room_furniture_placements WHERE user_id=?').bind(userId).all()
 ]);
 return (rows.results||[]).map(p=>({...serializePet(p,Date.now(),publicView),
  equipment:(gear.results||[]).filter(g=>Number(g.pet_id)===Number(p.id)).map(g=>({slot:g.slot,sku:g.sku,asset:PET_ACCESSORIES[g.sku]?.asset||''})),
  furniture:(furniture.results||[]).filter(g=>Number(g.pet_id)===Number(p.id)).map(g=>({key:g.item_key,x:Number(g.x_pct),y:Number(g.y_pct),flipped:!!g.flipped,art:FURNITURE.find(f=>f.key===g.item_key)?.art||''})),
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
export function petMood(vitals){
 const food=Number(vitals?.hunger??90),joy=Number(vitals?.joy??90),energy=Number(vitals?.energy??90);
 if(energy<=40)return {id:'sleepy',label:'Sleepy',tip:'A restful nap would help.'};
 if(food<=40)return {id:'hungry',label:'Snack hunter',tip:'Ready for a midnight snack.'};
 if(joy<=40)return {id:'bored',label:'Restless',tip:'Play a game together.'};
 if(Math.min(food,joy,energy)>=75)return {id:'radiant',label:'Thriving',tip:'Feeling fabulous and full of trouble.'};
 return {id:'content',label:'Content',tip:'Happy to be hanging out with you.'};
}
export function petBond(level){
 if(level>=8)return {id:'inseparable',label:'Inseparable'};
 if(level>=5)return {id:'best-friends',label:'Best friends'};
 if(level>=3)return {id:'trusted',label:'Trusted companion'};
 if(level>=2)return {id:'familiar',label:'Getting acquainted'};
 return {id:'new',label:'Newly rescued'};
}
export function petRelationship(experience){
 const xp=Math.max(0,Number(experience)||0);
 const stages=[
  {id:'new',label:'New little friend',floor:0,next:60},
  {id:'familiar',label:'Familiar face',floor:60,next:220},
  {id:'trusted',label:'Trusted buddy',floor:220,next:600},
  {id:'best-friends',label:'Best friends',floor:600,next:1500},
  {id:'inseparable',label:'Inseparable',floor:1500,next:null}
 ];
 const stage=[...stages].reverse().find(item=>xp>=item.floor)||stages[0];
 return {id:stage.id,label:stage.label,experience:xp,progress:stage.next===null?100:Math.min(100,Math.floor((xp-stage.floor)/(stage.next-stage.floor)*100)),next_at:stage.next};
}
export function serializePet(pet,now=Date.now(),publicView=false){
 const species=BY_ID.get(pet.species);
 const experience=Number(pet.experience)||0;
 const base={id:Number(pet.id),species:pet.species,species_name:species?.name||pet.species,
  nickname:pet.nickname,image:species?.svg||'',portrait:species?.portrait||'',idle:species?.idle||'',
  level:petLevel(experience),featured:!!pet.featured,adopted_at:pet.adopted_at,
  temperament:species?.temperament||'Curious',favorite:species?.favorite||'',lore:species?.lore||''};
 const currentLevel=base.level,previousXP=40*(currentLevel-1)**2,nextXP=40*currentLevel**2;
 const vitals=petVitals(pet,now);
 return publicView?{...base,bond:petBond(currentLevel)}:{...base,experience,vitals,mood:petMood(vitals),bond:petBond(currentLevel),relationship:petRelationship(pet.bond_experience),
  level_progress:{earned:Math.max(0,experience-previousXP),needed:nextXP-previousXP,next_level_xp:nextXP},
  // Last known moments reuse existing care timestamps; this is private owner data.
  last_moments:[['rescued',pet.adopted_at],['fed',pet.fed_at],['played',pet.played_at],['rested',pet.rested_at],['talked',pet.talked_at],['cuddled',pet.cuddled_at],['groomed',pet.groomed_at]]
   .filter(([,at])=>typeof at==='string'&&Number.isFinite(Date.parse(at)))
   .map(([kind,at])=>({kind,at})).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,5),

  next_care:Object.fromEntries(Object.entries(CARE).map(([key,rule])=>{
   const at=pet[rule.column]?Date.parse(pet[rule.column])+rule.seconds*1000:0;
   return [key,Number.isFinite(at)?Math.max(0,at-now):0];
  })),next_interaction:Object.fromEntries(Object.entries(INTERACTIONS).map(([key,rule])=>{
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
 const furnitureResponse=await handleMascotFurniture(request,env,url,user,{json,rateLimit,origin,petLevel});
 if(furnitureResponse)return furnitureResponse;
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
 if(path==='/api/mascot-pets/care-all'&&request.method==='POST'){
  const kind=typeof body.action==='string'?body.action:'',rule=CARE[kind];
  if(!rule)return respond({error:'Choose feed, play, or rest for your companions.'},400);
  const stamp=new Date().toISOString(),cutoff=new Date(Date.now()-rule.seconds*1000).toISOString();
  // One conditional D1 update for the entire collection: no per-pet browser request
  // flood, no double XP for cooldowns, and always scoped to the authenticated owner.
  const updated=await env.DB.prepare(
   'UPDATE mascot_pets SET '+rule.column+'=?,experience=MIN(experience+?,500000) WHERE user_id=? AND ('+rule.column+' IS NULL OR '+rule.column+'<=?) RETURNING id'
  ).bind(stamp,rule.xp,user.id,cutoff).all();
  const changed=(updated.results||[]).map(row=>Number(row.id)).filter(id=>Number.isSafeInteger(id)&&id>0);
  for(const id of changed){
   try{await careQuestProgress(env,user.id,id,kind)}
   catch(error){console.error('sanctuary_bulk_quest_progress',error)}
  }
  return respond({ok:true,action:kind,cared_for:changed.length,xp_awarded:changed.length*rule.xp,
   message:changed.length?'Cared for '+changed.length+' companions! Each earned '+rule.xp+' XP.':'Everyone is on cooldown for '+kind+'.'});
 }
 if(path==='/api/mascot-pets/adopt'&&request.method==='POST'){
  const species=typeof body.species==='string'?BY_ID.get(body.species):null;
  if(!species)return respond({error:'Choose an available sanctuary mascot.'},400);
  const nickname=body.nickname===undefined?species.name:nameOf(body.nickname);
  if(!nickname)return respond({error:'Pet names must be 1–28 simple characters.'},400);
  const pending=await env.DB.prepare("SELECT id FROM mascot_rescue_eggs WHERE user_id=? AND species=? AND status='incubating'").bind(user.id,species.id).first();
  if(pending)return respond({error:'An egg for this species is incubating. Hatch it instead of spending Cinders.'},409);
  const countRow=await env.DB.prepare('SELECT COUNT(*) AS count,MAX(experience) AS max_xp FROM mascot_pets WHERE user_id=?').bind(user.id).first();
  const count=Number(countRow?.count||0),rank=petLevel(countRow?.max_xp||0);
  if(count>=LIMIT)return respond({error:'All '+LIMIT+' species are already in your collection.'},409);
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
 const match=path.match(/^\/api\/mascot-pets\/(\d+)\/(care|interact|nickname|feature)$/);
 if(!match)return respond({error:'Unknown pet action.'},404);
 const id=Number(match[1]);if(!Number.isSafeInteger(id)||id<=0)return respond({error:'Invalid pet.'},400);
 const existing=await env.DB.prepare(ownSelect+' WHERE id=? AND user_id=?').bind(id,user.id).first();
 if(!existing)return respond({error:'Your mascot was not found.'},404);
 const action=match[2];
 if(action==='interact'&&request.method==='POST'){
  const kind=String(body.action||''),rule=INTERACTIONS[kind];
  if(!rule)return respond({error:'Choose talk, cuddle, or groom.'},400);
  const now=Date.now(),stamp=new Date(now).toISOString(),cutoff=new Date(now-rule.seconds*1000).toISOString();
  const pet=await env.DB.prepare(
   'UPDATE mascot_pets SET bond_experience=MIN(bond_experience+? ,500000),'+rule.column+'=? WHERE id=? AND user_id=? AND ('+rule.column+' IS NULL OR '+rule.column+'<=?) RETURNING *'
  ).bind(rule.bond,stamp,id,user.id,cutoff).first();
  if(!pet){
   const current=await env.DB.prepare(ownSelect+' WHERE id=? AND user_id=?').bind(id,user.id).first();
   return respond({error:'That little ritual needs a breather.',pet:serializePet(current)},429);
  }
  const personality=SPECIES_PERSONALITIES[pet.species]||['Curious','adventures'];
  const name=pet.nickname||BY_ID.get(pet.species)?.name||'Your companion';
  const messages={talk:name+' leans in to hear you. '+personality[0]+' minds can always find something to say about '+personality[1]+'.',cuddle:name+' accepts a cozy squeeze, then immediately resumes being a tiny menace.',groom:name+' is all fluffed up and ready for more '+personality[1]+'.'};
  return respond({ok:true,pet:serializePet(pet),bond_awarded:rule.bond,message:messages[kind]+' +'+rule.bond+' bond'});
 }
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
