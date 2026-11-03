/* Profile Link Hub view. Public endpoint enforces owner, friend and block boundaries. */
(()=>{'use strict';
const API="https://api.ash-fall.com";
const node=(tag,klass,text)=>{const element=document.createElement(tag);if(klass)element.className=klass;if(text!==undefined)element.textContent=text;return element};
const icon=name=>{
 const value=String(name||"").toLowerCase();
 if(/music|song|band|sound/.test(value))return "♫";
 if(/shop|store|merch/.test(value))return "▣";
 if(/art|portfolio|tattoo|design/.test(value))return "✦";
 if(/write|book|story|blog/.test(value))return "✎";
 if(/video|youtube|stream/.test(value))return "▷";
 return "↗";
};
async function renderProfileLinks(username,root){
 if(!root||!username)return false;
 try{
  const url=API+"/api/profile/links?username="+encodeURIComponent(username);
  const response=await fetch(url,{credentials:"include",cache:"no-store"});
  if(!response.ok)return false;
  const data=await response.json();
  const links=(data.links||[]).filter(link=>{
   if(typeof link?.label!=="string"||typeof link.url!=="string")return false;
   if(!link.label.trim()||link.label.length>50)return false;
   try{const u=new URL(link.url);return u.protocol==="https:"&&!u.username&&!u.password}catch{return false}
  }).slice(0,8);
  const previous=root.querySelector("#profile-link-hub");if(previous)previous.remove();
  if(!links.length)return false;
  const section=node("section","profile-link-hub");
  section.id="profile-link-hub";section.setAttribute("aria-labelledby","profile-links-title");
  const title=node("h2","","↗ Member Link Hub");title.id="profile-links-title";
  const hint=node("p","profile-link-description","Places this member chose to share");
  const grid=node("div","profile-link-list");
  for(const link of links){
   const href=new URL(link.url);
   const card=node("a","profile-link-card");
   card.href=href.href;card.target="_blank";card.rel="noopener noreferrer nofollow";
   card.append(node("span","profile-link-symbol",icon(link.label)));
   const details=node("span","profile-link-main");
   details.append(node("span","profile-link-label",link.label.trim()),node("span","profile-link-host",href.hostname.replace(/^www\./,"")));
   card.append(details,node("span","profile-link-open","↗"));grid.append(card);
  }
  section.append(title,hint,grid);
  const anchor=root.querySelector(".profile-actions-wrap")||root.querySelector(".profile-top");
  if(anchor)anchor.after(section);else root.append(section);
  return true;
 }catch(error){console.warn("Profile links unavailable",String(error));return false}
}
window.KnightfallRenderProfileLinks=renderProfileLinks;
})();