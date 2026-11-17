import {WIDTH,CELL_COUNT,SHELF_SLOTS,shelfCapacity,generatorAt,MAX_ENERGY,ENERGY_INTERVAL,RECIPES,xpNeeded,upgradeCost,unlocked,available,findReady,findShelfReady,storeOnShelf,takeFromShelf,makeGame,advance,spawn,move,serve,upgrade,recycle,stir,serialize,restore,QUESTS,questTarget,questReward,claimQuest,discoveryCount,WHISK_CAP,WHISK_EVERY,findMergePair,magicWhisk,ORDER_REFRESH_COST,refreshOrder} from "./engine.mjs";

const $=id=>document.getElementById(id);
const board=$("board"),orders=$("orders"),stations=$("stations"),upgrades=$("upgrades"),fx=$("fx-layer");
const STORE="knightfall:hex-and-whisk:v1",SOUND_STORE="knightfall:hex-and-whisk:sound";
let game,selected=null,selectedShelf=null,history=null,drag=null,ghost=null,hovered=null,hoveredShelf=null,lastToast=0,toastTimer=null,audio=null,hintPair=null;
let soundOn=false,bonusUntil=0,lastSyncScore=0,lastCookbookSignature="";
try{soundOn=localStorage.getItem(SOUND_STORE)==="yes"}catch{}
try{game=restore(localStorage.getItem(STORE),Math.random,Date.now())}catch{game=makeGame()}
function safeSave(){try{localStorage.setItem(STORE,serialize(game))}catch{}}
const text=(tag,content,className)=>{const el=document.createElement(tag);if(className)el.className=className;el.textContent=String(content);return el};
function food(chain,tier){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 svg.classList.add("food");svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");
 use.setAttribute("href","./sprites/icons.svg#"+chain+"-"+tier);svg.append(use);
 return svg;
}

