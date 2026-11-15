/* Admin-only Stripe Invoicing. Creates an UNSENT draft for review.
 * No public user can issue invoices, no card data passes through Knightfall.
 */
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"private, no-store"}});
async function post(env,path,fields){
 const result=await fetch("https://api.stripe.com/v1/"+path,{
  method:"POST",headers:{"Authorization":"Bearer "+env.STRIPE_SECRET_KEY,"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams(fields)
 });
 const data=await result.json().catch(()=>({}));
 if(!result.ok)throw Error("Stripe Invoicing "+path+" failed: "+result.status);
 return data;
}
export async function handleStripeInvoiceDraft(request,env,url,user){
 if(url.pathname!=="/api/stripe/invoices/draft")return null;
 if(request.method!=="POST")return json({error:"Method not allowed"},405);
 if(!user||!["admin","god"].includes(user.role))return json({error:"Admin access required"},403);
 if(env.STRIPE_INVOICING_ENABLED!=="true"||!env.STRIPE_SECRET_KEY)return json({error:"Invoicing has not launched yet"},503);
 const origin=request.headers.get("Origin");
 if(origin&&origin!=="https://ash-fall.com"&&origin!=="https://www.ash-fall.com")return json({error:"Invalid request origin"},403);
 let body;
 try{body=await request.json()}catch{return json({error:"Expected JSON"},400)}
 const email=String(body?.email||"").trim().toLowerCase();
 const description=String(body?.description||"").trim();
 const amount=body?.amount_cents,days=body?.due_days??30;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:"Valid customer email required"},400);
 if(description.length<3||description.length>400)return json({error:"Description must be 3–400 characters"},400);
 if(!Number.isSafeInteger(amount)||amount<100||amount>500000)return json({error:"Invoice amount must be $1–$5,000 USD"},400);
 if(!Number.isSafeInteger(days)||days<1||days>60)return json({error:"Payment terms must be 1–60 days"},400);
 try{
  const customer=await post(env,"customers",{email});
  if(!/^cus_[A-Za-z0-9]+$/.test(customer.id||""))throw Error("Invalid customer ID");
  const invoice=await post(env,"invoices",{customer:customer.id,collection_method:"send_invoice",days_until_due:String(days),auto_advance:"false",description});
  if(!/^in_[A-Za-z0-9]+$/.test(invoice.id||""))throw Error("Invalid draft invoice ID");
  await post(env,"invoiceitems",{customer:customer.id,invoice:invoice.id,amount:String(amount),currency:"usd",description});
  return json({invoice_id:invoice.id,status:"draft",amount_cents:amount,currency:"USD",sent:false,info:"Review and send this draft in the Stripe Dashboard."},201);
 }catch(error){console.error("stripe_invoice_draft",String(error?.message||error));return json({error:"Could not prepare draft invoice. Check Stripe Dashboard before retrying."},502)}
}
