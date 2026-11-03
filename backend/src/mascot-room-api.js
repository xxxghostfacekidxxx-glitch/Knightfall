/**
 * Personal companion room placements. No currency or XP awarded here.
 * D1 migration: 0108_mascot_room_layouts.sql.
 */
export const ROOM_POSES=Object.freeze(['idle','bounce','mischief']);
export const ROOM_DEFAULT=Object.freeze({x:50,y:65,pose:'idle'});
export async function handleMascotRoom(request,env,url,user,{json,rateLimit,origin}){
 const match=url.pathname.match(/^\/api\/mascot-pets\/(\d+)\/room$/);
 if(!match)return null;
 const reply=(v,status=200)=>json(v,status,origin);
 const id=Number(match[1]);
 if(!Number.isSafeInteger(id)||id<1)return reply({error:'Invalid companion ID.'},400);
 if(!['GET','PUT'].includes(request.method))return reply({error:'Method not allowed.'},405);
 const pet=await env.DB.prepare('SELECT id,nickname FROM mascot_pets WHERE id=? AND user_id=?').bind(id,user.id).first();
 if(!pet)return reply({error:'Companion not found.'},404);
 if(request.method==='GET'){
  const saved=await env.DB.prepare('SELECT x_percent,y_percent,pose FROM mascot_room_layouts WHERE pet_id=? AND user_id=?').bind(id,user.id).first();
  return reply({room:saved?{x:Number(saved.x_percent),y:Number(saved.y_percent),pose:saved.pose}:{...ROOM_DEFAULT}});
 }
 if(!await rateLimit(env,request,'mascot-room-save',18,60,user.id))return reply({error:'Room save rate limit reached.'},429);
 let data;
 try{data=await request.json()}catch{return reply({error:'Invalid JSON.'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'Invalid room data.'},400);
 const x=data.x,y=data.y,pose=data.pose;
 if(!Number.isInteger(x)||x<8||x>92||!Number.isInteger(y)||y<25||y>85||!ROOM_POSES.includes(pose))
  return reply({error:'Invalid room position or pet pose.'},400);
 try{
  await env.DB.prepare(
   'INSERT INTO mascot_room_layouts(pet_id,user_id,x_percent,y_percent,pose,updated_at) VALUES(?,?,?,?,?,?) '+
   'ON CONFLICT(pet_id) DO UPDATE SET x_percent=excluded.x_percent,y_percent=excluded.y_percent,pose=excluded.pose,updated_at=excluded.updated_at'
  ).bind(id,user.id,x,y,pose,new Date().toISOString()).run();
 }catch(e){console.warn('sanctuary_room_save',String(e).slice(0,120));return reply({error:'Unable to save your room.'},409)}
 return reply({ok:true,room:{x,y,pose},message:pet.nickname+'’s room position saved.'});
}
