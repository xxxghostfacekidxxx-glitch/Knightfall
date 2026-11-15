import {advanceTrainer,zoneAt} from "./cinderwild-world-rules.mjs";

const BASE="/api/cinderwild/world";
const PRESENCE_WINDOW_MS=45000;
const MOVE_COOLDOWN_MS=125;
const QUESTS=Object.freeze([
 {id:"first_steps",name:"Footsteps in the Ash",description:"Take five verified steps in the online world."},
 {id:"nurse_ember",name:"A Kindled Welcome",description:"Speak with Nurse Ember in Cinder Town."},
 {id:"supply_keeper",name:"Pack for the Wilds",description:"Visit the Supply Keeper in Cinder Town."},
 {id:"bramble_trail",name:"Into the Brambles",description:"Reach Bramble Trail on the shared world map."},
 {id:"warden_briar",name:"A Warden's Challenge",description:"Find Warden Briar on the trail."}
]);
const NPCS=Object.freeze({
 nurse_ember:{x:6,y:17},
 supply_keeper:{x:10,y:17},
 warden_briar:{x:24,y:19}
});
const DIRECTIONS=new Set(["up","down","left","right"]);

function publicPosition(row){
 return {x:Number(row.x),y:Number(row.y),steps:Number(row.steps),facing:row.facing,version:Number(row.version),zone:zoneAt(Number(row.x))};
}
function zoneBounds(x){
 return x<14?[1,13]:x<32?[14,31]:x<51?[32,50]:[51,62];
}
async function getPlayer(env,userId){
 return env.DB.prepare("SELECT * FROM cinderwild_world_players WHERE user_id=?").bind(userId).first();
}
async function completedQuests(env,userId){
 const rows=await env.DB.prepare("SELECT quest_id FROM cinderwild_world_quests WHERE user_id=?").bind(userId).all();
 const ids=new Set((rows.results||[]).map(row=>row.quest_id));
 return QUESTS.map(q=>({...q,completed:ids.has(q.id)}));
}
async function awardQuest(env,userId,questId){
 await env.DB.prepare("INSERT OR IGNORE INTO cinderwild_world_quests(user_id,quest_id) VALUES (?,?)").bind(userId,questId).run();
}
async function nearbyPlayers(env,userId,row,now){
 const [start,end]=zoneBounds(Number(row.x));
 const response=await env.DB.prepare(`
  SELECT p.user_id,u.username,u.display_name,p.x,p.y,p.facing
  FROM cinderwild_world_players p
  JOIN users u ON u.id=p.user_id AND u.status='active'
  WHERE p.online=1 AND p.last_seen_ms>=? AND p.user_id!=?
    AND p.x BETWEEN ? AND ?
    AND ABS(p.x-?)+ABS(p.y-?)<=22
    AND NOT EXISTS (
      SELECT 1 FROM user_blocks b
      WHERE (b.blocker_id=? AND b.blocked_id=p.user_id)
         OR (b.blocker_id=p.user_id AND b.blocked_id=?)
    )
  ORDER BY p.last_seen_ms DESC,p.user_id DESC LIMIT 40
 `).bind(now-PRESENCE_WINDOW_MS,userId,start,end,row.x,row.y,userId,userId).all();
 return (response.results||[]).map(p=>({
  id:Number(p.user_id),username:String(p.username),display_name:String(p.display_name||p.username),
  x:Number(p.x),y:Number(p.y),facing:p.facing
 }));
}
function validateRequestOrigin(request,origin){
 return request.headers.get("Origin")===origin;
}
function getDirection(raw){
 return typeof raw==="string"&&DIRECTIONS.has(raw)?raw:null;
}
export async function handleCinderwildOnlineWorld(request,env,url,{getUser,json,rateLimit,origin}){
 if(!url.pathname.startsWith(BASE))return null;
 if(![BASE,BASE+"/join",BASE+"/move",BASE+"/heartbeat",BASE+"/interact",BASE+"/leave"].includes(url.pathname))
  return json({error:"Unknown world action."},404,origin);
 const user=await getUser(request,env);
 if(!user)return json({error:"Sign in to join Cinderwild's shared world."},401,origin);
 const action=url.pathname===BASE?"view":url.pathname.slice(BASE.length+1);
 const expectedMethod=action==="view"?"GET":"POST";
 if(request.method!==expectedMethod)return json({error:"Method not allowed."},405,origin);
 if(action!=="view"&&!validateRequestOrigin(request,origin))
  return json({error:"This world action must originate from the Knightfall site."},403,origin);
 if(!(await rateLimit(env,request,"cinderwild-world-"+(action==="move"?"move":"general"),action==="move"?600:100,60,user.id)))
  return json({error:"Too many world actions. Try again shortly."},429,origin);
 const now=Date.now();

 if(action==="join"){
  await env.DB.prepare(`INSERT INTO cinderwild_world_players(user_id,x,y,steps,last_seen_ms,online)
   VALUES (?,8,18,0,?,1)
   ON CONFLICT(user_id) DO UPDATE SET last_seen_ms=excluded.last_seen_ms,online=1,updated_at=CURRENT_TIMESTAMP`).bind(user.id,now).run();
  const row=await getPlayer(env,user.id);
  return json({ok:true,me:publicPosition(row),quests:await completedQuests(env,user.id),world_rules_version:1},200,origin);
 }
 if(action==="view"){
  const row=await getPlayer(env,user.id);
  if(!row||!row.online||Number(row.last_seen_ms)<now-PRESENCE_WINDOW_MS)
   return json({ok:false,needs_join:true,players:[]},200,origin);
  const [players,quests]=await Promise.all([nearbyPlayers(env,user.id,row,now),completedQuests(env,user.id)]);
  return json({ok:true,me:publicPosition(row),players,quests,online_count:players.length+1},200,origin);
 }
 if(action==="leave"){
  await env.DB.prepare("UPDATE cinderwild_world_players SET online=0,last_seen_ms=0,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(user.id).run();
  return json({ok:true},200,origin);
 }
 const row=await getPlayer(env,user.id);
 if(!row||!row.online||Number(row.last_seen_ms)<now-PRESENCE_WINDOW_MS)
  return json({error:"Online session expired. Join the world again.",needs_join:true},409,origin);
 if(action==="heartbeat"){
  await env.DB.prepare("UPDATE cinderwild_world_players SET last_seen_ms=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND online=1").bind(now,user.id).run();
  return json({ok:true},200,origin);
 }
 let body;try{body=await request.json();}catch{return json({error:"Invalid JSON request."},400,origin);}
 if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid world action."},400,origin);
 if(action==="interact"){
  const target=String(body.target||"");
  const npc=NPCS[target];
  if(!npc)return json({error:"Unknown character."},400,origin);
  if(Math.abs(row.x-npc.x)+Math.abs(row.y-npc.y)>2)
   return json({error:"You must approach this character first."},403,origin);
  await awardQuest(env,user.id,target);
  await env.DB.prepare("UPDATE cinderwild_world_players SET last_seen_ms=? WHERE user_id=?").bind(now,user.id).run();
  return json({ok:true,quests:await completedQuests(env,user.id)},200,origin);
 }
 const direction=getDirection(body.direction);
 if(!direction)return json({error:"Use a cardinal movement direction."},400,origin);
 if(now-Number(row.last_move_ms)<MOVE_COOLDOWN_MS)
  return json({error:"Movement too fast.",retry_after_ms:MOVE_COOLDOWN_MS-(now-Number(row.last_move_ms))},429,origin);
 // No client badges or save data may authorize restricted server territory.
 // Gym battles and server-owned crest rewards will be added as a separate release.
 const result=advanceTrainer(row,direction,[]);
 if(!result.allowed)return json({error:result.error,me:publicPosition(row)},409,origin);
 const {x,y,steps}=result.position;
 const write=await env.DB.prepare(`
  UPDATE cinderwild_world_players
  SET x=?,y=?,steps=?,facing=?,version=version+1,last_move_ms=?,last_seen_ms=?,updated_at=CURRENT_TIMESTAMP
  WHERE user_id=? AND version=? AND online=1 AND last_move_ms<=?
 `).bind(x,y,steps,direction,now,now,user.id,row.version,now-MOVE_COOLDOWN_MS).run();
 if(Number(write.meta?.changes||0)!==1){
  const latest=await getPlayer(env,user.id);
  return json({error:"Position changed in another session.",conflict:true,me:latest?publicPosition(latest):null},409,origin);
 }
 if(steps===5)await awardQuest(env,user.id,"first_steps");
 if(x===14)await awardQuest(env,user.id,"bramble_trail");
 if(Math.abs(x-24)+Math.abs(y-19)<=2)await awardQuest(env,user.id,"warden_briar");
 return json({ok:true,me:{x,y,steps,facing:direction,version:Number(row.version)+1,zone:result.zone}},200,origin);
}
