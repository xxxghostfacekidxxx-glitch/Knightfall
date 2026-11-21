/* Knightfall original Web Audio metronome. No samples, network, tracking or autoplay. */
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const slider=$("kf-rhythm-speed"),value=$("kf-rhythm-bpm"),toggle=$("kf-rhythm-toggle");
 const tap=$("kf-rhythm-tap"),reset=$("kf-rhythm-reset"),status=$("kf-rhythm-status");
 if(!slider||!value||!toggle||!tap||!reset||!status)return;
 const clamp=n=>Math.max(50,Math.min(220,Math.round(Number(n)||120)));
 let bpm=clamp(slider.value),audio=null,playing=false,timer=null,nextBeat=0,beat=0,taps=[];
 const report=message=>{status.textContent=message};
 const update=number=>{bpm=clamp(number);slider.value=String(bpm);value.textContent=String(bpm)};
 const stop=()=>{
  if(timer!==null){clearInterval(timer);timer=null}
  playing=false;toggle.setAttribute("aria-pressed","false");toggle.textContent="Start metronome";
 };
 function strike(time,strong){
  const osc=audio.createOscillator(),gain=audio.createGain();
  osc.type="sine";osc.frequency.setValueAtTime(strong?980:690,time);
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(strong?.19:.11,time+.005);
  gain.gain.exponentialRampToValueAtTime(.0001,time+.07);
  osc.connect(gain);gain.connect(audio.destination);osc.start(time);osc.stop(time+.075);
 }
 function schedule(){
  if(!playing||!audio)return;
  const horizon=audio.currentTime+.12;
  let safety=0;
  while(nextBeat<horizon&&safety++<8){
   strike(nextBeat,beat%4===0);
   nextBeat+=60/bpm;
   beat++;
  }
 }
 toggle.addEventListener("click",async()=>{
  if(playing){stop();report("Metronome stopped.");return}
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){report("Your browser does not support Web Audio. Tap tempo still works.");return}
  try{
   if(!audio)audio=new Audio();
   if(audio.state!=="running")await audio.resume();
   playing=true;beat=0;nextBeat=audio.currentTime+.06;
   toggle.setAttribute("aria-pressed","true");toggle.textContent="Stop metronome";
   schedule();timer=setInterval(schedule,25);
   report("Playing "+bpm+" BPM. Every fourth beat is accented.");
  }catch{stop();report("Audio couldn't start. Check your browser's sound permissions.")}
 });
 slider.addEventListener("input",()=>{
  update(slider.value);
  if(playing)report("Playing "+bpm+" BPM.");
 });
 tap.addEventListener("click",()=>{
  const now=performance.now();
  if(taps.length&&now-taps[taps.length-1]>2000)taps=[];
  taps.push(now);if(taps.length>7)taps.shift();
  if(taps.length<2){report("Tap again in time with the beat.");return}
  const diffs=taps.slice(1).map((n,i)=>n-taps[i]).filter(n=>n>=250&&n<=1200);
  if(!diffs.length){report("Keep tapping at a steady pace.");return}
  const average=diffs.reduce((a,b)=>a+b,0)/diffs.length;
  update(60000/average);
  report((playing?"Playing at ":"Tempo set to ")+bpm+" BPM from your taps.");
 });
 reset.addEventListener("click",()=>{stop();taps=[];update(120);report("Reset to 120 BPM. Silent until you press Start.")});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing){stop();report("Paused because the tab is hidden.")}});
 window.addEventListener("pagehide",()=>{stop();if(audio){audio.close().catch(()=>{});audio=null}});
 update(bpm);
})();
