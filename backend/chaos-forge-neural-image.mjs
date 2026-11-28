// Explicitly invoked hosted image inference. Never called by autonomous research jobs.
export const IMAGE_MODEL="@cf/black-forest-labs/flux-1-schnell";
export async function neuralImage(env,owner,input){
 if(!input||input.confirmProvider!==true)throw Error("Confirm use of the hosted image model and possible provider charges.");
 if(!Number.isSafeInteger(Number(owner))||Number(owner)<1)throw Error("Owner required.");
 const prompt=typeof input.prompt==="string"?input.prompt.trim():"";
 if(!prompt||prompt.length>1000)throw Error("Prompt must contain 1–1000 characters.");
 if(!env.AI||typeof env.AI.run!=="function")throw Error("Hosted image inference unavailable.");
 const day=new Date().toISOString().slice(0,10);
 // Reserve an attempt before making a chargeable call. Concurrent calls cannot bypass the cap.
 const reservation=await env.DB.prepare("INSERT INTO chaos_image_usage(owner_id,day,attempts) VALUES(?,?,1) ON CONFLICT(owner_id,day) DO UPDATE SET attempts=attempts+1 WHERE attempts<3 RETURNING attempts").bind(Number(owner),day).first();
 if(!reservation)throw Error("Daily limit of three hosted image attempts reached (UTC).");
 const result=await env.AI.run(IMAGE_MODEL,{prompt,steps:4});
 const image=result?.image;
 if(typeof image!=="string"||image.length<16||image.length>5600000||!(/^[A-Za-z0-9+/]+={0,2}$/.test(image))||image.length%4!==0)throw Error("Provider did not return a bounded image.");
 const bytes=Uint8Array.from(atob(image),c=>c.charCodeAt(0));
 if(bytes.length>4194304||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)throw Error("Provider returned an unsupported image format.");
 return {image,filename:"miss-chaos-neural.jpg",mime:"image/jpeg",engine:IMAGE_MODEL,externalInference:true,attemptsToday:Number(reservation.attempts),dailyLimit:3,notice:"Private preview; download to retain. Not automatically published or stored in the artwork vault."};
}
