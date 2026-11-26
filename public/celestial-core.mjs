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

// Editorial reference inventories; relationships indicate associations, not a universal genealogy.
export const deities=[["osiris","Osiris","Afterlife","crook","Regeneration, kingship and the afterlife.","In the Osirian cycle his death and restoration establish an important model of renewed life.",["isis","horus","nephthys","anubis","set"]],["isis","Isis","Protection","throne","Protection, restoration and motherhood.","A central figure in the Osiris cycle, often represented with the child Horus.",["osiris","horus","nephthys"]],["horus","Horus","Kingship","falcon","Royal authority and the sky.","Many forms of Horus exist; the son of Isis and Osiris is one prominent form.",["isis","osiris","set","hathor"]],["anubis","Anubis","Afterlife","jackal","Embalming and funerary protection.","Canid imagery identifies this important guardian of the deceased.",["osiris","isis"]],["ra","Ra","Creation","sun","Solar renewal and creation.","Egyptian solar theology includes different manifestations and combined divine identities.",["atum","amun","hathor","sekhmet"]],["set","Set","Kingship","storm","Disorder, conflict and force.","His antagonism in the Osiris cycle does not encompass all his religious roles.",["osiris","horus"]],["nephthys","Nephthys","Afterlife","wings","Mourning and protection.","Frequently associated with Isis in funerary mythology.",["isis","osiris"]],["maat","Ma'at","Order","feather","Truth, justice and cosmic order.","The concept and its divine personification are important to Egyptian kingship and judgment.",["thoth","osiris"]],["thoth","Thoth","Order","moon","Writing, knowledge and reckoning.","Ibis and baboon imagery are among his traditional forms.",["maat","khonsu"]],["hathor","Hathor","Protection","horns","Music, celebration and nurturing.","Cow imagery and a solar disk between horns are well-known forms.",["horus","ra","sekhmet"]],["sekhmet","Sekhmet","Protection","lion","Power and the restraint of destructive force.","Her lioness imagery belongs to a broader complex of solar goddess traditions.",["ra","hathor","bastet"]],["bastet","Bastet","Protection","cat","Feline divinity and protection.","Her visual forms and associations changed across Egyptian history.",["sekhmet","ra"]],["ptah","Ptah","Creation","pillar","Craftsmanship and creation.","Memphis was a major center of his worship.",["sekhmet"]],["atum","Atum","Creation","horizon","Creation and the Heliopolitan tradition.","His identity is linked to solar theology in several accounts.",["ra"]],["amun","Amun","Creation","crown","Divine kingship and Theban worship.","Amun-Re illustrates the joining of divine identities.",["ra","khonsu"]],["khonsu","Khonsu","Order","crescent","Lunar divinity and Theban religion.","Associated with the Theban divine family.",["amun","thoth"]]];
export const zodiacCorrespondences=[["Fire","Cardinal","Mars","Initiation"],["Earth","Fixed","Venus","Continuity"],["Air","Mutable","Mercury","Exchange"],["Water","Cardinal","Moon","Nurture"],["Fire","Fixed","Sun","Expression"],["Earth","Mutable","Mercury","Refinement"],["Air","Cardinal","Venus","Relationships"],["Water","Fixed","Mars","Depth"],["Fire","Mutable","Jupiter","Exploration"],["Earth","Cardinal","Saturn","Structure"],["Air","Fixed","Saturn","Collective ideas"],["Water","Mutable","Jupiter","Imagination"]].map((row,i)=>[signs[i],...row]);
export const houseTopics=["Self and appearance","Personal resources","Communication and nearby environment","Home and roots","Creativity and pleasure","Daily routines and service","Partnerships","Shared resources and mortality","Higher learning and worldview","Public role and vocation","Friends and collective aims","Seclusion and inner life"];
export const planetaryMetals=[["Sun","Gold","☉"],["Moon","Silver","☽"],["Mercury","Mercury","☿"],["Venus","Copper","♀"],["Mars","Iron","♂"],["Jupiter","Tin","♃"],["Saturn","Lead","♄"]];
export const alchemyStages=[["Nigredo","Blackening","A term used in some alchemical accounts for darkening or decomposition.","What is no longer useful in a process?"],["Albedo","Whitening","A term associated with whitening or purification in some accounts.","What can be clarified?"],["Citrinitas","Yellowing","A stage included in some historical color sequences, not every account.","What is beginning to emerge?"],["Rubedo","Reddening","A term associated with reddening and completion in some accounts.","What would meaningful completion look like?"]];
export function findDeities(query="",group=""){const q=query.trim().toLowerCase();return deities.filter(d=>(!group||d[2]===group)&&d.slice(1,6).join(" ").toLowerCase().includes(q));}
export function zodiacFor(name){return zodiacCorrespondences.find(row=>row[0]===name)||null;}
export function tarotMotif(card){const i=deck.findIndex(c=>c[1]===card?.[1]);if(i<0)throw Error("Unknown tarot card.");return i<22?{kind:"major",index:i}:{kind:"minor",suit:Math.floor((i-22)/14),rank:(i-22)%14};}

