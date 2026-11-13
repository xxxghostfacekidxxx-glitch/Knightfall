/**
 * Member-only message-history search. All result rows must join the requesting
 * user's conversation membership; administrators use a separate archive route.
 */
export function messageSearchPattern(term) {
  return "%"+String(term).replace(/[\\%_]/g,"\\$&")+"%";
}

function positiveInteger(raw) {
  if (raw === null || !/^[1-9]\d*$/.test(String(raw))) return null;
  const n=Number(raw);
  return Number.isSafeInteger(n)?n:null;
}

export async function handleMessageSearch(request,env,url,{getUser,json,origin,rateLimit}) {
  if (url.pathname!=="/api/messages/search") return null;
  if (request.method!=="GET") return json({error:"Method not allowed."},405,origin);
  const user=await getUser(request,env);
  if (!user) return json({error:"Authentication required."},401,origin);
  const query=String(url.searchParams.get("q")||"").trim().slice(0,120);
  if(query.length<2) return json({error:"Search for at least two characters."},400,origin);
  if(rateLimit&&!await rateLimit(env,request,"message-history-search",60,60,user.id))
    return json({error:"Too many searches. Try again in a moment."},429,origin);
  const requestedConversation=url.searchParams.get("conversation_id");
  const conversationId=requestedConversation===null?0:positiveInteger(requestedConversation);
  if(conversationId===null)return json({error:"Invalid conversation."},400,origin);
  const rawBefore=url.searchParams.get("before");
  const before=rawBefore===null?0:positiveInteger(rawBefore);
  if(before===null)return json({error:"Invalid search cursor."},400,origin);
  const rawLimit=Number(url.searchParams.get("limit")||25);
  const limit=Number.isFinite(rawLimit)?Math.min(50,Math.max(1,Math.trunc(rawLimit))):25;
  if(conversationId){
    const member=await env.DB.prepare(
      "SELECT 1 AS ok FROM conversation_members WHERE conversation_id=? AND user_id=?"
    ).bind(conversationId,user.id).first();
    if(!member) return json({error:"Conversation not found."},404,origin);
  }
  const sql="SELECT m.id,m.conversation_id,m.sender_id,m.body,m.created_at,m.edited_at,"+
    "u.username,u.display_name,c.kind,c.name AS group_name,"+
    "CASE WHEN c.kind='group' THEN c.name ELSE ("+
      "SELECT COALESCE(ou.display_name,ou.username) FROM conversation_members om "+
      "JOIN users ou ON ou.id=om.user_id WHERE om.conversation_id=c.id AND om.user_id<>? LIMIT 1"+
    ") END AS conversation_name "+
    "FROM messages m "+
    "JOIN conversation_members cm ON cm.conversation_id=m.conversation_id AND cm.user_id=? "+
    "JOIN conversations c ON c.id=m.conversation_id "+
    "JOIN users u ON u.id=m.sender_id "+
    "WHERE m.deleted_at IS NULL AND m.body LIKE ? ESCAPE '\\' "+
    "AND (?=0 OR m.conversation_id=?) AND (?=0 OR m.id<?) "+
    "ORDER BY m.id DESC LIMIT ?";
  const {results}=await env.DB.prepare(sql).bind(
    user.id,user.id,messageSearchPattern(query),conversationId,conversationId,
    before,before,limit+1
  ).all();
  const rows=results||[];
  const hasMore=rows.length>limit;
  const messages=rows.slice(0,limit);
  return json({
    messages,
    has_more:hasMore,
    next_before:hasMore&&messages.length?Number(messages[messages.length-1].id):null
  },200,origin);
}
