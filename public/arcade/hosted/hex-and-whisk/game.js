import {WIDTH,CELL_COUNT,SHELF_SLOTS,shelfCapacity,generatorAt,MAX_ENERGY,ENERGY_INTERVAL,RECIPES,xpNeeded,upgradeCost,unlocked,available,findReady,findShelfReady,storeOnShelf,takeFromShelf,makeGame,advance,spawn,move,serve,upgrade,recycle,stir,serialize,restore,QUESTS,questTarget,questReward,claimQuest,discoveryCount,WHISK_CAP,WHISK_EVERY,findMergePair,magicWhisk,ORDER_REFRESH_COST,refreshOrder,PATRONS,patronForOrder,favoriteTipForOrder,orderProgress,keepsakesForPatron,KEEPSAKE_LEVELS,loyaltyStamps,loyaltyNext,LOYALTY_VISIT_INTERVAL} from "./engine.mjs";

const $=id=>document.getElementById(id);
const board=$("board"),orders=$("orders"),stations=$("stations"),upgrades=$("upgrades"),fx=$("fx-layer");
const STORE="knightfall:hex-and-whisk:v1",SOUND_STORE="knightfall:hex-and-whisk:sound";
let game,selected=null,selectedShelf=null,history=null,drag=null,ghost=null,hovered=null,hoveredShelf=null,lastToast=0,toastTimer=null,audio=null,hintPair=null;
let soundOn=false,bonusUntil=0,lastSyncScore=0,lastCookbookSignature="";
let readyOrderIds=null,momentToken=0,momentTimer=null,focusedOrderId=null;
try{soundOn=localStorage.getItem(SOUND_STORE)==="yes"}catch{}
try{game=restore(localStorage.getItem(STORE),Math.random,Date.now())}catch{game=makeGame()}
function safeSave(){try{localStorage.setItem(STORE,serialize(game))}catch{}}
const text=(tag,content,className)=>{const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(content);return el};
function food(chain,tier){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.classList.add("food","food-object");if(tier>=5)svg.classList.add("enchanted-food");if(tier>=7)svg.classList.add("legendary-food");svg.dataset.foodChain=chain;svg.dataset.foodTier=String(tier);svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");
 use.setAttribute("href","./sprites/icons.svg#"+chain+"-"+tier);svg.append(use);
 return svg;
}

