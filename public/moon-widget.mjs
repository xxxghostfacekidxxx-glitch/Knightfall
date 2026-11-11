import { phases, lunarSnapshot } from './lunar-phases.mjs';

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
  async function refresh() {
    try {
      const astronomy = await loadAstronomy();
      const {index} = lunarSnapshot(astronomy, new Date());
      disks.forEach((disk, i) => disk.classList.toggle('is-current', i === index));
      label.textContent = phases[index].name;
      link.setAttribute('aria-label', 'Moonology. Current Moon phase: ' + phases[index].name);
    } catch {
      label.textContent = 'Moonology';
      link.setAttribute('aria-label', 'Moonology. Current Moon phase unavailable.');
    }
  }
  refresh();
  setInterval(refresh, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
}
