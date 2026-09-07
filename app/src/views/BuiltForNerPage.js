// NAVONMESH "Built for NER" Regional Solution View

import { getTranslation } from '../data/i18n.js';

export function renderBuiltForNerPage(currentLang) {
  const challenges = [
    {
      icon: '☁️',
      challenge: 'LOW SOLAR AVAILABILITY',
      stat: '3–5 kWh / m² / day',
      desc: 'Heavy monsoon rainfall and dense cloud cover in hilly NER terrain reduce peak solar hours.',
      solution: 'Hybrid LiFePO4 Battery + Phase Change Material (PCM) thermal storage ensures 24/7 continuous cooling regardless of weather.'
    },
    {
      icon: '🌧️',
      challenge: 'HIGH AMBIENT HUMIDITY',
      stat: '70–90% RH Ambient',
      desc: 'Extreme humidity causes condensation, mold growth, and rapid rot in traditional sheds.',
      solution: '100mm PUF hermetic chamber insulation with automated SHT31 humidity management preserves crispness without mold.'
    },
    {
      icon: '⛰️',
      challenge: 'MOUNTAIN TERRAIN & ISOLATION',
      stat: 'Remote Village Clusters',
      desc: 'Hilly roads cause severe post-harvest transit delays to Assam and main market hubs.',
      solution: 'Modular 200kg mini cold room size designed for easy pickup-truck transport to high-altitude village collection centres.'
    },
    {
      icon: '⚡',
      challenge: 'UNRELIABLE POWER GRID',
      stat: 'Frequent Power Blackouts',
      desc: 'Rural NER villages suffer extended grid outages lasting days or weeks.',
      solution: '100% Off-grid solar-powered design with LoRa radio and SMS fallback requiring zero grid electricity or internet.'
    }
  ];

  const cardsHtml = challenges.map(c => `
    <div class="card" style="border: 2px solid var(--border-light); display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 36px;">${c.icon}</span>
        <span class="data-honesty-badge live">${c.stat}</span>
      </div>
      <h3 style="font-size: 18px; color: var(--text-dark);">${c.challenge}</h3>
      <p style="font-size: 13px; color: #DC2626; font-weight: 600;">⚠️ Regional Challenge: ${c.desc}</p>
      
      <div style="background: #ECFDF5; border: 1px solid #10B981; padding: 12px; border-radius: var(--radius-sm); font-size: 13px; color: #047857; font-weight: 600;">
        💡 <strong>NAVONMESH Response:</strong> ${c.solution}
      </div>
    </div>
  `).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">🌄 ${getTranslation(currentLang, 'navBuiltForNer')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Engineering solutions tailored specifically for North Eastern Region (NER) climate & geography.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        ${cardsHtml}
      </div>

    </div>
  `;
}