const CUSTOMER_ENCOUNTERS={
 imp:"Listen, chef. Your kitchen is officially my evil headquarters!",
 bat:"I brought my whole bat family. They loved your baking!",
 ghost:"For the first time in a century, I have something to look forward to.",
 witch:"I hereby appoint you my personal midnight chef. Try not to faint.",
 gargoyle:"I carved your name on the cathedral wall. That's a compliment.",
 moth:"I told the moon about you! It wants a reservation.",
 crow:"I've investigated. This is the best kitchen in the underworld.",
 slime:"YOU'RE MY FAVORITE HUMAN! BLOOOOOOP!"
};
const CUSTOMER_LINES={
 imp:{waiting:["Psst! Extra chaos!","I'm STARVING!","Make it spicy-ish!"],ready:["Mine! Mine! Mine!","Hehe, delicious!"],served:["Perfect! Evil genius!","I'm telling EVERY demon!"]},
 bat:{waiting:["Um... one snack?","I'll wait right here...","Smells really nice."],ready:["For... me? ♡","My little heart!"],served:["Thank you! *flap*","Best midnight snack!"]},
 ghost:{waiting:["I remember flavors...","Something moonlit...","I'm haunting the menu."],ready:["I can almost taste it!","Ethereal! ♡"],served:["Heavenly... sort of.","I feel alive again!"]},
 witch:{waiting:["Don't disappoint me.","Darling, I'm famished.","A touch of elegance."],ready:["Finally, perfection!","Now THAT is magic."],served:["Exquisite, darling.","Five curses out of five!"]},
 gargoyle:{waiting:["Hmph. Food.","Impress me, tiny chef.","I do NOT smile."],ready:["...Okay, I'm excited.","Looks acceptable. ♡"],served:["Don't tell anyone I liked it.","...I'm coming back."]},
 moth:{waiting:["Is that a LAMP?!","Ooh, shiny supper!","Fluttering with hunger!"],ready:["It's GLOWING! ✨","Absolutely radiant!"],served:["My wings are dancing!","A dazzling delight!"]},
 crow:{waiting:["What's in the dough?","I have my doubts.","Prove you're a chef."],ready:["Suspiciously delicious.","I approve. Maybe."],served:["Not bad. Not bad at all.","I'll tell my flock."]},
 slime:{waiting:["Bloop! Food time!","I could eat a castle!","BUBBLE BUBBLE!"],ready:["BLOOP BLOOP!!","HAPPY SLIME! ♡"],served:["SQUEEE! So good!","I might explode!"]}
};
function customerLine(order,ready){
 const patron=patronForOrder(order),phrases=CUSTOMER_LINES[patron.symbol][ready?"ready":"waiting"];
 const visits=loyaltyStamps(game,patron);
 const phase=(order.id+order.tier+Math.floor(visits/LOYALTY_VISIT_INTERVAL))%phrases.length;
 return phrases[phase];
}
function portrait(patron){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.classList.add("patron-icon");svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","#patron-"+patron.symbol);svg.append(use);return svg;
}
const label=(chain,tier)=>RECIPES[chain].items[tier-1];
// Distinct illustrated equipment, not food pieces from any merge chain.
const GENERATOR_ART={
 garden:`<rect x="13" y="27" width="74" height="60" rx="11" fill="#35554c" stroke="#e9d5a2" stroke-width="4"/><path d="M18 40 30 15H70L82 40Z" fill="#78b3a3" stroke="#f8dcac" stroke-width="4"/><path d="M31 22h38M50 20v19" stroke="#d1fff0" stroke-width="3" opacity=".75"/><rect x="23" y="45" width="54" height="35" rx="6" fill="#1e3436" stroke="#c9ad7b" stroke-width="3"/><path d="M33 76V59m17 17V52m17 24V59" stroke="#b5d8a9" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="46" r="5" fill="#f5da9b"/><path d="M44 46q-10-15-18-5m24 5q10-17 20-8" stroke="#91d9a5" stroke-width="4" fill="none"/><path d="M35 87h30" stroke="#f4d397" stroke-width="5" stroke-linecap="round"/>`,
 bakery:`<path d="M16 38Q16 13 50 13T84 38V84H16Z" fill="#87505a" stroke="#f6d5a3" stroke-width="5"/><path d="M25 36Q25 22 50 22T75 36V43H25Z" fill="#d98b6e" stroke="#ffe7b6" stroke-width="3"/><rect x="23" y="46" width="54" height="31" rx="7" fill="#432c39" stroke="#eac28f" stroke-width="4"/><path d="M33 67q6-17 12-7q5-18 11-3q6-9 11 9" fill="#ffbd70" stroke="#ffdf99" stroke-width="2"/><circle cx="28" cy="33" r="3" fill="#fce7bc"/><circle cx="72" cy="33" r="3" fill="#fce7bc"/><path d="M32 87h36" stroke="#edbd8a" stroke-width="6" stroke-linecap="round"/>`,
 sweets:`<path d="M25 42L17 23L37 30L50 10L63 30L83 23L75 42" fill="#c794c2" stroke="#ffe0f1" stroke-width="4"/><rect x="17" y="39" width="66" height="42" rx="12" fill="#8d5a9c" stroke="#f6d0e9" stroke-width="5"/><path d="M26 44q24-17 48 0" fill="none" stroke="#ffe8ad" stroke-width="4"/><circle cx="35" cy="58" r="6" fill="#f7c6dd"/><circle cx="50" cy="56" r="7" fill="#ffe2a3"/><circle cx="65" cy="58" r="6" fill="#b9e7da"/><path d="M30 73h40" stroke="#f4d4f7" stroke-width="4" stroke-linecap="round"/><path d="M32 81v8m36-8v8" stroke="#e5b5db" stroke-width="6" stroke-linecap="round"/>`
};
function generatorArt(chain){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.classList.add("generator-art");
 svg.setAttribute("viewBox","0 0 100 100");
 svg.setAttribute("aria-hidden","true");
 svg.setAttribute("focusable","false");
 const machineTrim={
 garden:`<path d="M16 40h68" stroke="#fff7cd" stroke-width="2" opacity=".75"/><circle cx="31" cy="30" r="3" fill="#ecffbf"/><circle cx="69" cy="30" r="3" fill="#ecffbf"/><path d="M28 73l8-3 8 3 8-3 8 3 8-3" stroke="#74c497" stroke-width="2.5" fill="none"/><path d="M37 14l4-8 4 8-4 7z" fill="#b2f8b6"/>`,
 bakery:`<path d="M19 42q31-9 62 0" stroke="#ffe2ab" stroke-width="2.5" fill="none"/><path d="M38 68q6-12 12-6t12 2" stroke="#ffeab6" stroke-width="2.5" fill="none"/><circle cx="28" cy="79" r="3" fill="#ffe4ba"/><circle cx="71" cy="79" r="3" fill="#ffe4ba"/><path d="M45 13l5-9 5 9" stroke="#ffefc7" stroke-width="2.5" fill="none"/>`,
 sweets:`<path d="M31 47q19-11 38 0" stroke="#fff2ca" stroke-width="2.5" fill="none"/><circle cx="26" cy="33" r="3" fill="#ffdbf1"/><circle cx="74" cy="33" r="3" fill="#ffdbf1"/><path d="M37 79l-4 5m30-5 4 5" stroke="#fff0cc" stroke-width="2.5"/><path d="M46 14l4-8 4 8 8 2-8 3-4 8-4-8-8-3z" fill="#fff2b9"/>`
};
 svg.innerHTML=(GENERATOR_ART[chain]||GENERATOR_ART.garden)+(machineTrim[chain]||"");
 return svg;
}
function announce(note,celebrate=false){
 $("status").textContent=note;$("status-icon").textContent=celebrate?"✧":"✦";
 if(celebrate)toast(note);
}
function toast(message){
 const el=$("toast");el.textContent=message;el.classList.add("show");
 const stamp=++lastToast;clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{if(stamp===lastToast)el.classList.remove("show")},2300);
}
function customerMoment(patron,phrase,reward="",mood="happy"){
 const stage=$("customer-moment");
 if(!stage)return;
 const copy=stage.querySelector(".moment-copy"),avatar=stage.querySelector(".moment-portrait");
 if(!copy||!avatar)return;
 const symbol=patron?.symbol||"imp";
 stage.dataset.customer=symbol;
 stage.dataset.mood=mood;
 stage.dataset.expression=mood==="served"?"joy":mood==="ready"?"delight":mood==="waiting"?"curious":"smile";
 stage.querySelector(".moment-name").textContent=patron?.name||"Midnight Guest";
 stage.querySelector(".moment-line").textContent=phrase;
 stage.querySelector(".moment-reward").textContent=reward;
 avatar.replaceChildren(portrait(patron||PATRONS[0]));
 avatar.append(text("span","","moment-face-spark"));
 const token=++momentToken;
 clearTimeout(momentTimer);
 stage.classList.remove("moment-show");
 stage.setAttribute("aria-hidden","false");
 // Restart the entrance sequence on successive servings.
 void stage.offsetWidth;
 stage.classList.add("moment-show");
 momentTimer=setTimeout(()=>{if(token!==momentToken)return;stage.classList.remove("moment-show");stage.setAttribute("aria-hidden","true");},2300);
}
function syncCustomerReactions(){
 const current=new Set(game.orders.filter(order=>findReady(game,order)>=0||findShelfReady(game,order)>=0).map(order=>order.id));
 if(readyOrderIds!==null){
  const justReady=game.orders.find(order=>current.has(order.id)&&!readyOrderIds.has(order.id));
  if(justReady){
   const patron=patronForOrder(justReady);
   const tip=favoriteTipForOrder(justReady);
   customerMoment(patron,customerLine(justReady,true),tip?"♡ FAV +"+tip+" coins":"READY TO SERVE","ready");
  }
 }
 readyOrderIds=current;
}
function bell(notes=[520,780],duration=.095){
 if(!soundOn)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  audio=audio||new Context();if(audio.state==="suspended")audio.resume().catch(()=>{});
  notes.forEach((hz,i)=>{
   const start=audio.currentTime+i*.062,osc=audio.createOscillator(),gain=audio.createGain();
   osc.type=i%2?"sine":"triangle";osc.frequency.value=hz;
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.055,start+.018);
   gain.gain.exponentialRampToValueAtTime(.0001,start+duration+.12);
   osc.connect(gain).connect(audio.destination);osc.start(start);osc.stop(start+duration+.13);
  });
 }catch{}
}
function rumble(ms){try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}}
function renderBoard(pop=-1){
 const focused=document.activeElement?.closest?.(".slot");
 const focusIndex=focused?Number(focused.dataset.index):-1;
 const frag=document.createDocumentFragment();
 const focusedOrder=game.orders.find(order=>order.id===focusedOrderId)||null;
 game.board.forEach((item,index)=>{
  const slot=document.createElement("button");slot.type="button";slot.className="slot";
  if(selected===index)slot.classList.add("selected");
  const producer=generatorAt(game,index);
  if(producer)slot.classList.add("generator-slot");
  // Subtle ingredient glow highlights valid merges when the player selects a dish.
  const held=selected!==null?game.board[selected]:null;
  if(held&&item&&index!==selected&&held.chain===item.chain&&held.tier===item.tier&&item.tier<7)slot.classList.add("match-option");
  if(item&&game.orders.some(order=>order.chain===item.chain&&order.tier===item.tier))slot.classList.add("order-ready-piece");
  if(focusedOrder&&item&&item.chain===focusedOrder.chain){
   slot.classList.add(item.tier===focusedOrder.tier?"focus-exact":"focus-ingredient");
   if(item.tier<focusedOrder.tier)slot.style.setProperty("--order-distance",String(focusedOrder.tier-item.tier));
  }
  if(focusedOrder&&producer===focusedOrder.chain)slot.classList.add("focus-generator");
  if(hintPair?.from===index)slot.classList.add("hint-source");
  if(hintPair?.to===index)slot.classList.add("hint-dest");
  if(index===pop)slot.classList.add("pop");
  slot.dataset.index=String(index);slot.setAttribute("role","gridcell");
  slot.setAttribute("aria-rowindex",String(Math.floor(index/WIDTH)+1));
  slot.setAttribute("aria-colindex",String(index%WIDTH+1));
  if(producer){
   slot.dataset.generator=producer;slot.style.setProperty("--i",String(index));
   const icon=generatorArt(producer);
   slot.append(text("span","✦","generator-sigil"),icon,text("small",RECIPES[producer].name.toUpperCase(),"generator-name"),text("span","LV "+(game.upgrades[producer]+1),"generator-tier"));
   slot.setAttribute("aria-label","Row "+(Math.floor(index/WIDTH)+1)+" column "+(index%WIDTH+1)+": movable "+RECIPES[producer].name+" generator. Select and tap again to harvest, or move it to another square.");
  }else if(item){
   slot.dataset.family=item.chain;slot.dataset.tier=String(item.tier);if(item.tier>=5)slot.classList.add("enchanted-piece");if(item.tier>=7)slot.classList.add("legendary-piece");slot.style.setProperty("--i",String(index));
   slot.append(food(item.chain,item.tier));
   // Ingredient name and tier are kept in the accessible label only.
   slot.setAttribute("aria-label","Row "+(Math.floor(index/WIDTH)+1)+" column "+(index%WIDTH+1)+": "+label(item.chain,item.tier)+", tier "+item.tier+(selected===index?", selected":""));
  }else slot.setAttribute("aria-label","Row "+(Math.floor(index/WIDTH)+1)+" column "+(index%WIDTH+1)+": empty");
  frag.append(slot);
 });
 board.replaceChildren(frag);
 if(focusIndex>=0&&document.activeElement!==board){const item=board.querySelector('[data-index="'+focusIndex+'"]');if(item)item.focus({preventScroll:true})}
}
function renderShelf(){
 const shelf=$("shelf");if(!shelf)return;
 const frag=document.createDocumentFragment();
 game.shelf.forEach((item,index)=>{
  const button=document.createElement("button");button.type="button";
  button.className="shelf-slot"+(item?" filled":"")+(selectedShelf===index?" selected":"");
  button.dataset.shelfIndex=String(index);
  button.setAttribute("aria-pressed",String(selectedShelf===index));
  if(item){
   button.append(food(item.chain,item.tier),text("span",label(item.chain,item.tier),"shelf-name"));
   button.setAttribute("aria-label","Pantry shelf "+(index+1)+": "+label(item.chain,item.tier)+". Tap to choose, then tap a board square to retrieve or swap.");
  }else{
   button.append(text("span","✧","shelf-star"),text("span","EMPTY POCKET","shelf-name"));
   button.setAttribute("aria-label","Empty pantry shelf "+(index+1)+". Select a board ingredient, then tap here to store it.");
  }
  button.addEventListener("click",()=>tapShelf(index));frag.append(button);
 });
 shelf.replaceChildren(frag);
 const counter=$("shelf-counter");if(counter)counter.textContent=game.shelf.filter(Boolean).length+" / "+game.shelf.length+" FILLED";
 const badge=$("storage-badge");if(badge)badge.textContent=game.shelf.filter(Boolean).length+"/"+game.shelf.length;
 const next=$("next-storage");if(next)next.textContent=game.shelf.length>=6?"ALL STORAGE UNLOCKED":"NEXT POCKET AT LEVEL "+(game.level+3-(game.level-1)%3);
}
function renderOrders(){
 const frag=document.createDocumentFragment();
 game.orders.forEach((order,i)=>{
  const ready=findReady(game,order)>=0||findShelfReady(game,order)>=0;
  const patron=patronForOrder(order);
  const favoriteTip=favoriteTipForOrder(order);
  const progress=orderProgress(game,order);
  const button=document.createElement("button");button.type="button";button.className="order-card"+(ready?" ready":"")+(order.tier>=5?" deluxe":"");
  button.style.setProperty("--customer-delay",String(i*-.7)+"s");
  button.dataset.customer=patron.symbol;
  button.dataset.mood=ready?"delighted":order.tier>=5?"impatient":"hopeful";
  button.classList.toggle("favorite-order",favoriteTip>0);
  const visits=loyaltyStamps(game,patron);
  button.classList.toggle("regular-customer",visits>0);
  button.classList.toggle("order-focused",order.id===focusedOrderId);
  button.dataset.expression=ready?"joy":visits>1?"familiar":"curious";
  button.disabled=false;button.title=ready?"Serve "+label(order.chain,order.tier):"Tap to hear "+patron.name+" and check their order for "+label(order.chain,order.tier);
  button.setAttribute("aria-label",patron.name+" ("+patron.personality+") requests "+label(order.chain,order.tier)+". "+(ready?"Ready to serve.":"Still cooking.")+" "+customerLine(order,ready)+" Earn "+(order.coins+favoriteTip)+" coins"+(favoriteTip?" including "+favoriteTip+" favorite-food tip":"")+" and "+order.xp+" XP.");
  if(ready)button.append(text("span","✓","check"));
  const customer=text("span","","customer-badge");
  const avatar=text("span","","customer-avatar");avatar.append(portrait(patron));
  avatar.append(text("span","","expression-spark"));
  customer.append(avatar,text("span",patron.name));
  if(visits>0)customer.append(text("span",visits+"×","loyalty-mark"));
  const speech=text("span",customerLine(order,ready),"customer-speech");
  customer.append(speech);
  button.append(customer);
  button.append(food(order.chain,order.tier),text("span",label(order.chain,order.tier),"order-name"));
  if(favoriteTip)button.append(text("span","♡ FAV +"+favoriteTip,"favorite-tip"));
  if(visits>0)button.title+=" · Returning regular ("+visits+" visits); "+loyaltyNext(game,patron)+" until loyalty reward";
  const footer=document.createElement("span");footer.className="order-foot";
  footer.append(text("span","◈ "+(order.coins+favoriteTip)),text("span","✦ "+order.xp+" XP"));
  button.append(footer,text("span",ready?"✦ SERVE ME!":"♡ TAP TO CHAT","serve-label"));
  const progressLabel=ready?"READY!":progress.tier>0?progress.steps+" TIERS TO GO":"START RECIPE";
  const progressTag=text("span",progressLabel,"order-progress-note");
  progressTag.title=progress.tier>0?"Highest available ingredient: "+label(order.chain,progress.tier):"No ingredients from this recipe family on the board or in storage";
  button.append(progressTag);
  button.addEventListener("click",()=>{
   if(ready){fulfill(i);return}
   focusedOrderId=focusedOrderId===order.id?null:order.id;
   renderBoard();renderOrders();
   customerMoment(patron,customerLine(order,false),favoriteTip?"♡ FAV +"+favoriteTip+" coins":progress.tier>0?progress.steps+" TIER STEPS FROM CLOSEST DISH":"MAKE "+label(order.chain,order.tier).toUpperCase(),"waiting");
   announce(focusedOrderId===null?"Order focus cleared.":patron.name+" wants "+label(order.chain,order.tier)+". Matching ingredients are highlighted on the board. "+(favoriteTip?"Favorite meal bonus: +"+favoriteTip+" coins.":""));
   bell([420,530],.05);
  });frag.append(button);
 });
 orders.replaceChildren(frag);
 const refresh=$("refresh-order");const disabled=game.coins<ORDER_REFRESH_COST||game.orders.every(order=>findReady(game,order)>=0||findShelfReady(game,order)>=0);
 if(refresh)refresh.disabled=disabled;
 const mobileRefresh=$("mobile-refresh-order");if(mobileRefresh)mobileRefresh.disabled=disabled;
}
function renderStations(){
 const frag=document.createDocumentFragment();
 for(const chain of Object.keys(RECIPES)){
  const info=RECIPES[chain],isOpen=unlocked(game,chain);
  const b=document.createElement("button");b.type="button";b.className="station-button"+(isOpen?" active":" locked");
  b.disabled=!isOpen||game.energy<=0||available(game)===0;
  b.setAttribute("aria-label",isOpen?"Collect from "+info.name+", costs one energy":info.name+" unlocks at level "+info.unlock);
  const art=text("span","","station-pic");art.append(generatorArt(chain));
  const copy=text("span","","station-text");
  copy.append(text("strong",info.name),text("small",isOpen?"ON YOUR GRID · TAP HERE TO HARVEST · LV "+(game.upgrades[chain]+1):"UNLOCKS AT KITCHEN LEVEL "+info.unlock));
  b.append(art,copy,text("span",isOpen?"1 ✦":"🔒","station-badge"));
  b.addEventListener("click",()=>makeIngredient(chain));frag.append(b);
 }
 stations.replaceChildren(frag);
}
function renderUpgrades(){
 const frag=document.createDocumentFragment();
 for(const chain of Object.keys(RECIPES)){
  const info=RECIPES[chain],isOpen=unlocked(game,chain),level=game.upgrades[chain],cost=upgradeCost(level),maxed=level>=3;
  const row=text("div","","upgrade-row"),copy=text("div","");
  copy.append(text("strong",info.name+" station · "+(isOpen?"Tier "+(level+1):"Locked")));
  copy.append(text("small",isOpen?"More chance of producing tier-2 ingredients.":"Reach kitchen level "+info.unlock+" to unlock."));
  const b=text("button",!isOpen?"Locked":maxed?"MAX":cost+" ◈","upgrade-button");
  b.type="button";b.disabled=!isOpen||maxed||game.coins<cost;
  b.title="Upgrade "+info.name+(maxed?" (maxed)":" for "+cost+" coins");
  b.addEventListener("click",()=>buyUpgrade(chain));
  row.append(copy,b);frag.append(row);
 }
 upgrades.replaceChildren(frag);
}

