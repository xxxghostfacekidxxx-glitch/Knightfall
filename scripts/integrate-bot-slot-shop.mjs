import fs from "node:fs";
const path="backend/src/index.js";
let code=fs.readFileSync(path,"utf8");
const put=(needle,addition,marker)=>{
 if(code.includes(marker))return;
 if(!code.includes(needle))throw Error("Missing anchor: "+needle);
 code=code.replace(needle,addition+needle);
};
put('import { calculateAstrology, calculateTransits } from "./astrology.js";',
 'import { handleBotSlotShop } from "./member-shop-checkout.js";\n','import { handleBotSlotShop }');
const cap=' const cap=user.role==="god"||user.role==="admin"?10:user.role==="moderator"?5:2;';
if(code.includes(cap))code=code.replace(cap,
 ' const baseCap=user.role==="god"||user.role==="admin"?10:user.role==="moderator"?5:2;\n'+
 ' const extra=await env.DB.prepare("SELECT extra_bot_slots FROM member_shop_entitlements WHERE user_id=?").bind(user.id).first().catch(()=>null);\n'+
 ' const cap=baseCap+Math.max(0,Math.min(100,Number(extra?.extra_bot_slots||0)));');
put('  if(url.pathname==="/api/member-shop/catalog"&&request.method==="GET"){',
 '  if(url.pathname.startsWith("/api/member-shop/")&&url.pathname!=="/api/member-shop/catalog"){\n'+
 '    const shopUser=url.pathname.endsWith("/stripe-webhook")?null:await requireUser(request,env);\n'+
 '    const result=await handleBotSlotShop(request,env,url,shopUser);\n'+
 '    if(result)return result;\n  }\n',
 'const result=await handleBotSlotShop');
fs.writeFileSync(path,code);
console.log("Member shop integration applied.");
