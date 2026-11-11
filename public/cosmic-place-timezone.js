/* Knightfall birthplace time-zone suggestion. Coordinates only; no birth record sent.
   Geographic time-zone zones are approximations; historical practice needs verification. */
(()=>{
 "use strict";
 const validZone=zone=>{
  if(typeof zone!=="string"||!zone||zone.length>90)return false;
  try{new Intl.DateTimeFormat("en-US",{timeZone:zone});return true;}catch{return false;}
 };
 function suggest(latitude,longitude,fn=window.tzlookup){
  const lat=Number(latitude),lon=Number(longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -66||lat > 66||lon < -180||lon > 180)throw Error("Unsupported birthplace coordinates.");
  if(typeof fn!=="function")throw Error("Offline geographic time-zone library unavailable. Enter your zone manually.");
  const zone=fn(lat,lon);
  if(!validZone(zone))throw Error("Estimated time zone is not supported by your browser. Enter one manually.");
  return zone;
 }
 function setSuggestion(input,latitude,longitude){
  if(!input)return {zone:null,applied:false,message:"Birth-place time-zone field unavailable."};
  try{
   const zone=suggest(latitude,longitude);
   const previous=input.dataset.autoTimezone||"";
   const current=input.value.trim();
   const canReplace=!current||current===previous;
   if(canReplace){
    input.value=zone;
    input.dataset.autoTimezone=zone;
   }
   const message=canReplace
     ?"Suggested "+zone+" from the selected city. Verify the historical time zone, especially near zone borders."
     :"Geographic estimate is "+zone+"; your manually entered "+current+" was preserved. Verify which applied at birth.";
   return {zone,applied:canReplace,message};
  }catch(error){
   return {zone:null,applied:false,message:error.message||"Unable to suggest time zone. Enter it manually."};
  }
 }
 function clearAuto(input){
  if(!input)return;
  const previous=input.dataset.autoTimezone||"";
  if(previous&&input.value===previous)input.value="";
  delete input.dataset.autoTimezone;
 }
 window.KnightfallGeoTimezone=Object.freeze({suggest,setSuggestion,clearAuto});
})();