function renderQuests(){
 const list=$("quest-list");if(!list)return; // tolerate old cached HTML until new page refreshes
 const frag=document.createDocumentFragment();
 for(const [kind,info] of Object.entries(QUESTS)){
  const quest=game.quests[kind],target=questTarget(kind,quest.stage);
  const reward=questReward(kind,quest.stage),ready=quest.progress>=target;
  const card=text("div","","quest-card"+(ready?" complete":""));
  const heading=text("div","","quest-heading");
  const icon=text("span",info.icon,"quest-icon");
  const description=text("div","","quest-desc");
  description.append(text("strong",info.title),text("small",info.subtitle+" · Stage "+quest.stage));
  heading.append(icon,description);
  const ratio=text("div","","quest-ratio");ratio.append(text("span",quest.progress+" / "+target),text("span","◈ "+reward.coins+"  ·  ⚡ "+reward.energy));
  const track=text("div","","quest-track");
  track.setAttribute("role","progressbar");
  track.setAttribute("aria-label",info.title+" quest progress");
  track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(target));
  track.setAttribute("aria-valuenow",String(quest.progress));
  const fill=text("span","","quest-fill");fill.style.width=(quest.progress/target*100)+"%";track.append(fill);
  const button=text("button",ready?"CLAIM REWARD ✦":"KEEP COOKING","quest-claim");
  button.type="button";button.disabled=!ready;
  button.setAttribute("aria-label","Claim "+info.title+" for "+reward.coins+" coins and "+reward.energy+" energy");
  button.addEventListener("click",()=>collectQuest(kind));
  card.append(heading,ratio,track,button);frag.append(card);
 }
 list.replaceChildren(frag);
}
function renderGuestbook(){
 const host=$("guestbook"),counter=$("guestbook-count");
 if(!host||!counter)return;
 const frag=document.createDocumentFragment();
 let collected=0;
 for(const patron of PATRONS){
  const visits=loyaltyStamps(game,patron);
  const earned=keepsakesForPatron(game,patron);
  collected+=earned.length;
  const card=text("article","","guestbook-character"+(visits?" returning":""));
  card.dataset.customer=patron.symbol;
  const portraitFrame=text("div","","guestbook-portrait");
  portraitFrame.append(portrait(patron));
  const info=text("div","","guestbook-info");
  info.append(text("strong",patron.name),text("small",visits+" visits · "+(visits?"Regular guest":"Not met yet")));
  const prizes=text("div","","guestbook-keepsakes");
  for(const [i,limit] of KEEPSAKE_LEVELS.entries()){
   const owned=earned.find(item=>item.visits===limit);
   const badge=text("span",owned?"✦ "+owned.name:"◇ Visit "+limit,"guestbook-keepsake"+(owned?" earned":" locked"));
   badge.title=owned?"Earned on visit "+limit:"Serve "+patron.name+" "+limit+" times to unlock";
   prizes.append(badge);
  }
  info.append(prizes);card.append(portraitFrame,info);frag.append(card);
 }
 host.replaceChildren(frag);counter.textContent=collected+" / "+(PATRONS.length*KEEPSAKE_LEVELS.length);
}
function renderCookbook(){
 const book=$("recipe-book"),counter=$("discovery-count");
 if(!book||!counter)return; // keep gameplay working across stale page caches
 const signature=Object.keys(RECIPES).map(chain=>game.discovered[chain]||0).join(":");
 if(signature===lastCookbookSignature)return;
 lastCookbookSignature=signature;
 const frag=document.createDocumentFragment();
 const recipes=Object.entries(RECIPES);
 for(const [chain,info] of recipes){
  const section=text("section","","recipe-chapter");
  const heading=text("h3",info.name+" · "+Math.min(7,game.discovered[chain])+" / 7");
  section.append(heading);
  const grid=text("div","","recipe-grid");
  for(let tier=1;tier<=7;tier++){
   const known=game.discovered[chain]>=tier;
   const entry=text("div","","recipe-item"+(known?" discovered":" secret"));
   if(known)entry.append(food(chain,tier));
   else entry.append(text("span","?","recipe-mystery"));
   entry.append(text("span",known?info.items[tier-1]:"???","recipe-name"));
   entry.setAttribute("title",known?info.items[tier-1]:"Discover this recipe by merging");
   grid.append(entry);
  }
  section.append(grid);frag.append(section);
 }
 book.replaceChildren(frag);
 counter.textContent=discoveryCount(game)+" / 21";
}
function collectQuest(kind){
 const result=claimQuest(game,kind,Date.now());
 if(!result.ok){problem(result.reason);return}
 history=null;selected=null;hintPair=null;render();
 announce("QUEST COMPLETE! +"+result.coins+" coins and +"+result.energy+" energy.",true);
 bell([520,690,880,1100],.1);rumble([15,40,15]);
}

