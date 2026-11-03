/**
 * Neon Nuisances home furnishings. D1 enforces every Cinders debit, ownership,
 * per-pet level and max 8 placements. Client never supplies a price.
 */
export const FURNITURE=Object.freeze([
 ['lantern','Haunted Lantern',0,1],['skull_pile','Bone Pile',0,1],
 ['bone_tree','Bone Tree',0,2],['grave_marker','Cursed Headstone',0,2],
 ['glitch_console','Glitch Console',500,2],['neon_throne','Neon Throne',850,3],
 ['spirit_fountain','Spirit Fountain',1100,4],['chaos_portal','Chaos Portal',1600,5]
].map(([key,name,cost_cinders,unlock_level])=>({
 key,name,cost_cinders,unlock_level,
 art:'/assets/devil-tools/neon-nuisances/furniture/'+key+'.svg'
})));
const lookup=new Map(FURNITURE.map(x=>[x.key,x]));
const ownPet=async(env,user,petId)=>env.DB.prepare('SELECT id,experience FROM mascot_pets WHERE id=? AND user_id=?').bind(petId,user.id).first();
const rows=async(env,user,petId)=>{
 const result=await env.DB.prepare('SELECT item_key,x_pct,y_pct,flipped FROM mascot_room_furniture_placements WHERE pet_id=? AND user_id=? ORDER BY item_key').bind(petId,user.id).all();
 return (result.results||[]).map(r=>({...r,art:lookup.get(r.item_key)?.art||''}));
};
export async function handleMascotFurniture(request,env,url,user,{json,rateLimit,origin,petLevel}){
 const path=url.pathname,respond=(value,status=200)=>json(value,status,origin);
 if(path==='/api/mascot-pets/furniture/catalog'&&request.method==='GET'){
  const inventory=await env.DB.prepare('SELECT item_key FROM mascot_room_furniture_inventory WHERE user_id=?').bind(user.id).all();
  return respond({furniture:FURNITURE,owned:(inventory.results||[]).map(x=>x.item_key),room_limit:8});
 }
 const match=path.match(/^\/api\/mascot-pets\/(\d+)\/furniture$/);
 const buying=path==='/api/mascot-pets/furniture/buy'&&request.method==='POST';
 if(!match&&!buying)return null;
 if(!buying&&!['GET','PUT','DELETE'].includes(request.method))return respond({error:'Method not allowed'},405);
 const id=match?Number(match[1]):null;
 if(match){
  if(!Number.isSafeInteger(id)||id<=0)return respond({error:'Invalid companion'},400);
  if(!await ownPet(env,user,id))return respond({error:'Companion not found'},404);
  if(request.method==='GET')return respond({placements:await rows(env,user,id)});
 }
 if(!await rateLimit(env,request,'mascot-furniture-actions',25,60,user.id))
  return respond({error:'Too many decoration changes. Try again shortly.'},429);
 let body;try{body=await request.json()}catch{return respond({error:'Invalid JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return respond({error:'Invalid furniture request'},400);
 const key=typeof body.key==='string'?body.key:'',item=lookup.get(key);
 if(!item)return respond({error:'Unknown furniture item'},400);
 if(buying){
  if(item.cost_cinders===0)return respond({error:'This furniture is free. Place it directly in a pet room.'},400);
  try{await env.DB.prepare('INSERT INTO mascot_room_furniture_purchases(user_id,item_key,cost_cinders) VALUES(?,?,?)')
   .bind(user.id,key,item.cost_cinders).run()}
  catch{return respond({error:'Already owned or insufficient Cinders'},409)}
  return respond({ok:true,item:key,message:item.name+' unlocked for every companion.'},201);
 }
 if(request.method==='DELETE'){
  await env.DB.prepare('DELETE FROM mascot_room_furniture_placements WHERE user_id=? AND pet_id=? AND item_key=?')
   .bind(user.id,id,key).run();
  return respond({ok:true,placements:await rows(env,user,id)});
 }
 const {x,y,flipped}=body;
 if(!Number.isInteger(x)||x<8||x>92||!Number.isInteger(y)||y<16||y>85||typeof flipped!=='boolean')
  return respond({error:'Use bounded room coordinates and a valid orientation.'},400);
 const pet=await ownPet(env,user,id),level=petLevel(pet.experience);
 if(level<item.unlock_level)return respond({error:'This furniture unlocks at pet level '+item.unlock_level+'.'},409);
 try{
  await env.DB.prepare(
   'INSERT INTO mascot_room_furniture_placements(user_id,pet_id,item_key,x_pct,y_pct,flipped,updated_at) '+
   'VALUES(?,?,?,?,?,?,?) ON CONFLICT(pet_id,item_key) DO UPDATE SET x_pct=excluded.x_pct,y_pct=excluded.y_pct,'+
   'flipped=excluded.flipped,updated_at=excluded.updated_at'
  ).bind(user.id,id,key,x,y,flipped?1:0,new Date().toISOString()).run();
 }catch{return respond({error:'Room is full or this furniture is not yet owned.'},409)}
 return respond({ok:true,placements:await rows(env,user,id),message:item.name+' placed in your companion room.'});
}
