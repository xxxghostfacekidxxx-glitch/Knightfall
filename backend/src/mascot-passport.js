/* Neon Nuisances Passport: all milestone progress and Cinders grants are
 * calculated by D1. No browser scores, no repeat claims, no purchase gating.
 */
const defsQuery='SELECT badge_id,title,description,metric,target,reward_cinders FROM mascot_passport_badges ORDER BY CASE metric WHEN "pets" THEN 0 WHEN "hatched" THEN 1 WHEN "quests" THEN 2 ELSE 3 END,target';
async function counts(env,userId){
 const [pets,eggs,quests,equipped]=await Promise.all([
  env.DB.prepare('SELECT COUNT(*) AS count FROM mascot_pets WHERE user_id=?').bind(userId).first(),
  env.DB.prepare("SELECT COUNT(*) AS count FROM mascot_rescue_eggs WHERE user_id=? AND status='hatched'").bind(userId).first(),
  env.DB.prepare('SELECT COUNT(*) AS count FROM mascot_quest_claims WHERE user_id=?').bind(userId).first(),
  env.DB.prepare('SELECT COUNT(*) AS count FROM mascot_equipment WHERE user_id=?').bind(userId).first()
 ]);
 return {pets:Number(pets?.count||0),hatched:Number(eggs?.count||0),quests:Number(quests?.count||0),equipped:Number(equipped?.count||0)};
}
export async function publicPassportBadges(env,userId){
 const rows=await env.DB.prepare('SELECT c.badge_id,b.title,b.description,c.claimed_at FROM mascot_passport_claims c JOIN mascot_passport_badges b ON b.badge_id=c.badge_id WHERE c.user_id=? ORDER BY c.claimed_at DESC').bind(userId).all();
 return rows.results||[];
}
export async function passportOverview(env,userId){
 const [definitions,claimed,progress]=await Promise.all([
  env.DB.prepare(defsQuery).all(),
  env.DB.prepare('SELECT badge_id,claimed_at FROM mascot_passport_claims WHERE user_id=?').bind(userId).all(),
  counts(env,userId)
 ]);
 const collection=new Map((claimed.results||[]).map(row=>[row.badge_id,row.claimed_at]));
 return {progress,badges:(definitions.results||[]).map(row=>{
  const current=progress[row.metric]||0;
  return {id:row.badge_id,title:row.title,description:row.description,metric:row.metric,
   target:Number(row.target),progress:current,reward_cinders:Number(row.reward_cinders),
   unlocked:current>=Number(row.target),claimed:collection.has(row.badge_id),
   claimed_at:collection.get(row.badge_id)||null};
 })};
}
export async function handleMascotPassport(request,env,url,user,{json,rateLimit,origin}){
 const path=url.pathname,respond=(value,code=200)=>json(value,code,origin);
 if(path==='/api/mascot-pets/passport'&&request.method==='GET')
  return respond(await passportOverview(env,user.id));
 const match=path.match(/^\/api\/mascot-pets\/passport\/([a-z_]{3,48})\/claim$/);
 if(!match)return null;
 if(request.method!=='POST')return respond({error:'Method not allowed.'},405);
 if(!await rateLimit(env,request,'mascot-passport-claim',10,60,user.id))
  return respond({error:'Passport claims are rate limited.'},429);
 const id=match[1];
 const definition=await env.DB.prepare('SELECT badge_id,title,reward_cinders FROM mascot_passport_badges WHERE badge_id=?').bind(id).first();
 if(!definition)return respond({error:'Unknown milestone.'},404);
 try{
  await env.DB.prepare('INSERT INTO mascot_passport_claims(user_id,badge_id) VALUES(?,?)')
   .bind(user.id,id).run();
 }catch{return respond({error:'This milestone is incomplete or already claimed.'},409)}
 return respond({ok:true,badge_id:id,reward_cinders:Number(definition.reward_cinders),
  message:definition.title+' unlocked! +'+Number(definition.reward_cinders)+' Cinders.',
  passport:await passportOverview(env,user.id)},201);
}
