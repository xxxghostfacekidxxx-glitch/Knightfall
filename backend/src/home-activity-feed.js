// Public homepage news. Staff-only writes are checked here and in D1.
const STAFF_ROLES = new Set(["god","admin","moderator"]);
export function canPublishHomeActivity(user) {
  return !!user && (STAFF_ROLES.has(String(user.role||"").toLowerCase()) ||
    String(user.public_title||"").trim().toLowerCase()==="digital creator");
}
export async function handleHomeActivityFeed(request,env,url,{requireUser,json,rateLimit,audit,origin}) {
  const base="/api/home/activity";
  const match=url.pathname.match(/^\/api\/home\/activity\/(\d{1,12})$/);
  if(url.pathname!==base&&!match)return null;
  if(url.pathname===base && request.method==="GET") {
    const rawLimit=Number(url.searchParams.get("limit"));
    const limit=Number.isInteger(rawLimit)&&rawLimit>0?Math.min(rawLimit,20):10;
    const rawBefore=url.searchParams.get("before");
    const before=rawBefore&&/^\d+$/.test(rawBefore)?Math.min(Number(rawBefore),Number.MAX_SAFE_INTEGER):Number.MAX_SAFE_INTEGER;
    const viewer=await requireUser(request,env);
    const {results}=await env.DB.prepare(
      "SELECT p.id,p.title,p.body,p.category,p.created_at,u.username,u.display_name,u.avatar_url,u.role,(SELECT title FROM member_bot_creator_privileges WHERE user_id=u.id) AS public_title FROM site_activity_posts p JOIN users u ON u.id=p.user_id WHERE u.status='active' AND p.id<? ORDER BY p.id DESC LIMIT ?"
    ).bind(before,limit).all();
    const posts=(results||[]).map(p=>({
      id:p.id,title:p.title,body:p.body,category:p.category,created_at:p.created_at,
      username:p.username,display_name:p.display_name,avatar_url:p.avatar_url,
      author_title:p.public_title||({god:"God",admin:"Administrator",moderator:"Moderator"}[p.role]||"Staff"),
      can_delete:!!viewer&&canPublishHomeActivity(viewer)&&
        (STAFF_ROLES.has(String(viewer.role||"").toLowerCase())||viewer.username===p.username)
    }));
    return json({posts,can_post:canPublishHomeActivity(viewer),
      next_before:posts.length===limit?posts[posts.length-1].id:null},200,origin);
  }
  const user=await requireUser(request,env);
  if(!user)return json({error:"Sign in to manage official activity."},401,origin);
  if(!canPublishHomeActivity(user))return json({error:"Only Knightfall staff may publish homepage activity."},403,origin);
  if(match&&request.method==="DELETE") {
    const id=Number(match[1]);
    if(!Number.isSafeInteger(id)||id<1)return json({error:"Invalid post ID."},400,origin);
    const record=await env.DB.prepare("SELECT user_id FROM site_activity_posts WHERE id=?").bind(id).first();
    if(!record)return json({error:"Post not found."},404,origin);
    const canModerate=STAFF_ROLES.has(String(user.role||"").toLowerCase());
    if(!canModerate&&Number(record.user_id)!==Number(user.id))return json({error:"You can only remove your own posts."},403,origin);
    await env.DB.prepare("DELETE FROM site_activity_posts WHERE id=?").bind(id).run();
    await audit(env,user,"home_activity.delete","site_activity_post",id);
    return json({ok:true},200,origin);
  }
  if(url.pathname!==base||request.method!=="POST")
    return json({error:"Method not allowed."},405,origin,{allow:match?"DELETE":"GET, POST"});
  if(!await rateLimit(env,request,"home-activity-post",8,3600,user.id))
    return json({error:"Too many announcements. Try again later."},429,origin);
  let data;try{data=await request.json()}catch{return json({error:"Invalid JSON."},400,origin)}
  const title=typeof data.title==="string"?data.title.trim():"";
  const body=typeof data.body==="string"?data.body.trim():"";
  const category=typeof data.category==="string"?data.category:"update";
  if(title.length<1||title.length>120||body.length<1||body.length>2000||
     !["update","announcement","event"].includes(category))
    return json({error:"Provide a title (1–120 characters), body (1–2,000 characters), and valid category."},400,origin);
  const result=await env.DB.prepare(
    "INSERT INTO site_activity_posts (user_id,title,body,category) VALUES (?,?,?,?)"
  ).bind(user.id,title,body,category).run();
  await audit(env,user,"home_activity.create","site_activity_post",result.meta?.last_row_id,{category});
  return json({ok:true,id:result.meta?.last_row_id},201,origin);
}
