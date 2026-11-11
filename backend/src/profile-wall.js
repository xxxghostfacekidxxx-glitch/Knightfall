/* Knightfall member wall: status posts, owner edits, reactions and comments.
   All visibility decisions are enforced here, never by client-provided flags. */
const PROFILE_NAME=/^[a-zA-Z0-9_-]{1,32}$/;
const VALID_REACTIONS=new Set(["fire","heart","skull"]);
const POST_LIMIT=12;
function idFrom(value){
  if(!/^[1-9][0-9]*$/.test(String(value||"")))return 0;
  const number=Number(value);
  return Number.isSafeInteger(number)?number:0;
}
function readingList(viewer,owner,following,friends){
  const values=["public"];
  if(viewer?.id===owner.id)values.push("followers","friends","private");
  else{
    if(following)values.push("followers");
    if(friends)values.push("friends");
  }
  return values;
}
async function friendOf(db,a,b){
  if(!a||!b)return false;
  return !!(await db.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(a,b,b,a).first());
}
async function followingUser(db,a,b){
  if(!a||!b)return false;
  return !!(await db.prepare("SELECT 1 FROM follows WHERE follower_id=? AND following_id=?").bind(a,b).first());
}
async function blockBetween(db,a,b){
  if(!a||!b||a===b)return false;
  return !!(await db.prepare("SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1").bind(a,b,b,a).first());
}
async function memberAccess(env,owner,viewer,helpers){
  if(!owner||owner.status!=="active")return {status:404,error:"Member unavailable."};
  if(viewer?.id===owner.id)return {friends:true,following:true};
  if(await blockBetween(env.DB,viewer?.id,owner.id))return {status:404,error:"Member unavailable."};
  if(owner.profile_visibility==="private"&&!helpers.isModerator(viewer))return {status:404,error:"Member unavailable."};
  const friends=await friendOf(env.DB,viewer?.id,owner.id);
  if(owner.profile_visibility==="friends"&&!friends&&!helpers.isAdmin(viewer))
    return {status:viewer?403:401,error:"This profile is only visible to friends."};
  const following=await followingUser(env.DB,viewer?.id,owner.id);
  return {friends,following};
}
function canReadPost(post,viewer,relationship){
  if(viewer?.id===post.user_id)return true;
  if(post.visibility==="public")return true;
  if(post.visibility==="followers")return relationship.following;
  if(post.visibility==="friends")return relationship.friends;
  return false;
}
async function readPost(env,postId,viewer,helpers){
  const post=await env.DB.prepare("SELECT a.id,a.user_id,a.body,a.visibility,a.created_at,a.updated_at,a.deleted_at,u.username,u.display_name,u.profile_visibility,u.status FROM social_activity a JOIN users u ON u.id=a.user_id WHERE a.id=? AND a.activity_type='status' AND a.deleted_at IS NULL LIMIT 1").bind(postId).first();
  if(!post)return {status:404,error:"Update not found."};
  const relationship=await memberAccess(env,post,viewer,helpers);
  if(relationship.status||!canReadPost(post,viewer,relationship))return {status:404,error:"Update not available."};
  return {post,relationship};
}
function fail(helpers,origin,status,error){return helpers.json({error},status,origin)}
function validBody(value,max){return typeof value==="string"&&value.trim().length>0&&value.trim().length<=max}
async function payload(request){try{const value=await request.json();return value&&typeof value==="object"&&!Array.isArray(value)?value:null}catch{return null}}
export async function handleProfileWall(request,env,url,helpers){
  const path=url.pathname;
  if(path!=="/api/profile-wall"&&!path.startsWith("/api/profile-wall/"))return null;
  const {json,requireUser,rateLimit,audit,origin}=helpers;
  const viewer=await requireUser(request,env);
  if(path==="/api/profile-wall"&&request.method==="GET"){
    const username=String(url.searchParams.get("username")||"").trim();
    if(!PROFILE_NAME.test(username))return fail(helpers,origin,400,"Provide a valid member username.");
    const owner=await env.DB.prepare("SELECT id,username,profile_visibility,status FROM users WHERE username=? LIMIT 1").bind(username.toLowerCase()).first();
    const relationship=await memberAccess(env,owner,viewer,helpers);
    if(relationship.status)return fail(helpers,origin,relationship.status,relationship.error);
    const visible=readingList(viewer,owner,relationship.following,relationship.friends);
    const marks=visible.map(() => "?").join(",");
    const rawBefore=url.searchParams.get("before");
    const before=rawBefore===null?Number.MAX_SAFE_INTEGER:idFrom(rawBefore);
    if(!before)return fail(helpers,origin,400,"Invalid pagination cursor.");
    const sql="SELECT a.id,a.user_id,a.body,a.visibility,a.created_at,a.updated_at,u.username,u.display_name,"+
      "(SELECT COUNT(*) FROM profile_wall_comments c WHERE c.activity_id=a.id AND c.deleted_at IS NULL) AS comment_count,"+
      "(SELECT COUNT(*) FROM profile_wall_reactions r WHERE r.activity_id=a.id AND r.reaction='fire') AS fire_count,"+
      "(SELECT COUNT(*) FROM profile_wall_reactions r WHERE r.activity_id=a.id AND r.reaction='heart') AS heart_count,"+
      "(SELECT COUNT(*) FROM profile_wall_reactions r WHERE r.activity_id=a.id AND r.reaction='skull') AS skull_count,"+
      "(SELECT r.reaction FROM profile_wall_reactions r WHERE r.activity_id=a.id AND r.user_id=?) AS my_reaction "+
      "FROM social_activity a JOIN users u ON u.id=a.user_id WHERE a.user_id=? AND a.activity_type='status' AND a.deleted_at IS NULL AND a.id<? AND a.visibility IN ("+marks+") ORDER BY a.id DESC LIMIT ?";
    const rows=await env.DB.prepare(sql).bind(viewer?.id||0,owner.id,before,...visible,POST_LIMIT+1).all();
    const all=rows.results||[];
    const more=all.length>POST_LIMIT;
    const posts=all.slice(0,POST_LIMIT);
    return json({posts,has_more:more,next_before:more?posts[posts.length-1]?.id:null,can_post:viewer?.id===owner.id,viewer_id:viewer?.id||null},200,origin);
  }
  const postMatch=path.match(/^\/api\/profile-wall\/posts\/([1-9][0-9]*)(?:\/(reactions|comments))?$/);
  if(postMatch){
    const postId=idFrom(postMatch[1]),part=postMatch[2]||"";
    if(!postId)return fail(helpers,origin,400,"Invalid update ID.");
    const found=await readPost(env,postId,viewer,helpers);
    if(found.status)return fail(helpers,origin,found.status,found.error);
    const post=found.post;
    if(!part&&(request.method==="PATCH"||request.method==="DELETE")){
      if(!viewer||viewer.id!==post.user_id)return fail(helpers,origin,403,"Only the author can edit or remove this update.");
      if(!await rateLimit(env,request,"profile-wall-post-edit",20,300,viewer.id))return fail(helpers,origin,429,"Too many updates. Try again later.");
      if(request.method==="DELETE"){
        await env.DB.prepare("UPDATE social_activity SET deleted_at=?,updated_at=? WHERE id=? AND user_id=? AND deleted_at IS NULL").bind(new Date().toISOString(),new Date().toISOString(),postId,viewer.id).run();
        await audit(env,viewer,"profile.wall.post.delete","social_activity",postId,{});
        return json({ok:true},200,origin);
      }
      const body=await payload(request);
      if(!body||!validBody(body.body,5000)||!["public","followers","private"].includes(body.visibility))
        return fail(helpers,origin,400,"Write 1-5,000 characters and choose a valid visibility.");
      const now=new Date().toISOString();
      await env.DB.prepare("UPDATE social_activity SET body=?,visibility=?,updated_at=? WHERE id=? AND user_id=? AND deleted_at IS NULL").bind(body.body.trim(),body.visibility,now,postId,viewer.id).run();
      await audit(env,viewer,"profile.wall.post.edit","social_activity",postId,{visibility:body.visibility});
      return json({ok:true,id:postId,updated_at:now},200,origin);
    }
    if(part==="reactions"&&(request.method==="POST"||request.method==="DELETE")){
      if(!viewer)return fail(helpers,origin,401,"Sign in to react.");
      if(!await rateLimit(env,request,"profile-wall-react",60,300,viewer.id))return fail(helpers,origin,429,"Too many reactions. Try later.");
      if(request.method==="DELETE"){
        await env.DB.prepare("DELETE FROM profile_wall_reactions WHERE activity_id=? AND user_id=?").bind(postId,viewer.id).run();
        return json({ok:true,reaction:null},200,origin);
      }
      const body=await payload(request);
      if(!body||!VALID_REACTIONS.has(body.reaction))return fail(helpers,origin,400,"Choose fire, heart, or skull.");
      await env.DB.prepare("INSERT INTO profile_wall_reactions(activity_id,user_id,reaction,created_at) VALUES (?,?,?,?) ON CONFLICT(activity_id,user_id) DO UPDATE SET reaction=excluded.reaction").bind(postId,viewer.id,body.reaction,new Date().toISOString()).run();
      return json({ok:true,reaction:body.reaction},200,origin);
    }
    if(part==="comments"&&request.method==="GET"){
      const rawBefore=url.searchParams.get("before"),before=rawBefore===null?Number.MAX_SAFE_INTEGER:idFrom(rawBefore);
      if(!before)return fail(helpers,origin,400,"Invalid comment cursor.");
      const rows=await env.DB.prepare("SELECT c.id,c.activity_id,c.user_id,c.body,c.created_at,c.updated_at,u.username,u.display_name FROM profile_wall_comments c JOIN users u ON u.id=c.user_id WHERE c.activity_id=? AND c.deleted_at IS NULL AND c.id<? AND u.status='active' AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE (b.blocker_id=? AND b.blocked_id=c.user_id) OR (b.blocker_id=c.user_id AND b.blocked_id=?)) ORDER BY c.id DESC LIMIT 21").bind(postId,before,viewer?.id||0,viewer?.id||0).all();
      const all=rows.results||[],more=all.length>20,comments=all.slice(0,20);
      return json({comments,has_more:more,next_before:more?comments[comments.length-1]?.id:null},200,origin);
    }
    if(part==="comments"&&request.method==="POST"){
      if(!viewer)return fail(helpers,origin,401,"Sign in to comment.");
      if(!await rateLimit(env,request,"profile-wall-comment",15,300,viewer.id))return fail(helpers,origin,429,"Too many comments. Wait a little.");
      const body=await payload(request);
      if(!body||!validBody(body.body,1000))return fail(helpers,origin,400,"Comments must contain 1-1,000 characters.");
      const now=new Date().toISOString();
      const result=await env.DB.prepare("INSERT INTO profile_wall_comments(activity_id,user_id,body,created_at,updated_at) VALUES (?,?,?,?,?)").bind(postId,viewer.id,body.body.trim(),now,now).run();
      await audit(env,viewer,"profile.wall.comment.create","profile_wall_comments",result.meta?.last_row_id,{activity_id:postId});
      return json({ok:true,id:result.meta?.last_row_id},201,origin);
    }
    return fail(helpers,origin,405,"Unsupported profile wall operation.");
  }
  const commentMatch=path.match(/^\/api\/profile-wall\/comments\/([1-9][0-9]*)$/);
  if(commentMatch&&request.method==="DELETE"){
    if(!viewer)return fail(helpers,origin,401,"Sign in to remove a comment.");
    const id=idFrom(commentMatch[1]);
    if(!id)return fail(helpers,origin,400,"Invalid comment ID.");
    const comment=await env.DB.prepare("SELECT c.id,c.user_id,a.user_id AS profile_owner_id FROM profile_wall_comments c JOIN social_activity a ON a.id=c.activity_id WHERE c.id=? AND c.deleted_at IS NULL").bind(id).first();
    if(!comment)return fail(helpers,origin,404,"Comment not found.");
    if(![comment.user_id,comment.profile_owner_id].includes(viewer.id)&&!helpers.isModerator(viewer))return fail(helpers,origin,403,"You cannot remove this comment.");
    if(!await rateLimit(env,request,"profile-wall-comment-delete",20,300,viewer.id))return fail(helpers,origin,429,"Too many comment changes.");
    await env.DB.prepare("UPDATE profile_wall_comments SET deleted_at=?,updated_at=? WHERE id=? AND deleted_at IS NULL").bind(new Date().toISOString(),new Date().toISOString(),id).run();
    await audit(env,viewer,"profile.wall.comment.delete","profile_wall_comments",id,{});
    return json({ok:true},200,origin);
  }
  return fail(helpers,origin,404,"Profile wall route not found.");
}