function renderStats(){
 $("score").textContent=game.score.toLocaleString();
 $("coins").textContent=game.coins.toLocaleString();
 $("level").textContent=game.level;
 $("served").textContent=game.served;
 $("energy").textContent=game.energy+" / "+MAX_ENERGY+(game.energy>MAX_ENERGY?" BONUS":"");
 $("energy-fill").style.width=(Math.min(game.energy,MAX_ENERGY)/MAX_ENERGY*100)+"%";
 $("energy-track").setAttribute("aria-valuetext",game.energy+" energy; natural regeneration stops at "+MAX_ENERGY);
 $("energy-track").classList.toggle("energy-overflow",game.energy>MAX_ENERGY);
 $("energy-track").setAttribute("aria-valuenow",String(Math.min(MAX_ENERGY,game.energy)));
 const now=Date.now();
 const seconds=game.energy>=MAX_ENERGY?0:Math.max(1,Math.ceil((ENERGY_INTERVAL-(now-game.energyLast)%ENERGY_INTERVAL)/1000));
 $("energy-timer").textContent=game.energy>MAX_ENERGY?"BONUS ENERGY · regeneration pauses at 40":game.energy===MAX_ENERGY?"Naturally full":("Next energy in "+seconds+"s");
 $("combo").textContent="×"+Math.max(1,game.combo);
 $("level-progress").textContent=game.xp+" / "+xpNeeded(game.level)+" XP";
 const rush=$("rush"),remain=Math.max(0,Math.ceil((game.rushUntil-now)/1000));
 rush.classList.toggle("active",remain>0);
 rush.textContent=remain>0?"🔥 RUSH HOUR · 2× TIPS · "+remain+"s":"RUSH HOUR / EVERY 5 ORDERS";
 $("undo").disabled=!history;
 $("recycle").disabled=selected===null||!game.board[selected];
 $("stir").disabled=game.coins<15||available(game)===CELL_COUNT;
 $("whisk-count").textContent=game.whisks+" / "+WHISK_CAP;
 $("next-whisk").textContent=(game.served%WHISK_EVERY)+" / "+WHISK_EVERY+" orders toward next whisk";
 $("whisk").disabled=game.whisks<1||!findMergePair(game);
 $("hint").disabled=!findMergePair(game);
}
function render(pop=-1){if(focusedOrderId!==null&&!game.orders.some(order=>order.id===focusedOrderId))focusedOrderId=null;renderBoard(pop);renderShelf();renderOrders();renderStations();renderUpgrades();renderQuests();renderCookbook();renderGuestbook();renderStats();syncCustomerReactions();safeSave()}
function particle(place,note,color){
 const cell=board.querySelector('[data-index="'+place+'"]');if(!cell)return;
 const bounds=fx.getBoundingClientRect(),r=cell.getBoundingClientRect();
 const x=r.left-bounds.left+r.width/2,y=r.top-bounds.top+r.height/2;
 if(note){
  const floating=text("span",note,"float-score");floating.style.left=x+"px";floating.style.top=y+"px";
  fx.append(floating);floating.addEventListener("animationend",()=>floating.remove(),{once:true});setTimeout(()=>floating.remove(),1100);
 }
 if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 for(let i=0;i<12;i++){
  const spark=text("span","","spark"),angle=i*Math.PI/6,dist=28+Math.random()*43;
  spark.style.left=x+"px";spark.style.top=y+"px";
  spark.style.setProperty("--dx",(Math.cos(angle)*dist).toFixed(0)+"px");
  spark.style.setProperty("--dy",(Math.sin(angle)*dist).toFixed(0)+"px");
  spark.style.setProperty("--spark-color",color||"#fff0ae");
  fx.append(spark);spark.addEventListener("animationend",()=>spark.remove(),{once:true});setTimeout(()=>spark.remove(),900);
 }
}
function problem(reason){
 const map={"generator-slot":"That tile is occupied by a generator. Move it first.","generator":"Select a generator or an ingredient first.","shelf-empty":"That pantry pocket is empty.",quest:"Unknown kitchen quest.",incomplete:"Finish the quest before claiming.",locked:"Sweetshop unlocks at kitchen level 3.",energy:"Out of energy. More arrives every 9 seconds.",full:"The counter is full. Merge or recycle ingredients.",empty:"Pick a food item first.",invalid:"Drop on a different square.",highest:"That recipe is already at its maximum tier.",missing:"You don't have the dish this customer wants yet.",coins:"Not enough coins. Serve orders to earn more.",maxed:"This station is completely upgraded.",order:"No such order."};
 announce(map[reason]||"That action didn't work. Try another item.");bell([245],.05);
}
function action(fn){
 const snapshot=serialize(game),result=fn();
 if(!result.ok){problem(result.reason);return null}
 history=snapshot;selected=null;selectedShelf=null;hintPair=null;return result;
}
function makeIngredient(chain){
 const result=action(()=>spawn(game,chain,Math.random,Date.now()));
 if(!result)return;
 render(result.place);particle(result.place,"+1",RECIPES[chain].hue);
 announce("Fresh "+label(chain,result.tier)+"! Drag matching items to cook something bigger.");
 if(result.discoveryBonus)toast("NEW RECIPE! +"+result.discoveryBonus+" discovery coins ✦");
 bell([390,540],.05);rumble(8);
}
function mergeFlight(from,to,chain,tier){
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 const source=board.querySelector('[data-index="'+from+'"]');
 const destination=board.querySelector('[data-index="'+to+'"]');
 if(!source||!destination||!fx)return;
 const bounds=fx.getBoundingClientRect(),start=source.getBoundingClientRect(),end=destination.getBoundingClientRect();
 const flying=document.createElement("span");
 flying.className="merge-flight";
 flying.style.left=(start.left-bounds.left+start.width/2)+"px";
 flying.style.top=(start.top-bounds.top+start.height/2)+"px";
 flying.style.setProperty("--fly-x",(end.left-start.left+(end.width-start.width)/2)+"px");
 flying.style.setProperty("--fly-y",(end.top-start.top+(end.height-start.height)/2)+"px");
 flying.append(food(chain,tier));
 fx.append(flying);
 flying.addEventListener("animationend",()=>flying.remove(),{once:true});
 setTimeout(()=>flying.remove(),650);
}
function highTierFlourish(place,chain,tier){
 const cell=board.querySelector('[data-index="'+place+'"]');
 if(!cell||!fx)return;
 const cellBox=cell.getBoundingClientRect(),layer=fx.getBoundingClientRect();
 const cx=cellBox.left-layer.left+cellBox.width/2,cy=cellBox.top-layer.top+cellBox.height/2;
 const flourish=document.createElement("span");
 flourish.className="tier-flourish"+(tier>=7?" legendary-flourish":"");
 flourish.style.left=cx+"px";flourish.style.top=cy+"px";
 flourish.style.setProperty("--flourish-color",RECIPES[chain]?.hue||"#ffe2ae");
 flourish.textContent=tier>=7?"✦":"✧";
 fx.append(flourish);
 flourish.addEventListener("animationend",()=>flourish.remove(),{once:true});
 setTimeout(()=>flourish.remove(),1200);
 if(tier>=7)toast("✦ LEGENDARY RECIPE! "+label(chain,tier));
 else if(tier===5)toast("✧ ENCHANTED RECIPE UNLOCKED: "+label(chain,tier));
}
function moveIngredient(a,b){
 const origin=game.board[a]?{...game.board[a]}:null;
 const result=action(()=>move(game,a,b,Date.now()));
 if(!result)return;
 if(result.type==="merge"){
  if(origin)mergeFlight(a,b,origin.chain,origin.tier);
  render(result.place);particle(result.place,"+"+result.gained,RECIPES[result.chain].hue);
  if(result.tier>=5)highTierFlourish(result.place,result.chain,result.tier);
  announce(result.combo>1?"MAGICAL COMBO ×"+result.combo+"! "+label(result.chain,result.tier)+" created!":"Mmm! "+label(result.chain,result.tier)+" cooked.",result.combo>=3);
  if(result.discoveryBonus)toast("NEW RECIPE: "+label(result.chain,result.tier)+"! +"+result.discoveryBonus+" discovery coins ✦");
  bell(result.combo>1?[520,780,1040]:[440,660],.09);rumble(12);
 }else if(result.type==="generator-move"){
  render(result.to);announce("✦ "+RECIPES[result.chain].name+" generator moved! Arrange your kitchen however you like.");bell([450,730],.07);
 }else{
  render();announce(result.type==="swap"?"Ingredients swapped. The counter is yours to arrange.":"Ingredient moved. Keep matching!");
  bell([350],.04);
 }
}
function parkIngredient(boardIndex,shelfIndex){
 const result=action(()=>storeOnShelf(game,boardIndex,shelfIndex));
 if(!result)return;
 render();announce(result.type==="shelf-swap"?"Swapped the counter item with your pantry reserve.":"Ingredient safely tucked into your pantry shelf.");
 bell([420,680],.08);rumble(8);
}
function tapShelf(index){
 if(selected!==null){if(generatorAt(game,selected)){announce("Generators stay on the cooking grid. Drag them anywhere on the counter instead.");return}parkIngredient(selected,index);return}
 if(!game.shelf[index]){
  selectedShelf=null;renderShelf();announce("Select a board ingredient, then tap an empty pantry pocket to store it.");return;
 }
 selectedShelf=selectedShelf===index?null:index;hintPair=null;
 if(selectedShelf!==null&&activeKitchenDrawer==="storage")setKitchenDrawer();
 renderShelf();renderBoard();
 announce(selectedShelf===null?"Pantry selection cleared.":"Pantry ingredient selected. Tap any board square to retrieve it or swap places.");
}
function retrieveIngredient(boardIndex){
 const index=selectedShelf;
 const result=action(()=>takeFromShelf(game,index,boardIndex));
 if(!result)return;
 render(boardIndex);if(activeKitchenDrawer==="storage")setKitchenDrawer();
 announce(result.type==="shelf-swap"?"Pantry and counter swapped places.":"Ingredient returned to the counter.");
 bell([570,770],.07);rumble(8);
}
function fulfill(index){
 const servedOrder=game.orders[index];
 if(servedOrder?.id===focusedOrderId)focusedOrderId=null;
 const servedPatron=servedOrder?patronForOrder(servedOrder):null;
 const result=serve(game,index,Math.random,Date.now());
 if(!result.ok){problem(result.reason);return}
 history=null;selected=null;selectedShelf=null;hintPair=null;render();
 const earned=result.patron+" loved it! +"+result.coins+" coins"+(result.favoriteTip?" (including "+result.favoriteTip+" favorite tip!)":"")+(result.loyaltyBonus?" · REGULAR BONUS +"+result.loyaltyBonus:"")+" ✦ +"+result.gained+" stars"+(result.whiskEarned?" ✧ +1 Magic Whisk!":"");
 announce(earned,true);bell([610,810,1040],.12);rumble(18);
 const patron=servedPatron;if(patron){
  const milestone=!!result.loyaltyBonus;
  const lines=CUSTOMER_LINES[patron.symbol].served;
  const phrase=milestone?CUSTOMER_ENCOUNTERS[patron.symbol]:lines[game.served%lines.length];
  const keepsakeNote=result.keepsake?" ✦ KEEPSAKE: "+result.keepsake.name:"";
  customerMoment(patron,phrase,"+"+result.coins+" ◈"+(result.favoriteTip?" · ♡ FAV TIP +"+result.favoriteTip:"")+(result.loyaltyBonus?" · REGULAR +"+result.loyaltyBonus:"")+keepsakeNote,result.keepsake?"encounter":milestone?"encounter":"served");
  if(result.keepsake)toast("✦ NEW GUESTBOOK KEEPSAKE: "+result.keepsake.name);
 }
 if(result.leveled)toast("KITCHEN LEVEL "+result.level+"! "+(result.unlockedSweetshop?"SWEETSHOP UNLOCKED!":"Bonus coins & energy!"));
 if(result.whiskEarned)toast("✨ +1 MAGIC WHISK EARNED · "+game.whisks+" / "+WHISK_CAP);
 if(result.storageUnlocked)toast("✦ PANTRY EXPANDED! "+result.storageCapacity+" storage pockets unlocked!");
 if(result.rush)toast("🔥 RUSH HOUR! DOUBLE TIPS FOR 45 SECONDS");
 maybeCloudAutosave();
}
function refreshCustomerOrder(){
 const result=refreshOrder(game,Math.random);
 if(!result.ok){
  if(result.reason==="all-ready")announce("Every customer is ready! Serve those dishes before refreshing orders.");
  else if(result.reason==="coins")announce("Need "+ORDER_REFRESH_COST+" coins to refresh an unfinished order.");
  else problem(result.reason);
  return;
 }
 history=null;selected=null;selectedShelf=null;hintPair=null;focusedOrderId=null;render();
 announce("✧ New customer request! "+ORDER_REFRESH_COST+" coins spent. Your cooked dishes are safe.",true);
 bell([480,640,820],.08);
}
function buyUpgrade(chain){
 const result=upgrade(game,chain);
 if(!result.ok){problem(result.reason);return}
 history=null;render();announce(RECIPES[chain].name+" upgraded! The pantry is feeling generous.",true);bell([460,700,890]);
}
function discard(){
 if(selected===null){announce("Select an ingredient on the board first.");return}
 const result=action(()=>recycle(game,selected));
 if(!result)return;
 render();announce("Counter cleared. No energy lost for recycling.");bell([280,330],.05);
}
function mix(){
 const result=action(()=>stir(game,Math.random));
 if(!result)return;
 render();announce("A little kitchen magic! The ingredients got shuffled.");bell([470,600,740]);
}

