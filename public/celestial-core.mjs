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
export function drawCards(count,random=Math.random,selection="major"){
 if(![1,3,5].includes(count))throw Error("Choose one, three or five cards.");
 if(!["major","full","minor"].includes(selection))throw Error("Choose a deck.");
 const pool=[...(selection==="major"?arcana:selection==="minor"?deck.slice(22):deck)],draw=[];
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

export const suits=[
 ["Wands","✦",["Spark","Planning","Expansion","Celebration","Competition","Recognition","Conviction","Momentum","Persistence","Burden","Curiosity","Adventure","Confidence","Leadership"],["What inspires action?","What direction will I choose?","What is ready to grow?","What milestone deserves recognition?","Which conflict is constructive?","How can I recognize progress?","Which principle deserves a defense?","What needs timely action?","Where do I need rest or resolve?","What responsibility can I share?","What would I explore as a beginner?","How can I act without rushing?","Where can I trust my creativity?","How can I lead responsibly?"]],
 ["Cups","☽",["Openness","Connection","Friendship","Contemplation","Loss","Memory","Options","Departure","Contentment","Belonging","Sensitivity","Invitation","Compassion","Emotional steadiness"],["What feeling needs space?","What makes a relationship reciprocal?","Who shares my joy?","What opportunity am I overlooking?","What remains after disappointment?","Which memory informs today?","Which option fits reality?","What no longer serves me?","What is enough?","What does belonging mean to me?","What feeling am I learning to name?","How can I express affection honestly?","How can I listen without absorbing everything?","What helps me respond calmly?"]],
 ["Swords","⚔",["Clarity","Indecision","Heartache","Rest","Conflict","Passage","Strategy","Restriction","Worry","Ending","Inquiry","Urgency","Discernment","Judgment"],["What fact matters most?","What information would help me decide?","What pain deserves acknowledgement?","Where can I pause?","What is the cost of winning?","What supports a transition?","Where do I need transparency?","Which constraint can I question?","What concern needs a practical response?","What can I stop carrying?","What question should I ask?","How can I slow a rushed decision?","What boundary protects clarity?","What would evidence-based judgment look like?"]],
 ["Pentacles","◇",["Opportunity","Balance","Craft","Security","Scarcity","Exchange","Patience","Practice","Independence","Legacy","Learning","Reliability","Stewardship","Stability"],["What tangible opportunity is available?","What needs a sustainable balance?","Who can help me improve my craft?","What am I protecting and why?","Where can I seek support?","What makes an exchange fair?","What requires time?","What skill deserves practice?","What does independence require?","What am I building for the future?","What practical skill can I learn?","What routine would support progress?","How can I care for resources and people?","What would responsible stability look like?"]]
];
export const ranks=["Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
export const deck=[...arcana,...suits.flatMap(([suit,glyph,themes,prompts])=>ranks.map((rank,i)=>[glyph+" "+(i<10?i+1:rank[0]),rank+" of "+suit,themes[i],prompts[i],suit]))];
export function parseUtcMinute(value){
 if(typeof value!=="string"||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))throw Error("Enter a date and UTC time.");
 parseDay(value.slice(0,10));
 const d=new Date(value+":00Z");
 if(!Number.isFinite(+d)||d.toISOString().slice(0,16)!==value)throw Error("Enter a valid UTC time.");
 return d;
}
export function transitAspects(natal,moving){
 const out=[],types=[["Conjunction",0],["Sextile",60],["Square",90],["Trine",120],["Opposition",180]];
 for(const m of moving)for(const n of natal){
  const sep=Math.abs(norm(m.longitude-n.longitude+180)-180);
  for(const [type,target] of types){const orb=Math.abs(sep-target);if(orb<=2)out.push({transit:m.name,natal:n.name,type,orb});}
 }
 return out.sort((a,b)=>a.orb-b.orb);
}
export function personalYear(day,year){
 parseDay(day);
 if(!Number.isInteger(year)||year<1900||year>2100)throw Error("Choose a year from 1900 to 2100.");
 let sum=[...day.slice(5).replace("-","")+String(year)].reduce((a,b)=>a+Number(b),0);
 while(sum>9)sum=[...String(sum)].reduce((a,b)=>a+Number(b),0);
 return sum;
}
export function nameNumbers(name){
 if(typeof name!=="string"||name.length>160)throw Error("Enter a name of up to 160 characters.");
 const letters=name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z]/g,"");
 if(!letters)throw Error("Enter a name containing Latin letters.");
 let expression=0,vowels=0,consonants=0;
 for(const l of letters){const v=(l.charCodeAt(0)-65)%9+1;expression+=v;if("AEIOU".includes(l))vowels+=v;else consonants+=v;}
 return {expression:reduceNumber(expression),soul:vowels?reduceNumber(vowels):null,personality:consonants?reduceNumber(consonants):null};
}
export function seasonEvents(engine,year){
 if(!Number.isInteger(year)||year<1900||year>2100)throw Error("Choose a year from 1900 to 2100.");
 const s=engine.Seasons(year);
 return [["March equinox",s.mar_equinox],["June solstice",s.jun_solstice],["September equinox",s.sep_equinox],["December solstice",s.dec_solstice]].map(([name,event])=>({name,date:event.date.toISOString()}));
}
export function wheelPoint(longitude,radius){
 const a=(180-norm(longitude))*Math.PI/180;
 return {x:200+radius*Math.cos(a),y:200-radius*Math.sin(a)};
}
