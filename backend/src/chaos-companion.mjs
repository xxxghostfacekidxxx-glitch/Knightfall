/** An accepted Between the Flames invitation gates the companion dashboard.
 * Existing Miss Chaos conversations and memories remain scoped to the signed-in account.
 */
export async function companionScope(env,user){
 if(!user?.id)return {role:"guest",accepted:false};
 const row=await env.DB.prepare("SELECT user_id,invited_by,status FROM ai_handoff_partner WHERE slot=1").first();
 const accepted=row?.status==="accepted";
 if(user.role==="god"&&Number(row?.invited_by)===Number(user.id))
  return {role:"owner",accepted:true,owner_id:Number(user.id)};
 if(accepted&&Number(row.user_id)===Number(user.id))
  return {role:"partner",accepted:true,owner_id:Number(row.invited_by)};
 return {role:"member",accepted:false,owner_id:null};
}
const trim=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
const summary=(b,shared)=>({id:b.id,name:trim(b.name,60),
 description:trim(b.description,240),is_public:Number(b.is_public)===1,
 is_nsfw:Number(b.is_nsfw)===1,shared:!!shared,
 url:shared||Number(b.is_public)===1?"/bot.html?id="+b.id:"/personal-bots.html",
 updated_at:trim(b.updated_at,40)});
export async function companionFleet(env,user){
 if(!user?.id)throw Error("Sign-in required.");
 const scope=await companionScope(env,user);
 const own=await env.DB.prepare("SELECT id,name,description,is_public,is_nsfw,updated_at FROM personal_bots WHERE owner_id=? AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 35").bind(user.id).all();
 const valid=b=>/^[a-f0-9]{32}$/.test(String(b.id||""));
 const own_bots=(own?.results||[]).filter(valid).map(b=>summary(b,false));
 let shared_owner_public_bots=[];
 if(scope.role==="partner"){
   const shared=await env.DB.prepare("SELECT b.id,b.name,b.description,b.is_public,b.is_nsfw,b.updated_at FROM personal_bots b JOIN users u ON u.id=b.owner_id WHERE b.owner_id=? AND b.is_public=1 AND b.is_nsfw=0 AND b.deleted_at IS NULL AND u.role='god' AND u.status='active' ORDER BY b.updated_at DESC LIMIT 35").bind(scope.owner_id).all();
   shared_owner_public_bots=(shared?.results||[]).filter(valid).map(b=>summary(b,true));
 }
 return {source:"Knightfall private account / public bot roster",role:scope.role,
   read_only:true,own_bots,shared_owner_public_bots,
   own_count:own_bots.length,shared_count:shared_owner_public_bots.length,
   links:{my_bots:"/personal-bots.html",shared_board:"/ai-handoff.html"},
   notice:"Only your own bot metadata and published non-NSFW owner bots. Private prompts, memories and bot chat archives are never returned. Open the bot page to talk with a published bot; user consent is required."};
}
export async function handleChaosCompanion(request,env,url,{requireUser,json,origin,rateLimit}){
 if(!["/api/chaos/companion","/api/chaos/fleet"].includes(url.pathname))return null;
 const response=(data,status=200)=>{const r=json(data,status,origin);r.headers.set("cache-control","private, no-store");return r};
 if(request.method!=="GET")return response({error:"Method not allowed."},405);
 const user=await requireUser(request,env);
 if(!user)return response({error:"Sign in to Knightfall first."},401);
 if(!await rateLimit(env,request,"chaos-companion-lookup",20,60,user.id))return response({error:"Too many requests."},429);
 try{
  if(url.pathname==="/api/chaos/fleet")return response(await companionFleet(env,user));
  const scope=await companionScope(env,user);
  if(!scope.accepted)return response({error:"This companion is reserved for the owner and accepted Between the Flames collaborator."},403);
  return response({ok:true,role:scope.role,companion:scope.role==="partner"?"Samantha's Miss Chaos":"Owner's Miss Chaos",
   account_bound:true,private_chats:true,private_memories:true,
   links:{chat:"/miss-chaos.html",board:"/ai-handoff.html",bots:"/personal-bots.html"},
   note:"Your private chat and memory belong only to your account. Shared handoff notes are posted solely after an explicit submit."});
 }catch{return response({error:"Companion roster temporarily unavailable."},503);}
}
