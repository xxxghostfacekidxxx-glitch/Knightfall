import {generate,selectTopic} from "./miss-chaos-native-core.mjs";const $=id=>document.getElementById(id);let model,seq=0;try{const res=await fetch("/assets/knightfall/miss-chaos/native-model-v1.json",{credentials:"omit"});if(!res.ok)throw Error("checkpoint unavailable");model=await res.json();if(model.version!==1||model.hidden!==24||model.emb.length!==model.vocab.length*model.hidden||model.out.length!==model.emb.length||model.bias.length!==model.vocab.length||model.topic.length!==model.topics.length*model.hidden)throw Error("invalid checkpoint");$("mc-local-status").textContent="Original weights ready. Generation runs in this browser.";$("mc-local-generate").disabled=false;}catch{$("mc-local-status").textContent="Checkpoint unavailable. No external inference fallback.";} $("mc-local-generate").addEventListener("click",()=>{if(!model)return;const selected=$("mc-local-topic").value,topic=selected==="auto"?selectTopic($("mc-local-prompt").value):selected;$("mc-local-result").textContent=generate(model,{topic,seed:42+seq++});$("mc-local-status").textContent="Generated locally • topic: "+topic+" • no external inference";});
import {generate as generateV3,personas,topics} from "./miss-chaos-native-v3.mjs";
async function mountV3(){
 const status=$("mc-v3-status"),button=$("mc-v3-generate"),speaker=$("mc-v3-persona"),topic=$("mc-v3-topic"),output=$("mc-v3-result");
 if(!status||!button||!speaker||!topic||!output)return;
 for(const [select,values] of [[speaker,personas],[topic,topics]])values.forEach((name,i)=>{const o=document.createElement("option");o.value=String(i);o.textContent=name;select.append(o);});
 try{
  const res=await fetch("/assets/knightfall/miss-chaos/native-model-v3.json",{credentials:"omit"});if(!res.ok)throw Error("unavailable");
  const {model:m,metrics}=await res.json();
  if(m.version!==3||m.V!==97||m.H!==32||m.C!==8||m.P!==7||m.T!==8||m.alphabet?.length!==97)throw Error("invalid dimensions");
  for(const [key,size] of [["e",m.C*m.V*m.H],["persona",m.P*m.H],["topic",m.T*m.H],["o",m.V*m.H],["b",m.V]])if(!Array.isArray(m[key])||m[key].length!==size||!m[key].every(Number.isFinite))throw Error("invalid weights");
  status.textContent=metrics.parameters+" parameters · "+metrics.trainingRows+" training examples · "+metrics.heldoutRows+" held out · character loss "+metrics.before.loss.toFixed(3)+" → "+metrics.after.loss.toFixed(3);
  let seed=42;button.disabled=false;button.addEventListener("click",()=>{output.textContent=generateV3(m,{persona:Number(speaker.value),topic:Number(topic.value),seed:seed++})||"(end of sequence)";});
 }catch{status.textContent="Experiment 003 checkpoint unavailable or invalid. No external fallback.";button.disabled=true;}
}
mountV3();
