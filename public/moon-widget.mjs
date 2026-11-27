import { phases, phaseIndex } from './lunar-phases.mjs';

let engine;
export function loadAstronomy() {
  if (!engine) {
    engine = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/astronomy-engine-2.1.19.min.js';
      script.onload = () => window.Astronomy ? resolve(window.Astronomy) : reject(new Error('Lunar engine unavailable.'));
      script.onerror = () => {
        script.remove();
        reject(new Error('Lunar engine unavailable.'));
      };
      document.head.append(script);
    }).catch(error => {
      engine = undefined;
      throw error;
    });
  }
  return engine;
}

export function mountMoonStrip(link) {
  const disks = phases.map(({name, icon}) => {
    const disk = document.createElement('span');
    disk.className = 'kf-lunar-disk';
    disk.textContent = icon;
    disk.title = name;
    return disk;
  });
  const row = link.querySelector('.kf-lunar-disks');
  const label = link.querySelector('.kf-lunar-label');
  row.replaceChildren(...disks);
  let pending=false,lastRefresh=0,lastIndex=-1;
  async function refresh() {
    if(document.hidden||pending||Date.now()-lastRefresh<55_000)return;
    pending=true;lastRefresh=Date.now();
    try {
      const astronomy = await loadAstronomy();
      if(document.hidden){lastRefresh=0;return;}
      // The header only needs the phase sector, not illumination calculations.
      const index = phaseIndex(astronomy.MoonPhase(new Date()));
      if(index===lastIndex)return;
      lastIndex=index;
      disks.forEach((disk, i) => disk.classList.toggle('is-current', i === index));
      label.textContent = phases[index].name;
      link.setAttribute('aria-label', 'Moonology. Current Moon phase: ' + phases[index].name);
    } catch {
      lastIndex=-1;
      label.textContent = 'Moonology';
      link.setAttribute('aria-label', 'Moonology. Current Moon phase unavailable.');
    } finally {pending=false;}
  }
  // The header remains a usable Moonology link while the astronomy engine
  // loads after the critical first render. Hidden tabs do no lunar work.
  if(typeof window.requestIdleCallback==="function")window.requestIdleCallback(refresh,{timeout:2000});
  else setTimeout(refresh,300);
  const timer=setInterval(refresh,60_000);
  const resume=()=>{if(!document.hidden)void refresh();};
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('pagehide',event=>{
    if(!event.persisted){clearInterval(timer);document.removeEventListener('visibilitychange',resume);}
  });
}
