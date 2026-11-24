/** Load only the authenticated owner's persisted turns for one personal bot. */
export async function loadPersonalBotChatHistory(db,botId,userId,limit=8){
 const boundedLimit=Math.max(1,Math.min(20,Math.trunc(Number(limit)||8)));
 const {results}=await db.prepare(`SELECT role,content FROM personal_bot_chat_messages
  WHERE bot_id=? AND user_id=? AND deleted_at IS NULL AND role IN ('user','assistant')
  ORDER BY id DESC LIMIT ?`).bind(botId,userId,boundedLimit).all();
 return (results||[]).reverse().map(message=>({
  role:message.role,
  content:String(message.content||"").slice(0,2500)
 }));
}
