"use strict";const s=new URLSearchParams(location.search).get("path")==="sith";const $=id=>document.getElementById(id);$("hall").dataset.order=s?"sith":"jedi";$("return").href=s?"/sith-order.html":"/jedi-temple.html";$("heading").textContent=s?"Sith Council and ceremonial hall":"Jedi Council and ceremonial hall";$("principles").textContent=s?"Stewardship through demonstrated competence, accountability and respect for individual sovereignty.":"Stewardship through service, deliberation, compassion and accountability.";$("vow").textContent=s?"I claim responsibility for my choices. I will cultivate my strengths, confront my illusions and pursue freedom without denying the freedom of others.":"I choose understanding over certainty, compassion over indifference, and responsibility over avoidance. I will learn from my mistakes and respect the freedom of others.";$("study").href="/force-library.html?category="+(s?"order-of-the-sith":"jedi-temple");
(()=>{
 const hall=$("hall");
 function section(title,items){const el=document.createElement("section");el.className="realm-card";const h=document.createElement("h2");h.textContent=title;el.append(h);for(const [name,body] of items){const d=document.createElement("details"),summary=document.createElement("summary"),p=document.createElement("p");summary.textContent=name;p.textContent=body;d.append(summary,p);el.append(d)}hall.append(el)}
 section("Proposed council charter",[
 ["Selection",s?"Candidates demonstrate competence, constructive achievement and accountable mentorship.":"Candidates demonstrate service, sound judgment and accountable mentorship."],
 ["Conflicts of interest","A reviewer should disclose relevant personal interests and recuse themselves when impartiality is compromised."],
 ["Appeals","A member should receive reasons for a decision and an opportunity to request independent review. No spiritual rank overrides site safety rules."],
 ["Limits of authority","Council roles would govern voluntary community activities only. No authority over personal finances, relationships, medical decisions or freedom to leave."]
 ]);
 section("Voluntary ceremonial practices",s?[
 ["Dedication of the flame","Name a freely chosen goal, identify its costs and limits, and choose one responsible action."],
 ["Trial of reflection","Review a setback, identify your contribution and decide what you will change."],
 ["Recognition of achievement","Describe demonstrated progress and acknowledge assistance received."]
 ]:[
 ["Dedication of service","Choose a freely undertaken act of service and consider the needs and consent of those affected."],
 ["Reflection of balance","Notice competing responsibilities and identify a compassionate boundary."],
 ["Recognition of learning","Describe a lesson learned, acknowledge uncertainty and choose a next step."]
 ]);
 const note=document.createElement("p");note.className="realm-note";note.textContent="Draft practices for community review. No ceremony records, appointments, votes or binding decisions are created by this page.";hall.append(note);
})();
