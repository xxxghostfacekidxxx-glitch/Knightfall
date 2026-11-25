// Keyed sends require a separately reviewed additive schema migration.
export async function keyedSendAvailable(db){
 try{const row=await db.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('messages') WHERE name IN ('client_message_id','client_payload_hash')").first();const idx=await db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='index' AND name='messages_client_message_unique'").first();return Number(row?.n)===2&&!!idx;}catch{return false;}
}
export function validSendKey(key){return typeof key==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key);}
export async function payloadHash(message,ids){const bytes=new TextEncoder().encode(JSON.stringify([message,[...ids].sort((a,b)=>a-b)]));const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");}
export async function findKeyedSend(db,conversationId,userId,key){
 return db.prepare("SELECT m.id,m.client_payload_hash FROM messages m JOIN conversation_members cm ON cm.conversation_id=m.conversation_id AND cm.user_id=? WHERE m.conversation_id=? AND m.sender_id=? AND m.client_message_id=? AND m.id>cm.joined_after_message_id").bind(userId,conversationId,userId,key).first();
}
export async function createKeyedSend(db,{conversationId,userId,message,now,key,hash,attachmentIds}){
 const params=[conversationId,userId,message,now,key,hash,conversationId,userId];
 let guard="";
 if(attachmentIds.length){guard=" AND (SELECT COUNT(*) FROM message_attachments WHERE conversation_id=? AND uploader_id=? AND message_id IS NULL AND id IN ("+attachmentIds.map(()=>"?").join(",")+"))=?";params.push(conversationId,userId,...attachmentIds,attachmentIds.length);}
 const insert=db.prepare("INSERT INTO messages (conversation_id,sender_id,body,created_at,client_message_id,client_payload_hash) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id=? AND user_id=?)"+guard+" ON CONFLICT(conversation_id,sender_id,client_message_id) DO NOTHING").bind(...params);
 const statements=[insert];
 if(attachmentIds.length)statements.push(db.prepare("UPDATE message_attachments SET message_id=(SELECT m.id FROM messages m WHERE m.conversation_id=? AND m.sender_id=? AND m.client_message_id=? AND m.client_payload_hash=?) WHERE conversation_id=? AND uploader_id=? AND message_id IS NULL AND id IN ("+attachmentIds.map(()=>"?").join(",")+") AND changes()=1").bind(conversationId,userId,key,hash,conversationId,userId,...attachmentIds));
 // D1 batch is transactional; attachment binding cannot commit separately.
 const result=await db.batch(statements);
 const row=await findKeyedSend(db,conversationId,userId,key);
 if(!row)return {status:409,error:"Conversation access or pending attachments changed. Review your draft."};
 if(row.client_payload_hash!==hash)return {status:409,error:"This send identifier was already used for another message."};
 return {status:Number(result[0]?.meta?.changes)===1?201:200,id:Number(row.id)};
}
