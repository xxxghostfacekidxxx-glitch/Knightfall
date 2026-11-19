/* Optional device-only Crucible shelf.
   Explicit writes only; no backend or sync. Browser profile users can see these files. */
import {parseCrucibleWorkspace} from "./chaos-crucible-progress.mjs";
export const CRUCIBLE_SHELF_KEY="kf:miss-chaos:crucible:shelf:v1";
export const CRUCIBLE_SHELF_LIMIT=12;
const MAX_STORAGE_CHARS=170000;
const VALID_ID=/^[a-z0-9-]{5,90}$/;
const schema="knightfall.miss-chaos.crucible.shelf.v1";

export function readCrucibleShelf(storage){
 if(!storage||typeof storage.getItem!=="function")throw Error("Device storage is unavailable.");
 const raw=storage.getItem(CRUCIBLE_SHELF_KEY);
 if(raw===null)return [];
 if(typeof raw!=="string"||raw.length>MAX_STORAGE_CHARS)throw Error("Device shelf data is too large. Export an existing kit before resetting browser data.");
 let file;
 try{file=JSON.parse(raw);}catch{throw Error("Device shelf cannot be read. No existing projects were overwritten.");}
 if(!file||typeof file!=="object"||Array.isArray(file)||file.schema!==schema||
    !Array.isArray(file.entries)||file.entries.length>CRUCIBLE_SHELF_LIMIT)
   throw Error("Device shelf format is invalid. No existing projects were overwritten.");
 const ids=new Set();
 return file.entries.map(entry=>{
  if(!entry||typeof entry!=="object"||typeof entry.id!=="string"||
     !VALID_ID.test(entry.id)||ids.has(entry.id)||
     typeof entry.kit!=="string"||entry.kit.length>12000||
     typeof entry.savedAt!=="string"||!/^\d{4}-\d\d-\d\dT/.test(entry.savedAt)||
     !Number.isFinite(Date.parse(entry.savedAt)))
    throw Error("A stored project is invalid. No saved projects were changed.");
  ids.add(entry.id);
  const validated=parseCrucibleWorkspace(entry.kit);
  return {id:entry.id,savedAt:entry.savedAt,kit:entry.kit,
          title:validated.project.title,kind:validated.project.kind};
 }).sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
}
function writeShelf(storage,entries){
 storage.setItem(CRUCIBLE_SHELF_KEY,JSON.stringify({
   schema,entries:entries.map(({id,savedAt,kit})=>({id,savedAt,kit}))
 }));
}
export function saveCrucibleShelf(storage,kit,{id=null,now=new Date(),newId=null}={}){
 if(typeof kit!=="string")throw Error("A valid project kit is required.");
 const parsed=parseCrucibleWorkspace(kit);
 const list=readCrucibleShelf(storage);
 if(id!==null&&(typeof id!=="string"||!VALID_ID.test(id)))throw Error("Invalid device shelf project ID.");
 const index=id===null?-1:list.findIndex(entry=>entry.id===id);
 if(id!==null&&index<0)throw Error("That device project no longer exists. Save as a new copy instead.");
 if(index<0&&list.length>=CRUCIBLE_SHELF_LIMIT)
   throw Error("The device shelf holds 12 projects. Remove an old project or export a kit before saving another.");
 if(!(now instanceof Date)||Number.isNaN(now.getTime()))throw Error("Invalid device save timestamp.");
 const assigned=index>=0?id:(newId||("c-"+now.getTime().toString(36)+"-"+Math.random().toString(36).slice(2,10)));
 if(!VALID_ID.test(assigned)||list.some(entry=>entry.id===assigned&&entry.id!==id))
   throw Error("Could not create a unique device project ID.");
 const entry={id:assigned,savedAt:now.toISOString(),kit,
              title:parsed.project.title,kind:parsed.project.kind};
 if(index>=0)list[index]=entry;else list.push(entry);
 writeShelf(storage,list);
 return {id:entry.id,savedAt:entry.savedAt,title:entry.title,kind:entry.kind,replaced:index>=0};
}
export function deleteCrucibleShelf(storage,id){
 if(typeof id!=="string"||!VALID_ID.test(id))throw Error("Invalid device shelf project ID.");
 const list=readCrucibleShelf(storage);
 const filtered=list.filter(entry=>entry.id!==id);
 if(filtered.length===list.length)return false;
 writeShelf(storage,filtered);
 return true;
}
