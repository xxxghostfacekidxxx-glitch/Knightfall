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
,
["Egyptian traditions","Ra","Solar divinity and creation. Interpretations and forms vary across periods.","How do recurring cycles become metaphors for continuity?","https://giza.fas.harvard.edu/faq/"],
["Egyptian traditions","Horus","Falcon imagery and royal legitimacy. Interpretations and forms vary across periods.","How do symbols communicate legitimacy?","https://giza.fas.harvard.edu/faq/"],
["Egyptian traditions","Anubis","Embalming and care for the dead. Interpretations and forms vary across periods.","What does respectful remembrance involve?","https://giza.fas.harvard.edu/faq/"],
["Egyptian traditions","Hathor","Music, affection and renewal. Interpretations and forms vary across periods.","What deserves celebration?","https://giza.fas.harvard.edu/faq/"],
["Egyptian traditions","Sekhmet","Lioness imagery and the restraint of destructive force. Interpretations and forms vary across periods.","What distinguishes protection from uncontrolled anger?","https://www.ucl.ac.uk/museums-static/digitalegypt/religion/deitiescreation.html"],
["Egyptian traditions","Set","Conflict, disorder and a complex role in myth. Interpretations and forms vary across periods.","What is lost when a figure is reduced to a villain?","https://www.metmuseum.org/de/exhibitions/divine-egypt/inside-the-exhibition"],
["Egyptian traditions","Nephthys","Mourning and restoration in the Osiris cycle. Interpretations and forms vary across periods.","What does communal mourning make possible?","https://www.metmuseum.org/de/exhibitions/divine-egypt/inside-the-exhibition"],
["Egyptian traditions","Ptah","Memphis and creator traditions. Interpretations and forms vary across periods.","Compare creation through craftsmanship and speech.","https://www.ucl.ac.uk/museums-static/digitalegypt/religion/deitiesplaces.html"],
["Egyptian traditions","Atum","Heliopolis and the emergence of the world. Interpretations and forms vary across periods.","How do origin stories describe unity and multiplicity?","https://www.ucl.ac.uk/museums-static/digitalegypt/religion/deitiesplaces.html"],
["Egyptian traditions","Amun-Re","Combined divine identities and state religion. Interpretations and forms vary across periods.","Why might traditions combine rather than replace sacred identities?","https://www.metmuseum.org/de/exhibitions/divine-egypt/inside-the-exhibition"],
["Egyptian traditions","Creation traditions","Different local accounts of cosmic origins. Interpretations and forms vary across periods.","Compare regional variation rather than imposing a single story.","https://www.ucl.ac.uk/museums-static/digitalegypt/religion/deitiescreation.html"],
["Egyptian traditions","Duat","The otherworld as represented in funerary literature. Interpretations and forms vary across periods.","How do maps of unseen worlds express cultural values?","https://www.khanacademy.org/humanities/ancient-art-civilizations/egypt-art/beginners-guide-egypt/a/introduction-to-ancient-egyptian-mortuary-texts"],
["Egyptian traditions","Weighing of the heart","Judgment imagery in funerary texts. Interpretations and forms vary across periods.","How does this image convey accountability?","https://www.khanacademy.org/humanities/ancient-art-civilizations/egypt-art/beginners-guide-egypt/a/introduction-to-ancient-egyptian-mortuary-texts"],
["Egyptian traditions","Mortuary texts","Pyramid Texts, Coffin Texts and Book of the Dead spells. Interpretations and forms vary across periods.","What changes when a religious text reaches a different audience?","https://www.khanacademy.org/humanities/ancient-art-civilizations/egypt-art/beginners-guide-egypt/a/introduction-to-ancient-egyptian-mortuary-texts"],
["Esoteric history","Hermetic reception","Renaissance thinkers incorporated Hermetic writings into diverse philosophical projects.","Separate the original context from later reception.","https://plato.stanford.edu/entries/natphil-ren/"],
["Esoteric history","Microcosm and macrocosm","Historical correspondences between human beings and the cosmos are conceptual analogies rather than established physical mechanisms.","When is an analogy useful?","https://plato.stanford.edu/entries/natphil-ren/"],
["Esoteric history","Natural philosophy","Renaissance investigations of nature drew on multiple traditions of cosmology and medicine.","What distinguishes a claim from evidence?","https://plato.stanford.edu/entries/natphil-ren/"],
["Runic studies","Runic writing","Runes are historical Germanic writing systems with regional and chronological variation.","What can an inscription reveal about its writer?","https://en.natmus.dk/historical-knowledge/historical-themes/runes/"],
["Runic studies","Elder Futhark","The older runic alphabet has 24 characters; later inventories differ.","Compare an alphabet with a symbolic interpretation system.","https://nors.ku.dk/english/research/runes/"],
["Runic studies","Modern reflection","Modern rune prompts are distinct from evidence about historical inscriptions.","How can a contemporary practice acknowledge historical limits?","https://en.natmus.dk/historical-knowledge/historical-themes/runes/"],
["Sacred geometry","Circle and radius","Points on a circle are equidistant from its center.","Distinguish a property from a metaphor.",""],
["Sacred geometry","Vesica piscis","Two equal circles separated by one radius make a lens-shaped overlap.","Explore overlap and separation.",""],
["Sacred geometry","Seven-circle rosette","Six outer circles are arranged at sixty-degree intervals around a central circle.","Which patterns emerge from repetition?",""],
["Sacred geometry","Unicursal hexagram","A six-point figure can be traced in one closed path; symbolic interpretations vary.","Compare alternate paths through the same vertices.",""]
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

