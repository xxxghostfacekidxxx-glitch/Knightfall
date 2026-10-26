// Lightweight approximate geocentric ecliptic longitudes (orbital elements).
// Based on public-domain low-precision orbital elements by Paul Schlyter.
// Not Swiss Ephemeris, JPL DE, or a substitute for professional chart calculations.
const rad=Math.PI/180, deg=180/Math.PI;
const norm=x=>((x%360)+360)%360;
const sin=x=>Math.sin(x*rad),cos=x=>Math.cos(x*rad);
const signs=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
function solve(M,e){let E=M+deg*e*sin(M)*(1+e*cos(M));for(let i=0;i<8;i++)E-=(E-deg*e*sin(E)-M)/(1-e*cos(E));return E}
function elements(d,n,i,w,a,e,M){
 const E=solve(norm(M),e),x=a*(cos(E)-e),y=a*Math.sqrt(1-e*e)*sin(E);
 const v=Math.atan2(y,x)*deg,r=Math.hypot(x,y);
 return {x:r*(cos(n)*cos(v+w)-sin(n)*sin(v+w)*cos(i)),y:r*(sin(n)*cos(v+w)+cos(n)*sin(v+w)*cos(i)),z:r*sin(v+w)*sin(i),v,r};
}
function positions(date){
 const d=date.getTime()/86400000+2440587.5-2451543.5;
 const sun=elements(d,0,0,282.9404+4.70935e-5*d,1,0.016709-1.151e-9*d,356.0470+0.9856002585*d);
 const sunLong=norm(Math.atan2(sun.y,sun.x)*deg);
 const models={
 Mercury:[48.3313+3.24587e-5*d,7.0047+5e-8*d,29.1241+1.01444e-5*d,0.387098,0.205635+5.59e-10*d,168.6562+4.0923344368*d],
 Venus:[76.6799+2.4659e-5*d,3.3946+2.75e-8*d,54.8910+1.38374e-5*d,0.723330,0.006773-1.302e-9*d,48.0052+1.6021302244*d],
 Mars:[49.5574+2.11081e-5*d,1.8497-1.78e-8*d,286.5016+2.92961e-5*d,1.523688,0.093405+2.516e-9*d,18.6021+0.5240207766*d],
 Jupiter:[100.4542+2.76854e-5*d,1.3030-1.557e-7*d,273.8777+1.64505e-5*d,5.20256,0.048498+4.469e-9*d,19.8950+0.0830853001*d],
 Saturn:[113.6634+2.3898e-5*d,2.4886-1.081e-7*d,339.3939+2.97661e-5*d,9.55475,0.055546-9.499e-9*d,316.9670+0.0334442282*d],
 Uranus:[74.0005+1.3978e-5*d,0.7733+1.9e-8*d,96.6612+3.0565e-5*d,19.18171-1.55e-8*d,0.047318+7.45e-9*d,142.5905+0.011725806*d],
 Neptune:[131.7806+3.0173e-5*d,1.7700-2.55e-7*d,272.8461-6.027e-6*d,30.05826+3.313e-8*d,0.008606+2.15e-9*d,260.2471+0.005995147*d]
 };
 const output={Sun:sunLong};
 for(const [name,args] of Object.entries(models)){const p=elements(d,...args);output[name]=norm(Math.atan2(p.y+sun.y,p.x+sun.x)*deg)}
 // Low-precision Pluto series (heliocentric longitude, latitude and distance).
 // Approximation is intentionally identified as such, especially near sign cusps.
 const S=50.03+0.033459652*d,P=238.95+0.003968789*d;
 const plon=238.9508+0.00400703*d-19.799*sin(P)+19.848*sin(2*P)+0.897*sin(3*P)-4.956*sin(S)+0.610*sin(2*S)+1.211*sin(P-S)-1.341*sin(P+S)+0.267*sin(2*P-S)-0.143*sin(2*P+S)+0.364*sin(3*P-S)+0.119*sin(3*P+S)-0.186*sin(P-2*S)-0.034*sin(P+2*S)+0.031*sin(2*P-2*S)+0.010*sin(2*P+2*S);
 const plat=-3.9082-5.453*sin(P)-14.975*cos(P)+3.527*sin(2*P)+1.673*cos(2*P)-1.051*sin(3*P)+0.328*cos(3*P)+0.179*sin(P-S)-0.291*cos(P-S)+0.019*sin(P+S)+0.100*cos(P+S)-0.031*sin(2*P-S)-0.026*cos(2*P-S)+0.011*cos(2*P+S);
 const pr=40.72+6.68*sin(P)+6.90*cos(P)-1.18*sin(2*P)-0.03*cos(2*P)+0.15*sin(3*P)-0.14*cos(3*P);
 output.Pluto=norm(Math.atan2(pr*sin(plon)*cos(plat)+sun.y,pr*cos(plon)*cos(plat)+sun.x)*deg);
 const moon=elements(d,125.1228-0.0529538083*d,5.1454,318.0634+0.1643573223*d,60.2666,0.054900,115.3654+13.0649929509*d);
 const moonM=norm(115.3654+13.0649929509*d),sunM=norm(356.0470+0.9856002585*d);
 const elong=norm(125.1228-0.0529538083*d+318.0634+0.1643573223*d+moonM-sunLong);
 const argLat=norm(318.0634+0.1643573223*d+moonM);
 const correction=-1.274*sin(moonM-2*elong)+0.658*sin(2*elong)-0.186*sin(sunM)-0.059*sin(2*moonM-2*elong)-0.057*sin(moonM-2*elong+sunM)+0.053*sin(moonM+2*elong)+0.046*sin(2*elong-sunM)+0.041*sin(moonM-sunM)-0.035*sin(elong)-0.031*sin(moonM+sunM)-0.015*sin(2*argLat-2*elong)+0.011*sin(moonM-4*elong);
 output.Moon=norm(Math.atan2(moon.y,moon.x)*deg+correction);
 // Mean lunar nodes are approximate orbital-plane intersections, not true nodes.
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
 const gmst=norm(280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T-T*T*T/38710000);
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
 return {angles,house_placements:housePlacements,utc:time.toISOString(),zodiac:"tropical (approximate)",coordinate_system:"geocentric ecliptic longitude",bodies,aspects:aspects.sort((a,b)=>a.orb-b.orb),limitations:"Low-precision orbital-element calculations. Ascendant, Midheaven and equal/whole-sign houses require coordinates; mean lunar nodes are approximate; Pluto uses a low-precision series; no topocentric corrections or high-precision ephemeris accuracy. Retrograde is estimated from daily positions. Do not use for precise electional astrology."};
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
