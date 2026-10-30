(()=>{'use strict';
 const main=document.querySelector('main');
 if(!main||document.querySelector('.cabinet-view-controls')||!main.requestFullscreen)return;
 const bar=document.createElement('div');bar.className='cabinet-view-controls';
 const button=document.createElement('button');button.type='button';button.textContent='Fullscreen';
 button.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await main.requestFullscreen()}catch{button.textContent='Fullscreen unavailable'}});
 document.addEventListener('fullscreenchange',()=>{button.textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen'});
 bar.append(button);const heading=main.querySelector('h1');if(heading)heading.after(bar);else main.prepend(bar);
})();
