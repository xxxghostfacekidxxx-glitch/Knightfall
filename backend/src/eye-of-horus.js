import {canAccessEyeOfHorus} from "./staff-capabilities.js";

const EYE_ROOT="/api/god/eye";
const EYE_TTL_SECONDS=600;
const EYE_CATEGORIES=new Set(["direct_messages","miss_chaos","personal_bot_chats","profile_photos","message_attachments","bot_definitions"]);
const IMAGE_TYPES=new Set(["image/jpeg","image/png","image/gif","image/webp"]);
const SITE_ORIGINS=new Set(["https://ash-fall.com","https://www.ash-fall.com"]);

const numberInRange=(value,defaultValue,min,max)=>{
  const number=Number(value);
  return Number.isSafeInteger(number) && number>=min && number<=max ? number : defaultValue;
};
const validReason=(reason)=>typeof reason==="string" && reason.trim().length>=16 && reason.trim().length<=300;
const noStore=(data,json,origin,status=200)=>json(data,status,origin,{"cache-control":"private, no-store"});

export function eyeReviewQuery(category,limit,offset,userId) {
  if(!EYE_CATEGORIES.has(category))throw new Error("Unsupported review category.");
  const conditions=[],parameters=[];
  let select,filterColumn;
  switch(category){
    case "direct_messages":
      select="SELECT m.id,m.conversation_id,m.sender_id,u.username AS sender,m.body,m.created_at,(SELECT group_concat(participant.username, ', ') FROM conversation_members cm JOIN users participant ON participant.id=cm.user_id WHERE cm.conversation_id=m.conversation_id) AS participants FROM messages m JOIN users u ON u.id=m.sender_id";
      conditions.push("m.deleted_at IS NULL");filterColumn="m.sender_id";break;
    case "miss_chaos":
      select="SELECT m.id,m.conversation_id,m.user_id,u.username,m.role,m.content,m.created_at,c.title AS conversation_title FROM chaos_messages m JOIN chaos_conversations c ON c.id=m.conversation_id AND c.user_id=m.user_id JOIN users u ON u.id=m.user_id";
      conditions.push("c.deleted_at IS NULL");filterColumn="m.user_id";break;
    case "personal_bot_chats":
      select="SELECT m.id,m.bot_id,m.user_id,u.username,m.role,m.content,m.created_at,COALESCE(b.name,'Deleted bot') AS bot_name FROM personal_bot_chat_messages m JOIN users u ON u.id=m.user_id LEFT JOIN personal_bots b ON b.id=m.bot_id";
      filterColumn="m.user_id";break;
    case "profile_photos":
      select="SELECT p.id,p.user_id,u.username,p.caption,p.kind,p.content_type,p.size_bytes,p.created_at FROM profile_photos p JOIN users u ON u.id=p.user_id";
      filterColumn="p.user_id";break;
    case "message_attachments":
      select="SELECT a.id,a.conversation_id,a.message_id,a.uploader_id AS user_id,u.username,a.original_filename,a.content_type,a.byte_size,a.created_at FROM message_attachments a JOIN messages m ON m.id=a.message_id AND m.deleted_at IS NULL JOIN users u ON u.id=a.uploader_id";
      filterColumn="a.uploader_id";break;
    case "bot_definitions":
      select="SELECT b.id,b.owner_id AS user_id,u.username,b.name,b.description,b.system_prompt,b.is_public,b.is_nsfw,b.created_at FROM personal_bots b JOIN users u ON u.id=b.owner_id";
      filterColumn="b.owner_id";break;
  }
  if(userId!==null){
    // A conversation participant may have received the message without sending it.
    const filter=category==="direct_messages"
      ?"EXISTS (SELECT 1 FROM conversation_members member_filter WHERE member_filter.conversation_id=m.conversation_id AND member_filter.user_id=?)"
      :filterColumn+"=?";
    conditions.push(filter);parameters.push(userId);
  }
  const where=conditions.length?" WHERE "+conditions.join(" AND "):"";
  const orderColumn=category==="bot_definitions"?"b.created_at":category==="profile_photos"?"p.created_at":category==="message_attachments"?"a.created_at":"m.created_at";
  return {sql:select+where+" ORDER BY "+orderColumn+" DESC, "+orderColumn.split(".")[0]+".id DESC LIMIT ? OFFSET ?",parameters:[...parameters,limit,offset]};
}

