/* Roads of Cinder · original life-journey tabletop engine.
   No Hasbro rules, artwork, trademarks, boards, or card text are used.
   Side-effect-free gameplay logic; UI and persistence live separately. */
(function(root){"use strict";
const SALARIES=[
 {id:"mechanic",name:"Wasteland Mechanic",pay:48000,icon:"🔧"},
 {id:"artist",name:"Neon Artist",pay:52000,icon:"🎨"},
 {id:"medic",name:"Field Medic",pay:69000,icon:"🩺"},
 {id:"engineer",name:"Cinder Engineer",pay:94000,icon:"⚙️"},
 {id:"lawyer",name:"Rift Advocate",pay:110000,icon:"⚖️"},
 {id:"founder",name:"Ash Entrepreneur",pay:76000,icon:"💼"},
 {id:"pilot",name:"Skyline Pilot",pay:88000,icon:"🚀"}
];
const COLLEGE=new Set(["medic","engineer","lawyer","pilot"]);
const PATH=[
 ["start","BEGIN"],["payday","Payday"],["event","First Apartment"],["career","Career Day"],
 ["family","New Connections"],["payday","Payday"],["choice","Side Hustle"],["expense","Moving Day"],
 ["event","Wild Opportunity"],["payday","Payday"],["home","First Home"],["family","Family Gathering"],
 ["fork","Two Roads"],["event","Windfall"],["payday","Payday"],["expense","Unexpected Repairs"],
 ["invest","Invest in Yourself"],["family","Love & Loyalty"],["payday","Payday"],["event","Life Happens"],
 ["career","Career Crossroads"],["expense","Rainy Day"],["home","Upgrade Your Space"],["payday","Payday"],
 ["choice","Passion Project"],["family","Baby Boom"],["event","Lucky Break"],["payday","Payday"],
 ["tax","The Taxman"],["invest","Market Day"],["expense","Bills Again"],["payday","Payday"],
 ["fork","Big Decision"],["family","Family Adventure"],["event","Chance Encounter"],["payday","Payday"],
 ["career","Career Shift"],["home","Property Ladder"],["expense","Fender Bender"],["payday","Payday"],
 ["choice","Risk or Rest"],["event","Unexpected Gift"],["family","Generations"],["payday","Payday"],
 ["invest","Long-Term Thinking"],["expense","Healthcare Bill"],["event","Community Celebration"],
 ["payday","Payday"],["family","New Chapter"],["career","Last Promotion"],
 ["home","One More Move"],["event","Final Surprise"],["payday","Payday"],
 ["choice","Legacy Choice"],["event","The Good Years"],["tax","Tax Season"],
 ["payday","Final Payday"],["family","Family Reunion"],["invest","Last Investment"],
 ["event","Life's Little Twist"],["retire","RETIRE"]
].map(([kind,name],index)=>({index,kind,name}));
const DECK={
 event:[
  {text:"Your odd little invention catches on.",cash:22000},
  {text:"A festival hires you to headline the weekend.",cash:16000},
  {text:"A mysterious benefactor clears an old bill.",debt:-14000},
  {text:"Your antique collection sells at auction.",cash:26000},
  {text:"The roof leaks at the worst possible time.",cash:-13000},
  {text:"A distant relative remembers you in a will.",cash:32000},
  {text:"You invest in a friend's questionable idea.",cash:-9000,investment:19000},
  {text:"Your neighborhood votes you a local hero.",cash:12000},
  {text:"A storm cancels everything, including your savings plan.",cash:-17000},
  {text:"A side project pays off spectacularly.",cash:24000},
  {text:"An old repair bill finally arrives.",cash:-10500},
  {text:"You win a regional skills competition.",cash:18500}
 ],
 family:[
  {text:"A new child joins the family.",kids:1,cash:-12000},
  {text:"Family vacation: memories aren't cheap.",cash:-8500,happiness:2},
  {text:"A loved one helps renovate your home.",house:10000},
  {text:"Your family throws you a surprise celebration.",happiness:2,cash:-4000},
  {text:"A child earns a scholarship. You breathe easier.",cash:13000},
  {text:"You volunteer together and gain perspective.",happiness:3},
  {text:"The extended family visits for a month.",cash:-6500,happiness:1}
 ],
 expense:[
  {text:"Emergency plumbing. The water wins.",cash:-11000},
  {text:"Car trouble at the worst possible time.",cash:-15000},
  {text:"Unexpected medical costs.",cash:-19000},
  {text:"A necessary renovation takes its toll.",cash:-13000,house:6000},
  {text:"The tax office discovers your creative accounting.",cash:-12000},
  {text:"You pay down a lingering obligation.",cash:-9000,debt:-4000}
 ]
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const money=n=>Math.round(n);
const fresh=(name,color)=>({name,color,pos:0,cash:25000,debt:0,salary:0,career:"Unchosen",degree:false,
 house:0,investments:0,kids:0,partner:false,happiness:2,retired:false,history:[],paydays:0});
class RoadsGame {
 constructor(options={}){
  this.rng=options.rng||Math.random;
  this.round=0;this.current=0;this.finished=false;this.lastSpin=0;this.log=[];
  const names=Array.isArray(options.names)&&options.names.length>=2?options.names.slice(0,4):["Ash","Ember"];
  this.players=names.map((n,i)=>fresh(String(n||"Player "+(i+1)).slice(0,24),["#ff4bd1","#baff48","#55eaff","#ba8cff"][i]));
  this.pending={kind:"path",player:0};this.logEvent("Choose a starting path. Every life takes a different turn.");
 }
 logEvent(text){this.log.unshift(text);this.log.length=Math.min(this.log.length,28)}
 player(){return this.players[this.current]}
 netWorth(p){return p.cash+p.house+p.investments-p.debt+p.kids*3500+p.happiness*2000}
 options(){
  const p=this.player(),q=this.pending;if(!q)return [];
  if(q.kind==="path")return [
   {id:"work",title:"Start Working",description:"Earn sooner. Choose from starter careers and keep your cash.",icon:"🔨"},
   {id:"college",title:"Go to College",description:"Borrow $45,000; unlock higher-paying careers.",icon:"🎓"}];
  if(q.kind==="career"){
   const allowed=SALARIES.filter(c=>p.degree||!COLLEGE.has(c.id));
   return allowed.map(c=>({id:c.id,title:c.icon+" "+c.name,description:"Salary "+money(c.pay).toLocaleString()+" per payday",icon:c.icon}));
  }
  if(q.kind==="home")return [
   {id:"small",title:"Buy a Starter Home",description:"Pay $45k, gain $58k in property.",icon:"🏡"},
   {id:"large",title:"Buy a Dream Home",description:"Pay $120k, gain $148k in property.",icon:"🏰"},
   {id:"skip",title:"Keep Renting",description:"Keep your cash for other adventures.",icon:"🧳"}];
  if(q.kind==="invest")return [
   {id:"safe",title:"Build a Nest Egg",description:"Pay $18k; gain a $25k investment.",icon:"🏦"},
   {id:"risky",title:"High-Risk Venture",description:"Pay $25k; 50% chance of gaining $65k, otherwise lose your stake.",icon:"🎲"},
   {id:"skip",title:"Play It Safe",description:"Don't invest today.",icon:"🧘"}];
  if(q.kind==="fork"||q.kind==="choice")return [
   {id:"bold",title:"Take the Wild Route",description:"Risk $16k for a chance at $42k.",icon:"⚡"},
   {id:"steady",title:"Choose the Scenic Route",description:"Gain $8k and 1 happiness.",icon:"🌿"}];
  if(q.kind==="family")return [
   {id:"bond",title:"Make Time for Loved Ones",description:"Gain happiness; modest celebration costs.",icon:"💚"},
   {id:"grow",title:"Expand the Family",description:"Add a child and gain a legacy bonus at retirement.",icon:"🍼"},
   {id:"focus",title:"Focus on Yourself",description:"Earn $9k from some extra work.",icon:"✨"}];
  if(q.kind==="retire")return [
   {id:"quiet",title:"Quiet Retirement",description:"Take a $25k retirement benefit.",icon:"🌅"},
   {id:"legacy",title:"Leave a Legacy",description:"Gain $10k per child and $7k per happiness point.",icon:"🏆"}];
  return [];
 }
 pay(p,amount){p.cash+=money(amount);if(p.cash<0){p.debt+=-p.cash;p.cash=0}}
 charge(p,amount){this.pay(p,-amount)}
 offer(kind){this.pending={kind,player:this.current}}
 choose(id){
  if(this.finished||!this.pending||typeof id!=="string")return false;
  const pending=this.pending;if(!this.options().some(o=>o.id===id))return false;
  const p=this.player();this.pending=null;
  if(pending.kind==="path"){
   if(id==="college"){p.degree=true;p.debt+=45000;p.salary=40000;this.logEvent(p.name+" goes to college with a $45,000 student loan.")}
   else {p.salary=48000;this.logEvent(p.name+" starts working with no student debt.")}
   this.offer("career");return true;
  }
  if(pending.kind==="career"){
   const c=SALARIES.find(x=>x.id===id);p.career=c.name;p.salary=c.pay;
   this.logEvent(p.name+" becomes a "+c.name+" ($"+c.pay.toLocaleString()+"/payday).");
  }
  if(pending.kind==="home"){
   if(id!=="skip"){const price=id==="large"?120000:45000,worth=id==="large"?148000:58000;
    this.charge(p,price);p.house+=worth;this.logEvent(p.name+" buys property worth $"+worth.toLocaleString()+".");}
   else this.logEvent(p.name+" decides against buying a house.");
  }
  if(pending.kind==="invest"){
   if(id==="safe"){this.charge(p,18000);p.investments+=25000;this.logEvent(p.name+" builds a $25k nest egg.")}
   if(id==="risky"){this.charge(p,25000);if(this.rng()<.5){p.investments+=65000;this.logEvent(p.name+" hits a $65k investment jackpot!")}else this.logEvent(p.name+"'s risky venture goes bust.")}
   if(id==="skip")this.logEvent(p.name+" keeps their money liquid.");
  }
  if(pending.kind==="fork"||pending.kind==="choice"){
   if(id==="bold"){this.charge(p,16000);if(this.rng()<.55){this.pay(p,42000);this.logEvent(p.name+" wins big taking the wild route.")}else this.logEvent(p.name+" takes a chance and comes up short.")}
   else{this.pay(p,8000);p.happiness++;this.logEvent(p.name+" enjoys the scenic route.");}
  }
  if(pending.kind==="family"){
   if(id==="grow"){p.kids++;this.charge(p,12000);p.happiness++;this.logEvent(p.name+" welcomes a child to the family.")}
   else if(id==="bond"){this.charge(p,6000);p.happiness+=2;p.partner=true;this.logEvent(p.name+" makes a lasting connection.")}
   else{this.pay(p,9000);this.logEvent(p.name+" chooses a little breathing room and extra work.")}
  }
  if(pending.kind==="retire"){
   p.retired=true;
   const bonus=id==="legacy"?p.kids*10000+p.happiness*7000:25000;
   this.pay(p,bonus);this.logEvent(p.name+" retires with a $"+bonus.toLocaleString()+" bonus and $"+money(this.netWorth(p)).toLocaleString()+" net worth.");
  }
  p.history.push({at:p.pos,choice:id});p.history=p.history.slice(-90);
  this.finishTurn();return true;
 }
 applyCard(p,kind){
  const deck=DECK[kind];const card=deck[Math.floor(this.rng()*deck.length)];
  if(card.cash)this.pay(p,card.cash);
  if(card.debt)p.debt=Math.max(0,p.debt+card.debt);
  if(card.house)p.house+=card.house;
  if(card.investment)p.investments+=card.investment;
  if(card.kids)p.kids+=card.kids;
  if(card.happiness)p.happiness+=card.happiness;
  this.logEvent(p.name+": "+card.text);
 }
 applyTile(p,t){
  switch(t.kind){
   case "payday":this.pay(p,p.salary);p.paydays++;this.logEvent(p.name+" collects a $"+p.salary.toLocaleString()+" payday.");break;
   case "career":this.offer("career");break;
   case "home":this.offer("home");break;
   case "family":this.offer("family");break;
   case "fork":this.offer("fork");break;
   case "choice":this.offer("choice");break;
   case "invest":this.offer("invest");break;
   case "tax":{const fee=Math.max(5000,Math.round(p.salary*.13));this.charge(p,fee);this.logEvent(p.name+" pays $"+fee.toLocaleString()+" in taxes.");break}
   case "event":this.applyCard(p,"event");break;
   case "expense":this.applyCard(p,"expense");break;
   case "retire":this.offer("retire");break;
  }
 }
 spin(){
  if(this.finished||this.pending||this.player().retired)return null;
  const p=this.player(),roll=1+Math.floor(this.rng()*10),from=p.pos,to=Math.min(PATH.length-1,from+roll);
  this.lastSpin=roll;p.pos=to;this.logEvent(p.name+" spins "+roll+" and moves to "+PATH[to].name+".");
  for(let i=from+1;i<to;i++)if(PATH[i].kind==="payday"){this.pay(p,p.salary);p.paydays++;this.logEvent(p.name+" passes Payday and collects $"+p.salary.toLocaleString()+".")}
  this.applyTile(p,PATH[to]);if(!this.pending)this.finishTurn();return roll;
 }
 finishTurn(){
  if(this.pending)return;
  if(this.players.every(p=>p.retired)){this.finished=true;this.logEvent("Everyone has retired. Count your fortune!");return}
  const previous=this.current;for(let n=0;n<this.players.length;n++){
   this.current=(this.current+1)%this.players.length;
   if(!this.players[this.current].retired)break;
  }
  if(this.current<=previous)this.round++;
  if(this.player().career==="Unchosen")this.offer("path");
 }
 results(){return [...this.players].map(p=>({name:p.name,netWorth:this.netWorth(p),cash:p.cash,property:p.house,investments:p.investments,debt:p.debt,kids:p.kids,happiness:p.happiness})).sort((a,b)=>b.netWorth-a.netWorth)}
 snapshot(){return JSON.parse(JSON.stringify({version:2,players:this.players,current:this.current,round:this.round,finished:this.finished,lastSpin:this.lastSpin,pending:this.pending,log:this.log}))}
 restore(raw){
  if(!raw||raw.version!==2||!Array.isArray(raw.players)||raw.players.length<2||raw.players.length>4)return false;
  const fields=["pos","cash","debt","salary","house","investments","kids","happiness","paydays"];
  if(!raw.players.every(p=>p&&typeof p.name==="string"&&p.name.length<=24&&fields.every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1e9)&&(p.pos|0)===p.pos&&p.pos<PATH.length&&typeof p.career==="string"&&typeof p.retired==="boolean"&&typeof p.degree==="boolean"&&Array.isArray(p.history)&&p.history.length<=90))return false;
  if(!Number.isInteger(raw.current)||raw.current<0||raw.current>=raw.players.length||typeof raw.finished!=="boolean"||!Number.isInteger(raw.round)||raw.round<0||raw.round>10000||!Array.isArray(raw.log)||raw.log.length>28)return false;
  if(raw.pending&&(!["path","career","home","invest","fork","choice","family","retire"].includes(raw.pending.kind)||raw.pending.player!==raw.current))return false;
  if(raw.finished&&(!raw.players.every(p=>p.retired)||raw.pending))return false;
  this.players=JSON.parse(JSON.stringify(raw.players));
  this.current=raw.current;this.round=raw.round;this.finished=raw.finished;
  this.pending=raw.pending||null;this.lastSpin=Number(raw.lastSpin)||0;
  this.log=raw.log.filter(x=>typeof x==="string").map(x=>x.slice(0,300));
  return true;
 }
}
root.RoadsOfCinder={RoadsGame,PATH,SALARIES,money};
})(typeof window!=="undefined"?window:globalThis);
