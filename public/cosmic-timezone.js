/* Historical birth-place time zone conversion with native Intl, no third-party date API. */
(() => {
  "use strict";
  const pad=n=>String(n).padStart(2,"0");
  function parts(date,zone){
    const formatter=new Intl.DateTimeFormat("en-US-u-ca-gregory",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",hour12:false});
    const result={};
    for(const p of formatter.formatToParts(date))if(["year","month","day","hour","minute"].includes(p.type))result[p.type]=Number(p.value);
    return result;
  }
  function resolve(local,zone,fold="earlier"){
    const match=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(local||"");
    if(!match)throw Error("Enter a valid birth date and local time.");
    const [year,month,day,hour,minute]=match.slice(1).map(Number);
    const wall=new Date(Date.UTC(year,month-1,day,hour,minute));
    if(wall.getUTCFullYear()!==year||wall.getUTCMonth()!==month-1||wall.getUTCDate()!==day||wall.getUTCHours()!==hour||wall.getUTCMinutes()!==minute)throw Error("That local birth date or time is invalid.");
    const tz=String(zone||"").trim();
    if(!tz)throw Error("Enter a birth-place time zone, such as America/Chicago.");
    try{new Intl.DateTimeFormat("en-US",{timeZone:tz});}catch{throw Error("Unknown time zone. Choose a valid IANA zone such as America/Chicago.");}
    const candidates=[];
    // Quarter-hour offsets cover modern zones; some pre-1970 local mean times
    // had second-level offsets and require manual verification.
    for(let offset=-12*60;offset<=14*60;offset+=15){
      const date=new Date(wall.getTime()-offset*60000),check=parts(date,tz);
      if(check.year===year&&check.month===month&&check.day===day&&check.hour===hour&&check.minute===minute)candidates.push({utc:date.toISOString(),offset:offset/60});
    }
    candidates.sort((a,b)=>a.utc.localeCompare(b.utc));
    if(!candidates.length)throw Error("This time does not exist in that zone (DST jump), or the historical offset is unusual. Check the birth record and use a verified manual UTC offset.");
    return {chosen:fold==="later"?candidates[candidates.length-1]:candidates[0],ambiguous:candidates.length>1,candidates,zone:tz};
  }
  function populate(inputId){
    const input=document.getElementById(inputId);
    if(!input)return;
    const id=inputId+"-list",list=document.createElement("datalist");
    list.id=id;input.setAttribute("list",id);
    const zones=typeof Intl.supportedValuesOf==="function"?Intl.supportedValuesOf("timeZone"):[];
    const fallback=["America/Chicago","America/New_York","America/Denver","America/Los_Angeles","America/Phoenix","Europe/London","Europe/Paris","Asia/Kolkata","Australia/Sydney"];
    for(const zone of zones.length?zones:fallback)list.append(new Option(zone,zone));
    input.after(list);
  }
  window.KnightfallBirthTime=Object.freeze({resolve,populate});
})();
