import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.ASSET_TEST_BASE||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 for(const vp of [{width:1280,height:800},{width:390,height:844}]){
  const page=await browser.newPage({viewport:vp});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/assets/devil-tools/neon-nuisances/manifest.json');
  const result=await page.evaluate(async base=>{
   const manifest=await(await fetch(base+'/assets/devil-tools/neon-nuisances/manifest.json')).json();
   const diagnostics=[],colors={};
   for(const id of ['bloop','nib']){
    const item=manifest.characters.find(c=>c.id===id);
    for(const [index,src] of [item.svg,...Object.values(item.variants)].entries()){
     const url=base+src+'?check='+manifest.version;
     const response=await fetch(url);if(!response.ok)throw Error('Missing '+url);
     const parsed=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
     if(parsed.querySelector('parsererror'))throw Error('Malformed SVG '+url);
     const img=new Image();img.src=url;await img.decode();
     if(!img.naturalWidth||!img.naturalHeight)throw Error('Missing SVG dimensions '+url);
     const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
     const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,128,128);
     const pixels=ctx.getImageData(0,0,128,128).data;let visible=0,checksum=0;
     for(let p=0;p<pixels.length;p+=4){if(pixels[p+3]>50)visible++;checksum=(checksum+(pixels[p]+pixels[p+1]*3+pixels[p+2]*7)*pixels[p+3])%1000000007}
     if(visible<1000)throw Error('Blank mascot art '+url+' pixels '+visible);
     diagnostics.push({name:item.name,pose:index,visible,checksum});
     if(index===0)colors[id]=checksum;
    }
   }
   return{diagnostics,colors};
  },base);
  assert.equal(result.diagnostics.length,10);
  assert.notEqual(result.colors.bloop,result.colors.nib,'Gillrot and Nocturnib should not be recolors');
  assert.deepEqual(errors,[]);
  console.log('PASS ten mascot SVG renders at',vp.width,'x',vp.height,result.diagnostics.map(x=>x.visible).join(','));
  await page.close();
 }
}finally{await browser.close()}
