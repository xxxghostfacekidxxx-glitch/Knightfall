/* Cosmic Atlas: explain derived natal placements without collecting birth records.
 * These are traditional symbolic descriptions, not psychological diagnoses or predictions.
 */
(() => {
 "use strict";
 const SIGNS=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
 const ELEMENTS={Fire:["Aries","Leo","Sagittarius"],Earth:["Taurus","Virgo","Capricorn"],Air:["Gemini","Libra","Aquarius"],Water:["Cancer","Scorpio","Pisces"]};
 const MODES={Cardinal:["Aries","Cancer","Libra","Capricorn"],Fixed:["Taurus","Leo","Scorpio","Aquarius"],Mutable:["Gemini","Virgo","Sagittarius","Pisces"]};
 const RULERS={Aries:["Mars"],Taurus:["Venus"],Gemini:["Mercury"],Cancer:["Moon"],Leo:["Sun"],Virgo:["Mercury"],Libra:["Venus"],Scorpio:["Mars","Pluto"],Sagittarius:["Jupiter"],Capricorn:["Saturn"],Aquarius:["Saturn","Uranus"],Pisces:["Jupiter","Neptune"]};
 const THEMES={
 Sun:"Identity, purpose and creative expression",Moon:"Instinct, comfort and emotional habits",
 Mercury:"Communication, learning and thought",Venus:"Affection, values and aesthetic taste",
 Mars:"Initiative, desire and conflict style",Jupiter:"Growth, opportunity and beliefs",
 Saturn:"Boundaries, responsibility and endurance",Uranus:"Change, independence and experimentation",
 Neptune:"Imagination, ideals and uncertainty",Pluto:"Transformation, power and deep change",
 "North Node":"A symbolic direction for growth","South Node":"Familiar patterns and habits"
 };
 const HOUSE_THEMES=["Identity and beginnings","Resources and values","Communication and learning",
 "Home and belonging","Creativity and play","Routines and service","Partnerships and agreements",
 "Shared resources and change","Exploration and philosophy","Vocation and public life",
 "Community and aspirations","Solitude and reflection"];
 const PHASES=["New Moon","Waxing Crescent","First Quarter","Waxing Gibbous","Full Moon",
 "Waning Gibbous","Last Quarter","Waning Crescent"];
 const ASPECT_THEMES={
 Conjunction:"Traditionally interpreted as an intensified blend of themes",
 Sextile:"A potential area of cooperation, often developed by conscious effort",
 Square:"A symbolic tension that may invite adjustment or practice",
 Trine:"Themes that may feel mutually supportive or familiar",
 Opposition:"Two contrasting themes to consider together, not a verdict"
 };
 const CLASSICAL=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
 const mod=n=>((n%360)+360)%360;
 const elt=(tag,cls,value)=>{
  const x=document.createElement(tag);if(cls)x.className=cls;
  if(value!==undefined)x.textContent=String(value);return x;
 };
 function position(body){
  if(!body||!SIGNS.includes(body.sign))return null;
  const deg=Number(body.degree_in_sign??body.degree);
  if(!Number.isFinite(deg)||deg<0||deg>=30)return null;
  return SIGNS.indexOf(body.sign)*30+deg;
 }
 function summarize(chart){
  const bodies=chart?.bodies||{};
  const positions=Object.fromEntries(Object.entries(bodies).map(([name,data])=>[name,position(data)]));
  const sun=positions.Sun,moon=positions.Moon;
  const difference=sun!==null&&sun!==undefined&&moon!==null&&moon!==undefined?mod(moon-sun):null;
  const phase=difference===null?null:{
   name:PHASES[Math.floor(mod(difference+22.5)/45)],
   elongation:Number(difference.toFixed(1)),
   note:"Approximate lunar phase inferred from tropical Sun–Moon longitude difference."
  };
  const rise=chart?.angles?.ascendant_sign||chart?.ascendant_sign||null;
  const rulers=RULERS[rise]||[];
  const ruler=rulers.length?{
   traditional:rulers[0],modern:rulers.length>1?rulers[1]:null,
   placement:bodies[rulers[0]]?.sign||null,
   house:Number.isInteger(chart.house_placements?.[rulers[0]])?chart.house_placements[rulers[0]]:null
  }:null;
  const groupCounts=groups=>Object.fromEntries(Object.entries(groups).map(([k,signs])=>[k,CLASSICAL.filter(p=>signs.includes(bodies[p]?.sign)).length]));
  const elements=groupCounts(ELEMENTS),modalities=groupCounts(MODES);
  const count=[...Object.keys(bodies)].filter(name=>!name.includes("Node"));
  const clusters=SIGNS.map(sign=>({sign,names:count.filter(name=>bodies[name]?.sign===sign)})).filter(x=>x.names.length>=3);
  const retrogrades=count.filter(name=>bodies[name]?.retrograde===true);
  return {phase,rising:rise,ruler,elements,modalities,clusters,retrogrades};
 }
 function aspectNotes(items){
  return items.map(a=>({
   ...a,
   note:ASPECT_THEMES[a.type]||"A symbolic relationship between planetary themes"
  }));
 }
 function useAtlas(target,chart,options={}){
  if(!target)return;
  const data=summarize(chart),isTransit=options.kind==="transit";
  const atlas=elt("section","cosmic-atlas");
  const heading=elt("h3","",isTransit?"✧ Transit Sky Atlas":"✧ Chart Atlas");
  const intro=elt("p","cosmic-atlas-intro",isTransit?"These are moving sky positions, not your birth chart. Explore the symbolic themes of the moment without treating them as predictions.":"Explore placements and patterns. Astrology is a symbolic tradition, not a scientifically proven personality test.");
  atlas.append(heading,intro);
  const stats=elt("div","cosmic-atlas-stats");
  if(data.ruler){
   const block=elt("article","cosmic-atlas-stat");
   block.append(elt("span","","Chart ruler · traditional"),elt("strong","",data.ruler.traditional));
   block.append(elt("small","",data.ruler.placement?
     data.ruler.placement+(data.ruler.house?" · house "+data.ruler.house:""):"Placement unavailable"));
   if(data.ruler.modern)block.append(elt("small","","Modern co-ruler: "+data.ruler.modern));
   stats.append(block);
  }
  if(data.phase){
   const block=elt("article","cosmic-atlas-stat");
   block.append(elt("span","","Lunar phase · approximate"),elt("strong","",data.phase.name),
      elt("small","",data.phase.elongation+"° Moon–Sun separation"));
   stats.append(block);
  }
  if(data.clusters.length){
   const block=elt("article","cosmic-atlas-stat");
   block.append(elt("span","","3+ planet sign cluster"),elt("strong","",data.clusters.map(c=>c.sign).join(", ")));
   block.append(elt("small","","Counts planets in one sign; traditions differ on what constitutes a stellium."));
   stats.append(block);
  }
  if(data.retrogrades.length){
   const block=elt("article","cosmic-atlas-stat");
   block.append(elt("span","","Retrograde bodies"),elt("strong","",data.retrogrades.join(", ")));
   block.append(elt("small","","Apparent backward motion from Earth, not a physical reversal."));
   stats.append(block);
  }
  if(stats.children.length)atlas.append(stats);
  const placementNames=Object.keys(chart?.bodies||{}).filter(name=>position(chart.bodies[name])!==null);
  if(placementNames.length){
   const panel=elt("section","cosmic-focus");
   panel.append(elt("h4","",isTransit?"Focus a moving planet":"Focus a planet"));
   const label=elt("label","cosmic-focus-label","Planet or point ");
   const selector=elt("select","cosmic-focus-select");
   selector.setAttribute("aria-label",isTransit?"Choose a transiting planet to explore":"Choose a natal placement to explore");
   selector.append(new Option("All placements",""));
   for(const name of placementNames)selector.append(new Option(name,name));
   label.append(selector);panel.append(label);
   const detail=elt("div","cosmic-focus-detail");detail.setAttribute("aria-live","polite");
   const aspects=window.KnightfallCosmic?.aspects?.(chart)||[];
   const show=()=>{
    const name=selector.value;
    detail.replaceChildren();
    const svg=target.closest(".cosmic-blueprint")?.querySelector("svg");
    if(svg){
     for(const item of svg.querySelectorAll("[data-planet]"))item.style.opacity=!name||item.getAttribute("data-planet")===name?"1":".22";
     for(const item of svg.querySelectorAll("[data-aspect-a]"))item.style.opacity=!name||item.getAttribute("data-aspect-a")===name||item.getAttribute("data-aspect-b")===name?"1":".07";
    }
    if(!name){
      detail.append(elt("p","",isTransit?"Choose a moving planet to see its current sign and major sky aspects. This is not a natal personality reading.":"Choose a planet to see its sign, house, major aspects and symbolic themes."));
      return;
    }
    const body=chart.bodies[name],house=chart.house_placements?.[name];
    detail.append(elt("strong","",(isTransit?"Transiting ":"")+name+" in "+body.sign+" · "+Number(body.degree_in_sign??body.degree).toFixed(1)+"°"));
    if(Number.isInteger(house)&&house>=1&&house<=12)
     detail.append(elt("p","","House "+house+": "+HOUSE_THEMES[house-1]+"."));
    const lexicon=window.KnightfallCosmicLexicon,interpretation=!isTransit?lexicon?.placement?.(chart,name):null;
    if(isTransit){
      const scope=lexicon?.PLANETS?.[name]?.scope||THEMES[name]||"a traditional planetary theme";
      const style=lexicon?.SIGNS?.[body.sign]?.style||"a symbolic zodiac style";
      detail.append(elt("p","cosmic-transit-context","This transiting planet is currently associated with "+scope.toLowerCase()+" and is in "+body.sign+", traditionally described as "+style+". It describes the chosen sky, not a person's natal character."));
      if(body.retrograde)detail.append(elt("p","cosmic-interpretation-retrograde","Retrograde in the calculated sky: apparent backward motion from Earth, not evidence of future events."));
    }else if(interpretation){
     detail.append(elt("p","cosmic-interpretation-reading",interpretation.reading));
     if(interpretation.houseReading)detail.append(elt("p","cosmic-interpretation-house",interpretation.houseReading));
     if(interpretation.retrograde)detail.append(elt("p","cosmic-interpretation-retrograde",interpretation.retrograde));
     detail.append(elt("p","cosmic-interpretation-tension",interpretation.tension));
     const question=elt("div","cosmic-reflection-question");
     question.append(elt("strong","","Reflection prompt"),elt("p","",interpretation.question));
     detail.append(question);
    }else{
     if(body.retrograde)detail.append(elt("p","","Marked retrograde in the calculation."));
     detail.append(elt("p","",THEMES[name]||"A traditional symbolic natal chart point"));
    }
    const links=aspectNotes(aspects.filter(a=>a.a===name||a.b===name).slice(0,4));
    if(links.length){
     const ul=elt("ul","");
     for(const a of links){
      const other=a.a===name?a.b:a.a;
      ul.append(elt("li","",a.type+" with "+other+" · "+a.orb.toFixed(1)+"° orb. "+a.note+"."));
     }
     detail.append(ul);
    }
   };
   selector.addEventListener("change",show);show();
   panel.append(detail);
   const reset=elt("button","cosmic-reset-focus","Show all planets");
   reset.type="button";
   reset.addEventListener("click",()=>{selector.value="";show();selector.focus();});
   panel.append(reset);
   atlas.append(panel);
  }
  const lexical=window.KnightfallCosmicLexicon;
  const angleDescriptions=lexical?.angles?.(chart)||[];
  if(angleDescriptions.length){
   const anglePanel=elt("details","cosmic-angle-guide");
   anglePanel.append(elt("summary","","Rising sign and Midheaven interpretation"));
   for(const angle of angleDescriptions){
    const section=elt("article","cosmic-angle-card");
    section.append(elt("strong","",angle.name+" · "+angle.sign),elt("p","",angle.description));
    anglePanel.append(section);
   }
   atlas.append(anglePanel);
  }
  const houses=lexical?.houseGuide?.(chart)||[];
  if(houses.length){
   const housePanel=elt("details","cosmic-house-guide");
   housePanel.append(elt("summary","","Explore all 12 houses"));
   const note=elt("p","cosmic-atlas-intro","House signs and occupants use your recorded Ascendant and house system. These are symbolic interpretations.");
   housePanel.append(note);
   for(const house of houses){
    const entry=elt("details","cosmic-house-entry");
    entry.append(elt("summary","","House "+house.number+" · "+house.sign+" · "+house.title));
    entry.append(elt("p","",house.context+"."));
    entry.append(elt("p","",house.occupants.length?"Placements: "+house.occupants.join(", ")+".":"No recorded bodies in this house; an empty house is not a missing part of life."));
    entry.append(elt("p","cosmic-house-question","Reflection: "+house.question));
    housePanel.append(entry);
   }
   atlas.append(housePanel);
  }
  const counts=elt("details","cosmic-distribution"),summary=elt("summary","","Element and modality distribution");
  const list=elt("div","cosmic-distribution-grid");
  for(const [category,counts] of [["Elements",data.elements],["Modalities",data.modalities]]){
   const card=elt("div","");
   card.append(elt("strong","",category+" · classical 7 bodies"));
   for(const [type,n] of Object.entries(counts)){
    const bar=elt("div","cosmic-bar"),label=elt("span","",type+" · "+n),track=elt("div","cosmic-bar-track"),fill=elt("i","");
    fill.style.width=Math.round(n/7*100)+"%";
    track.append(fill);bar.append(label,track);card.append(bar);
   }
   list.append(card);
  }
  counts.append(summary,list);atlas.append(counts);
  target.append(atlas);
 }
 window.KnightfallCosmicInsights=Object.freeze({summarize,aspectNotes,render:useAtlas});
})();
