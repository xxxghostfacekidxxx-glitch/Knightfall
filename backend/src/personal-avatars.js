const SKIN=new Set(['porcelain','peach','honey','olive','cocoa','violet']);
const HAIR=new Set(['shag','spikes','bob','mohawk','horns','buns','flop']);
const HAIR_COLOR=new Set(['ink','plum','pink','acid','silver','copper','blue']);
const EYES=new Set(['doe','sleepy','mischief','star','spiral']);
const EYE_COLOR=new Set(['violet','green','blue','pink','gold','red']);
const EXPRESSION=new Set(['smile','grin','pout','fang','frown','tongue']);
const FACE_MARK=new Set(['none','freckles','stars','stitches','lightning','heart']);
const PIERCING=new Set(['none','septum','brow','lip','ear']);
const OUTFIT=new Set(['hoodie','jacket','overalls','dress','sweater','cape']);
const OUTFIT_COLOR=new Set(['plum','pink','acid','silver','copper','blue','black','red']);
const ACCESSORY=new Set(['none','horns','halo','bow','beanie','crown','bandage']);
const BACKGROUND=new Set(['void','bubblegum','toxic','gravewave','ember','lavender','sky']);
const PATTERN=new Set(['none','sparkles','static','bats','hearts']);
const HEADWEAR=new Set(['none','witch_hat','tiara','antenna','headphones','flower']);
const EYEWEAR=new Set(['none','star_shades','round_specs','visor','monocle','eyepatch']);
const NECKWEAR=new Set(['none','spike_choker','chain','bandana','scarf']);
const AURA=new Set(['none','ghost_flames','spark_ring','glow','moon']);
const FIELDS={skin:SKIN,hair:HAIR,hair_color:HAIR_COLOR,eyes:EYES,eye_color:EYE_COLOR,expression:EXPRESSION,face_mark:FACE_MARK,piercing:PIERCING,outfit:OUTFIT,outfit_color:OUTFIT_COLOR,headwear:HEADWEAR,eyewear:EYEWEAR,neckwear:NECKWEAR,aura:AURA,accessory:ACCESSORY,background:BACKGROUND,pattern:PATTERN};
const DEFAULTS={skin:'peach',hair:'shag',hair_color:'ink',eyes:'doe',eye_color:'violet',expression:'smile',face_mark:'freckles',piercing:'none',outfit:'hoodie',outfit_color:'plum',headwear:'none',eyewear:'none',neckwear:'spike_choker',aura:'none',accessory:'none',background:'void',pattern:'sparkles'};
const PRODUCTS=Object.freeze([{id:'avatar_slot',slots:1,cost_cinders:600,label:'One extra misfit slot'},
 {id:'avatar_slots_3',slots:3,cost_cinders:1500,label:'Misfit trio bundle'}]);
