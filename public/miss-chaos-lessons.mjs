// Browser-only tutorial progress. No account data, uploads or server writes.
const lessons={
 "Visual Lab":{url:"/chaos-visual-lab.html",steps:["Open Visual Lab.","Choose an image from your device.","Select one edit, preview it, then export."],task:"Create and export a 64 × 64 pixel icon.",check:"Open the PNG and confirm its dimensions."},
 "Code Studio":{url:"/chaos-code-studio.html",steps:["Open Code Studio.","Paste a small code or JSON sample.","Inspect or format it, then review the output."],task:"Validate a JSON object with a name and color.",check:"Confirm the editor reports valid JSON."},
 "Chaos Forge":{url:"/chaos-forge.html",steps:["Open Chaos Forge.","Choose a simple craft pattern.","Enter real measurements and check estimates."],task:"Draft a small rectangular pouch.",check:"Check the width, height and seam allowance of each piece."},
 "Textract":{url:"/chaos-textract.html",steps:["Open Textract.","Select a supported document you can use.","Extract text, correct mistakes, then copy."],task:"Extract text from a short document.",check:"Compare the first and last sentence with the original."},
 "The Crucible":{url:"/chaos-crucible.html",steps:["Open The Crucible.","Describe a small creative project.","Review its project brief and first task."],task:"Write a three-sentence project brief.",check:"Include the goal, materials and first action."},
 "Production Lab":{url:"/devil-tools.html#foundry-catalog",steps:["Open Creator Foundry.","Find the Production Lab tools.","Make a small test asset and export it."],task:"Create and export a tiny sprite.",check:"Open the asset and check dimensions and transparency."}
};
const $=id=>document.getElementById(id);
const picker=$("mc-lesson-tool");
if(picker){
 const key="knightfall:foundry-tutorial:v1";
 let progress={};
 try{const value=JSON.parse(localStorage.getItem(key)||"{}");if(value&&typeof value==="object"&&!Array.isArray(value))progress=value;}catch{}
 const getStep=name=>Number.isInteger(progress[name])&&progress[name]>=0&&progress[name]<=2?progress[name]:0;
 function render(){
  const name=picker.value,lesson=lessons[name],step=getStep(name);
  $("mc-lesson-heading").textContent=name+" · Step "+(step+1)+" of 3";
  $("mc-lesson-instruction").textContent=lesson.steps[step];
  $("mc-lesson-exercise").textContent=step===2?"Practice: "+lesson.task:"";
  $("mc-lesson-check").textContent=step===2?"Check your work: "+lesson.check:"";
  $("mc-lesson-open").href=lesson.url;
  $("mc-lesson-back").disabled=step===0;
  $("mc-lesson-next").disabled=step===2;
  $("mc-lesson-status").textContent=step===2?"Practice is ready. Completion is self-checked; Miss Chaos has not inspected your file.":"Move forward when you have tried this step.";
 }
 function save(step){progress[picker.value]=step;try{localStorage.setItem(key,JSON.stringify(progress));}catch{}render();}
 picker.addEventListener("change",render);
 $("mc-lesson-back").addEventListener("click",()=>save(Math.max(0,getStep(picker.value)-1)));
 $("mc-lesson-next").addEventListener("click",()=>save(Math.min(2,getStep(picker.value)+1)));
 $("mc-lesson-reset").addEventListener("click",()=>save(0));
 render();
}
