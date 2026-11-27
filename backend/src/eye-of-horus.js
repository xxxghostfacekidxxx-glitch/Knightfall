import { founderRoundtable } from "./founder-roundtable.mjs";
import { canAccessEyeOfHorus } from "./staff-capabilities.js";

// The God console is a privileged, read-only browser. It uses the normal,
// authenticated God session. It does not require review reasons or generate
// access notifications or application-level read/audit log entries.
export const EYE_DATASETS=Object.freeze({
 direct_messages:{name:"Direct messages",from:"messages m JOIN users u ON u.id=m.sender_id",
  cols:"m.id,m.conversation_id,m.sender_id AS user_id,u.username AS sender,m.body,m.created_at,m.edited_at,m.deleted_at,(SELECT group_concat(p.username, ', ') FROM conversation_members cm JOIN users p ON p.id=cm.user_id WHERE cm.conversation_id=m.conversation_id) AS participants",filter:"EXISTS(SELECT 1 FROM conversation_members me WHERE me.conversation_id=m.conversation_id AND me.user_id=?)",order:"m.id"},
 miss_chaos:{name:"Miss Chaos chats",from:"chaos_messages m JOIN chaos_conversations c ON c.id=m.conversation_id AND c.user_id=m.user_id JOIN users u ON u.id=m.user_id",
  cols:"m.id,m.conversation_id,m.user_id,u.username,m.role,m.content,m.created_at,c.title AS conversation_title,c.deleted_at",filter:"m.user_id=?",order:"m.id"},
 personal_bot_chats:{name:"Personal bot chats",from:"personal_bot_chat_messages m JOIN users u ON u.id=m.user_id LEFT JOIN personal_bots b ON b.id=m.bot_id",
  cols:"m.id,m.bot_id,m.user_id,u.username,m.role,m.content,m.created_at,b.name AS bot_name,m.deleted_at",filter:"m.user_id=?",order:"m.id"},
 profile_photos:{name:"Profile photos",from:"profile_photos p JOIN users u ON u.id=p.user_id",
  cols:"p.id,p.user_id,u.username,p.caption,p.kind,p.content_type,p.size_bytes,p.created_at,p.deleted_at",filter:"p.user_id=?",order:"p.id"},
 message_attachments:{name:"Message attachments",from:"message_attachments a JOIN users u ON u.id=a.uploader_id LEFT JOIN messages m ON m.id=a.message_id",
  cols:"a.id,a.conversation_id,a.message_id,a.uploader_id AS user_id,u.username,a.original_filename,a.content_type,a.byte_size,a.created_at,m.deleted_at AS message_deleted_at",filter:"a.uploader_id=?",order:"a.id"},
 bot_definitions:{name:"Bot configurations",from:"personal_bots b JOIN users u ON u.id=b.owner_id",
  cols:"b.id,b.owner_id AS user_id,u.username,b.name,b.description,b.system_prompt,b.is_public,b.is_nsfw,b.created_at,b.deleted_at",filter:"b.owner_id=?",order:"b.created_at"},
 chaos_memories:{name:"Miss Chaos memories",from:"chaos_memories a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.memory,a.category,a.created_at,a.deleted_at",filter:"a.user_id=?",order:"a.id"},
 personal_memos:{name:"Private memos",from:"member_memos a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.title,a.body,a.created_at,a.updated_at",filter:"a.user_id=?",order:"a.id"},
 memo_mail:{name:"Member Memo Mail",from:"member_memo_mail a JOIN users u ON u.id=a.sender_id",
  cols:"a.id,a.sender_id AS user_id,u.username AS sender,a.recipient_id,a.subject,a.body,a.created_at,a.sender_archived_at,a.recipient_archived_at",filter:"(a.sender_id=? OR a.recipient_id=?)",order:"a.id",twice:true},
 moon_journals:{name:"Moon journals",from:"moon_journal a JOIN users u ON u.id=a.user_id",
  cols:"a.user_id,u.username,a.entry_date,a.title,a.body,a.phase_index,a.created_at,a.updated_at",filter:"a.user_id=?",order:"a.entry_date"},
 shadow_journals:{name:"Shadow journals",from:"shadow_journal a JOIN users u ON u.id=a.user_id",
  cols:"a.user_id,u.username,a.entry_date,a.title,a.body,a.prompt_key,a.created_at,a.updated_at",filter:"a.user_id=?",order:"a.entry_date"},
 birth_charts:{name:"Birth charts",from:"profile_birth_charts a JOIN users u ON u.id=a.user_id",
  cols:"a.user_id,u.username,a.visible,a.chart_json,a.updated_at",filter:"a.user_id=?",order:"a.updated_at"},
 dating_profiles:{name:"Dating profiles",from:"dating_profiles a JOIN users u ON u.id=a.user_id",
  cols:"a.user_id,u.username,a.display_name,a.bio,a.age_range_min,a.age_range_max,a.city_label,a.interests,a.seeking,a.visibility,a.created_at",filter:"a.user_id=?",order:"a.created_at"},
 creator_posts:{name:"Creator posts",from:"creator_posts a JOIN users u ON u.id=a.creator_id",
  cols:"a.id,a.creator_id AS user_id,u.username,a.title,a.description,a.visibility,a.content_rating,a.status,a.price_cents,a.created_at,a.deleted_at",filter:"a.creator_id=?",order:"a.created_at"},
 vault_files:{name:"Private vault index",from:"vault_items a JOIN users u ON u.id=a.uploaded_by",
  cols:"a.object_key AS id,a.uploaded_by AS user_id,u.username,a.filename,a.content_type,a.size_bytes,a.created_at,a.deleted_at",filter:"a.uploaded_by=?",order:"a.created_at"},
 forums:{name:"Forum threads",from:"threads a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.title,a.body,a.deleted_at,a.created_at",filter:"a.user_id=?",order:"a.id"},
 forum_replies:{name:"Forum replies",from:"posts a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.thread_id,a.user_id,u.username,a.body,a.deleted_at,a.created_at",filter:"a.user_id=?",order:"a.id"},
 social_activity:{name:"Social activity",from:"social_activity a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.activity_type,a.object_type,a.object_id,a.body,a.visibility,a.deleted_at,a.created_at",filter:"a.user_id=?",order:"a.id"},
 official_activity:{name:"Homepage staff feed",from:"site_activity_posts a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.title,a.body,a.category,a.deleted_at,a.created_at",filter:"a.user_id=?",order:"a.id"},
 die_ary:{name:"Private Die-ary",from:"die_ary_entries a JOIN users u ON u.id=a.user_id",
  cols:"a.id,a.user_id,u.username,a.title,a.body,a.deleted_at,a.created_at",filter:"a.user_id=?",order:"a.id"},
 media_albums:{name:"Member media albums",from:"media_albums a JOIN users u ON u.id=a.owner_id",
  cols:"a.id,a.owner_id AS user_id,u.username,a.name,a.deleted_at,a.created_at",filter:"a.owner_id=?",order:"a.id"},
 shop_products:{name:"Member shop products",from:"shop_products a JOIN shops s ON s.id=a.shop_id JOIN users u ON u.id=s.owner_id",
  cols:"a.id,s.owner_id AS user_id,u.username,a.name,a.description,a.price_cents,a.image_url,a.deleted_at,a.created_at",filter:"s.owner_id=?",order:"a.created_at"},
 users:{name:"Member accounts",from:"users a",
  cols:"a.id AS user_id,a.username,a.email,a.display_name,a.role,a.status,a.bio,a.created_at,a.updated_at",filter:"a.id=?",order:"a.id"}
});
const TYPES=new Set(["image/jpeg","image/png","image/gif","image/webp"]);
export function eyeBrowseQuery(category,limit=25,offset=0,userId=null) {
 const def=EYE_DATASETS[category];if(!def)throw Error("Unknown data collection.");
 const bindings=[];const where=userId==null?"":" WHERE "+def.filter;
 if(userId!=null){bindings.push(userId);if(def.twice)bindings.push(userId)}
 return {sql:"SELECT "+def.cols+" FROM "+def.from+where+" ORDER BY "+def.order+" DESC LIMIT ? OFFSET ?",params:[...bindings,limit,offset]};
}
export async function handleEyeOfHorus(request,env,url,{requireUser,json,origin}) {
 const prefix="/api/god/eye";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))return null;
 const respond=(payload,status=200)=>json(payload,status,origin,{"cache-control":"private, no-store","x-robots-tag":"noindex,nofollow"});
 const user=await requireUser(request,env);
 if(!user)return respond({error:"Sign in to access the God console."},401);
 if(!canAccessEyeOfHorus(user))return respond({error:"God-only access."},403);
 if(request.method!=="GET"&&request.method!=="HEAD")return respond({error:"Eye of Horus is read-only."},405);
 if(url.pathname===prefix+"/roundtable")return respond(founderRoundtable());
 if(url.pathname===prefix+"/roundtable/progress"){
  try{const [runs,tools,knowledge,lessons,control]=await Promise.all([
   env.DB.prepare("SELECT status,COUNT(*) AS n FROM chaos_knowledge_runs WHERE agent_key LIKE 'mc-%' GROUP BY status").all(),
   env.DB.prepare("SELECT CASE WHEN agent_key='manual-curation' THEN 'manual' ELSE 'other' END AS provenance,COUNT(*) AS n FROM chaos_knowledge_tools GROUP BY provenance").all(),
   env.DB.prepare("SELECT review_status,COUNT(*) AS n FROM chaos_knowledge_candidates GROUP BY review_status").all(),
   env.DB.prepare("SELECT COUNT(*) AS n FROM chaos_knowledge_lessons").first(),
   env.DB.prepare("SELECT k.enabled,e.paused FROM chaos_knowledge_66_control k JOIN eye_chaos_controls e ON e.id=1 WHERE k.id=1").first()]);
   return respond({kind:"research-aggregate",as_of:new Date().toISOString(),runs:runs.results||[],tools:tools.results||[],knowledge:knowledge.results||[],lessons:Number(lessons?.n||0),enabled:Number(control?.enabled)===1&&Number(control?.paused)===0});
  }catch{return respond({error:"Research evidence unavailable."},503);}
 }
 if(url.pathname===prefix+"/status")return respond({god:true,unlocked:true,datasets:Object.entries(EYE_DATASETS).map(([id,d])=>({id,label:d.name}))});
 if(url.pathname===prefix+"/browse"){
   const category=url.searchParams.get("category")||"direct_messages";
   if(!Object.hasOwn(EYE_DATASETS,category))return respond({error:"Unknown collection."},400);
   const limit=Number(url.searchParams.get("limit")||20),offset=Number(url.searchParams.get("offset")||0);
   const rawId=url.searchParams.get("user_id");
   const userId=rawId?Number(rawId):null;
   if(!Number.isInteger(limit)||limit<1||limit>50||!Number.isSafeInteger(offset)||offset<0||offset>100000||
     (userId!==null&&(!Number.isSafeInteger(userId)||userId<1)))return respond({error:"Invalid paging or user filter."},400);
   const q=eyeBrowseQuery(category,limit,offset,userId);
   const rows=await env.DB.prepare(q.sql).bind(...q.params).all();
   const items=rows.results||[];
   return respond({category,items,offset,limit,has_more:items.length===limit});
 }
 const media=url.pathname.match(/^\/api\/god\/eye\/media\/(profile_photos|message_attachments|vault_files)\/([a-f0-9-]+)$/);
 if(media){
   const category=media[1],id=media[2];
   let row,storage;
   if(category==="profile_photos"){
     if(!/^\d+$/.test(id))return respond({error:"Invalid photo."},400);
     row=await env.DB.prepare("SELECT object_key,content_type,size_bytes FROM profile_photos WHERE id=?").bind(Number(id)).first();
     storage=env.PROFILE_MEDIA;
   } else if(category==="message_attachments"){
     if(!/^\d+$/.test(id))return respond({error:"Invalid attachment."},400);
     row=await env.DB.prepare("SELECT object_key,content_type,byte_size AS size_bytes FROM message_attachments WHERE id=?").bind(Number(id)).first();
     storage=env.MESSAGE_ATTACHMENTS;
   } else {
     row=await env.DB.prepare("SELECT object_key,content_type,size_bytes FROM vault_items WHERE object_key=?").bind("vault/"+id).first();
     storage=env.VAULT;
   }
   if(!row||!storage||!TYPES.has(row.content_type))return respond({error:"Image unavailable."},404);
   const object=await storage.get(row.object_key);
   if(!object)return respond({error:"Image unavailable."},404);
   return new Response(request.method==="HEAD"?null:object.body,{status:200,headers:{
     "content-type":row.content_type,"cache-control":"private, no-store","x-content-type-options":"nosniff",
     "content-disposition":"inline","content-security-policy":"default-src 'none'; sandbox",
     "cross-origin-resource-policy":"same-site","access-control-allow-origin":origin,
     "access-control-allow-credentials":"true","vary":"Origin"
   }});
 }
 return respond({error:"Unknown God console route."},404);
}
