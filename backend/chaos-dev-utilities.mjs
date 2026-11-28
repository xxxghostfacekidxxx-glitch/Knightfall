import {diffLines,createTwoFilesPatch} from "diff";
/** Bounded code comparison. This never executes either input or changes repository files. */
export function compareChaosCode(input={}, {fullReview=false}={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Expected two text versions.");
 const before=input.before,after=input.after;
 const bytes=value=>new TextEncoder().encode(value).length;
 if(typeof before!=="string"||typeof after!=="string"||bytes(before)>(fullReview?16000:5000)||bytes(after)>(fullReview?16000:5000))
  throw Error("Each version must be text of at most 5,000 bytes.");
 if(before.split(/\r?\n/).length>250||after.split(/\r?\n/).length>250)throw Error("Maximum 250 lines per version.");
 const options={timeout:850,maxEditLength:1100};
 const changes=diffLines(before,after,options);
 if(!Array.isArray(changes))throw Error("Comparison exceeded the safe processing limit.");
 let added=0,removed=0;
 const hunks=changes.filter(part=>part.added||part.removed).map(part=>{
   const n=(part.value.match(/\n/g)||[]).length+(part.value.length&&!part.value.endsWith("\n")?1:0);
   if(part.added)added+=n;
   if(part.removed)removed+=n;
   return {action:part.added?"added":"removed",lines:n,preview:part.value.slice(0,420)};
 }).slice(0,24);
 let patch=before===after?"":createTwoFilesPatch("before.txt","after.txt",before,after,"","",{
   context:3,timeout:850,maxEditLength:1100
 });
 if(typeof patch!=="string"||bytes(patch)>(fullReview?40000:16500))throw Error("The diff is too large to return safely.");
 return {source:"jsdiff 8.0.2 (BSD-3-Clause)",identical:before===after,
   added_lines:added,removed_lines:removed,hunks,unified_diff:patch,
   notice:"Comparison only. No execution, source persistence, patch application, GitHub writes, or deployment."};
}
const TYPES=new Set(["object","array","string","number","integer","boolean","null"]);
const KEYS=new Set(["$schema","$id","title","description","type","properties","required","additionalProperties","items","enum","minimum","maximum","minLength","maxLength","minItems","maxItems"]);
const encodePath=key=>String(key).replace(/~/g,"~0").replace(/\//g,"~1");
function normalizeSchema(root){
 let visits=0;
 function visit(s,depth){
  if(!s||typeof s!=="object"||Array.isArray(s))throw Error("Schema must consist of JSON objects.");
  if(depth>7||++visits>120)throw Error("Schema is too deeply nested or too large.");
  for(const key of Object.keys(s))if(!KEYS.has(key))throw Error("Unsupported schema keyword: "+String(key).slice(0,50));
  if(!TYPES.has(s.type))throw Error("Every schema node needs one supported 'type'.");
  for(const key of ["minimum","maximum","minLength","maxLength","minItems","maxItems"]){
   if(Object.hasOwn(s,key)&&(!Number.isFinite(s[key])||(key.startsWith("min")||key.startsWith("max"))&&!Number.isInteger(s[key])&&key!=="minimum"&&key!=="maximum"))
     throw Error("Invalid numeric constraint: "+key);
  }
  if(Object.hasOwn(s,"additionalProperties")&&typeof s.additionalProperties!=="boolean")throw Error("additionalProperties must be boolean.");
  if(Object.hasOwn(s,"enum")&&(!Array.isArray(s.enum)||s.enum.length<1||s.enum.length>30))throw Error("Enum must contain 1–30 values.");
  if(Object.hasOwn(s,"required")&&(!Array.isArray(s.required)||s.required.length>35||s.required.some(v=>typeof v!=="string"||v.length>100)))throw Error("Invalid required fields.");
  if(Object.hasOwn(s,"properties")){
   if(s.type!=="object"||!s.properties||typeof s.properties!=="object"||Array.isArray(s.properties)||Object.keys(s.properties).length>35)throw Error("Invalid properties collection.");
   for(const child of Object.values(s.properties))visit(child,depth+1);
  }
  if(Object.hasOwn(s,"items")){if(s.type!=="array")throw Error("Items require array type.");visit(s.items,depth+1);}
 }
 visit(root,0);
}
export function validateChaosJSON(input={}){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Provide JSON document and schema.");
 const docText=input.document,schemaText=input.schema;
 if(typeof docText!=="string"||typeof schemaText!=="string")throw Error("JSON document and schema must be text.");
 const bytes=text=>new TextEncoder().encode(text).length;
 if(bytes(docText)>5300||bytes(schemaText)>5300||!docText.trim()||!schemaText.trim())
   throw Error("Each JSON text must be nonempty and at most 5,300 bytes.");
 let data,schema;
 try{data=JSON.parse(docText);}catch(e){return {source:"Knightfall bounded JSON shape validator",valid:false,errors:[{path:"/",message:"Document JSON is not valid: "+String(e.message).slice(0,120)}]};}
 try{schema=JSON.parse(schemaText);}catch(e){throw Error("Schema JSON syntax is invalid.");}
 normalizeSchema(schema);
 const errors=[];let inspected=0;
 function check(value,s,path,depth){
  if(++inspected>1500||depth>9)throw Error("Document is too complex for this validator.");
  if(errors.length>=16)return;
  const actual=value===null?"null":Array.isArray(value)?"array":typeof value;
  const matches=s.type==="integer"?typeof value==="number"&&Number.isInteger(value):s.type==="number"?typeof value==="number":actual===s.type;
  if(!matches){errors.push({path,message:"Expected "+s.type+", received "+actual});return;}
  if(s.enum&&!s.enum.some(expected=>JSON.stringify(expected)===JSON.stringify(value)))
    errors.push({path,message:"Not in the allowed enum values."});
  if(typeof value==="string"){
   if(Number.isInteger(s.minLength)&&value.length<s.minLength)errors.push({path,message:"Below minLength."});
   if(Number.isInteger(s.maxLength)&&value.length>s.maxLength)errors.push({path,message:"Above maxLength."});
  }
  if(typeof value==="number"){
   if(typeof s.minimum==="number"&&value<s.minimum)errors.push({path,message:"Below minimum."});
   if(typeof s.maximum==="number"&&value>s.maximum)errors.push({path,message:"Above maximum."});
  }
  if(Array.isArray(value)){
   if(Number.isInteger(s.minItems)&&value.length<s.minItems)errors.push({path,message:"Below minItems."});
   if(Number.isInteger(s.maxItems)&&value.length>s.maxItems)errors.push({path,message:"Above maxItems."});
   if(s.items)for(let i=0;i<value.length&&errors.length<16;i++)check(value[i],s.items,path+"/"+i,depth+1);
  }
  if(actual==="object"){
   for(const name of s.required||[])if(!Object.hasOwn(value,name))errors.push({path:path+"/"+encodePath(name),message:"Required property is missing."});
   for(const name of Object.keys(value)){
    if(errors.length>=16)break;
    if(Object.hasOwn(s.properties||{},name))check(value[name],s.properties[name],path+"/"+encodePath(name),depth+1);
    else if(s.additionalProperties===false)errors.push({path:path+"/"+encodePath(name),message:"Additional property is not allowed."});
   }
  }
 }
 check(data,schema,"",0);
 return {source:"Knightfall bounded JSON shape validator",valid:errors.length===0,errors,
   checked_nodes:inspected,
   limits:"Safe subset of JSON Schema: types, properties, required, additionalProperties, items, enum, numerical and size bounds. No $ref, pattern, conditionals, coercion, external access or execution."};
}
