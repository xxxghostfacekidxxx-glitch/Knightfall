/* Private Memo Mail is not member chat. Memos are immutable delivered snapshots. */
export async function handleMemberMemoMail(request,env,url,{getUser,json,rateLimit,origin,createNotification}){
 const path=url.pathname;
 if(!/^\/api\/memo-mail(?:\/\d+(?:\/read)?)?$/.test(path))return null;
 const respond=(data,status=200)=>json(data,status,origin);
 const user=await getUser(request,env);
 if(!user)return respond({error:'Sign in to use Memo Mail.'},401);
 const item=path.match(/^\/api\/memo-mail\/(\d+)(\/read)?$/),id=item?Number(item[1]):0;
 if(item&&(!Number.isSafeInteger(id)||id<1))return respond({error:'Invalid memo.'},400);
 if(path==='/api/memo-mail'&&request.method==='GET'){
  const box=url.searchParams.get('box')==='sent'?'sent':'inbox',inbox=box==='inbox';
  const where=inbox?'m.recipient_id=? AND m.recipient_archived_at IS NULL':'m.sender_id=? AND m.sender_archived_at IS NULL';
  const query='SELECT m.id,m.subject,m.body,m.created_at,m.read_at,u.username AS other_username,u.display_name AS other_name FROM member_memo_mail m JOIN users u ON u.id='+(inbox?'m.sender_id':'m.recipient_id')+' WHERE '+where+' ORDER BY m.created_at DESC,m.id DESC LIMIT 100';
  const {results}=await env.DB.prepare(query).bind(user.id).all();
  const mail=results||[];
  return respond({box,mail,unread:inbox?mail.filter(m=>!m.read_at).length:0});
 }
 if(path==='/api/memo-mail'&&request.method==='POST'){
  if(!await rateLimit(env,request,'memo-mail-send',12,600,user.id))return respond({error:'Memo sending limit reached. Try again later.'},429);
  let payload;try{payload=await request.json()}catch{return respond({error:'Invalid JSON.'},400)}
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return respond({error:'Invalid request.'},400);
  const memoId=Number(payload.memo_id),username=String(payload.username||'').trim().toLowerCase();
  if(!Number.isSafeInteger(memoId)||memoId<1||!/^[a-z0-9_]{3,24}$/.test(username))return respond({error:'Select a saved memo and a valid member.'},400);
  const memo=await env.DB.prepare('SELECT id,title,body FROM member_memos WHERE id=? AND user_id=?').bind(memoId,user.id).first();
  if(!memo)return respond({error:'Memo not found in your account.'},404);
  const subject=String(memo.title||'Untitled memo').trim(),body=String(memo.body||'').trim();
  if(!subject||subject.length>100||!body||body.length>4000)return respond({error:'Memo must have a title and text (4,000 characters maximum).'},400);
  const to=await env.DB.prepare("SELECT id,username FROM users WHERE username=? AND status='active'").bind(username).first();
  if(!to)return respond({error:'Member not found.'},404);
  if(Number(to.id)===Number(user.id))return respond({error:'You cannot send a memo to yourself.'},400);
  const blocked=await env.DB.prepare('SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1').bind(user.id,to.id,to.id,user.id).first();
  if(blocked)return respond({error:'Memo delivery is unavailable between these accounts.'},403);
  const sentAt=new Date().toISOString();
  const row=await env.DB.prepare('INSERT INTO member_memo_mail(sender_id,recipient_id,subject,body,created_at) VALUES (?,?,?,?,?) RETURNING id,created_at').bind(user.id,to.id,subject,body,sentAt).first();
  if(createNotification)await createNotification(env,{
   userId:to.id,actorId:user.id,kind:'memo',targetType:'memo_mail',targetId:row.id,
   title:'New memo from @'+user.username,body:subject,url:'/memo-pad.html?tab=inbox'
  });
  return respond({ok:true,id:row.id,recipient:to.username,created_at:row.created_at},201);
 }
 if(item?.[2]&&request.method==='POST'){
  const entry=await env.DB.prepare('UPDATE member_memo_mail SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient_id=? AND recipient_archived_at IS NULL RETURNING id,read_at').bind(new Date().toISOString(),id,user.id).first();
  return entry?respond({ok:true,id:entry.id,read_at:entry.read_at}):respond({error:'Memo not found.'},404);
 }
 if(item&&!item[2]&&request.method==='DELETE'){
  // Hide from one side only; the other person's copy remains intact.
  const mine=await env.DB.prepare('SELECT id,sender_id,recipient_id FROM member_memo_mail WHERE id=? AND (sender_id=? OR recipient_id=?)').bind(id,user.id,user.id).first();
  if(!mine)return respond({error:'Memo not found.'},404);
  const mineSent=Number(mine.sender_id)===Number(user.id),column=mineSent?'sender_archived_at':'recipient_archived_at';
  await env.DB.prepare('UPDATE member_memo_mail SET '+column+'=? WHERE id=? AND '+(mineSent?'sender_id':'recipient_id')+'=?').bind(new Date().toISOString(),id,user.id).run();
  return respond({ok:true});
 }
 return respond({error:'Unsupported memo mail method.'},405);
}
