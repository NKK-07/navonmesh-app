// NAVONMESH Impact & Economic Savings View

import { getTranslation } from '../data/i18n.js';

export function renderImpactPage(currentLang) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; margin-bottom: 4px;">📈 ${getTranslation(currentLang, 'navImpact')}</h1>
          <p style="color: var(--text-muted); font-size: 15px;">Economic revenue protection and food loss reduction metrics for NER farmers.</p>
        </div>

        <span class="data-honesty-badge simulated" style="font-size: 12px; padding: 6px 14px;">
          ⚠️ Demo / Simulated Data Calculation
        </span>
      </div>

      <!-- 5 Impact Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">🥬 PRODUCE SAVED</span>
          <div style="font-size: 36px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">1,240 kg</div>
          <span style="font-size: 12px; color: var(--text-muted);">Prevented post-harvest decay</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">💰 FARMER VALUE PROTECTED</span>
          <div style="font-size: 36px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">₹48,000</div>
          <span style="font-size: 12px; color: var(--agri-green-dark); font-weight: bold;">+35% Income Retention</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">♻️ FOOD WASTE AVOIDED</span>
          <div style="font-size: 36px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">320 kg</div>
          <span style="font-size: 12px; color: var(--text-muted);">Zero spoilage in transit</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">☀️ RENEWABLE ENERGY USED</span>
          <div style="font-size: 36px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">82%</div>
          <span style="font-size: 12px; color: var(--text-muted);">Clean solar power fraction</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">⏳ ADDITIONAL STORAGE TIME</span>
          <div style="font-size: 36px; font-weight: 900; color: var(--pcm-purple); margin-top: 4px;">+12 Days</div>
          <span style="font-size: 12px; color: var(--text-muted);">Market price negotiation window</span>
        </div>
      </div>

    </div>
  `;
}