const PATRONS=[{name:"Pip the Imp",symbol:"imp"},{name:"Mochi Bat",symbol:"bat"},{name:"Wisp Ghost",symbol:"ghost"},{name:"Marnie Witch",symbol:"witch"}];
function portrait(patron){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.classList.add("patron-icon");svg.setAttribute("viewBox","0 0 100 100");svg.setAttribute("aria-hidden","true");
 const use=document.createElementNS("http://www.w3.org/2000/svg","use");use.setAttribute("href","#patron-"+patron.symbol);svg.append(use);return svg;
}
const label=(chain,tier)=>RECIPES[chain].items[tier-1];
function generatorArt(chain){const art=food(chain,chain==="garden"?1:chain==="bakery"?3:2);art.classList.add("generator-art");return art;}
function announce(note,celebrate=false){
 $("status").textContent=note;$("status-icon").textContent=celebrate?"✧":"✦";
 if(celebrate)toast(note);
}
function toast(message){
 const el=$("toast");el.textContent=message;el.classList.add("show");
 const stamp=++lastToast;clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{if(stamp===lastToast)el.classList.remove("show")},2300);
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
 game.board.forEach((item,index)=>{
  const slot=document.createElement("button");slot.type="button";slot.className="slot";
  if(selected===index)slot.classList.add("selected");
  const producer=generatorAt(game,index);
  if(producer)slot.classList.add("generator-slot");
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
   slot.dataset.family=item.chain;slot.style.setProperty("--i",String(index));
   slot.append(food(item.chain,item.tier));
   slot.append(text("span",""+item.tier,"tile-rank"),text("small",label(item.chain,item.tier),"tile-name"));
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
 const next=$("next-storage");if(next)next.textContent=game.shelf.length>=6?"ALL STORAGE UNLOCKED":"NEXT POCKET AT LEVEL "+(game.level+3-(game.level-1)%3);
}
function renderOrders(){
 const frag=document.createDocumentFragment();
 game.orders.forEach((order,i)=>{
  const ready=findReady(game,order)>=0||findShelfReady(game,order)>=0;
  const patron=PATRONS[order.id%PATRONS.length];
  const button=document.createElement("button");button.type="button";button.className="order-card"+(ready?" ready":"")+(order.tier>=5?" deluxe":"");
  button.style.setProperty("--customer-delay",String(i*-.7)+"s");
  button.disabled=!ready;button.title=ready?"Serve "+label(order.chain,order.tier):"Merge ingredients to make "+label(order.chain,order.tier);
  button.setAttribute("aria-label",patron.name+" requests "+label(order.chain,order.tier)+". "+(ready?"Ready to serve.":"Still cooking.")+" Earn "+order.coins+" coins and "+order.xp+" XP.");
  if(ready)button.append(text("span","✓","check"));
  const customer=text("span","","customer-badge");
  const avatar=text("span","","customer-avatar");avatar.append(portrait(patron));
  customer.append(avatar,text("span",patron.name));
  const speech=text("span",ready?"YUM! ♡":order.tier>=5?"A grand feast!":"Something tasty?","customer-speech");
  customer.append(speech);
  button.append(customer);
  button.append(food(order.chain,order.tier),text("span",label(order.chain,order.tier),"order-name"));
  const footer=document.createElement("span");footer.className="order-foot";
  footer.append(text("span","◈ "+order.coins),text("span","✦ "+order.xp+" XP"));
  button.append(footer,text("span",ready?"✦ SERVE ME!":"✧ COOKING...","serve-label"));
  button.addEventListener("click",()=>fulfill(i));frag.append(button);
 });
 orders.replaceChildren(frag);
 const refresh=$("refresh-order");if(refresh){refresh.disabled=game.coins<ORDER_REFRESH_COST||game.orders.every(order=>findReady(game,order)>=0||findShelfReady(game,order)>=0);}
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
 $("energy").textContent=game.energy+" / "+MAX_ENERGY;
 $("energy-fill").style.width=(game.energy/MAX_ENERGY*100)+"%";
 $("energy-track").setAttribute("aria-valuenow",String(game.energy));
 const now=Date.now();
 const seconds=game.energy>=MAX_ENERGY?0:Math.max(1,Math.ceil((ENERGY_INTERVAL-(now-game.energyLast)%ENERGY_INTERVAL)/1000));
 $("energy-timer").textContent=game.energy>=MAX_ENERGY?"Ready to cook":("Next energy in "+seconds+"s");
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
function render(pop=-1){renderBoard(pop);renderShelf();renderOrders();renderStations();renderUpgrades();renderQuests();renderCookbook();renderStats();safeSave()}
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
function moveIngredient(a,b){
 const result=action(()=>move(game,a,b,Date.now()));
 if(!result)return;
 if(result.type==="merge"){
  render(result.place);particle(result.place,"+"+result.gained,RECIPES[result.chain].hue);
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
 renderShelf();renderBoard();
 announce(selectedShelf===null?"Pantry selection cleared.":"Pantry ingredient selected. Tap any board square to retrieve it or swap places.");
}
function retrieveIngredient(boardIndex){
 const index=selectedShelf;
 const result=action(()=>takeFromShelf(game,index,boardIndex));
 if(!result)return;
 render(boardIndex);
 announce(result.type==="shelf-swap"?"Pantry and counter swapped places.":"Ingredient returned to the counter.");
 bell([570,770],.07);rumble(8);
}
function fulfill(index){
 const result=serve(game,index,Math.random,Date.now());
 if(!result.ok){problem(result.reason);return}
 history=null;selected=null;selectedShelf=null;hintPair=null;render();
 const earned="ORDER SERVED! +"+result.coins+" coins ✦ +"+result.gained+" stars"+(result.whiskEarned?" ✧ +1 Magic Whisk!":"");
 announce(earned,true);bell([610,810,1040],.12);rumble(18);
 if(result.leveled)toast("KITCHEN LEVEL "+result.level+"! "+(result.unlockedSweetshop?"SWEETSHOP UNLOCKED!":"Bonus coins & energy!"));
 if(result.whiskEarned)toast("✨ +1 MAGIC WHISK EARNED · "+game.whisks+" / "+WHISK_CAP);
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
 history=null;selected=null;selectedShelf=null;hintPair=null;render();
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
