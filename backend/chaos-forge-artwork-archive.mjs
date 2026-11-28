// Private original artwork archive. Uses existing private R2 binding and owner-scoped D1 metadata.
// Never accepts client-provided SVG or arbitrary R2 paths.
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const ownerId=owner=>{const n=Number(owner);if(!Number.isSafeInteger(n)||n<1)throw Error("Owner required.");return n;};
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),x=>x.toString(16).padStart(2,"0")).join("");
const storageKey=(owner,id)=>"miss-chaos-originals/"+owner+"/"+id;
export async function archiveArtwork(env,owner,{bytes,mime,engine,title,settings}){
 const user=ownerId(owner);
 if(!env.CREATOR_MEDIA||typeof env.CREATOR_MEDIA.put!=="function")throw Error("Private artwork storage unavailable.");
 if(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>4194304||!["image/jpeg","image/svg+xml"].includes(mime)||typeof engine!=="string"||engine.length>100||typeof title!=="string"||title.length>80)throw Error("Invalid artwork.");
 const recipe=JSON.stringify(settings??{});if(recipe.length>4096)throw Error("Artwork recipe exceeds limit.");
 const id=crypto.randomUUID(),hash=await sha(bytes),created=new Date().toISOString(),filename="miss-chaos-"+id+(mime==="image/jpeg"?".jpg":".svg");
 const result=await env.DB.prepare("INSERT INTO chaos_artwork_archive(id,owner_id,filename,mime,engine,title,recipe_json,sha256,byte_count,created_at,state) SELECT ?,?,?,?,?,?,?,?,?,?,'pending' WHERE (SELECT count(*) FROM chaos_artwork_archive WHERE owner_id=?)<60 AND (SELECT coalesce(sum(byte_count),0) FROM chaos_artwork_archive WHERE owner_id=?)+?<=67108864").bind(id,user,filename,mime,engine,title,recipe,hash,bytes.length,created,user,user,bytes.length).run();
 if(result.meta?.changes!==1)throw Error("Private archive full: 60 originals or 64 MiB. Remove an old image first.");
 try{
  await env.CREATOR_MEDIA.put(storageKey(user,id),bytes,{httpMetadata:{contentType:mime}});
  const updated=await env.DB.prepare("UPDATE chaos_artwork_archive SET state='ready' WHERE id=? AND owner_id=? AND state='pending'").bind(id,user).run();
  if(updated.meta?.changes!==1)throw Error("Archive reservation lost.");
 }catch(error){
  // Keep the reservation if object cleanup fails; it remains visible for retry.
  try{await env.CREATOR_MEDIA.delete(storageKey(user,id));await env.DB.prepare("DELETE FROM chaos_artwork_archive WHERE id=? AND owner_id=? AND state='pending'").bind(id,user).run();}catch{}
  throw error;
 }
 return {id,filename,mime,engine,title,sha256:hash,byte_count:bytes.length,created_at:created,state:"ready"};
}
export async function listArtwork(env,owner){
 const rows=await env.DB.prepare("SELECT id,filename,mime,engine,title,recipe_json,sha256,byte_count,created_at,state FROM chaos_artwork_archive WHERE owner_id=? ORDER BY created_at DESC LIMIT 60").bind(ownerId(owner)).all();
 return {artworks:(rows.results||[]).map(r=>{let settings={};try{settings=JSON.parse(r.recipe_json);}catch{}const {recipe_json,...metadata}=r;return {...metadata,settings};}),limit:60,byteLimit:67108864};
}
export async function readArtwork(env,owner,id){
 const user=ownerId(owner);if(!ID.test(id))return null;
 const row=await env.DB.prepare("SELECT filename,mime,sha256,byte_count FROM chaos_artwork_archive WHERE id=? AND owner_id=? AND state='ready'").bind(id,user).first();
 if(!row||!["image/jpeg","image/svg+xml"].includes(row.mime)||row.byte_count>4194304||row.byte_count<1)return null;
 const object=await env.CREATOR_MEDIA.get(storageKey(user,id));if(!object||object.size!==row.byte_count)return null;
 const bytes=new Uint8Array(await object.arrayBuffer());if(await sha(bytes)!==row.sha256)throw Error("Artwork integrity check failed.");
 return new Response(bytes,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":'attachment; filename="miss-chaos-'+id+(row.mime==="image/jpeg"?".jpg":".svg")+'"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","X-Robots-Tag":"noindex, noimageindex","Cross-Origin-Resource-Policy":"same-site"}});
}
export async function deleteArtwork(env,owner,id){
 const user=ownerId(owner);if(!ID.test(id))return false;
 // Do not delete a pending upload while it is active; allow cleanup after 15 minutes.
 const cutoff=new Date(Date.now()-15*60000).toISOString();
 const row=await env.DB.prepare("UPDATE chaos_artwork_archive SET state='deleting' WHERE id=? AND owner_id=? AND (state IN ('ready','deleting') OR (state='pending' AND created_at<?)) RETURNING id").bind(id,user,cutoff).first();
 if(!row)return false;
 await env.CREATOR_MEDIA.delete(storageKey(user,id));
 const r=await env.DB.prepare("DELETE FROM chaos_artwork_archive WHERE id=? AND owner_id=? AND state='deleting'").bind(id,user).run();return r.meta?.changes===1;
}