function sessionKey(cookie){return "eye:unlock:"+cookie}
function purposeKey(cookie){return "eye:purpose:"+cookie}
function apiError(json,origin,message,status){return noStore({error:message},json,origin,status)}
function safeContentHeaders(type,length){
  return {
    "content-type":type,
    "content-length":String(length),
    "cache-control":"private, no-store, max-age=0",
    "x-content-type-options":"nosniff",
    "referrer-policy":"no-referrer",
    "content-security-policy":"default-src 'none'; sandbox",
    "cross-origin-resource-policy":"same-site",
    "content-disposition":"inline"
  };
}
async function recordAccess(env,actor,kind,category,reason,{userId=null,objectId=null,count=0}={}){
  // This insert is mandatory. A broken audit ledger must fail closed.
  await env.DB.prepare("INSERT INTO eye_of_horus_access_log (god_user_id,action,category,reason,target_user_id,object_id,result_count) VALUES (?,?,?,?,?,?,?)")
    .bind(actor.id,kind,category,reason,userId,objectId,count).run();
}

export async function handleEyeOfHorus(request,env,url,{requireUser,json,origin,getCookie,verifyPassword,rateLimit,audit}){
  if(url.pathname!==EYE_ROOT&&!url.pathname.startsWith(EYE_ROOT+"/"))return null;
  const user=await requireUser(request,env);
  if(!user)return apiError(json,origin,"Authentication required.",401);
  if(!canAccessEyeOfHorus(user))return apiError(json,origin,"God-only oversight access required.",403);

  const cookie=getCookie(request,"knightfall_session");
  if(!cookie||!env.SESSIONS)return apiError(json,origin,"Secure session unavailable.",401);
  const unlockKey=sessionKey(cookie),purpose=purposeKey(cookie);
  const isPost=request.method==="POST";
  if(isPost&&!SITE_ORIGINS.has(request.headers.get("Origin")))
    return apiError(json,origin,"An authenticated Knightfall request origin is required.",403);
  const now=Date.now();
  const current=await env.SESSIONS.get(unlockKey,"json");
  const unlocked=!!current&&current.user_id===user.id&&Number(current.expires_at)>now;

  if(url.pathname===EYE_ROOT+"/status"&&request.method==="GET")
    return noStore({god:true,unlocked,expires_at:unlocked?new Date(current.expires_at).toISOString():null},json,origin);

  if(url.pathname===EYE_ROOT+"/unlock"&&isPost){
    if(!await rateLimit(env,request,"eye-unlock",4,900,user.id))
      return apiError(json,origin,"Too many verification attempts. Try again later.",429);
    let body;try{body=await request.json()}catch{return apiError(json,origin,"Invalid request.",400)}
    const password=typeof body.password==="string"?body.password:"";
    if(!password||password.length>256)return apiError(json,origin,"Enter your current site password.",400);
    const credentials=await env.DB.prepare("SELECT password_hash FROM users WHERE id=? AND status='active' AND role='god'").bind(user.id).first();
    if(!credentials||!await verifyPassword(password,credentials.password_hash))
      return apiError(json,origin,"Password verification failed.",403);
    const expires_at=Date.now()+EYE_TTL_SECONDS*1000;
    await env.SESSIONS.put(unlockKey,JSON.stringify({user_id:user.id,expires_at}),{expirationTtl:EYE_TTL_SECONDS});
    await env.SESSIONS.delete(purpose);
    await audit(env,user,"eye.unlock","oversight_session",null,{duration_seconds:EYE_TTL_SECONDS});
    return noStore({ok:true,unlocked:true,expires_at:new Date(expires_at).toISOString()},json,origin);
  }
  if(url.pathname===EYE_ROOT+"/lock"&&isPost){
    await env.SESSIONS.delete(unlockKey);
    await env.SESSIONS.delete(purpose);
    return noStore({ok:true,unlocked:false},json,origin);
  }
  if(!unlocked)return apiError(json,origin,"Re-enter your password to unlock Eye of Horus.",403);

  if(url.pathname===EYE_ROOT+"/audit"&&request.method==="GET"){
    if(!await rateLimit(env,request,"eye-audit",12,60,user.id))
      return apiError(json,origin,"Too many requests.",429);
    const {results}=await env.DB.prepare("SELECT id,action,category,reason,target_user_id,object_id,result_count,created_at FROM eye_of_horus_access_log WHERE god_user_id=? ORDER BY id DESC LIMIT 100").bind(user.id).all();
    return noStore({logs:results||[]},json,origin);
  }

  if(url.pathname===EYE_ROOT+"/review"&&isPost){
    if(!await rateLimit(env,request,"eye-review",15,60,user.id))
      return apiError(json,origin,"Review rate limit reached.",429);
    let body;try{body=await request.json()}catch{return apiError(json,origin,"Invalid request.",400)}
    const category=typeof body.category==="string"?body.category:"";
    const reason=typeof body.reason==="string"?body.reason.trim():"";
    if(!EYE_CATEGORIES.has(category))return apiError(json,origin,"Unsupported review category.",400);
    if(!validReason(reason))return apiError(json,origin,"Provide a 16–300 character moderation, security, or support reason.",400);
    const userId=body.user_id==null||body.user_id===""?null:Number(body.user_id);
    if(userId!==null&&(!Number.isSafeInteger(userId)||userId<1))
      return apiError(json,origin,"Invalid member ID.",400);
    const limit=numberInRange(body.limit,20,1,25);
    const offset=numberInRange(body.offset,0,0,10000);
    const query=eyeReviewQuery(category,limit,offset,userId);
    const result=await env.DB.prepare(query.sql).bind(...query.parameters).all();
    const items=result.results||[];
    const allowedMedia=category==="profile_photos"||category==="message_attachments"
      ?{category,ids:items.filter(x=>IMAGE_TYPES.has(x.content_type)).map(x=>Number(x.id))} : null;
    // No content is written to session or access logs. Only authorization context.
    await recordAccess(env,user,"review",category,reason,{userId,count:items.length});
    await env.SESSIONS.put(purpose,JSON.stringify({user_id:user.id,reason,allowed_media:allowedMedia,expires_at:current.expires_at}),{expirationTtl:Math.max(1,Math.ceil((current.expires_at-Date.now())/1000))});
    return noStore({items,category,limit,offset,has_more:items.length===limit,review_reason:reason},json,origin);
  }

  const match=url.pathname.match(/^\/api\/god\/eye\/media\/(profile_photos|message_attachments)\/(\d{1,12})$/);
  if(match&&request.method==="GET"){
    if(!await rateLimit(env,request,"eye-media",40,60,user.id))
      return apiError(json,origin,"Media preview rate limit reached.",429);
    const category=match[1],id=Number(match[2]);
    if(!Number.isSafeInteger(id)||id<1)return apiError(json,origin,"Invalid media ID.",400);
    const context=await env.SESSIONS.get(purpose,"json");
    if(!context||context.user_id!==user.id||context.expires_at<=Date.now()||
        context.allowed_media?.category!==category||!context.allowed_media.ids.includes(id)||!validReason(context.reason))
      return apiError(json,origin,"Review this media item with a documented reason first.",403);
    let entry,storage;
    if(category==="profile_photos"){
      entry=await env.DB.prepare("SELECT object_key,content_type,size_bytes FROM profile_photos WHERE id=?").bind(id).first();
      storage=env.PROFILE_MEDIA;
    }else{
      entry=await env.DB.prepare("SELECT a.object_key,a.content_type,a.byte_size AS size_bytes FROM message_attachments a JOIN messages m ON m.id=a.message_id AND m.deleted_at IS NULL WHERE a.id=?").bind(id).first();
      storage=env.MESSAGE_ATTACHMENTS;
    }
    if(!entry||!storage||!IMAGE_TYPES.has(entry.content_type))
      return apiError(json,origin,"Image unavailable.",404);
    const object=await storage.get(entry.object_key);
    if(!object)return apiError(json,origin,"Image unavailable.",404);
    await recordAccess(env,user,"media_preview",category,context.reason,{objectId:String(id),count:1});
    return new Response(object.body,{status:200,headers:safeContentHeaders(entry.content_type,object.size||entry.size_bytes)});
  }
  return apiError(json,origin,"Unknown Eye of Horus route.",404);
}
