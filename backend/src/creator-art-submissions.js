/* Creator artwork submission and review, using the existing PUBLIC_ASSETS R2 bucket.
 * Pending objects are private; approved copies follow the existing public-asset API.
 * No database migration is needed for pending submissions.
 */
const PREFIX='submissions/';
const MAX_BYTES=2*1024*1024;
const safeName=value=>String(value||'artwork').normalize('NFKC').toLowerCase()
  .replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'artwork';
const isCreator=user=>user&&(user.role==='admin'||user.role==='god'||String(user.public_title||'').trim()==='Digital Creator');
const isPng=bytes=>bytes.length>=24&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
const pngDimension=bytes=>{
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 return {width:view.getUint32(16),height:view.getUint32(20)};
};
const normalize=id=>/^[a-f0-9]{32}$/.test(id||'')?id:'';
export async function handleCreatorArtSubmissions(request,env,url,{requireUser,isAdmin,rateLimit,randomToken,json,audit,origin}){
 const root='/api/devil-tools/asset-submissions';
 if(url.pathname!==root&&!url.pathname.startsWith(root+'/'))return null;
 const user=await requireUser(request,env);
 if(!user)return json({error:'Sign in to use the Creator artwork library.'},401,origin);
 if(!isCreator(user))return json({error:'Creator Foundry access required.'},403,origin);
 if(!env.PUBLIC_ASSETS)return json({error:'Site asset storage is not configured.'},503,origin);
 const admin=isAdmin(user);
 if(url.pathname===root){
   if(request.method==='GET'){
     const list=await env.PUBLIC_ASSETS.list({prefix:PREFIX,limit:1000,include:['customMetadata']});
     const records=(list.objects||[]).map(x=>{
       const id=String(x.key||'').replace(PREFIX,'');
       const meta=x.customMetadata||{};
       return {id,asset_name:meta.assetName||'artwork',uploaded_by:Number(meta.uploadedBy||0),
         created_at:meta.createdAt||x.uploaded?.toISOString()||'',size_bytes:Number(x.size||0),
         preview_url:root+'/'+id+'/preview'};
     }).filter(x=>normalize(x.id)&&(admin||x.uploaded_by===user.id))
       .sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,100);
     return json({assets:records,can_approve:admin},200,origin);
   }
   if(request.method!=='POST')return json({error:'Method not allowed.'},405,origin,{allow:'GET, POST'});
   if(!await rateLimit(env,request,'creator-art-submit',8,60,user.id))
     return json({error:'Too many uploads. Please try again later.'},429,origin);
   const pending=await env.PUBLIC_ASSETS.list({prefix:PREFIX,limit:1000,include:['customMetadata']});
   if(pending.truncated)return json({error:'The review queue is full. An administrator must clear pending artwork first.'},429,origin);
   if((pending.objects||[]).filter(x=>Number(x.customMetadata?.uploadedBy)===user.id).length>=10)
     return json({error:'You have 10 pending images. Wait for review or ask an administrator to clear some.'},429,origin);
   let form;try{form=await request.formData()}catch{return json({error:'Invalid upload form.'},400,origin)}
   const file=form.get('file');
   if(!file||typeof file.arrayBuffer!=='function'||typeof file.size!=='number')
     return json({error:'Choose an image first.'},400,origin);
   if(file.size<24||file.size>MAX_BYTES)
     return json({error:'Use an optimized PNG between 24 bytes and 2 MB.'},413,origin);
   const bytes=new Uint8Array(await file.arrayBuffer());
   if(!isPng(bytes)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')
     return json({error:'Only valid PNG file headers are accepted.'},415,origin);
   const {width,height}=pngDimension(bytes);
   if(width<8||height<8||width>4096||height>4096||width*height>16_777_216)
     return json({error:'Artwork dimensions must be between 8 and 4096 pixels.'},400,origin);
   const id=randomToken(16),name=safeName(form.get('name')||file.name),createdAt=new Date().toISOString();
   await env.PUBLIC_ASSETS.put(PREFIX+id,bytes,{
     httpMetadata:{contentType:'image/png',cacheControl:'private, no-store'},
     customMetadata:{assetName:name,uploadedBy:String(user.id),createdAt}
   });
   await audit(env,user,'creator_art.submit','public_asset',null,{id,name,size_bytes:bytes.byteLength});
   return json({ok:true,submission:{id,asset_name:name,status:'pending',created_at:createdAt}},201,origin);
 }
 const match=url.pathname.match(/^\/api\/devil-tools\/asset-submissions\/([a-f0-9]{32})(?:\/(preview|approve|reject))?$/);
 if(!match)return json({error:'Unknown artwork submission route.'},404,origin);
 const id=normalize(match[1]),action=match[2]||'';
 const object=await env.PUBLIC_ASSETS.get(PREFIX+id);
 if(!object)return json({error:'Submission not found.'},404,origin);
 const meta=object.customMetadata||{};
 const owner=Number(meta.uploadedBy||0)===user.id;
 if(!owner&&!admin)return json({error:'Submission not found.'},404,origin);
 if(action==='preview'&&(request.method==='GET'||request.method==='HEAD')){
   const headers=new Headers({
     'content-type':'image/png','x-content-type-options':'nosniff',
     'content-security-policy':"default-src 'none'; sandbox",
     'cache-control':'private, no-store','cross-origin-resource-policy':'same-site',
     'access-control-allow-origin':origin,'access-control-allow-credentials':'true',
     'vary':'Origin'
   });
   return new Response(request.method==='HEAD'?null:object.body,{status:200,headers});
 }
 if(!admin)return json({error:'Administrator approval required.'},403,origin);
 if(request.method!=='POST'||!['approve','reject'].includes(action))
   return json({error:'Method not allowed.'},405,origin,{allow:'POST'});
 if(!await rateLimit(env,request,'creator-art-review',20,60,user.id))
   return json({error:'Too many reviews. Try again later.'},429,origin);
 if(action==='reject'){
   await env.PUBLIC_ASSETS.delete(PREFIX+id);
   await audit(env,user,'creator_art.reject','public_asset',null,{id,uploaded_by:meta.uploadedBy});
   return json({ok:true,id,status:'rejected'},200,origin);
 }
 const already=await env.DB.prepare('SELECT id FROM public_asset_releases WHERE id=?').bind(id).first();
 if(already)return json({error:'This asset is already published.'},409,origin);
 const bytes=new Uint8Array(await object.arrayBuffer());
 if(bytes.length<24||bytes.length>MAX_BYTES||!isPng(bytes))
   return json({error:'Submitted PNG failed release validation.'},415,origin);
 const assetName=safeName(meta.assetName),key='sprites/'+id,createdAt=new Date().toISOString();
 let stored=false;
 try{
   const published=await env.PUBLIC_ASSETS.put(key,bytes,{
     httpMetadata:{contentType:'image/png',cacheControl:'public, max-age=31536000, immutable'},
     customMetadata:{assetName,uploadedBy:String(meta.uploadedBy||0),approvedBy:String(user.id)}
   });
   stored=true;
   await env.DB.prepare('INSERT INTO public_asset_releases (id,asset_name,object_key,content_type,size_bytes,uploaded_by,created_at,etag) VALUES (?,?,?,?,?,?,?,?)')
     .bind(id,assetName,key,'image/png',bytes.byteLength,Number(meta.uploadedBy||0),createdAt,published?.httpEtag||published?.etag||null).run();
 }catch(error){
   if(stored){try{await env.PUBLIC_ASSETS.delete(key)}catch(e){console.error('creator_art_release_rollback_failed',e)}}
   console.error('creator_art_approve_failed',error);
   return json({error:'The asset could not be approved. Submission remains pending.'},500,origin);
 }
 try{await env.PUBLIC_ASSETS.delete(PREFIX+id)}catch(e){console.error('creator_art_pending_cleanup_failed',e)}
 await audit(env,user,'creator_art.approve','public_asset',null,{id,asset_name:assetName,uploaded_by:meta.uploadedBy});
 return json({ok:true,id,status:'approved',url:'/public-assets/'+id},200,origin);
}
