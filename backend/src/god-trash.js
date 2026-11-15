import {canAccessEyeOfHorus} from "./staff-capabilities.js";

// God-controlled recovery and final purge for main user-generated records.
// Reads and actions here are intentionally not recorded in the Eye access log.
// The ordinary authenticated God session is sufficient.
const TYPES=Object.freeze({
 messages:{table:"messages",id:"id",label:"body",owner:"sender_id"},
 threads:{table:"threads",id:"id",label:"title",owner:"user_id"},
 posts:{table:"posts",id:"id",label:"body",owner:"user_id"},
 chaos_conversations:{table:"chaos_conversations",id:"id",label:"title",owner:"user_id",textId:true},
 personal_bots:{table:"personal_bots",id:"id",label:"name",owner:"owner_id",textId:true},
 personal_bot_chat_messages:{table:"personal_bot_chat_messages",id:"id",label:"content",owner:"user_id"},
 profile_photos:{table:"profile_photos",id:"id",label:"caption",owner:"user_id",storage:"PROFILE_MEDIA"},
 vault_items:{table:"vault_items",id:"object_key",label:"filename",owner:"uploaded_by",storage:"VAULT",textId:true},
 chaos_memories:{table:"chaos_memories",id:"id",label:"memory",owner:"user_id"},
 member_memos:{table:"member_memos",id:"id",label:"title",owner:"user_id"},
 member_memo_mail:{table:"member_memo_mail",id:"id",label:"subject",owner:"sender_id"},
 moon_journal:{table:"moon_journal",id:"entry_date",label:"title",owner:"user_id",dateId:true},
 shadow_journal:{table:"shadow_journal",id:"entry_date",label:"title",owner:"user_id",dateId:true},
 media_albums:{table:"media_albums",id:"id",label:"name",owner:"owner_id"},
 shop_products:{table:"shop_products",id:"id",label:"name",owner:null,textId:true},
 die_ary_entries:{table:"die_ary_entries",id:"id",label:"title",owner:"user_id"},
 site_activity_posts:{table:"site_activity_posts",id:"id",label:"title",owner:"user_id"},
 creator_posts:{table:"creator_posts",id:"id",label:"title",owner:"creator_id",textId:true},
 vault_folders:{table:"vault_folders",id:"id",label:"name",owner:null}
});
function parseId(type,value){
 if(type.dateId)return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:null;
 if(type.textId)return typeof value==="string"&&value.length>0&&value.length<=160&&/^[a-z0-9/_-]+$/i.test(value)?value:null;
 const num=Number(value);return Number.isSafeInteger(num)&&num>0?num:null;
}
function eligible(type,id,userId){
 const predicate=type.dateId?" AND user_id=?":"";
 return {sql:"SELECT "+type.id+" AS id,deleted_at"+(type.storage?",object_key":"")+" FROM "+type.table+" WHERE "+type.id+"=?"+predicate+" AND deleted_at IS NOT NULL",
   args:type.dateId?[id,userId]:[id]};
}
async function deleteStorage(env,type,row){
 if(!type.storage)return;
 if(!env[type.storage])throw Error("Private file storage unavailable.");
 await env[type.storage].delete(row.object_key);
}
export async function handleGodTrash(request,env,url,{requireUser,json,origin}){
 const prefix="/api/god/trash";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))return null;
 const response=(value,status=200)=>json(value,status,origin,{"cache-control":"private, no-store"});
 const user=await requireUser(request,env);
 if(!user)return response({error:"Authentication required."},401);
 if(!canAccessEyeOfHorus(user))return response({error:"Only God may view or finalize deleted content."},403);
 if(url.pathname===prefix&&request.method==="GET"){
   const category=url.searchParams.get("category")||"all";
   if(category!=="all"&&!Object.hasOwn(TYPES,category))return response({error:"Unknown deleted-content category."},400);
   const targets=category==="all"?Object.entries(TYPES):[[category,TYPES[category]]];
   const groups=await Promise.all(targets.map(async([key,type])=>{
     const query="SELECT "+type.id+" AS id,"+(type.owner||"NULL")+" AS user_id,"+type.label+" AS label,deleted_at FROM "+type.table+" WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 70";
     const r=await env.DB.prepare(query).all();
     return (r.results||[]).map(x=>({category:key,id:String(x.id),user_id:x.user_id,label:String(x.label||"").slice(0,180),deleted_at:x.deleted_at}));
   }));
   const items=groups.flat().sort((a,b)=>String(b.deleted_at).localeCompare(String(a.deleted_at))).slice(0,250);
   return response({items,categories:Object.keys(TYPES)});
 }
 const match=url.pathname.match(/^\/api\/god\/trash\/([a-z_]+)\/([^/]+)\/(restore|purge)$/);
 if(!match)return response({error:"Unknown recovery route."},404);
 if(request.method!=="POST")return response({error:"Method not allowed."},405);
 if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("Origin")))
   return response({error:"Untrusted request origin."},403);
 const category=match[1],type=TYPES[category],id=type?parseId(type,decodeURIComponent(match[2])):null,action=match[3];
 if(!type||id===null)return response({error:"Unknown item."},404);
 const userId=type.dateId?Number(url.searchParams.get("user_id")):null;
 if(type.dateId&&(!Number.isSafeInteger(userId)||userId<1))return response({error:"Member ID required for dated journal entry."},400);
 const check=eligible(type,id,userId),row=await env.DB.prepare(check.sql).bind(...check.args).first();
 if(!row)return response({error:"Item is not soft-deleted or no longer exists."},404);
 const where=type.id+"=?"+(type.dateId?" AND user_id=?":"")+" AND deleted_at IS NOT NULL";
 if(action==="restore"){
   if(category==="member_memo_mail")await env.DB.prepare("UPDATE member_memo_mail SET sender_archived_at=NULL,recipient_archived_at=NULL WHERE id=?").bind(id).run();
   await env.DB.prepare("UPDATE "+type.table+" SET deleted_at=NULL WHERE "+where).bind(...check.args).run();
   return response({ok:true,restored:true,category,id});
 }
 // The destructive path is reachable only here after a verified soft-delete.
 // Purge linked files and report rows before deleting the parent record.
 if(category==="messages"){
   const attachments=await env.DB.prepare("SELECT id,object_key FROM message_attachments WHERE message_id=?").bind(id).all();
   if((attachments.results||[]).length){
     if(!env.MESSAGE_ATTACHMENTS)return response({error:"Attachment storage unavailable; no data deleted."},503);
     for(const file of attachments.results)await env.MESSAGE_ATTACHMENTS.delete(file.object_key);
     await env.DB.prepare("DELETE FROM message_attachments WHERE message_id=?").bind(id).run();
   }
   await env.DB.prepare("DELETE FROM message_reports WHERE message_id=?").bind(id).run();
 }else if(category==="threads"){
   await env.DB.prepare("DELETE FROM reports WHERE thread_id=? OR post_id IN(SELECT id FROM posts WHERE thread_id=?)").bind(id,id).run();
   await env.DB.prepare("DELETE FROM posts WHERE thread_id=?").bind(id).run();
 }else if(category==="posts"){
   await env.DB.prepare("DELETE FROM reports WHERE post_id=?").bind(id).run();
 }else if(category==="personal_bots"){
   await env.DB.prepare("DELETE FROM personal_bot_chat_messages WHERE bot_id=?").bind(id).run();
   await env.DB.prepare("DELETE FROM personal_bot_memory WHERE bot_id=?").bind(id).run();
 }else if(category==="vault_items"){
   await deleteStorage(env,type,row);
   await env.DB.prepare("DELETE FROM vault_folder_items WHERE object_key=?").bind(id).run();
 }else if(category==="profile_photos"){
   await deleteStorage(env,type,row);
 }else if(category==="vault_folders"){
   await env.DB.prepare("DELETE FROM vault_folder_items WHERE folder_id=?").bind(id).run();
 }
 await env.DB.prepare("DELETE FROM "+type.table+" WHERE "+where).bind(...check.args).run();
 return response({ok:true,purged:true,category,id});
}
