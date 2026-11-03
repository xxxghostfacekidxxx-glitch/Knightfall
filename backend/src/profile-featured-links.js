/* Knightfall featured profile links. Owner-only writes and profile-visibility-aware reads. */
const TYPES=new Set(['website','social','music','art','gaming','other']);
const HTTPS='https:';
export function normalizeProfileLinks(input){
 if(!Array.isArray(input)||input.length>6)return {error:'Choose up to six featured links.'};
 const result=[],seen=new Set();
 for(const raw of input){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {error:'Every link must have a label and URL.'};
  if(typeof raw.label!=='string'||typeof raw.url!=='string'||typeof raw.category!=='string')return {error:'Enter a label, URL and category for every link.'};
  const label=raw.label.trim(),category=raw.category.trim().toLowerCase();
  if(label.length<1||label.length>50||!TYPES.has(category))return {error:'Link labels must be 1 to 50 characters and have a supported category.'};
  let parsed;
  try{parsed=new URL(raw.url.trim())}catch{return {error:'Enter a valid HTTPS website address.'}}
  if(parsed.protocol!==HTTPS||!parsed.hostname||parsed.username||parsed.password)return {error:'Only direct HTTPS links without embedded passwords are allowed.'};
  if(parsed.href.length>500)return {error:'A featured link cannot exceed 500 characters.'};
  if(/[\u0000-\u001f\u007f]/.test(raw.url)||/[\u0000-\u001f\u007f]/.test(label))return {error:'Links cannot contain control characters.'};
  if(seen.has(parsed.href))return {error:'The same website cannot be featured twice.'};
  seen.add(parsed.href);result.push({label,url:parsed.href,category});
 }
 return {links:result};
}
export async function handleProfileFeaturedLinks(request,env,url,{getUser,isModerator,rateLimit,json,origin}){
 const reply=(body,status=200)=>json(body,status,origin);
 if(url.pathname!=='/api/profile/links')return null;
 const method=request.method;
 if(method!=='GET'&&method!=='PUT')return reply({error:'Unsupported featured links method.'},405);
 const viewer=await getUser(request,env);
 if(method==='PUT'){
  if(!viewer)return reply({error:'Sign in to edit featured links.'},401);
  if(!await rateLimit(env,request,'profile-featured-links',18,60,viewer.id))return reply({error:'Too many profile changes. Try again shortly.'},429);
  let payload;try{payload=await request.json()}catch{return reply({error:'Invalid JSON.'},400)}
  const normalized=normalizeProfileLinks(payload?.links);
  if(normalized.error)return reply({error:normalized.error},400);
  const now=new Date().toISOString();
  const statements=[env.DB.prepare('DELETE FROM profile_featured_links WHERE user_id=?').bind(viewer.id)];
  normalized.links.forEach((entry,index)=>{
   statements.push(env.DB.prepare('INSERT INTO profile_featured_links (user_id,label,url,category,sort_order,updated_at) VALUES (?,?,?,?,?,?)').bind(viewer.id,entry.label,entry.url,entry.category,index,now));
  });
  await env.DB.batch(statements);
  return reply({ok:true,links:normalized.links});
 }
 const requestedUsername=String(url.searchParams.get('username')||'').trim().toLowerCase();
 let owner;
 if(requestedUsername){
  if(!/^[a-z0-9_]{3,24}$/.test(requestedUsername))return reply({error:'Invalid profile username.'},400);
  owner=await env.DB.prepare("SELECT id,username,profile_visibility FROM users WHERE username=? AND status='active'").bind(requestedUsername).first();
  if(!owner)return reply({error:'Profile not found.'},404);
 }else{
  if(!viewer)return reply({error:'Sign in to view your links.'},401);
  owner={id:viewer.id,username:viewer.username,profile_visibility:viewer.profile_visibility};
 }
 const own=viewer&&Number(viewer.id)===Number(owner.id),moderator=!!isModerator(viewer);
 if(!own&&!moderator){
  if(owner.profile_visibility==='private')return reply({error:'This profile is private.'},404);
  if(owner.profile_visibility==='friends'){
   if(!viewer)return reply({error:'Sign in to view this profile.'},401);
   const friend=await env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(viewer.id,owner.id,owner.id,viewer.id).first();
   if(!friend)return reply({error:'This profile is visible to friends only.'},403);
  }
 }
 const rows=await env.DB.prepare('SELECT label,url,category FROM profile_featured_links WHERE user_id=? ORDER BY sort_order ASC,id ASC LIMIT 6').bind(owner.id).all();
 return reply({username:owner.username,links:rows.results||[]});
}