export const chamberMap=[["cs-observatory","Observatory","☉",88,88],["cs-transits","Natal transits","☿",250,52],["cs-synastry","Synastry","☍",412,88],["cs-calendar","Calendar","☾",455,190],["cs-numerology","Numerology","Ⅲ",410,292],["cs-tarot","Tarot","✦",250,328],["cs-library","Archives","✧",90,292],["cs-runes","Runes","ᚠ",45,190],["cs-geometry","Geometry","◇",163,190],["cs-pantheon","Hall of Gods","𓂀",250,138],["cs-correspondences","Lexicon","♄",337,190],["cs-alchemy","Alchemy","△",250,242],["cs-lessons","Study paths","✧",105,355],["cs-hours","Planetary hours","☉",250,395],["cs-circles","Study circles","✦",395,355]];
export function tarotAsset(card){const m=tarotMotif(card);return m.kind==="major"?"major-"+m.index+".svg":"minor-"+m.suit+"-"+m.rank+".svg";}
export function synastryAspects(first,second,orbLimit=4){if(![2,4,6].includes(orbLimit))throw Error("Choose a supported aspect orb.");const out=[],types=[["Conjunction",0],["Sextile",60],["Square",90],["Trine",120],["Opposition",180]];for(const a of first)for(const b of second){if(!Number.isFinite(a.longitude)||!Number.isFinite(b.longitude))throw Error("Invalid chart position.");const sep=Math.abs(norm(a.longitude-b.longitude+180)-180);for(const [type,target] of types){const orb=Math.abs(sep-target);if(orb<=orbLimit)out.push({first:a.name,second:b.name,type,orb});}}return out.sort((a,b)=>a.orb-b.orb);}

export const studyLessons=[["Creation at Heliopolis","Atum and the Ennead","The Heliopolitan tradition describes Atum and successive divine generations. Other Egyptian communities articulated creation differently.","Why do different communities tell different origin stories?"],["Creation at Memphis","Ptah and creation","The Memphite theological tradition associates Ptah with creation through heart and tongue. Its surviving textual witness has a complex transmission history.","Compare intention, speech and craft as metaphors for creation."],["Osirian cycle","Death and restoration","Accounts connect Osiris, Isis, Set and Horus through death, restoration and disputes over succession. Details vary across sources.","How does restoration differ from returning to an unchanged past?"],["The Duat","Entering the night","Egyptian underworld texts describe the solar journey and the deceased's passage in different ways. This study sequence is a modern editorial overview, not a reconstructed ritual.","What does darkness symbolize in different contexts?"],["The Duat","Gates and guardians","Some New Kingdom funerary compositions organize the night journey around regions, gates and divine beings.","How does a journey narrative organize uncertainty?"],["The Duat","Judgment and renewal","The weighing of the heart belongs to mortuary traditions; solar renewal is prominent in other underworld compositions. These are not one uniform itinerary.","What is the difference between judgment and renewal?"],["Hermetic philosophy","Mind and cosmos","The philosophical Hermetica use dialogues to explore divinity, knowledge and the world. The texts do not form a single modern doctrine.","What is knowledge, and how does it differ from belief?"],["Hermetic philosophy","The human place","Hermetic texts contain diverse reflections on human nature and its relationship to the divine and cosmos.","How do cosmological models shape an account of human responsibility?"],["Hermetic reception","Historical transmission","Hermetic writings circulated across languages and historical settings; Renaissance reception and modern occult systems are distinct stages.","How does translation reshape interpretation?"],["Hermetic reception","The Emerald Tablet","The short alchemical text known as the Emerald Tablet circulated in Arabic and Latin traditions. It should not be conflated with the Corpus Hermeticum.","What can a metaphor explain without becoming a scientific claim?"]];
export const studyCircles=[["celestial-astrology","Celestial Astrology","Chart symbolism, astronomy and planetary studies."],["celestial-tarot","Celestial Tarot and Runes","Card symbolism, runic history and reflection."],["celestial-mythology","Celestial Mythology","Egyptian traditions, comparative mythology and sources."],["celestial-hermetic","Celestial Hermetic Studies","Hermetic literature, alchemy and sacred geometry."]];
export const hourOrder=["Saturn","Jupiter","Mars","Sun","Venus","Mercury","Moon"];
export function planetaryHours(engine,day,lat,lon){
 const d=parseDay(day),start=new Date(day+"T00:00:00Z");if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180)throw Error("Enter valid latitude and longitude.");
 const observer=new engine.Observer(lat,lon,0),sun=engine.Body.Sun;
 const rise=engine.SearchRiseSet(sun,observer,1,start,1);if(!rise)throw Error("No sunrise on this UTC date at these coordinates.");
 const set=engine.SearchRiseSet(sun,observer,-1,rise,1),next=set&&engine.SearchRiseSet(sun,observer,1,set,1);if(!set||!next)throw Error("A complete sunrise–sunset cycle is unavailable here.");
 const a=+rise.date,b=+set.date,c=+next.date;if(!(a<b&&b<c))throw Error("Invalid solar cycle.");
 const first=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"][d.getUTCDay()],index=hourOrder.indexOf(first);
 return Array.from({length:24},(_,i)=>{const night=i>=12,j=i%12,base=night?b:a,step=(night?c-b:b-a)/12;return {hour:i+1,period:night?"Night":"Day",planet:hourOrder[(index+i)%7],start:new Date(base+j*step).toISOString(),end:new Date(base+(j+1)*step).toISOString()};});
}
