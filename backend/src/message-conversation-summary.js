/**
 * Get metadata for a single conversation even when it is older than the
 * 100-row recent inbox. Required for shared message permalinks and searches.
 */
export async function handleMessageSummary(request,env,url,{getUser,json,origin}){
 const match=url.pathname.match(/^\/api\/messages\/conversations\/(\d+)\/summary$/);
 if(!match)return null;
 if(request.method!=="GET")return json({error:"Method not allowed."},405,origin);
 const user=await getUser(request,env);
 if(!user)return json({error:"Authentication required."},401,origin);
 const id=Number(match[1]);
 if(!Number.isSafeInteger(id)||id<1)return json({error:"Invalid conversation."},400,origin);
 // Never use the administrator archive permission for member permalink lookups.
 const member=await env.DB.prepare(
  "SELECT muted_until FROM conversation_members WHERE conversation_id=? AND user_id=?"
 ).bind(id,user.id).first();
 if(!member)return json({error:"Conversation not found."},404,origin);
 const conversation=await env.DB.prepare(
  "SELECT id,kind,name,created_at,updated_at FROM conversations WHERE id=?"
 ).bind(id).first();
 if(!conversation)return json({error:"Conversation not found."},404,origin);
 const base={
  id:Number(conversation.id),kind:conversation.kind,
  created_at:conversation.created_at,updated_at:conversation.updated_at,
  muted_until:member.muted_until,unread_count:0,messaging_blocked:0,
  other_username:null,other_display_name:null,other_avatar_url:null,
  other_last_seen_at:null,other_is_online:0,
  group_name:null,participant_count:0,online_count:0
 };
 if(conversation.kind==="group"){
  const count=await env.DB.prepare(
   "SELECT COUNT(*) AS n FROM conversation_members WHERE conversation_id=?"
  ).bind(id).first();
  return json({conversation:{...base,group_name:conversation.name||"Group conversation",
   other_display_name:conversation.name||"Group conversation",participant_count:Number(count?.n||0)}},200,origin);
 }
 if(conversation.kind!=="direct")return json({error:"Conversation unavailable."},404,origin);
 const other=await env.DB.prepare(
  "SELECT u.id,u.username,u.display_name,u.avatar_url,u.last_seen_at,"+
  "CASE WHEN u.last_seen_at IS NOT NULL AND julianday('now')-julianday(u.last_seen_at)<(5.0/1440) "+
  "THEN 1 ELSE 0 END AS other_is_online "+
  "FROM conversation_members cm JOIN users u ON u.id=cm.user_id "+
  "WHERE cm.conversation_id=? AND cm.user_id<>? LIMIT 1"
 ).bind(id,user.id).first();
 if(!other)return json({error:"Conversation not found."},404,origin);
 const blocked=await env.DB.prepare(
  "SELECT 1 AS blocked FROM user_blocks "+
  "WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1"
 ).bind(user.id,other.id,other.id,user.id).first();
 return json({conversation:{...base,other_user_id:Number(other.id),
  other_username:other.username,other_display_name:other.display_name,
  other_avatar_url:other.avatar_url,other_last_seen_at:other.last_seen_at,
  other_is_online:Number(other.other_is_online||0),messaging_blocked:blocked?1:0
 }},200,origin);
}
