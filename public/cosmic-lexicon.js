/* Knightfall Cosmic Library: traditional interpretive vocabulary for derived
 * tropical chart placements. Symbolic prompts, not diagnoses or predictions.
 * No date, time, coordinate, API call, tracking, or account access.
 */
(() => {
 "use strict";
 const PLANETS={
  Sun:{scope:"Identity and purposeful expression",gift:"creative confidence and a personal sense of direction",shadow:"overidentifying with recognition or external approval",reflection:"What choices feel authentically yours rather than performed for approval?"},
  Moon:{scope:"Emotional rhythms and private needs",gift:"an intuitive way to notice comfort, safety and connection",shadow:"falling into automatic emotional defenses when stressed",reflection:"What helps you feel safe enough to respond instead of react?"},
  Mercury:{scope:"Thinking, learning and communication",gift:"a recognizable style of gathering and exchanging ideas",shadow:"mistaking your preferred communication style for everyone's",reflection:"How can you make room for people who think differently?"},
  Venus:{scope:"Affection, pleasure, beauty and personal values",gift:"your symbolic approach to harmony and meaningful connection",shadow:"seeking agreement at the expense of clarity or honest boundaries",reflection:"What makes a relationship nourishing without losing yourself?"},
  Mars:{scope:"Energy, action, desire and conflict",gift:"an instinctive way to take initiative and protect priorities",shadow:"either rushing into conflict or holding back needed action",reflection:"What would assertive, deliberate action look like here?"},
  Jupiter:{scope:"Growth, faith, opportunity and exploration",gift:"curiosity about possibilities beyond familiar limits",shadow:"overpromising, overextending or treating hope as certainty",reflection:"Which opportunity deserves effort rather than optimism alone?"},
  Saturn:{scope:"Boundaries, responsibilities and discipline",gift:"the ability to build structures that survive difficulty",shadow:"confusing responsible limits with permanent restrictions",reflection:"What small sustainable commitment would strengthen your life?"},
  Uranus:{scope:"Change, experimentation and independence",gift:"a willingness to challenge stale assumptions",shadow:"pursuing disruption when a smaller improvement would do",reflection:"Which rule is worth questioning, and why?"},
  Neptune:{scope:"Dreams, imagination and ideals",gift:"creativity, sensitivity and openness to mystery",shadow:"blurring inspiration with certainty or ignoring hard evidence",reflection:"How can you protect your imagination while checking the facts?"},
  Pluto:{scope:"Intensity, renewal and questions of power",gift:"capacity for honest examination and long-term transformation",shadow:"letting control or suspicion substitute for trust",reflection:"Where can you make change without trying to control people?"},
  "North Node":{scope:"A traditional symbolic direction of learning",gift:"curiosity about less familiar choices",shadow:"treating a symbol as a fixed destiny",reflection:"What unfamiliar skill feels worth practicing?"},
  "South Node":{scope:"Familiar patterns in traditional node symbolism",gift:"skills and routines that once offered stability",shadow:"assuming old patterns are your only options",reflection:"Which familiar strengths can help you try something new?"}
 };
 const SIGNS={
  Aries:{style:"direct, initiating and willing to take a first step",gift:"courage and candor",challenge:"impulsiveness or unnecessary competition",element:"Fire",mode:"Cardinal"},
  Taurus:{style:"steady, sensory and oriented toward what lasts",gift:"patience and reliability",challenge:"resistance to needed change",element:"Earth",mode:"Fixed"},
  Gemini:{style:"curious, versatile and conversational",gift:"adaptability and connection",challenge:"scattering attention",element:"Air",mode:"Mutable"},
  Cancer:{style:"protective, receptive and rooted in belonging",gift:"care and emotional awareness",challenge:"withdrawing when vulnerable",element:"Water",mode:"Cardinal"},
  Leo:{style:"expressive, warm and creatively visible",gift:"generosity and courage",challenge:"needing recognition to feel valued",element:"Fire",mode:"Fixed"},
  Virgo:{style:"observant, precise and improvement-minded",gift:"discernment and practical service",challenge:"perfectionism and self-criticism",element:"Earth",mode:"Mutable"},
  Libra:{style:"relational, fair-minded and balancing",gift:"diplomacy and perspective",challenge:"indecision or conflict avoidance",element:"Air",mode:"Cardinal"},
  Scorpio:{style:"investigative, loyal and emotionally intense",gift:"depth and resilience",challenge:"secrecy or excessive control",element:"Water",mode:"Fixed"},
  Sagittarius:{style:"exploratory, candid and meaning-seeking",gift:"optimism and breadth of view",challenge:"overgeneralizing or escaping limits",element:"Fire",mode:"Mutable"},
  Capricorn:{style:"structured, ambitious and accountable",gift:"persistence and maturity",challenge:"equating achievement with self-worth",element:"Earth",mode:"Cardinal"},
  Aquarius:{style:"independent, systemic and future-oriented",gift:"originality and community thinking",challenge:"emotional distance or stubborn certainty",element:"Air",mode:"Fixed"},
  Pisces:{style:"imaginative, empathetic and receptive",gift:"compassion and creative flexibility",challenge:"unclear boundaries or idealization",element:"Water",mode:"Mutable"}
 };
 const HOUSES=[
  {title:"Self and first impressions",context:"How you enter new situations and shape a personal identity",question:"What first impression do you choose to reinforce or revise?"},
  {title:"Resources and values",context:"Money habits, possessions, self-worth and what feels worth protecting",question:"What are you building that matters beyond its price?"},
  {title:"Learning and everyday exchanges",context:"Conversation, neighbors, siblings, curiosity and nearby environments",question:"What idea deserves a clearer explanation or deeper listen?"},
  {title:"Home, family and inner foundations",context:"Belonging, private life, roots and the spaces that restore you",question:"What would make your foundations more supportive?"},
  {title:"Creativity, joy and play",context:"Art, affection, recreation and risks taken for self-expression",question:"Where can you create without needing to impress?"},
  {title:"Routines, wellbeing and craft",context:"Daily responsibilities, skill building and practical care",question:"Which sustainable habit would make tomorrow easier?"},
  {title:"Partnerships and negotiation",context:"One-to-one commitments, cooperation, reflection and boundaries",question:"How can you collaborate while remaining clear about your needs?"},
  {title:"Shared matters and renewal",context:"Trust, intimacy, shared resources, transitions and complex attachments",question:"What would responsible vulnerability look like?"},
  {title:"Beliefs and wider horizons",context:"Travel, philosophy, study, meaning and unfamiliar perspectives",question:"Which assumption could you test through experience?"},
  {title:"Vocation and public contribution",context:"Long-term goals, professional roles, accountability and reputation",question:"What work reflects your values even without applause?"},
  {title:"Friends and collective futures",context:"Groups, friendship, networks, service and shared aspirations",question:"What kind of community do you want to help create?"},
  {title:"Rest, solitude and integration",context:"Retreat, reflection, compassion and things understood privately",question:"What needs quiet attention rather than another distraction?"}
 ];
 const SIGNS_ORDER=Object.keys(SIGNS);
 const validHouse=x=>Number.isInteger(x)&&x>=1&&x<=12;
 function placement(chart,name){
  const body=chart?.bodies?.[name],planet=PLANETS[name],sign=SIGNS[body?.sign];
  if(!planet||!sign)return null;
  const raw=Number(body.degree_in_sign??body.degree);
  const degree=Number.isFinite(raw)&&raw>=0&&raw<30?raw:null;
  const house=validHouse(chart?.house_placements?.[name])&&chart?.time_precision!=="unknown"?chart.house_placements[name]:null;
  const section=house?HOUSES[house-1]:null;
  const retro=body?.retrograde===true;
  return {
   name,sign:body.sign,degree,house,element:sign.element,mode:sign.mode,
   title:name+" in "+body.sign+(house?" · house "+house:""),
   domain:planet.scope,
   reading:"In traditional tropical astrology, "+name+" concerns "+planet.scope.toLowerCase()+". The "+body.sign+" expression is often described as "+sign.style+". This combines "+planet.gift+" with the "+sign.element.toLowerCase()+" element and "+sign.mode.toLowerCase()+" modality.",
   houseReading:section?"In house "+house+", attention turns toward "+section.context.toLowerCase()+".":null,
   tension:"An invitation to watch for "+sign.challenge+" or "+planet.shadow+". These are possibilities for reflection, not traits established by a chart.",
   retrograde:retro?"Calculated retrograde: apparent backward motion in Earth's sky; traditionally read as a more reflective expression, not a defect.":null,
   question:section?section.question+" "+planet.reflection:planet.reflection
  };
 }
 function houseGuide(chart){
  if(!chart||chart.time_precision==="unknown")return [];
  const first=chart.angles?.ascendant_sign||chart.ascendant_sign;
  const signIndex=SIGNS_ORDER.indexOf(first);
  if(signIndex<0)return [];
  return HOUSES.map((house,i)=>{
   const number=i+1,sign=SIGNS_ORDER[(signIndex+i)%12];
   const occupants=Object.keys(chart.bodies||{}).filter(name=>validHouse(chart.house_placements?.[name])&&chart.house_placements[name]===number);
   return {number,sign,title:house.title,context:house.context,question:house.question,occupants};
  });
 }
 function angles(chart){
  const asc=chart?.time_precision==="unknown"?null:chart?.angles?.ascendant_sign||chart?.ascendant_sign||null;
  const mc=chart?.time_precision==="unknown"?null:chart?.angles?.midheaven_sign||chart?.midheaven_sign||null;
  const output=[];
  if(asc&&SIGNS[asc])output.push({name:"Ascendant",sign:asc,description:"Symbolically describes your way of meeting new experiences. "+SIGNS[asc].style+"; its strength is "+SIGNS[asc].gift+"."});
  if(mc&&SIGNS[mc])output.push({name:"Midheaven",sign:mc,description:"A symbolic lens on vocation and public direction, expressed with "+SIGNS[mc].style+" tendencies. This is not a career prediction."});
  return output;
 }
 function brief(chart){
  const names=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
  const items=names.map(n=>placement(chart,n)).filter(Boolean);
  const top=items.slice(0,5).map(x=>x.name+" in "+x.sign+(x.house?" house "+x.house:"")+": "+x.domain).join("; ");
  const ruler=chart?.angles?.ascendant_sign||chart?.ascendant_sign;
  const anglesText=angles(chart).map(a=>a.name+" in "+a.sign).join(", ");
  return ("Traditional symbolic themes, not a scientific personality or fate claim. "+top+
    (anglesText?". Angles: "+anglesText:"")+
    (ruler?". Rising sign supplied; use recorded houses only.":"")+
    (chart?.time_precision==="unknown"?". Birth time unknown: exclude Rising, Midheaven and houses; Moon or cusp signs could vary.":"")+
    " Connect these themes through choices, context, and grounded reflection.").slice(0,1250);
 }
 window.KnightfallCosmicLexicon=Object.freeze({PLANETS,SIGNS,HOUSES,placement,houseGuide,angles,brief});
})();