const respond=(json,value,status=200,origin)=>json(value,status,origin);
function cleanName(value){if(typeof value!=='string')return null;const name=value.trim().replace(/\s+/g,' ');return name.length>=1&&name.length<=32?name:null;}
function cleanAvatar(value){if(!value||typeof value!=='object'||Array.isArray(value))return null;const result={};for(const [field,choices] of Object.entries(FIELDS)){const choice=value[field]===undefined?DEFAULTS[field]:value[field];if(!choices.has(choice))return null;result[field]=choice;}return result;}
async function wallet(env,user){
 await env.DB.prepare('INSERT OR IGNORE INTO user_wallets(user_id,balance) VALUES(?,?)').bind(user.id,(user.username==='knightfall'||['admin','moderator','god'].includes(user.role))?1000000:2000).run();
 const row=await env.DB.prepare('SELECT balance FROM user_wallets WHERE user_id=?').bind(user.id).first();return Number(row?.balance||0);
}
async function slotsFor(env,userId){
 const entitlement=await env.DB.prepare('SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=?').bind(userId).first();
 const owned=await env.DB.prepare('SELECT slot_no,name,avatar_json,is_active,updated_at FROM personal_avatars WHERE user_id=? ORDER BY slot_no').bind(userId).all();
 const count=2+Number(entitlement?.extra_slots||0),bySlot=new Map((owned.results||[]).map(row=>[Number(row.slot_no),row]));
 return Array.from({length:count},(_,i)=>{const row=bySlot.get(i+1);let avatar=null;try{avatar=row?JSON.parse(row.avatar_json):null}catch{}return {slot_no:i+1,unlocked:true,empty:!row,name:row?.name||'',avatar,is_active:Number(row?.is_active)===1,updated_at:row?.updated_at||null};});
}
export async function handlePersonalAvatars(request,env,url,{getUser,json,rateLimit,origin}){
 const path=url.pathname;if(!path.startsWith('/api/avatars'))return null;
 const send=(value,status=200)=>respond(json,value,status,origin);
 const publicMatch=path.match(/^\/api\/avatars\/profile\/([a-zA-Z0-9_-]{1,32})$/);
 if(publicMatch&&request.method==='GET'){
  const owner=await env.DB.prepare("SELECT id,username,profile_visibility,status FROM users WHERE username=? COLLATE NOCASE AND status='active'").bind(publicMatch[1]).first();
  if(!owner)return send({error:'Profile not found.'},404);
  const viewer=await getUser(request,env),self=viewer&&Number(viewer.id)===Number(owner.id),staff=viewer&&['moderator','admin','god'].includes(viewer.role);
  if(!self&&!staff){
   const blocked=viewer?await env.DB.prepare('SELECT 1 FROM user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) UNION SELECT 1 FROM social_user_blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?) LIMIT 1').bind(viewer.id,owner.id,owner.id,viewer.id,viewer.id,owner.id,owner.id,viewer.id).first():null;
   if(blocked||owner.profile_visibility==='private')return send({error:'Profile not found.'},404);
   if(owner.profile_visibility==='friends'){if(!viewer)return send({error:'Sign in to view this profile.'},401);const friend=await env.DB.prepare("SELECT 1 FROM friend_requests WHERE status='accepted' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?)) LIMIT 1").bind(viewer.id,owner.id,owner.id,viewer.id).first();if(!friend)return send({error:'Profile unavailable.'},403);}
  }
  const row=await env.DB.prepare('SELECT name,avatar_json,updated_at FROM personal_avatars WHERE user_id=? AND is_active=1').bind(owner.id).first();
  let avatar=null;try{avatar=row?JSON.parse(row.avatar_json):null}catch{}
  return send({username:owner.username,avatar:cleanAvatar(avatar),name:row?.name||'',updated_at:row?.updated_at||null});
 }
 const user=await getUser(request,env);if(!user)return send({error:'Sign in to manage your misfit avatars.'},401);
 if(path==='/api/avatars/me'&&request.method==='GET'){
  const [slots,balance]=await Promise.all([slotsFor(env,user.id),wallet(env,user)]);
  const ent=await env.DB.prepare('SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=?').bind(user.id).first();
  return send({slots,free_slots:2,extra_slots:Number(ent?.extra_slots||0),max_extra_slots:20,wallet_balance:balance,products:PRODUCTS});
 }
 if(!await rateLimit(env,request,'personal-avatar-write',20,60,user.id))return send({error:'Too many avatar changes. Try again shortly.'},429);
 const deleteMatch=path.match(/^\/api\/avatars\/(\d+)$/);
 if(deleteMatch&&request.method==='DELETE'){
  const slot=Number(deleteMatch[1]);
  if(!Number.isSafeInteger(slot)||slot<1||slot>22)return send({error:'Choose a valid avatar slot.'},400);
  const existing=await env.DB.prepare('SELECT is_active FROM personal_avatars WHERE user_id=? AND slot_no=?').bind(user.id,slot).first();
  if(!existing)return send({error:'There is no saved misfit in that slot.'},404);
  await env.DB.prepare('DELETE FROM personal_avatars WHERE user_id=? AND slot_no=?').bind(user.id,slot).run();
  return send({ok:true,active_removed:Number(existing.is_active)===1,slots:await slotsFor(env,user.id),message:Number(existing.is_active)===1?'Misfit cleared. Your profile is back to its usual picture.':'Misfit cleared from this slot.'});
 }
 if(!['POST','PUT'].includes(request.method))return send({error:'Method not allowed.'},405);
 let body;try{body=await request.json()}catch{return send({error:'Invalid JSON.'},400);}
 if(!body||typeof body!=='object'||Array.isArray(body))return send({error:'Invalid avatar request.'},400);
 if(path==='/api/avatars/purchase'&&request.method==='POST'){
  const product=PRODUCTS.find(x=>x.id===body.product);if(!product)return send({error:'Choose an avatar slot pack from the shop.'},400);
  await wallet(env,user);
  try{await env.DB.prepare('INSERT INTO personal_avatar_slot_purchases(user_id,slots,cost_cinders) VALUES(?,?,?)').bind(user.id,product.slots,product.cost_cinders).run();}
  catch(error){return send({error:String(error?.message||'Purchase could not be completed.').includes('Not enough Cinders')?'Not enough Cinders for that slot pack.':'Avatar slot limit reached or purchase could not be completed.'},409);}
  const entitlement=await env.DB.prepare('SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=?').bind(user.id).first();
  return send({ok:true,slots:await slotsFor(env,user.id),extra_slots:Number(entitlement?.extra_slots||0),max_extra_slots:20,wallet_balance:await wallet(env,user),message:product.label+' unlocked.'},201);
 }
 if(path!='/api/avatars/save'||request.method!=='PUT')return send({error:'Unknown avatar route.'},404);
 const slot=Number(body.slot_no),name=cleanName(body.name),avatar=cleanAvatar(body.avatar),active=body.active===true;
 if(!Number.isInteger(slot)||slot<1||slot>22)return send({error:'Choose an unlocked avatar slot.'},400);
 if(!name||!avatar||typeof body.active!=='boolean')return send({error:'Add a name and complete every misfit design choice.'},400);
 const entitlement=await env.DB.prepare('SELECT extra_slots FROM personal_avatar_entitlements WHERE user_id=?').bind(user.id).first();
 if(slot>2+Number(entitlement?.extra_slots||0))return send({error:'That avatar slot is locked. Unlock it with Cinders first.'},403);
 const avatarJson=JSON.stringify(avatar),now=new Date().toISOString();
 try{
  const writes=[];if(active)writes.push(env.DB.prepare('UPDATE personal_avatars SET is_active=0 WHERE user_id=? AND is_active=1').bind(user.id));
  writes.push(env.DB.prepare('INSERT INTO personal_avatars(user_id,slot_no,name,avatar_json,is_active,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,slot_no) DO UPDATE SET name=excluded.name,avatar_json=excluded.avatar_json,is_active=excluded.is_active,updated_at=excluded.updated_at').bind(user.id,slot,name,avatarJson,active?1:0,now));
  await env.DB.batch(writes);
 }catch(error){return send({error:String(error?.message||'').includes('locked')?'That avatar slot is locked.':'Avatar could not be saved.'},409);}
 return send({ok:true,slots:await slotsFor(env,user.id),message:active?'Misfit saved and set as your profile avatar.':'Misfit saved.'});
}
