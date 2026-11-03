/* Knightfall Profile Link Hub. Public reads inherit full-profile privacy and block rules. */
export function normalizeProfileLinks(input){
 if(!Array.isArray(input)||input.length>8)return null;
 const links=[];
 for(const entry of input){
  if(!entry||typeof entry!=="object"||typeof entry.label!=="string"||typeof entry.url!=="string")return null;
  const label=entry.label.trim(),raw=entry.url.trim();
  if(!label||label.length>50||/[[\u0000-\u001f\u007f]/.test(label)||!raw||raw.length>500)return null;
  let normalized;
  try{
   const parsed=new URL(raw);
   if(parsed.protocol!=="https:"||!parsed.hostname||parsed.username||parsed.password)return null;
   normalized=parsed.href;
  }catch{return null}
  if(normalized.length>500)return null;
  links.push({label,url:normalized});
 }
 return links;
}
export async function handleProfileLinks(request,env,url,{getUser,json,origin,rateLimit,isModerator}){
 if(url.pathname!=="/api/profile/links")return null;
 const respond=(payload,status=200)=>json(payload,status,origin);
 const viewer=await getUser(request,env);
 if(request.method==="GET"){
  const username=String(url.searchParams.get("username")||"").trim();
  let target;
  if(username){
   if(!/^[a-z0-9_]{3,24}$/i.test(username))return respond({error:"Invalid username."},400);
   target=await env.DB.prepare("SELECT id,profile_visibility FROM users WHERE username=? AND status='active'").bind(username).first();
   if(!target)return respond({error:"Member not found."},404);
   if(Number(viewer?.id)!==Number(target.id)&&!isModerator(viewer)){
    const blocked=viewer?await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(viewer.id,target.id,target.id,viewer.id).first():null;
    if(blocked)return respond({error:"Member profile unavailable."},403);
    if(target.profile_visibility==="private")return respond({error:"Member profile is private."},404);
    if(target.profile_visibility==="friends"){
     if(!viewer)return respond({error:"Sign in to view this profile."},401);
     const accepted=await env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(viewer.id,target.id,target.id,viewer.id).first();
     if(!accepted)return respond({error:"Friends only."},403);
    }
   }
  }else{
   if(!viewer)return respond({error:"Sign in to edit your profile links."},401);
   target={id:viewer.id};
  }
  const rows=await env.DB.prepare("SELECT position,label,url FROM member_profile_links WHERE user_id=? ORDER BY position ASC LIMIT 8").bind(target.id).all();
  return respond({links:(rows.results||[]).map(({label,url})=>({label,url})),limit:8});
 }
 if(request.method!=="PUT")return respond({error:"Unsupported method."},405);
 if(!viewer)return respond({error:"Sign in to edit your profile links."},401);
 if(!await rateLimit(env,request,"profile-links-save",20,60,viewer.id))return respond({error:"Too many profile changes. Try again shortly."},429);
 let body;
 try{body=await request.json()}catch{return respond({error:"Invalid JSON."},400)}
 const links=normalizeProfileLinks(body?.links);
 if(!links)return respond({error:"Choose at most eight HTTPS links with a title (50 characters maximum) and URL (500 maximum)."},400);
 const now=new Date().toISOString();
 const statements=[env.DB.prepare("DELETE FROM member_profile_links WHERE user_id=?").bind(viewer.id)];
 for(const [position,{label,url:address}] of links.entries()){
  statements.push(env.DB.prepare("INSERT INTO member_profile_links(user_id,position,label,url,updated_at) VALUES(?,?,?,?,?)").bind(viewer.id,position,label,address,now));
 }
 await env.DB.batch(statements);
 return respond({ok:true,links,limit:8});
}
