/* Public profile showcase and verified milestones. Never trust client claim counts. */
const VALID_NAME=/^[a-zA-Z0-9_-]{1,32}$/;
const MILESTONES=[
 {key:"first_words",label:"First Words",icon:"✍️",goal:1,field:"threads",description:"Start your first community thread"},
 {key:"voice_of_chaos",label:"Voice of Chaos",icon:"📢",goal:10,field:"replies",description:"Contribute ten forum replies"},
 {key:"visual_alchemist",label:"Visual Alchemist",icon:"🎨",goal:3,field:"photos",description:"Upload three gallery creations"},
 {key:"crowd_magnet",label:"Crowd Magnet",icon:"🧲",goal:10,field:"followers",description:"Earn ten followers"},
 {key:"spark_starter",label:"Spark Starter",icon:"🔥",goal:5,field:"reactions",description:"Earn five reactions on your updates"},
 {key:"conversation_starter",label:"Conversation Starter",icon:"💬",goal:5,field:"comments",description:"Receive five comments on your updates"}
];
const identity=n=>Number.isSafeInteger(n)&&n>0;
const isOwn=(viewer,owner)=>!!viewer&&Number(viewer.id)===Number(owner.id);
async function profileGate(env,owner,viewer,h){
 if(!owner||owner.status!=="active")return {status:404,error:"Profile not found."};
 if(isOwn(viewer,owner))return null;
 if(viewer){
  const blocked=await env.DB.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(viewer.id,owner.id,owner.id,viewer.id).first();
  if(blocked)return {status:404,error:"Profile not found."};
 }
 if(owner.profile_visibility==="private"&&!h.isModerator(viewer))return {status:404,error:"Profile not found."};
 if(owner.profile_visibility==="friends"&&!h.isAdmin(viewer)){
  if(!viewer)return {status:401,error:"Sign in to view this profile."};
  const friend=await env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(viewer.id,owner.id,owner.id,viewer.id).first();
  if(!friend)return {status:403,error:"This profile is visible to friends only."};
 }
 return null;
}
export function profileMilestones(counts,own){
 const earned=MILESTONES.map(m=>{
  const progress=Math.max(0,Number(counts[m.field]||0));
  return {...m,progress:Math.min(m.goal,progress),earned:progress>=m.goal};
 });
 return own?earned:earned.filter(x=>x.earned);
}
export async function handleProfileShowcase(request,env,url,h){
 if(url.pathname!=="/api/profile-showcase")return null;
 const {json,origin,requireUser,rateLimit}=h;
 const viewer=await requireUser(request,env);
 if(request.method==="GET"){
  const username=String(url.searchParams.get("username")||"").trim();
  if(!VALID_NAME.test(username))return json({error:"Valid username required."},400,origin);
  const owner=await env.DB.prepare("SELECT id,username,status,profile_visibility FROM users WHERE username=?").bind(username.toLowerCase()).first();
  const denied=await profileGate(env,owner,viewer,h);
  if(denied)return json({error:denied.error},denied.status,origin);
  const q=env.DB.prepare("SELECT fc.slot,p.id AS photo_id,p.caption,p.created_at FROM profile_featured_creations fc JOIN profile_photos p ON p.id=fc.photo_id AND p.user_id=fc.user_id AND p.kind='gallery' WHERE fc.user_id=? ORDER BY fc.slot ASC").bind(owner.id);
  const sql=[
   "SELECT COUNT(*) AS n FROM threads WHERE user_id=? AND deleted_at IS NULL",
   "SELECT COUNT(*) AS n FROM posts WHERE user_id=? AND deleted_at IS NULL",
   "SELECT COUNT(*) AS n FROM profile_photos WHERE user_id=? AND kind='gallery'",
   "SELECT COUNT(*) AS n FROM follows WHERE following_id=?",
   "SELECT COUNT(*) AS n FROM profile_wall_reactions r JOIN social_activity a ON a.id=r.activity_id WHERE a.user_id=? AND a.deleted_at IS NULL AND a.activity_type='status'",
   "SELECT COUNT(*) AS n FROM profile_wall_comments c JOIN social_activity a ON a.id=c.activity_id WHERE a.user_id=? AND a.deleted_at IS NULL AND a.activity_type='status' AND c.deleted_at IS NULL"
  ];
  const [featured,...values]=await Promise.all([q.all(),...sql.map(q=>env.DB.prepare(q).bind(owner.id).first())]);
  const counts=Object.fromEntries(["threads","replies","photos","followers","reactions","comments"].map((k,i)=>[k,Number(values[i]?.n||0)]));
  const own=isOwn(viewer,owner);
  return json({username:owner.username,own_profile:own,featured:(featured.results||[]).map(p=>({...p,url:"https://api.ash-fall.com/api/profile-media/"+Number(p.photo_id)})),achievements:profileMilestones(counts,own),earned_total:profileMilestones(counts,false).length,achievement_total:MILESTONES.length},200,origin);
 }
 if(request.method==="PUT"){
  if(!viewer)return json({error:"Sign in to feature your creations."},401,origin);
  if(!await rateLimit(env,request,"profile-showcase",15,300,viewer.id))return json({error:"Too many showcase changes. Please try again later."},429,origin);
  let body;try{body=await request.json()}catch{return json({error:"Invalid JSON."},400,origin)}
  const ids=body?.photo_ids;
  if(!Array.isArray(ids)||ids.length>3||ids.some(id=>!identity(id))||new Set(ids).size!==ids.length)
   return json({error:"Choose up to three different photos from your own gallery."},400,origin);
  if(ids.length){
   const placeholders=ids.map(()=>"?").join(",");
   const results=await env.DB.prepare("SELECT id FROM profile_photos WHERE user_id=? AND kind='gallery' AND id IN ("+placeholders+")").bind(viewer.id,...ids).all();
   if((results.results||[]).length!==ids.length)return json({error:"Only your own uploaded gallery photos can be featured."},403,origin);
  }
  const queries=[env.DB.prepare("DELETE FROM profile_featured_creations WHERE user_id=?").bind(viewer.id)];
  ids.forEach((photoId,index)=>queries.push(env.DB.prepare("INSERT INTO profile_featured_creations(user_id,photo_id,slot,created_at) SELECT ?,?, ?,? WHERE EXISTS(SELECT 1 FROM profile_photos WHERE id=? AND user_id=? AND kind='gallery')").bind(viewer.id,photoId,index+1,new Date().toISOString(),photoId,viewer.id)));
  await env.DB.batch(queries);
  return json({ok:true,photo_ids:ids},200,origin);
 }
 return json({error:"Unsupported showcase operation."},405,origin);
}
