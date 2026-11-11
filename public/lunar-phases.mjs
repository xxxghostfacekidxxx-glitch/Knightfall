export const phases = [
  { name: 'New Moon', icon: '🌑', theme: 'Begin', prompt: 'What would I begin if it only needed one small first step?' },
  { name: 'Waxing Crescent', icon: '🌒', theme: 'Build momentum', prompt: 'What can I do today to make an intention easier to keep?' },
  { name: 'First Quarter', icon: '🌓', theme: 'Choose', prompt: 'Which decision have I been putting off, and what would help me make it?' },
  { name: 'Waxing Gibbous', icon: '🌔', theme: 'Refine', prompt: 'What is already working, and what small adjustment would improve it?' },
  { name: 'Full Moon', icon: '🌕', theme: 'Take stock', prompt: 'What can I see clearly now that I missed at the start of this cycle?' },
  { name: 'Waning Gibbous', icon: '🌖', theme: 'Share', prompt: 'What have I learned that I want to carry forward or share?' },
  { name: 'Last Quarter', icon: '🌗', theme: 'Release', prompt: 'What can I stop carrying, and what would make that possible?' },
  { name: 'Waning Crescent', icon: '🌘', theme: 'Rest', prompt: 'What kind of rest would help me feel ready to begin again?' }
];

// The eight display phases are sectors centered on 0°, 45°, … 315°.
export function phaseIndex(angle) {
  return Math.floor((angle + 22.5) / 45) % phases.length;
}

export function lunarSnapshot(astronomy, time) {
  return {
    index: phaseIndex(astronomy.MoonPhase(time)),
    illumination: astronomy.Illumination(astronomy.Body.Moon, time).phase_fraction
  };
}