export const runeLetters=[
["ᚠ","Fehu","f","Resources"],["ᚢ","Uruz","u","Strength"],["ᚦ","Thurisaz","þ","Boundaries"],["ᚨ","Ansuz","a","Communication"],["ᚱ","Raidho","r","Direction"],["ᚲ","Kenaz","k","Learning"],["ᚷ","Gebo","g","Exchange"],["ᚹ","Wunjo","w","Joy"],["ᚺ","Hagalaz","h","Disruption"],["ᚾ","Nauthiz","n","Need"],["ᛁ","Isa","i","Stillness"],["ᛃ","Jera","j","Cycles"],["ᛇ","Eihwaz","ï","Endurance"],["ᛈ","Perthro","p","Uncertainty"],["ᛉ","Algiz","z","Protection"],["ᛊ","Sowilo","s","Clarity"],["ᛏ","Tiwaz","t","Commitment"],["ᛒ","Berkano","b","Growth"],["ᛖ","Ehwaz","e","Cooperation"],["ᛗ","Mannaz","m","Community"],["ᛚ","Laguz","l","Adaptability"],["ᛜ","Ingwaz","ŋ","Potential"],["ᛞ","Dagaz","d","Change"],["ᛟ","Othala","o","Belonging"]];
export function drawRune(random=Math.random){const r=random();if(!Number.isFinite(r)||r<0||r>=1)throw Error("Invalid random value.");return runeLetters[Math.floor(r*24)];}
export function geometryPattern(name){
 const circles=[],paths=[],add=(x,y,r)=>circles.push({x,y,r});
 switch(name){
 case "circle":add(200,200,130);paths.push([[200,200],[330,200]]);break;
 case "vesica":add(140,200,120);add(260,200,120);break;
 case "rosette":add(200,200,82);for(let i=0;i<6;i++){const a=i*Math.PI/3;add(200+82*Math.cos(a),200+82*Math.sin(a),82);}break;
 case "hexagram":{const p=i=>[200+150*Math.sin(i*Math.PI/3),200-150*Math.cos(i*Math.PI/3)];paths.push([0,2,5,3,1,4,0].map(p));break;}
 default:throw Error("Choose a geometry pattern.");
 }return {circles,paths};
}
export function celestialEvents(engine,year,kind="all"){
 if(!Number.isInteger(year)||year<1900||year>2100)throw Error("Choose a year from 1900 to 2100.");
 if(!["all","seasons","moon","eclipses"].includes(kind))throw Error("Choose an event category.");
 const start=new Date(Date.UTC(year,0,1)),end=new Date(Date.UTC(year+1,0,1)),events=[];
 if(kind==="all"||kind==="seasons")events.push(...seasonEvents(engine,year).map(e=>({...e,kind:"Season"})));
 function collect(first,next,dateOf,describe,max){
  let event=first(start),previous=-Infinity;
  for(let i=0;i<max;i++){
   const d=dateOf(event),t=+d;
   if(!Number.isFinite(t)||t<=previous||t<+start)throw Error("Astronomical search returned invalid event order.");
   if(t>=+end)return;
   events.push({...describe(event),date:d.toISOString()});previous=t;event=next(event);
  }throw Error("Astronomical search exceeded its event limit.");
 }
 if(kind==="all"||kind==="moon")collect(d=>engine.SearchMoonQuarter(d),e=>engine.NextMoonQuarter(e),e=>e.time.date,e=>({kind:"Moon",name:["New moon","First quarter","Full moon","Last quarter"][e.quarter]}),60);
 if(kind==="all"||kind==="eclipses"){
  collect(d=>engine.SearchGlobalSolarEclipse(d),e=>engine.NextGlobalSolarEclipse(e.peak),e=>e.peak.date,e=>({kind:"Solar eclipse",name:e.kind+" solar eclipse (global peak)"}),10);
  collect(d=>engine.SearchLunarEclipse(d),e=>engine.NextLunarEclipse(e.peak),e=>e.peak.date,e=>({kind:"Lunar eclipse",name:e.kind+" lunar eclipse (peak)"}),10);
 }return events.sort((a,b)=>a.date.localeCompare(b.date));
}
