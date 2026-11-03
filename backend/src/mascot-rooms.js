/**
 * Neon Nuisances interactive pet rooms.
 * User ownership, coordinates and mood are server-verified. No currency grants.
 */
export const DEFAULT_ROOM = Object.freeze({pet_x:50,pet_y:58,decor_x:72,decor_y:70,ambiance:'mist'});
export const AMBIANCES = Object.freeze([
 {id:'mist',label:'Haunted mist',min_level:1},
 {id:'fireflies',label:'Toxic fireflies',min_level:2},
 {id:'glitch',label:'Glitch storm',min_level:3},
 {id:'none',label:'Still night',min_level:1}
]);
export function serializeRoom(raw){
 const base=raw||DEFAULT_ROOM;
 return {pet_x:Number(base.pet_x),pet_y:Number(base.pet_y),decor_x:Number(base.decor_x),
  decor_y:Number(base.decor_y),ambiance:base.ambiance||DEFAULT_ROOM.ambiance};
}
export async function handleMascotRooms(request,env,url,user,{json,rateLimit,origin,petLevel}){
 const path=url.pathname;
 const match=path.match(/^\/api\/mascot-pets\/(\d+)\/room$/);
 if(!match)return null;
 const respond=(v,s=200)=>json(v,s,origin);
 const petId=Number(match[1]);
 if(!Number.isSafeInteger(petId)||petId<1)return respond({error:'Invalid companion.'},400);
 const pet=await env.DB.prepare('SELECT id,nickname,experience FROM mascot_pets WHERE id=? AND user_id=?')
  .bind(petId,user.id).first();
 if(!pet)return respond({error:'Companion not found.'},404);
 if(request.method==='GET'){
  const row=await env.DB.prepare('SELECT pet_x,pet_y,decor_x,decor_y,ambiance FROM mascot_room_layouts WHERE pet_id=? AND user_id=?')
   .bind(petId,user.id).first();
  return respond({room:serializeRoom(row),ambiences:AMBIANCES});
 }
 if(request.method!=='PUT')return respond({error:'Method not allowed.'},405);
 if(!await rateLimit(env,request,'mascot-room-save',18,60,user.id))
  return respond({error:'Too many room saves. Try again shortly.'},429);
 let data;
 try{data=await request.json()}catch{return respond({error:'Invalid JSON.'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return respond({error:'Invalid room data.'},400);
 const bounds={pet_x:[8,92],pet_y:[26,84],decor_x:[10,90],decor_y:[30,90]};
 const coords={};
 for(const [key,[min,max]] of Object.entries(bounds)){
  const value=data[key];
  if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)
   return respond({error:'Invalid '+key+' coordinate.'},400);
  coords[key]=value;
 }
 const ambiance=AMBIANCES.find(x=>x.id===data.ambiance);
 if(!ambiance)return respond({error:'Unknown room ambiance.'},400);
 if(petLevel(pet.experience)<ambiance.min_level)
  return respond({error:'Level up your companion to unlock this room ambiance.'},409);
 try{
  await env.DB.prepare(
   'INSERT INTO mascot_room_layouts(pet_id,user_id,pet_x,pet_y,decor_x,decor_y,ambiance,updated_at) '+
   'VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(pet_id) DO UPDATE SET pet_x=excluded.pet_x,pet_y=excluded.pet_y,'+
   'decor_x=excluded.decor_x,decor_y=excluded.decor_y,ambiance=excluded.ambiance,updated_at=excluded.updated_at'
  ).bind(petId,user.id,coords.pet_x,coords.pet_y,coords.decor_x,coords.decor_y,
    ambiance.id,new Date().toISOString()).run();
 }catch{return respond({error:'Could not save this room.'},409)}
 return respond({ok:true,room:serializeRoom({...coords,ambiance:ambiance.id}),
  message:pet.nickname+'’s room saved!'});
}
