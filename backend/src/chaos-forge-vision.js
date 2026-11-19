/** Single-photo craft deconstruction with opt-in Workers AI vision, no image storage. */
const MODEL="@cf/moondream/moondream3.1-9B-A2B";
export async function handleChaosForgeVision(request,env,{requireUser,rateLimit,json,origin}){
 const user=await requireUser(request,env);
 if(!user)return json({error:"Sign in to analyze a reference image."},401,origin);
 if(!["https://ash-fall.com","https://www.ash-fall.com"].includes(request.headers.get("origin")))
   return json({error:"Open Chaos Forge from Knightfall."},403,origin);
 if(!await rateLimit(env,request,"chaos-forge-vision",4,3600,user.id))
   return json({error:"Image analysis limit reached. Use the manual tools or retry later."},429,origin);
 const MAX_BODY=980000;
 const declared=Number(request.headers.get("content-length")||0);
 if(declared>MAX_BODY)return json({error:"Image too large. Reduce the image size."},413,origin);
 let body;
 try{
   // Enforce the upload limit while streaming; request.text() would allocate an unbounded body first.
   const reader=request.body?.getReader();
   if(!reader)throw Error("Missing request body.");
   const chunks=[];let bytes=0;
   while(true){
     const {value,done}=await reader.read();
     if(done)break;
     bytes+=value.byteLength;
     if(bytes>MAX_BODY){await reader.cancel();return json({error:"Image too large. Reduce the image size."},413,origin);}
     chunks.push(value);
   }
   const all=new Uint8Array(bytes);let offset=0;
   for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}
   body=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(all));
 }catch{return json({error:"Invalid image request."},400,origin);}
 const image=typeof body?.image==="string"?body.image:"";
 const match=image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match||image.length>900000)return json({error:"Use a resized JPEG, PNG, or WebP image under 650 KB."},400,origin);
 let binary;
 try{binary=atob(match[2]);}catch{return json({error:"Malformed image encoding."},400,origin);}
 if(binary.length<16||binary.length>650000)return json({error:"The compressed image must be under 650 KB."},400,origin);
 const starts=pattern=>pattern.every((value,i)=>binary.charCodeAt(i)===value);
 const valid=match[1]==="jpeg"
   ?starts([255,216,255])
   :match[1]==="png"
     ?starts([137,80,78,71,13,10,26,10])
     :starts([82,73,70,70])&&binary.slice(8,12)==="WEBP";
 if(!valid)return json({error:"The image bytes do not match their declared file type."},400,origin);
 const kind=["clothing","craft","accessory","object"].includes(body?.kind)?body.kind:"object";
 const notes=String(body?.notes||"").trim().slice(0,400);
 if(!env.AI?.run)return json({error:"Vision AI is not available on this account."},503,origin);
 const question=[
  "You are Miss Chaos, a practical maker and pattern-drafting assistant. Analyze this single reference photo of a "+kind+".",
  "Use the following headings: VISIBLE DETAILS; POSSIBLE CONSTRUCTION; MATERIALS & TOOLS; CUT/ASSEMBLY PLAN; MEASUREMENTS NEEDED; UNCERTAINTIES.",
  "Identify separate panels, seams, fasteners, joints, closures, edge treatments, and likely material if visible.",
  "Write a specific numbered assembly sequence and a rough list of cut pieces when reasonable.",
  "Explicitly separate what you can SEE from guesses. Never invent true sizes or hidden back/inside construction.",
  "Start your reply with exactly: TEMPLATE: followed by one of tote, pouch, apron, skirt, box, or trace. Use trace if none truly fits.",
  "Do not guess exact dimensions or infer hidden construction from a single image.",
  "Say that it is a draft, not a production-ready pattern, and ask for missing measurements if needed.",
  notes?"Maker notes: "+notes:""
 ].filter(Boolean).join("\n");
 try{
   const result=await env.AI.run(MODEL,{task:"query",image,question,reasoning:false,max_tokens:1200,temperature:0.2});
   const analysis=String(result?.answer||result?.response||"").trim().slice(0,9000);
   if(!analysis)throw Error("Vision returned an empty answer.");
   const suggested_template=analysis.match(/(?:^|\n)\s*TEMPLATE\s*:\s*(tote|pouch|apron|skirt|box|trace)\b/im)?.[1]?.toLowerCase()||null;
   return json({analysis,suggested_template,model:MODEL,kind,limits:"One image cannot determine exact fit, hidden surfaces, or accurate dimensions. Check measurements and prototypes.",stored:false},200,origin);
 }catch(error){
   console.warn("chaos_forge_vision_failed",String(error?.message||error).slice(0,140));
   return json({error:"Vision analysis is unavailable or the free AI allowance was exhausted. Manual drafting and 3D preview still work."},503,origin);
 }
}
