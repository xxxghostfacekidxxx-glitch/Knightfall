// Celestial Sanctum: symbolic study tools and shared ephemeris calculations.
export const signs=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const planets=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto"];
export const planetThemes=["Identity and vitality","Feelings and rhythms","Language and learning","Values and connection","Action and boundaries","Growth and possibility","Limits and responsibility","Change and independence","Imagination and ambiguity","Transformation and power"];
export const norm=x=>((x%360)+360)%360;
export function parseDay(value){
 if(typeof value!=="string"||!/^(19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(value))throw Error("Choose a date between 1900 and 2100.");
 const d=new Date(value+"T12:00:00Z");
 if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value)throw Error("Choose a valid calendar date.");
 return d;
}
export function reduceNumber(n){
 if(!Number.isSafeInteger(n)||n<0)throw Error("Invalid number.");
 while(n>9&&![11,22,33].includes(n))n=String(n).split("").reduce((s,d)=>s+Number(d),0);
 return n;
}
export const numberThemes={1:"Initiative • What can I begin?",2:"Cooperation • Where can I listen?",3:"Expression • What wants a voice?",4:"Structure • What needs a foundation?",5:"Change • Where can I adapt?",6:"Care • What deserves attention?",7:"Inquiry • What assumptions need testing?",8:"Responsibility • How do I use influence?",9:"Completion • What can I release?",11:"Inspiration • How can I ground an idea?",22:"Building • What practical step matters?",33:"Service • How can I care without neglecting myself?"};
export function lifePath(value){
 parseDay(value);
 const digits=value.replace(/-/g,"");
 const sum=[...digits].reduce((a,b)=>a+Number(b),0);
 return {sum,number:reduceNumber(sum)};
}
export const arcana=[
 ["0","The Fool","Beginnings","What might I try without demanding certainty?"],
 ["I","The Magician","Agency","What resources are already within reach?"],
 ["II","The High Priestess","Intuition","What needs quiet attention before action?"],
 ["III","The Empress","Nurture","What conditions would help something grow?"],
 ["IV","The Emperor","Structure","Which boundary would support me?"],
 ["V","The Hierophant","Tradition","Which inherited belief deserves examination?"],
 ["VI","The Lovers","Choice","Which choice reflects my values?"],
 ["VII","The Chariot","Direction","Where should I focus my effort?"],
 ["VIII","Strength","Patience","Where can gentleness be more useful than force?"],
 ["IX","The Hermit","Reflection","What becomes clearer in solitude?"],
 ["X","Wheel of Fortune","Change","What is within my control amid change?"],
 ["XI","Justice","Accountability","What would a fair decision look like?"],
 ["XII","The Hanged Man","Perspective","What if I approached this differently?"],
 ["XIII","Death","Transition","What has ended, and what can begin?"],
 ["XIV","Temperance","Balance","What needs moderation or integration?"],
 ["XV","The Devil","Attachment","What habit or assumption limits my freedom?"],
 ["XVI","The Tower","Disruption","What support would help me rebuild?"],
 ["XVII","The Star","Hope","What small possibility remains?"],
 ["XVIII","The Moon","Uncertainty","What do I know, and what am I imagining?"],
 ["XIX","The Sun","Clarity","What gives me energy and confidence?"],
 ["XX","Judgement","Reassessment","What can I learn from past choices?"],
 ["XXI","The World","Integration","What have I completed or brought together?"]
];
export function drawCards(count,random=Math.random){
 if(![1,3].includes(count))throw Error("Choose one or three cards.");
 const pool=[...arcana],draw=[];
 while(draw.length<count){
  const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error("Invalid random value.");
  draw.push(pool.splice(Math.floor(r*pool.length),1)[0]);
 }
 return draw;
}
export function skySnapshot(engine,date){
 if(!(date instanceof Date)||!Number.isFinite(+date))throw Error("Invalid observation time.");
 const lon=(name,time)=>norm(engine.Ecliptic(engine.GeoVector(engine.Body[name],time,true)).elon);
 return planets.map((name,i)=>{
  const longitude=lon(name,date),before=lon(name,new Date(+date-86400000)),after=lon(name,new Date(+date+86400000));
  if(![longitude,before,after].every(Number.isFinite))throw Error("Ephemeris unavailable.");
  const speed=norm(after-before+180)-180;
  return {name,longitude,sign:signs[Math.floor(longitude/30)],degree:longitude%30,retrograde:speed<0,theme:planetThemes[i]};
 });
}
export function skyAspects(bodies){
 const out=[],types=[["Conjunction",0],["Sextile",60],["Square",90],["Trine",120],["Opposition",180]];
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j],sep=Math.abs(norm(a.longitude-b.longitude+180)-180);
  for(const [type,target] of types){const orb=Math.abs(sep-target);if(orb<=4)out.push({a:a.name,b:b.name,type,orb});}
 }
 return out.sort((a,b)=>a.orb-b.orb);
}
export const studies=[
 ["Egyptian traditions","Osiris and Isis","Osiris is associated with death, regeneration and kingship; Isis with protective magic, mourning and restoration. Their stories vary across periods and texts.","Compare the restoration of Osiris with a modern metaphor for recovery. Where does the analogy end?"],
 ["Egyptian traditions","Ma'at","Ma'at names a goddess and an ideal of truth, justice and cosmic order. It is not interchangeable with modern moral or astrological systems.","What is the difference between order, fairness and obedience?"],
 ["Egyptian traditions","Thoth","Thoth is associated with writing, knowledge, reckoning and the Moon in Egyptian traditions.","How do recording and measuring change what a culture remembers?"],
 ["Greek mythology","Persephone","The Homeric Hymn to Demeter relates Persephone's descent and return in a narrative tied to loss, reunion and agricultural rhythms.","Compare seasonal interpretations with the narrative's treatment of agency."],
 ["Greek mythology","Hermes","Hermes is a messenger, traveler and boundary-crossing figure. Later Hermetic traditions are distinct historical developments.","Which boundaries are practical, and which are symbolic?"],
 ["Esoteric history","Hermetic texts","The Corpus Hermeticum contains philosophical and religious dialogues composed in the early centuries CE in the Greco-Egyptian world.","Distinguish historical authorship from later claims of ancient authority."],
 ["Esoteric history","Alchemy","Alchemy encompasses diverse historical practices involving materials, medicine and natural philosophy; modern psychological readings are later interpretations.","How does material transformation differ from metaphorical transformation?"],
 ["Symbolic arts","Tarot history","Tarot began as a European card game in the fifteenth century. Occult and divinatory interpretations developed later.","How does a change of use alter the meaning of an object?"],
 ["Symbolic arts","Astrology and astronomy","Historical astrology and astronomy were often intertwined. Modern astronomy uses observation and testable models; astrology is not established as a predictive science.","What separates a measurable observation from an interpretation?"]
];
