/* Knightfall Cosmic Blueprint: client-side visualizer for derived chart data only.
   Never needs raw birth dates, times, or locations. */
(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
  const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const PLANET_GLYPHS = {Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇","North Node":"☊","South Node":"☋"};
  const ELEMENTS = {Fire:["Aries","Leo","Sagittarius"],Earth:["Taurus","Virgo","Capricorn"],Air:["Gemini","Libra","Aquarius"],Water:["Cancer","Scorpio","Pisces"]};
  const MODES = {Cardinal:["Aries","Cancer","Libra","Capricorn"],Fixed:["Taurus","Leo","Scorpio","Aquarius"],Mutable:["Gemini","Virgo","Sagittarius","Pisces"]};
  const MEANINGS = {
    Sun:"core identity and self-expression",
    Moon:"emotional habits and inner needs",
    Rising:"first impressions and the way you approach new situations"
  };
  const ASPECTS = [["Conjunction",0],["Sextile",60],["Square",90],["Trine",120],["Opposition",180]];
  const mod = value => ((value % 360) + 360) % 360;
  const el = (tag,cls,text) => {const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
  function svgEl(tag,attrs={},text){
    const node=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function longitude(body){
    if(Number.isFinite(body?.longitude))return mod(body.longitude);
    const index=SIGN_NAMES.indexOf(body?.sign);
    const degree=Number(body?.degree_in_sign??body?.degree);
    return index>=0&&Number.isFinite(degree)&&degree>=0&&degree<30?index*30+degree:null;
  }
  function points(chart){
    return Object.entries(chart?.bodies||{}).map(([name,body])=>({name,body,longitude:longitude(body)})).filter(p=>p.longitude!==null);
  }
  function aspects(chart){
    const items=points(chart).filter(p=>!p.name.includes("Node"));
    const found=[];
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const difference=Math.abs(items[i].longitude-items[j].longitude);
      const separation=Math.min(difference,360-difference);
      const orbLimit=items[i].name==="Sun"||items[i].name==="Moon"||items[j].name==="Sun"||items[j].name==="Moon"?6:4;
      for(const [type,angle] of ASPECTS){
        const orb=Math.abs(separation-angle);
        if(orb<=orbLimit)found.push({a:items[i].name,b:items[j].name,type,orb:Number(orb.toFixed(2)),from:items[i].longitude,to:items[j].longitude});
      }
    }
    return found.sort((a,b)=>a.orb-b.orb);
  }
  function polar(degrees,radius,ascendant){
    const rad=(180-mod(degrees-ascendant))*Math.PI/180;
    return {x:210+radius*Math.cos(rad),y:210-radius*Math.sin(rad)};
  }
  function ascendant(chart){
    if(Number.isFinite(chart?.angles?.ascendant))return mod(chart.angles.ascendant);
    const index=SIGN_NAMES.indexOf(chart?.ascendant_sign);
    const degree=Number(chart?.ascendant_degree);
    return index>=0&&Number.isFinite(degree)?mod(index*30+degree):0;
  }
  function wheel(chart,kind="natal",transitChart=null){
    const overlay=kind==="overlay"&&!!transitChart?.bodies;
    const transit=kind==="transit";
    const svg=svgEl("svg",{viewBox:"0 0 420 420",role:"img","aria-label":overlay?"Natal and transit zodiac wheel, natal planets in pink and transiting planets in mint":transit?"Tropical transit sky positions, signs and aspects":"Natal zodiac wheel showing signs, planets, houses, and major aspects"});
    svg.append(svgEl("title",{},overlay?"Tropical natal and transit planetary overlay":transit?"Tropical planetary sky positions":"Tropical zodiac natal chart"));
    const a=ascendant(chart);
    svg.append(svgEl("circle",{cx:210,cy:210,r:203,fill:"#10101c",stroke:"#ff67d6","stroke-width":2}));
    for(const r of [193,160,125,101])svg.append(svgEl("circle",{cx:210,cy:210,r,fill:"none",stroke:r===125?"#a5ffdd66":"#ffffff33","stroke-width":r===193?1.5:1}));
    for(let i=0;i<12;i++){
      const p1=polar(i*30,160,a),p2=polar(i*30,193,a),pLabel=polar(i*30+15,178,a);
      svg.append(svgEl("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:"#ffffff61","stroke-width":1}));
      svg.append(svgEl("text",{x:pLabel.x,y:pLabel.y+7,"text-anchor":"middle",fill:"#e6d7ff","font-size":24},SIGN_GLYPHS[i]));
    }
    const angles=chart?.angles;
    const first=angles?.houses?.[0]??(chart?.house_system?.toLowerCase().includes("whole")?Math.floor(a/30)*30:a);
    if(chart?.ascendant_sign||angles){
      for(let i=0;i<12;i++){
        const angle=angles?.houses?.[i]??mod(first+i*30),p=polar(angle,157,a),q=polar(angle,102,a),number=polar(mod(angle+15),112,a);
        svg.append(svgEl("line",{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:"#a5ffdd55","stroke-width":.8}));
        svg.append(svgEl("text",{x:number.x,y:number.y+3,"text-anchor":"middle",fill:"#a5ffdd","font-size":11},String(i+1)));
      }
      const rise=polar(a,196,a);
      svg.append(svgEl("text",{x:rise.x+4,y:rise.y-7,fill:"#ff8bdc","font-size":12,"font-weight":"bold"},"ASC"));
    }
    const chartAspects=aspects(chart).slice(0,24);
    for(const aspect of chartAspects){
      const p1=polar(aspect.from,98,a),p2=polar(aspect.to,98,a);
      const stroke=aspect.type==="Trine"||aspect.type==="Sextile"?"#a5ffe9":"#ff77c4";
      const link=svgEl("line",{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke,"stroke-opacity":.3,"stroke-width":1.1,"data-aspect-a":aspect.a,"data-aspect-b":aspect.b});
      link.append(svgEl("title",{},aspect.a+" "+aspect.type.toLowerCase()+" "+aspect.b+"; "+aspect.orb.toFixed(1)+"° orb"));
      svg.append(link);
    }
    const bodies=points(chart).filter(p=>!p.name.includes("Node")).sort((x,y)=>x.longitude-y.longitude);
    let previous=-1000,layer=0;
    for(const item of bodies){
      if(item.longitude-previous<9)layer=(layer+1)%3;else layer=0;
      previous=item.longitude;
      const dot=polar(item.longitude,156,a),label=polar(item.longitude,144-layer*13,a);
      svg.append(svgEl("circle",{cx:dot.x,cy:dot.y,r:3.5,fill:"#ff81d8","data-planet":item.name}));
      const labelNode=svgEl("text",{x:label.x,y:label.y+5,"text-anchor":"middle",fill:"#fff","font-size":20,"font-weight":700,"data-planet":item.name},PLANET_GLYPHS[item.name]||item.name[0]);
      labelNode.append(svgEl("title",{},item.name+" in "+item.body.sign));
      svg.append(labelNode);
    }
    if(overlay){
      // Inner mint ring: moving sky; pink rim: natal positions. Transit aspects
      // link precisely located ecliptic longitudes rather than house midpoints.
      svg.append(svgEl("circle",{cx:210,cy:210,r:126,fill:"none",stroke:"#a3ffe88c","stroke-width":1.3,"stroke-dasharray":"3 5"}));
      const current=points(transitChart).filter(p=>!p.name.includes("Node")).sort((a,b)=>a.longitude-b.longitude);
      let prev=-1000,lane=0;
      for(const item of current){
        lane=item.longitude-prev<9?(lane+1)%3:0;prev=item.longitude;
        const label=polar(item.longitude,127-lane*12,a),marker=polar(item.longitude,137,a);
        const ring=svgEl("circle",{cx:label.x,cy:label.y,r:10,fill:"#071d20","fill-opacity":".97",stroke:"#9cffe4","stroke-width":".75","data-transit-planet":item.name});
        ring.append(svgEl("title",{},"Transit "+item.name+" in "+item.body.sign));
        svg.append(ring);
        svg.append(svgEl("circle",{cx:marker.x,cy:marker.y,r:2.1,fill:"#a9ffea"}));
        const glyph=svgEl("text",{x:label.x,y:label.y+5,"text-anchor":"middle",fill:"#b9ffe9","font-size":16,"font-weight":700,"data-transit-planet":item.name},PLANET_GLYPHS[item.name]||item.name[0]);
        glyph.append(svgEl("title",{},"Transit "+item.name+" in "+item.body.sign));
        svg.append(glyph);
      }
      const links=transitAspects(transitChart,chart).slice(0,20);
      for(const link of links){
        const natal=points(chart).find(p=>p.name===link.natal);
        const moving=points(transitChart).find(p=>p.name===link.transit);
        if(!natal||!moving)continue;
        const n=polar(natal.longitude,95,a),m=polar(moving.longitude,76,a);
        const color=link.type==="Trine"||link.type==="Sextile"?"#aaffec":"#ff89d5";
        const line=svgEl("line",{x1:n.x,y1:n.y,x2:m.x,y2:m.y,stroke:color,"stroke-opacity":".65","stroke-width":"1.1","data-overlay-aspect":link.type,"data-overlay-moving":link.transit,"data-overlay-natal":link.natal});
        line.append(svgEl("title",{},"Transit "+link.transit+" "+link.type.toLowerCase()+" natal "+link.natal+"; "+link.orb.toFixed(1)+"° orb"));
        svg.append(line);
      }
    }
    svg.append(svgEl("circle",{cx:210,cy:210,r:38,fill:"#101320",stroke:"#adffde88"}));
    svg.append(svgEl("text",{x:210,y:205,"text-anchor":"middle",fill:"#ff80d2","font-size":12,"font-weight":700},"KNIGHTFALL"));
    svg.append(svgEl("text",{x:210,y:222,"text-anchor":"middle",fill:"#c8bfdb","font-size":11},"COSMIC CHART"));
    return svg;
  }
  function prompt(chart,subject="me"){
    const entries=points(chart);
    const placements=entries.map(({name,body})=>name+": "+body.sign+" "+Number(body.degree_in_sign??body.degree).toFixed(1)+"°"+(chart?.house_placements?.[name]?" in house "+chart.house_placements[name]:"")+(body.retrograde?" retrograde":"")).join("; ");
    const aspectSummary=aspects(chart).slice(0,14).map(a=>a.a+" "+a.type.toLowerCase()+" "+a.b+" (orb "+a.orb+"°)").join("; ");
    const uncertainty=chart?.time_precision==="unknown"?" Birth time was not provided. This is a provisional noon-UTC chart. Do not infer Ascendant, houses, or an exact Moon placement; sign-cusp positions may change.":"";
    const lexiconSummary=window.KnightfallCosmicLexicon?.brief?.(chart)||"";
    const insight=window.KnightfallCosmicInsights?.summarize?.(chart);
    const patternInfo=insight?[
      insight.ruler?"Traditional chart ruler: "+insight.ruler.traditional+(insight.ruler.modern?"; modern co-ruler "+insight.ruler.modern:"")+".":"",
      insight.phase?"Approximate Moon phase: "+insight.phase.name+" ("+insight.phase.elongation+"° Sun–Moon difference).":"",
      insight.clusters?.length?"Planet clusters: "+insight.clusters.map(c=>c.names.length+" in "+c.sign).join(", ")+".":""
    ].filter(Boolean).join(" "):"";
    const lead=subject==="member"?"Interpret this member\u0027s shared tropical natal chart, not my own, as a symbolic reflective reading rather than a scientific prediction. Explain their Sun, Moon, Rising, houses, aspects, strengths and tensions without claiming to know their private life. ":"Interpret my calculated tropical natal chart as a symbolic, reflective reading, not a scientific prediction. Explain my Sun, Moon, Rising, house themes, strongest aspects, emotional patterns, strengths, tensions, and practical prompts for self-reflection. ";
    return (lead+"Do not invent missing birth details, transits, or houses. "+
      "Rising: "+(chart?.angles?.ascendant_sign||chart?.ascendant_sign||"unavailable")+". House system: "+(chart?.angles?.house_system||chart?.house_system||"unavailable")+". Placements: "+placements+". Major aspects: "+(aspectSummary||"none within the displayed orbs")+". "+patternInfo+uncertainty+" "+lexiconSummary).slice(0,3900);
  }
  function downloadSvg(svg,filename="knightfall-cosmic-chart.svg"){
    if(!svg)throw Error("Chart image is unavailable.");
    // Clone only the drawn SVG, without birth date, coordinates or chat history.
    const artwork=svg.cloneNode(true);
    artwork.setAttribute("xmlns",NS);
    artwork.setAttribute("width","840");
    artwork.setAttribute("height","840");
    const content=new XMLSerializer().serializeToString(artwork);
    const blob=new Blob([content],{type:"image/svg+xml;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=filename;
    document.body.append(link);
    link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function render(target,chart,options={}){
    if(!target)return;
    target.replaceChildren();
    const all=points(chart);
    if(!all.length){target.append(el("p","cosmic-muted","No calculated placements to display."));return;}
    const shell=el("div","cosmic-blueprint"),graphic=el("div","cosmic-wheel"),reading=el("div","cosmic-reading");
    graphic.append(wheel(chart,options.kind==="transit"?"transit":options.kind==="overlay"?"overlay":"natal",options.transitChart));
    const balance=el("div","cosmic-balance");
    const classical=all.filter(p=>["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"].includes(p.name));
    const top=(groups)=>Object.entries(groups).map(([name,signs])=>({name,count:classical.filter(p=>signs.includes(p.body.sign)).length})).sort((a,b)=>b.count-a.count);
    const elements=top(ELEMENTS),modes=top(MODES);
    const elementLabel=elements[0]?.count===elements[1]?.count?"Balanced elements":elements[0]?.name+" emphasis";
    const modeLabel=modes[0]?.count===modes[1]?.count?"Mixed modalities":modes[0]?.name+" emphasis";
    balance.append(el("span","cosmic-pill","✧ "+elementLabel),el("span","cosmic-pill","✧ "+modeLabel));
    reading.append(balance);
    if(options.kind==="overlay"&&options.transitChart?.bodies){
      const legend=el("div","cosmic-overlay-legend");
      legend.append(el("span","cosmic-legend-natal","● Natal placements"),
        el("span","cosmic-legend-transit","● Transiting planets"));
      reading.prepend(legend);
      const transitLinks=transitAspects(options.transitChart,chart);
      const box=el("details","cosmic-overlay-aspects");
      box.open=true;
      box.append(el("summary","","Transit-to-natal connections · "+transitLinks.length));
      const filterRow=el("label","cosmic-transit-filter","Explore a moving planet ");
      const filter=el("select","cosmic-transit-select");
      filter.setAttribute("aria-label","Filter transit-to-natal connections by moving planet");
      filter.append(new Option("All moving planets",""));
      const transitNames=[...new Set(transitLinks.map(item=>item.transit))];
      for(const name of transitNames)filter.append(new Option(name,name));
      filterRow.append(filter);box.append(filterRow);
      const count=el("p","cosmic-transit-count","");
      count.setAttribute("aria-live","polite");
      box.append(count);
      const list=el("ul","cosmic-transit-connections");
      for(const aspect of transitLinks.slice(0,60)){
        const guide=window.KnightfallCosmicLexicon?.transitGuide?.(chart,options.transitChart,aspect);
        const item=el("li","cosmic-transit-connection");
        item.setAttribute("data-transit-moving",aspect.transit);
        if(guide){
          const expandable=el("details","cosmic-transit-detail");
          expandable.append(el("summary","",guide.title+" · "+aspect.orb.toFixed(1)+"° orb"));
          expandable.append(el("p","",guide.summary));
          expandable.append(el("p","cosmic-transit-reflection","Reflect: "+guide.reflection));
          item.append(expandable);
        }else item.textContent="Transit "+aspect.transit+" "+aspect.type.toLowerCase()+" natal "+aspect.natal+" · "+aspect.orb.toFixed(1)+"° orb";
        list.append(item);
      }
      if(!transitLinks.length)list.append(el("li","","No major transit-to-natal aspects inside the 2° orb."));
      box.append(list);
      const updateFocus=()=>{
        const name=filter.value;
        let visible=0;
        for(const item of list.children){
          const matches=!name||item.getAttribute("data-transit-moving")===name;
          item.hidden=!matches;
          if(matches)visible++;
        }
        count.textContent=name?"Showing "+visible+" strongest connections for "+name+".":"Showing "+visible+" of "+transitLinks.length+" connections.";
        for(const node of graphic.querySelectorAll("[data-transit-planet]"))
          node.style.opacity=!name||node.getAttribute("data-transit-planet")===name?"1":".2";
        for(const node of graphic.querySelectorAll("[data-overlay-moving]"))
          node.style.opacity=!name||node.getAttribute("data-overlay-moving")===name?"1":".08";
      };
      filter.addEventListener("change",updateFocus);
      updateFocus();
      reading.append(box);
    }
    if(options.kind==="transit")reading.prepend(el("p","cosmic-muted","Geocentric transit sky · houses and rising sign not calculated for this view."));
    if(chart.time_precision==="unknown")reading.prepend(el("p","cosmic-uncertain","Birth time unknown: provisional noon-UTC placements only. Do not rely on houses or Rising; the Moon and sign-cusp placements may differ at birth."));
    const three=el("div","cosmic-three");
    for(const [name,sign] of [["Sun",chart.bodies?.Sun?.sign],["Moon",chart.bodies?.Moon?.sign],["Rising",chart.angles?.ascendant_sign||chart.ascendant_sign]]){
      if(!sign)continue;
      const card=el("article","cosmic-key"),heading=el("strong","",name+" · "+sign);
      card.append(heading,el("p","",name+" represents "+MEANINGS[name]+" in traditional astrology."));
      three.append(card);
    }
    reading.append(three);
    const aspectsPanel=el("details","cosmic-aspects"),summary=el("summary","", "Major aspects · "+aspects(chart).length);
    const list=el("ul","");
    for(const aspect of aspects(chart).slice(0,12)){
      const item=el("li","",aspect.a+" "+aspect.type.toLowerCase()+" "+aspect.b+" · "+aspect.orb.toFixed(1)+"° orb");
      list.append(item);
    }
    if(!list.children.length)list.append(el("li","","No major aspects inside the displayed orb limits."));
    aspectsPanel.append(summary,list);reading.append(aspectsPanel);
    window.KnightfallCosmicInsights?.render?.(reading,chart);
    const download=el("button","cosmic-export-button","↓ Save wheel as SVG");
    download.type="button";
    download.setAttribute("aria-label","Download this zodiac chart image as SVG");
    const exportStatus=el("span","cosmic-export-status","");
    exportStatus.setAttribute("role","status");
    download.addEventListener("click",()=>{
      try{downloadSvg(graphic.querySelector("svg"));exportStatus.textContent="Image saved locally. No birth data uploaded.";}
      catch(error){exportStatus.textContent="Chart export is unavailable: "+error.message;}
    });
    const exportArea=el("div","cosmic-export");
    exportArea.append(download,exportStatus);
    reading.append(exportArea);
    shell.append(graphic,reading);target.append(shell);
  }
  function transitAspects(transitChart,natalChart){
    const traveling=points(transitChart).filter(p=>!p.name.includes("Node"));
    const natal=points(natalChart).filter(p=>!p.name.includes("Node"));
    const matches=[];
    for(const moving of traveling)for(const birth of natal){
      const raw=Math.abs(moving.longitude-birth.longitude),separation=Math.min(raw,360-raw);
      for(const [type,angle] of ASPECTS){
        const orb=Math.abs(separation-angle);
        if(orb<=2)matches.push({transit:moving.name,natal:birth.name,type,orb:Number(orb.toFixed(2))});
      }
    }
    return matches.sort((a,b)=>a.orb-b.orb);
  }
  function synastry(first,second){
    const a=points(first).filter(p=>!p.name.includes("Node"));
    const b=points(second).filter(p=>!p.name.includes("Node"));
    const results=[];
    for(const one of a)for(const two of b){
      const raw=Math.abs(one.longitude-two.longitude),sep=Math.min(raw,360-raw);
      for(const [type,angle] of ASPECTS){
        const orb=Math.abs(sep-angle);
        if(orb<=4)results.push({first:one.name,second:two.name,type,orb:Number(orb.toFixed(2))});
      }
    }
    return results.sort((x,y)=>x.orb-y.orb);
  }
  window.KnightfallCosmic=Object.freeze({render,prompt,aspects,transitAspects,synastry});
})();
