/* Neon Nuisances Expeditions: earned eggs, species story quests and personal habitats.
 * No random paid eggs, no browser-authoritative rewards and no trading of pets.
 */
const DAILY_ACTIONS=['feed','play','rest'];
const THEMES=Object.freeze([
 {id:'graveyard',name:'Midnight Graveyard',unlock_level:1,art:'/assets/devil-tools/neon-nuisances/habitats/graveyard.svg'},
 {id:'neon-city',name:'Neon Rooftops',unlock_level:2,art:'/assets/devil-tools/neon-nuisances/habitats/neon-city.svg'},
 {id:'toxic-lagoon',name:'Radioactive Lagoon',unlock_level:3,art:'/assets/devil-tools/neon-nuisances/habitats/toxic-lagoon.svg'},
 {id:'cosmic-void',name:'Eclipse Observatory',unlock_level:5,art:'/assets/devil-tools/neon-nuisances/habitats/cosmic-void.svg'}
]);
const DECORATIONS=Object.freeze([
 {id:'none',name:'No decoration',unlock_level:1,art:''},
 {id:'lantern',name:'Haunted Lantern',unlock_level:1,art:'/assets/devil-tools/neon-nuisances/habitats/lantern.svg'},
 {id:'arcade',name:'Tiny Arcade Cabinet',unlock_level:2,art:'/assets/devil-tools/neon-nuisances/habitats/arcade.svg'},
 {id:'crystal',name:'Void Crystal',unlock_level:3,art:'/assets/devil-tools/neon-nuisances/habitats/crystal.svg'}
]);
export const HABITAT_THEMES=THEMES;
export const HABITAT_DECORATIONS=DECORATIONS;
const worldNames={
 moxie:'Moonlit Moth Dance',bloop:'Gillrot’s Toxic Tide',pippa:'The Haunted Harvest',
 nib:'Nocturnib’s Night Patrol',glim:'Cryptglow’s Lantern Watch',
 zuzu:'Sludgebyte’s Slime Lab',kiki:'Riotpaws Rooftop Rush',
 emberbun:'Cinderfang’s Ember Run',gravebyte:'Gravebyte Signal Repair',
 statichex:'Statichex Frequency Heist',rattlepop:'Rattlepop’s Candy Coffin',
 thornriot:'Thornriot’s Wild Growth', 'volt-imp':'Volt Imp Power Surge',
 'crypt-koi':'Crypt Koi Spirit Current','casket-pup':'Casket Pup Graveyard Patrol',
 'void-sprout':'Void Sprout Eclipse Bloom','minion-mouse':'Minion Mouse Tunnel Hunt',
 'mini-villain':'Mini Villain’s Evil Scheme','mini-eddie':'The Eddie’s Bone Guard',
 gutterkit:'Gutterkit Alley Scavenge','chunky-monkey':'Chunky Monkey Jungle Jam',
 'boo-thang':'Boo Thang’s Ghostly Date',
 lydibug:'Lydibug’s Starlit Garden',sootsnoot:'Sootsnoot’s Ash Trail',
 rumblefluff:'Rumblefluff’s Thunder Nap',glittergob:'Glittergob’s Shiny Scheme',
 craggle:'Craggle’s Moonwall Watch',prismare:'Prismare’s Lantern Drift'
};
export const QUEST_TITLES=Object.freeze(worldNames);
export const todayUTC=(at=new Date())=>at.toISOString().slice(0,10);
const dateIndex=day=>Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
export function questFor(species,day=todayUTC()){
 const id=Object.keys(worldNames).indexOf(species);
 if(id<0)throw Error('Unknown species');
 const action=DAILY_ACTIONS[((id+dateIndex(day))%3+3)%3];
 return {action,title:worldNames[species],instruction:{
  feed:'Feed your companion after accepting this mission.',
  play:'Play with your companion after accepting this mission.',
  rest:'Let your companion rest after accepting this mission.'
 }[action]};
}
export async function careQuestProgress(env,userId,petId,action){
 if(!DAILY_ACTIONS.includes(action))return;
 const day=todayUTC();
 await env.DB.prepare("UPDATE mascot_quest_runs SET progress=1 WHERE user_id=? AND pet_id=? AND day=? AND action=? AND claimed=0")
 .bind(userId,petId,day,action).run();
}
async function readAdventures(env,user){
 const day=todayUTC(),[pets,runs,eggs,fragments]=await Promise.all([
  env.DB.prepare('SELECT id,species,nickname,experience FROM mascot_pets WHERE user_id=? ORDER BY id').bind(user.id).all(),
  env.DB.prepare('SELECT id,pet_id,day,action,title,progress,claimed FROM mascot_quest_runs WHERE user_id=? AND day=? ORDER BY id').bind(user.id,day).all(),
  env.DB.prepare('SELECT id,species,nickname,started_at,ready_at,status,hatched_at FROM mascot_rescue_eggs WHERE user_id=? ORDER BY id DESC LIMIT 30').bind(user.id).all(),
  env.DB.prepare('SELECT fragments FROM mascot_shell_fragments WHERE user_id=?').bind(user.id).first()
 ]);
 const allPets=pets.results||[],allRuns=runs.results||[];
 const offers=allPets.map(pet=>({pet_id:pet.id,pet_name:pet.nickname,species:pet.species,
   ...questFor(pet.species,day),run:allRuns.find(q=>Number(q.pet_id)===Number(pet.id))||null}));
 return {day,quests:allRuns,offers,eggs:eggs.results||[],shell_fragments:Number(fragments?.fragments||0),
  started_today:allRuns.length,quests_left:Math.max(0,3-allRuns.length),quest_reward_cinders:75,
  fragments_per_quest:1,fragments_per_egg:3,incubation_minutes:35,
  themes:THEMES,decorations:DECORATIONS};
}
const safeId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;
function cleanName(input,defaultName){
 if(input===undefined)return defaultName;
 if(typeof input!=='string')return null;
 const v=input.replace(/\s+/g,' ').trim();
 return v.length>=1&&v.length<=28&&/^[\p{L}\p{N}][\p{L}\p{N} ._'!?-]*$/u.test(v)?v:null;
}
export async function handleMascotAdventures(request,env,url,user,{json,rateLimit,origin,petLevel,speciesCatalog}){
 const path=url.pathname,respond=(payload,status=200)=>json(payload,status,origin);
 if(path==='/api/mascot-pets/adventures'&&request.method==='GET'){
  return respond(await readAdventures(env,user));
 }
 if(!path.startsWith('/api/mascot-pets/quests/')&&!path.startsWith('/api/mascot-pets/eggs/')
   &&!/\/(?:habitat|room)$/.test(path))return null;
 if(request.method!=='POST'&&request.method!=='PUT')return respond({error:'Method not allowed.'},405);
 if(!await rateLimit(env,request,'mascot-adventure-action',20,60,user.id))
  return respond({error:'Adventure actions are temporarily rate limited.'},429);
 let body={};
 try{body=await request.json()}catch{return respond({error:'Invalid request JSON.'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid action payload.'},400);
 const day=todayUTC();
 if(path==='/api/mascot-pets/quests/start'&&request.method==='POST'){
  const petId=safeId(body.pet_id);
  if(!petId)return respond({error:'Choose a pet to begin this quest.'},400);
  const pet=await env.DB.prepare('SELECT id,species,nickname FROM mascot_pets WHERE id=? AND user_id=?').bind(petId,user.id).first();
  if(!pet)return respond({error:'That pet does not belong to your sanctuary.'},404);
  const offer=questFor(pet.species,day);
  try{await env.DB.prepare('INSERT INTO mascot_quest_runs(user_id,pet_id,day,action,title) VALUES(?,?,?,?,?)')
    .bind(user.id,pet.id,day,offer.action,offer.title).run();}
  catch{return respond({error:'Only three different companion quests can be started per day.'},409)}
  return respond({ok:true,message:offer.title+' started. '+offer.instruction,adventures:await readAdventures(env,user)},201);
 }
 const claim=path.match(/^\/api\/mascot-pets\/quests\/(\d+)\/claim$/);
 if(claim&&request.method==='POST'){
  try{await env.DB.prepare('INSERT INTO mascot_quest_claims(user_id,quest_id,day) VALUES(?,?,?)')
    .bind(user.id,Number(claim[1]),day).run();}
  catch{return respond({error:'Quest unfinished, expired or already claimed.'},409)}
  return respond({ok:true,message:'Quest completed! +75 Cinders and +1 Rescue Shell.',adventures:await readAdventures(env,user)});
 }
 if(path==='/api/mascot-pets/eggs/craft'&&request.method==='POST'){
  const species=speciesCatalog.find(x=>x.id===body.species);
  if(!species)return respond({error:'Choose a known mascot species.'},400);
  const nickname=cleanName(body.nickname,species.name);
  if(!nickname)return respond({error:'Egg nickname must be 1–28 valid characters.'},400);
  const ready=new Date(Date.now()+35*60000).toISOString();
  try{await env.DB.prepare("INSERT INTO mascot_rescue_eggs(user_id,species,nickname,started_at,ready_at,status) VALUES(?,?,?,?,?,'incubating')")
    .bind(user.id,species.id,nickname,new Date().toISOString(),ready).run();}
  catch{return respond({error:'You need three Rescue Shells, an unlocked species, and an empty slot for it.'},409)}
  return respond({ok:true,message:'Your '+species.name+' egg is incubating! Hatch it when the timer ends.',adventures:await readAdventures(env,user)},201);
 }
 const hatch=path.match(/^\/api\/mascot-pets\/eggs\/(\d+)\/hatch$/);
 if(hatch&&request.method==='POST'){
  let egg;
  try{egg=await env.DB.prepare("UPDATE mascot_rescue_eggs SET status='hatched',hatched_at=? WHERE id=? AND user_id=? AND status='incubating' AND ready_at<=? RETURNING *")
    .bind(new Date().toISOString(),Number(hatch[1]),user.id,new Date().toISOString()).first();}
  catch{return respond({error:'Egg cannot hatch yet or species is already owned.'},409)}
  if(!egg)return respond({error:'That egg is not ready to hatch.'},409);
  return respond({ok:true,message:egg.nickname+' hatched and joined your Sanctuary!',adventures:await readAdventures(env,user)});
 }
 const roomLayout=path.match(/^\/api\/mascot-pets\/(\d+)\/room$/);
 if(roomLayout&&request.method==='PUT'){
  const petId=Number(roomLayout[1]),x=body.x,y=body.y,pose=body.pose;
  if(!Number.isSafeInteger(petId)||petId<=0||
    !Number.isInteger(x)||x<8||x>92||
    !Number.isInteger(y)||y<25||y>85||
    !['idle','bounce','mischief'].includes(pose))
   return respond({error:'Choose a valid room location and pose.'},400);
  const owned=await env.DB.prepare('SELECT id FROM mascot_pets WHERE id=? AND user_id=?')
   .bind(petId,user.id).first();
  if(!owned)return respond({error:'This is not your pet room.'},404);
  try{
   await env.DB.prepare("INSERT INTO mascot_room_layouts(pet_id,user_id,x_percent,y_percent,pose,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(pet_id) DO UPDATE SET x_percent=excluded.x_percent,y_percent=excluded.y_percent,pose=excluded.pose,updated_at=excluded.updated_at")
    .bind(petId,user.id,x,y,pose,new Date().toISOString()).run();
  }catch{return respond({error:'Room layout could not be saved.'},409)}
  return respond({ok:true,room:{x,y,pose},message:'Your companion room was saved.'});
 }
 const room=path.match(/^\/api\/mascot-pets\/(\d+)\/habitat$/);
 if(room&&request.method==='PUT'){
  const petId=Number(room[1]),theme=THEMES.find(x=>x.id===body.theme),decoration=DECORATIONS.find(x=>x.id===body.decoration);
  if(!theme||!decoration)return respond({error:'Choose a valid habitat and decoration.'},400);
  const pet=await env.DB.prepare('SELECT id,experience FROM mascot_pets WHERE id=? AND user_id=?').bind(petId,user.id).first();
  if(!pet)return respond({error:'That companion does not belong to your sanctuary.'},404);
  const level=petLevel(pet.experience);
  if(level<theme.unlock_level||level<decoration.unlock_level)
   return respond({error:'Level up your companion to unlock this habitat or decoration.'},409);
  await env.DB.prepare("INSERT INTO mascot_habitats(user_id,pet_id,theme,decoration,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(pet_id) DO UPDATE SET theme=excluded.theme,decoration=excluded.decoration,updated_at=excluded.updated_at")
   .bind(user.id,petId,theme.id,decoration.id,new Date().toISOString()).run();
  return respond({ok:true,message:'The habitat has been updated.'});
 }
 return respond({error:'Unknown Sanctuary adventure action.'},404);
}