// On compact screens the board remains playable while optional tools use overlay drawers.
let activeKitchenDrawer=null;
function setKitchenDrawer(which=null){
 const shelf=$("kitchen-storage"),menu=$("kitchen-menu"),scrim=$("game-overlay-scrim");
 activeKitchenDrawer=which;
 const storageOpen=which==="storage",menuOpen=which==="menu";
 shelf?.classList.toggle("drawer-open",storageOpen);
 menu?.classList.toggle("drawer-open",menuOpen);
 scrim.hidden=!which;
 document.body.classList.toggle("kitchen-drawer-active",!!which);
 $("open-storage")?.setAttribute("aria-expanded",String(storageOpen));
 $("open-kitchen-menu")?.setAttribute("aria-expanded",String(menuOpen));
 if(which)(storageOpen?shelf:menu)?.focus({preventScroll:true});
 else (storageOpen?$("open-storage"):$("open-kitchen-menu"))?.blur();
}
$("open-storage")?.addEventListener("click",()=>setKitchenDrawer(activeKitchenDrawer==="storage"?null:"storage"));
$("open-kitchen-menu")?.addEventListener("click",()=>setKitchenDrawer(activeKitchenDrawer==="menu"?null:"menu"));
$("close-storage")?.addEventListener("click",()=>setKitchenDrawer());
$("close-kitchen-menu")?.addEventListener("click",()=>setKitchenDrawer());
$("game-overlay-scrim")?.addEventListener("click",()=>setKitchenDrawer());
$("mobile-refresh-order")?.addEventListener("click",()=>refreshCustomerOrder());
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&activeKitchenDrawer){event.preventDefault();setKitchenDrawer();}});
function showMergeHint(){
 const pair=findMergePair(game);
 if(!pair){hintPair=null;renderBoard();announce("No matching pair yet. Harvest, serve, or move food to make space.");return}
 hintPair=pair;selected=null;renderBoard();renderStats();
 announce("A handy match: combine the glowing "+label(pair.chain,pair.tier-1)+" tiles to make "+label(pair.chain,pair.tier)+".");
 bell([540,660],.05);
}
$("refresh-order")?.addEventListener("click",refreshCustomerOrder);
function useMagicWhisk(){
 const result=action(()=>magicWhisk(game,Date.now()));
 if(!result)return;
 render(result.place);particle(result.place,"✦ MAGIC MERGE",RECIPES[result.chain].hue);
 announce("✨ WHISKED! "+label(result.chain,result.tier)+" cooked automatically. "+game.whisks+" charges left.",true);
 if(result.discoveryBonus)toast("NEW RECIPE: "+label(result.chain,result.tier)+"!");
 bell([510,740,980,1180],.12);rumble([15,35,12]);
}
function undo(){
 if(!history){announce("Nothing to undo yet.");return}
 game=restore(history,Math.random,Date.now());history=null;selected=null;selectedShelf=null;hintPair=null;
 render();announce("Last board action undone.");bell([460,390],.06);
}
function tapCell(index){
 if(!Number.isInteger(index)||index<0||index>=CELL_COUNT)return;
 if(selectedShelf!==null){retrieveIngredient(index);return}
 if(selected!==null){
  if(selected===index){
   const chain=generatorAt(game,index);
   selected=null;
   if(chain){makeIngredient(chain);return}
   renderBoard();renderStats();return
  }
  moveIngredient(selected,index);return;
 }
 if(!game.board[index]&&!generatorAt(game,index)){announce("Empty square. Tap an ingredient or generator first.");return}
 selected=index;renderBoard();renderStats();const selectedGenerator=generatorAt(game,index);
 announce(selectedGenerator?RECIPES[selectedGenerator].name+" generator selected. Tap again to harvest, or tap another square to relocate it.":label(game.board[index].chain,game.board[index].tier)+" selected. Tap or drag it onto a match.");
}
function clearHovered(){if(hovered!==null){const b=board.querySelector('[data-index="'+hovered+'"]');if(b)b.classList.remove("drop-target")}hovered=null;if(hoveredShelf!==null){$("shelf")?.querySelector('[data-shelf-index="'+hoveredShelf+'"]')?.classList.remove("drop-target")}hoveredShelf=null}
function removeGhost(){clearHovered();if(ghost){ghost.remove();ghost=null}}
function shelfAt(x,y){const element=document.elementFromPoint(x,y);const slot=element?.closest?.(".shelf-slot");return slot&&$("shelf")?.contains(slot)?Number(slot.dataset.shelfIndex):null}
function indexAt(x,y){
 const element=document.elementFromPoint(x,y);
 const slot=element?.closest?.(".slot");
 return slot&&board.contains(slot)?Number(slot.dataset.index):null;
}
board.addEventListener("pointerdown",event=>{
 if(event.pointerType==="mouse"&&event.button!==0)return;
 const slot=event.target.closest(".slot");if(!slot)return;
 drag={id:event.pointerId,from:Number(slot.dataset.index),startX:event.clientX,startY:event.clientY,moved:false};
 try{board.setPointerCapture(event.pointerId)}catch{}
});
board.addEventListener("pointermove",event=>{
 if(!drag||drag.id!==event.pointerId)return;
 const dist=Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY);
 if(!drag.moved&&dist>9&&(game.board[drag.from]||generatorAt(game,drag.from))){
  drag.moved=true;ghost=text("div","","drag-ghost");
  const generator=generatorAt(game,drag.from);
  if(generator)ghost.append(generatorArt(generator));
  else ghost.append(food(game.board[drag.from].chain,game.board[drag.from].tier));
  document.body.append(ghost);
 }
 if(!drag.moved)return;
 event.preventDefault();
 ghost.style.left=event.clientX+"px";ghost.style.top=event.clientY+"px";
 const target=indexAt(event.clientX,event.clientY),shelfTarget=shelfAt(event.clientX,event.clientY);
 if(target!==hovered||shelfTarget!==hoveredShelf){
  clearHovered();
  if(target!==null&&target!==drag.from){hovered=target;board.querySelector('[data-index="'+target+'"]')?.classList.add("drop-target")}
  if(shelfTarget!==null){hoveredShelf=shelfTarget;$("shelf")?.querySelector('[data-shelf-index="'+shelfTarget+'"]')?.classList.add("drop-target")}
 }
});
function endDrag(event){
 if(!drag||drag.id!==event.pointerId)return;
 const original=drag.from,didMove=drag.moved,target=didMove?indexAt(event.clientX,event.clientY):null,shelfTarget=didMove?shelfAt(event.clientX,event.clientY):null;
 removeGhost();drag=null;
 try{board.releasePointerCapture(event.pointerId)}catch{}
 if(didMove){
  if(shelfTarget!==null){if(generatorAt(game,original))announce("Keep your generator on the cooking grid, chef!");else parkIngredient(original,shelfTarget);}
  else if(target!==null&&target!==original)moveIngredient(original,target);
  else announce("Drop that ingredient onto a board square or pantry pocket.");
 }else tapCell(original);
}
board.addEventListener("pointerup",endDrag);
board.addEventListener("pointercancel",()=>{removeGhost();drag=null});
board.addEventListener("click",event=>{
 if(event.detail!==0)return;
 const slot=event.target.closest(".slot");if(slot)tapCell(Number(slot.dataset.index));
});
board.addEventListener("keydown",event=>{
 const slot=event.target.closest(".slot");if(!slot)return;
 const idx=Number(slot.dataset.index);
 const delta={ArrowUp:-WIDTH,ArrowDown:WIDTH,ArrowLeft:-1,ArrowRight:1}[event.key];
 if(delta!==undefined){
  event.preventDefault();let next=idx+delta;
  if(event.key==="ArrowLeft"&&idx%WIDTH===0||event.key==="ArrowRight"&&idx%WIDTH===WIDTH-1)next=idx;
  if(next>=0&&next<CELL_COUNT)board.querySelector('[data-index="'+next+'"]')?.focus();return;
 }
 if(event.key==="Delete"||event.key==="Backspace"){event.preventDefault();selected=idx;discard();}
});
document.addEventListener("keydown",event=>{
 if(event.ctrlKey||event.altKey||event.metaKey||event.target.matches("input,textarea,[contenteditable]"))return;
 const key=event.key.toLowerCase();
 if(key==="u"){event.preventDefault();undo()}
 if(key==="s"){event.preventDefault();mix()}
 if(key==="h"){event.preventDefault();showMergeHint()}
 if(key==="w"){event.preventDefault();useMagicWhisk()}
 if(key==="m"){$("sound-toggle").click()}
 if(key==="escape"&&(selected!==null||selectedShelf!==null)){selected=null;selectedShelf=null;renderBoard();renderShelf();renderStats()}
 if(["1","2","3"].includes(key)&&event.target.tagName!=="BUTTON"){makeIngredient(Object.keys(RECIPES)[Number(key)-1])}
});
$("undo").addEventListener("click",undo);
$("recycle").addEventListener("click",discard);
$("stir").addEventListener("click",mix);
$("hint").addEventListener("click",showMergeHint);
$("whisk").addEventListener("click",useMagicWhisk);
$("sound-toggle").addEventListener("click",()=>{
 soundOn=!soundOn;$("sound-toggle").textContent=soundOn?"♫ ON":"♪ OFF";
 $("sound-toggle").setAttribute("aria-pressed",String(soundOn));
 $("sound-toggle").setAttribute("aria-label",soundOn?"Mute sounds":"Enable sounds");
 try{localStorage.setItem(SOUND_STORE,soundOn?"yes":"no")}catch{}
 if(soundOn)bell([580,820]);
});
$("sound-toggle").textContent=soundOn?"♫ ON":"♪ OFF";$("sound-toggle").setAttribute("aria-pressed",String(soundOn));
const fullButton=$("fullscreen");
async function toggleFullscreen(){
 if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}return}
 if(document.body.classList.contains("theater")){document.body.classList.remove("theater");return}
 try{if(!document.documentElement.requestFullscreen)throw Error("unsupported");await document.documentElement.requestFullscreen()}
 catch{document.body.classList.toggle("theater");toast("Kitchen focus mode enabled");}
}
fullButton.addEventListener("click",toggleFullscreen);
document.addEventListener("fullscreenchange",()=>fullButton.setAttribute("aria-label",document.fullscreenElement?"Exit fullscreen":"Enter fullscreen"));
function accountApi(){return window.AshFallArcade}
async function saveAccount(silent=false){
 try{
  const api=accountApi();if(!api){if(!silent)announce("Account save helper isn't ready. Your local save is safe.");return}
  if(api.ready)await api.ready;
  if(!api.user){if(!silent)announce("Sign in to Knightfall to save to your account. Local saving is already on.");return}
  const payload={serialized:JSON.parse(serialize(game)),source:"hex-and-whisk",served:game.served,score:game.score};
  if(silent)await api.saveProgress("hex-and-whisk",payload,"autosave",1);
  else{
   const result=await api.recordScore("hex-and-whisk",game.score,payload);
   if(!result?.saved)throw Error("Score was not saved");
   lastSyncScore=game.score;announce("Kitchen saved to your Knightfall account!",true);bell([640,880]);
  }
 }catch(error){if(!silent)announce("Cloud sync failed. Your local kitchen remains saved.");}
}
async function loadAccount(){
 try{
  const api=accountApi();if(!api){announce("Account service isn't loaded. Your local kitchen is safe.");return}
  if(api.ready)await api.ready;
  if(!api.user){announce("Please sign in to load your account kitchen.");return}
  const saved=await api.loadProgress("hex-and-whisk","autosave");
  if(!saved){announce("No account kitchen save found yet. Your local save remains untouched.");return}
  if((game.score>0||game.served>0)&&!window.confirm("Replace this device's kitchen with your saved account kitchen?"))return;
  game=restore(saved.serialized||saved.gameState||saved,Math.random,Date.now());
  history=null;selected=null;selectedShelf=null;hintPair=null;render();announce("Account kitchen loaded. Welcome back, chef!",true);
 }catch{announce("Could not load the account save. Your local kitchen is safe.")}
}
function maybeCloudAutosave(){
 if(game.served%4!==0||game.score<=lastSyncScore)return;
 lastSyncScore=game.score;saveAccount(true);
}
$("cloud-save").addEventListener("click",()=>saveAccount(false));
$("cloud-load").addEventListener("click",loadAccount);
setInterval(()=>{
 const before=game.energy,now=Date.now();advance(game,now);
 if(game.energy!==before){renderStats();renderStations();safeSave()}
 else renderStats();
},1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){advance(game,Date.now());render()}else safeSave()});
window.addEventListener("pagehide",safeSave);
render();
announce("Welcome to the night kitchen! Tap Garden or Bakery and start merging.");
