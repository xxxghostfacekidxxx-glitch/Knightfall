import * as prettier from "prettier/standalone";
import prettierBabel from "prettier/plugins/babel";
import prettierEstree from "prettier/plugins/estree";
export {buildChaosFlow} from "../public/chaos-flow-core.mjs";

/** No model calls, account access, file writes or code execution. */
export async function formatChaosCode(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Invalid formatting arguments.");
 const code=input.code;
 if(typeof code!=="string"||!code.trim()||new TextEncoder().encode(code).length>10000)
  throw Error("Provide 1–10,000 bytes of JavaScript or JSON.");
 const language=String(input.language||"javascript").toLowerCase();
 if(!["javascript","json"].includes(language))throw Error("Only JavaScript and JSON formatting are supported.");
 const printWidth=input.print_width===undefined?80:input.print_width;
 if(!Number.isInteger(printWidth)||printWidth<40||printWidth>120)throw Error("Print width must be 40–120.");
 let formatted;
 try{
  formatted=await prettier.format(code,{
   parser:language==="json"?"json":"babel",
   plugins:[prettierBabel,prettierEstree],
   printWidth,tabWidth:2,useTabs:false,semi:true,
   singleQuote:false,bracketSpacing:true,
   endOfLine:"lf"
  });
 }catch(e){
  const message=String(e?.message||"Formatting failed.").split("\n")[0].slice(0,180);
  return {source:"Prettier 3.6.2 (MIT)",language,valid:false,error:message,
   notice:"No code was changed. Fix syntax errors and try again."};
 }
 if(typeof formatted!=="string"||new TextEncoder().encode(formatted).length>28000)
   throw Error("Formatted output exceeded the safe limit.");
 return {source:"Prettier 3.6.2 (MIT)",language,valid:true,
  formatted,changed:formatted!==code,
  notice:"This is source formatting only. Code was never run, uploaded to a separate service, or saved in the database."};
}
