import {petLevel} from './mascot-progression.js';

const names=['Riot Raccoon','Crypt Koi','Glitch Goblin','Moth Matron','Cinder Pup','Void Sprout'];
export const arenaDay=(date=new Date())=>date.toISOString().slice(0,10);
const hash=value=>{let h=2166136261;for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
export function resolveArenaBout(pet,day){
 const level=petLevel(pet.experience),seed=hash(day+':'+pet.id+':'+pet.species);
 const opponent=names[seed%names.length],opponentLevel=1+(Math.floor(seed/11)%Math.max(1,level+3));
 const petPower=level*10+(Number(pet.experience)%10)+(Math.floor(seed/31)%11);
 const foePower=opponentLevel*10+(Math.floor(seed/127)%11);
 const outcome=petPower===foePower?'draw':petPower>foePower?'win':'loss';
 return {opponent,opponent_level:opponentLevel,outcome,xp_reward:outcome==='win'?35:outcome==='draw'?20:10};
}
export async function handleMascotArena(request,env,url,user,{json,rateLimit,origin}){
 const path=url.pathname,reply=(value,status=200)=>json(value,status,origin);
 if(path==='/api/mascot-pets/arena'&&request.method==='GET'){
  const day=arenaDay(),[pets,runs]=await Promise.all([
   env.DB.prepare('SELECT id,species,nickname,experience FROM mascot_pets WHERE user_id=? ORDER BY id').bind(user.id).all(),
   env.DB.prepare('SELECT id,pet_id,opponent,opponent_level,outcome,xp_reward,created_at FROM mascot_arena_runs WHERE user_id=? ORDER BY id DESC LIMIT 30').bind(user.id).all()
  ]);
  const used=new Set((runs.results||[]).filter(x=>String(x.created_at).slice(0,10)===day).map(x=>Number(x.pet_id)));
  return reply({day,mode:'pve',daily_limit_per_pet:1,reward:'XP only',pets:(pets.results||[]).map(p=>({...p,level:petLevel(p.experience),can_battle:!used.has(Number(p.id))})),recent:runs.results||[]});
 }
 if(path!='/api/mascot-pets/arena/challenge')return null;
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 if(!await rateLimit(env,request,'mascot-arena-challenge',10,60,user.id))return reply({error:'The arena is cooling down. Try again in a minute.'},429);
 let body;try{body=await request.json()}catch{return reply({error:'Invalid challenge.'},400)}
 const petId=Number(body?.pet_id);if(!Number.isSafeInteger(petId)||petId<1)return reply({error:'Choose one of your companions.'},400);
 const pet=await env.DB.prepare('SELECT id,species,nickname,experience FROM mascot_pets WHERE id=? AND user_id=?').bind(petId,user.id).first();
 if(!pet)return reply({error:'That companion does not belong to your sanctuary.'},404);
 const day=arenaDay(),now=new Date().toISOString(),bout=resolveArenaBout(pet,day);
 // The unique key caps each pet at one daily bout. The batch applies XP only
 // while that day's row remains unclaimed, making racing retries idempotent.
 await env.DB.batch([
  env.DB.prepare('INSERT OR IGNORE INTO mascot_arena_runs(user_id,pet_id,day,opponent,opponent_level,outcome,xp_reward,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(user.id,pet.id,day,bout.opponent,bout.opponent_level,bout.outcome,bout.xp_reward,now),
  env.DB.prepare('UPDATE mascot_pets SET experience=experience+(SELECT xp_reward FROM mascot_arena_runs WHERE user_id=? AND pet_id=? AND day=? AND rewarded_at IS NULL) WHERE id=? AND user_id=? AND EXISTS(SELECT 1 FROM mascot_arena_runs WHERE user_id=? AND pet_id=? AND day=? AND rewarded_at IS NULL)').bind(user.id,pet.id,day,pet.id,user.id,user.id,pet.id,day),
  env.DB.prepare('UPDATE mascot_arena_runs SET rewarded_at=? WHERE user_id=? AND pet_id=? AND day=? AND rewarded_at IS NULL').bind(now,user.id,pet.id,day)
 ]);
 const battle=await env.DB.prepare('SELECT id,pet_id,opponent,opponent_level,outcome,xp_reward,created_at FROM mascot_arena_runs WHERE user_id=? AND pet_id=? AND day=?').bind(user.id,pet.id,day).first();
 const updated=await env.DB.prepare('SELECT experience FROM mascot_pets WHERE id=? AND user_id=?').bind(pet.id,user.id).first();
 if(!battle)return reply({error:'The bout could not be recorded. Please retry.'},500);
 return reply({ok:true,battle,pet:{id:pet.id,nickname:pet.nickname,experience:Number(updated?.experience||pet.experience)},message:battle.outcome==='win'?'Victory! Your companion earned arena XP.':battle.outcome==='draw'?'A close draw! Your companion earned a little arena XP.':'The rival won this round. Your companion still earned practice XP.'},battle.created_at===now?201:200);
}
