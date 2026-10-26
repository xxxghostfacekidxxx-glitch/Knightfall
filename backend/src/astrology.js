import * as Astronomy from "astronomy-engine";
// Geocentric planetary positions via MIT-licensed Astronomy Engine.
// Not Swiss Ephemeris; lunar mean nodes and house angles retain approximations.
const rad=Math.PI/180, deg=180/Math.PI;
const norm=x=>((x%360)+360)%360;
const sin=x=>Math.sin(x*rad),cos=x=>Math.cos(x*rad);
const signs=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
// Astronomy Engine 2.1.19 (MIT): geocentric apparent positions converted
// from J2000 equatorial coordinates to true ecliptic of date.
const PLANETS=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
function positions(date){
 const output={};
 for(const name of PLANETS){
  const vector=Astronomy.GeoVector(Astronomy.Body[name],date,true);
  output[name]=norm(Astronomy.Ecliptic(vector).elon);
 }
 // Mean nodes: an approximate secular lunar-node formula, distinct from
 // the high-precision planetary ephemeris and from true/oscillating nodes.
 const d=date.getTime()/86400000+2440587.5-2451543.5;
 output["North Node"]=norm(125.1228-0.0529538083*d);
 output["South Node"]=norm(output["North Node"]+180);
 return output;
}
// Ascendant at the eastern ecliptic/horizon intersection; equal-house cusps
// are 30 degrees apart from the Ascendant. These are NOT Placidus houses.
export function calculateAngles(iso, latitude, longitude, houseSystem="equal"){
 const lat=Number(latitude),lon=Number(longitude),time=new Date(iso);
 if(!Number.isFinite(time.getTime())||!Number.isFinite(lat)||!Number.isFinite(lon)||lat < -66||lat > 66||lon < -180||lon > 180)throw Error("Provide a valid UTC date and coordinates (latitude -66 to 66, longitude -180 to 180).");
 const jd=time.getTime()/86400000+2440587.5,T=(jd-2451545)/36525;
 const gmst=norm(Astronomy.SiderealTime(time)*15);
 const lst=norm(gmst+lon);
 const obliquity=23.439291111-0.013004167*T-0.0000001639*T*T+0.0000005036*T*T*T;
 const theta=lst*rad,eps=obliquity*rad,phi=lat*rad;
 const asc=norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(eps)+Math.tan(phi)*Math.sin(eps))*deg);
 if(!["equal","whole-sign"].includes(houseSystem))throw Error("Choose equal or whole-sign houses.");
 const firstCusp=houseSystem==="whole-sign"?Math.floor(asc/30)*30:asc;
 const houses=Array.from({length:12},(_,i)=>Number(norm(firstCusp+i*30).toFixed(3)));
 const midheaven=norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(eps))*deg);
 return {ascendant:Number(asc.toFixed(3)),ascendant_sign:signs[Math.floor(asc/30)],midheaven:Number(midheaven.toFixed(3)),midheaven_sign:signs[Math.floor(midheaven/30)],houses,house_system:houseSystem==="whole-sign"?"Whole sign":"Equal houses (Ascendant-based)",latitude:lat,longitude:lon,limitations:"Approximate sidereal time and mean obliquity; no nutation/refraction corrections. Neither equal nor whole-sign houses are Placidus. Extreme latitudes are not supported."};
}
export function calculateAstrology(iso,location,houseSystem="equal"){
 const time=new Date(iso);
 if(!Number.isFinite(time.getTime())||time.getUTCFullYear()<1900||time.getUTCFullYear()>2100)throw Error("Use a valid UTC time between 1900 and 2100.");
 const now=positions(time),before=positions(new Date(time.getTime()-86400000)),after=positions(new Date(time.getTime()+86400000));
 const bodies=Object.fromEntries(Object.entries(now).map(([name,longitude])=>{
  const speed=((after[name]-before[name]+540)%360-180)/2;
  return [name,{longitude:Number(longitude.toFixed(3)),sign:signs[Math.floor(longitude/30)],degree_in_sign:Number((longitude%30).toFixed(3)),retrograde:speed<0}];
 }));
 const aspects=[],names=Object.keys(bodies).filter(name=>!name.endsWith("Node")),targets=[["conjunction",0],["sextile",60],["square",90],["trine",120],["opposition",180]];
 for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
  const a=bodies[names[i]].longitude,b=bodies[names[j]].longitude,diff=Math.abs(a-b),sep=Math.min(diff,360-diff);
  for(const [type,angle] of targets){const orb=Math.abs(sep-angle);if(orb<=4)aspects.push({a:names[i],b:names[j],type,orb:Number(orb.toFixed(2))});}
 }
 const angles=location ? calculateAngles(time.toISOString(),location.latitude,location.longitude,houseSystem) : null;
 const housePlacements=angles ? Object.fromEntries(Object.entries(bodies).map(([name,body])=>[name,Math.floor(norm(body.longitude-angles.houses[0])/30)+1])) : null;
 return {angles,house_placements:housePlacements,utc:time.toISOString(),zodiac:"tropical (true ecliptic of date)",coordinate_system:"geocentric ecliptic longitude",bodies,aspects:aspects.sort((a,b)=>a.orb-b.orb),limitations:"Planet positions use Astronomy Engine geocentric apparent vectors and true ecliptic of date. Mean lunar nodes and the house-angle formula remain approximate. Equal and whole-sign houses are supported, not Placidus. Retrograde is estimated from daily positions. Birth time and historic UTC offset affect Ascendant accuracy."};
}

export function calculateTransits(natalUtc,transitUtc){
 const natal=calculateAstrology(natalUtc),transit=calculateAstrology(transitUtc);
 const types=[["conjunction",0],["sextile",60],["square",90],["trine",120],["opposition",180]];
 const aspects=[];
 for(const [moving,m] of Object.entries(transit.bodies))for(const [natalBody,n] of Object.entries(natal.bodies)){
  const raw=Math.abs(m.longitude-n.longitude),sep=Math.min(raw,360-raw);
  for(const [type,angle] of types){const orb=Math.abs(sep-angle);if(orb<=2)aspects.push({transit:moving,natal:natalBody,type,orb:Number(orb.toFixed(2))});}
 }
 return {natal_utc:natal.utc,transit_utc:transit.utc,transit_bodies:transit.bodies,transit_aspects:aspects.sort((a,b)=>a.orb-b.orb),limitations:transit.limitations};
}
