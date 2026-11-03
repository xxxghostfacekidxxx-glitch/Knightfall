/* Private, owner-scoped notes. Server-side sends use existing messaging APIs. */
export async function handleMemberMemos(request,env,url,{getUser,json,rateLimit,origin}){
 const path=url.pathname;
 if(!/^\/api\/memos(?:\/\d+)?$/.test(path))return null;
 const respond=(body,status=200)=>json(body,status,origin);
 const user=await getUser(request,env);
 if(!user)return respond({error:'Sign in to access your Memo Pad.'},401);
 const memoMatch=path.match(/^\/api\/memos\/(\d+)$/);
 const id=memoMatch?Number(memoMatch[1]):null;
 if(id!==null&&(!Number.isSafeInteger(id)||id<1))return respond({error:'Invalid memo ID.'},400);
 if(path==='/api/memos'&&request.method==='GET'){
  const {results}=await env.DB.prepare('SELECT id,title,body,created_at,updated_at FROM member_memos WHERE user_id=? ORDER BY updated_at DESC,id DESC LIMIT 100').bind(user.id).all();
  return respond({memos:results||[],limit:100});
 }
 if(memoMatch&&request.method==='GET'){
  const memo=await env.DB.prepare('SELECT id,title,body,created_at,updated_at FROM member_memos WHERE id=? AND user_id=?').bind(id,user.id).first();
  return memo?respond({memo}):respond({error:'Memo not found.'},404);
 }
 if(!['POST','PATCH','DELETE'].includes(request.method))return respond({error:'Unsupported method.'},405);
 if(!await rateLimit(env,request,'memo-write',40,60,user.id))return respond({error:'Too many memo changes. Try again shortly.'},429);
 if(memoMatch&&request.method==='DELETE'){
  const result=await env.DB.prepare('DELETE FROM member_memos WHERE id=? AND user_id=?').bind(id,user.id).run();
  return Number(result.meta?.changes||0)>0?respond({ok:true}):respond({error:'Memo not found.'},404);
 }
 if(path==='/api/memos'&&request.method!=='POST')return respond({error:'Unsupported method.'},405);
 if(memoMatch&&request.method!=='PATCH')return respond({error:'Unsupported method.'},405);
 let payload;
 try{payload=await request.json()}catch{return respond({error:'Invalid JSON.'},400)}
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return respond({error:'Invalid memo.'},400);
 if(typeof payload.title!=='string'||typeof payload.body!=='string')return respond({error:'Title and note text are required.'},400);
 const title=payload.title.trim()||'Untitled memo',body=payload.body.trimEnd();
 if(title.length>100||body.length>4000)return respond({error:'Memo title must be at most 100 characters and text at most 4,000.'},400);
 const now=new Date().toISOString();
 if(!memoMatch){
  const count=await env.DB.prepare('SELECT COUNT(*) AS count FROM member_memos WHERE user_id=?').bind(user.id).first();
  if(Number(count?.count||0)>=100)return respond({error:'Memo limit reached (100). Delete an old memo first.'},409);
  const memo=await env.DB.prepare('INSERT INTO member_memos (user_id,title,body,created_at,updated_at) VALUES (?,?,?,?,?) RETURNING id,title,body,created_at,updated_at').bind(user.id,title,body,now,now).first();
  return respond({memo},201);
 }
 const memo=await env.DB.prepare('UPDATE member_memos SET title=?,body=?,updated_at=? WHERE id=? AND user_id=? RETURNING id,title,body,created_at,updated_at').bind(title,body,now,id,user.id).first();
 return memo?respond({memo}):respond({error:'Memo not found.'},404);
}
