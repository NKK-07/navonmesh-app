// NAVONMESH Smart Shelf-Life Estimator View ("HOW MANY DAYS LEFT?")
// Q10-based temperature-quality model

import { getTranslation } from '../data/i18n.js';

export function renderShelfLifePage(state, currentLang) {
  const crop = state.activeCrop;
  const days = state.shelfLifeDays;
  const quality = state.shelfLifeQuality;
  const factors = state.shelfLifeFactors;

  const pctRemaining = Math.min(100, Math.round((days / crop.shelfLifeDays) * 100));

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 7.5V12l3 2"/></svg> Smart Shelf-Life Estimator</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Real-time prediction of remaining produce freshness based on cumulative temperature exposure.</p>
      </div>

      <!-- Main Shelf Life Card -->
      <div class="card" style="background: linear-gradient(135deg, #1B2026 0%, #14181D 100%); color: white; padding: 32px; display: flex; flex-direction: column; gap: 24px;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 54px;">${crop.icon}</span>
            <div>
              <h2 style="font-size: 28px; color: #FFFFFF;">${crop.name.toUpperCase()}</h2>
              <span style="color: #6B7683; font-size: 14px;">Stored: ${state.produceWeightKg} kg | Stored Since: 02 Sep 2026</span>
            </div>
          </div>
          
          <span class="data-honesty-badge estimated" style="font-size: 12px; padding: 6px 14px;">
            ℹ️ Smart Q10 Temperature-Quality Model
          </span>
        </div>

        <!-- Big Countdown Number -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 13px; color: #6B7683; font-weight: 800; letter-spacing: 1px;">ESTIMATED REMAINING SHELF LIFE</span>
          <div style="font-size: 64px; font-weight: 900; font-family: var(--font-display); color: #047857; line-height: 1;">
            ${days} DAYS
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
            <span>Freshness Grade: <strong style="color: #047857;">${quality}</strong></span>
            <span>${pctRemaining}% Viability Remaining</span>
          </div>
          <div style="width: 100%; height: 16px; background: #2E3742; overflow: hidden; position: relative;">
            <div style="width: ${pctRemaining}%; height: 100%; background: linear-gradient(90deg, #047857, #047857);"></div>
          </div>
        </div>

        <!-- Exposure Factor Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 10px;">
          
          <div style="background: rgba(255,255,255,0.06); padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #6B7683; font-weight: 700;">TEMP EXPOSURE</span>
            <div style="font-size: 18px; font-weight: 800; color: white; margin-top: 4px;">${factors.tempExposure}</div>
            <span style="font-size: 11px; color: #6B7683;">Mean: ${state.temperature.toFixed(1)}°C</span>
          </div>

          <div style="background: rgba(255,255,255,0.06); padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #6B7683; font-weight: 700;">HUMIDITY STATUS</span>
            <div style="font-size: 18px; font-weight: 800; color: white; margin-top: 4px;">${factors.humidityStatus}</div>
            <span style="font-size: 11px; color: #6B7683;">Target RH: ${crop.humidityTarget}%</span>
          </div>

          <div style="background: rgba(255,255,255,0.06); padding: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #6B7683; font-weight: 700;">STORAGE QUALITY</span>
            <div style="font-size: 18px; font-weight: 800; color: #047857; margin-top: 4px;">${factors.qualityGrade}</div>
            <span style="font-size: 11px; color: #6B7683;">Zero Chilling Injury</span>
          </div>

        </div>

        <div style="font-size: 12px; color: #6B7683; background: rgba(0,0,0,0.3); padding: 12px; border: 1px dashed rgba(255,255,255,0.2);">
          ℹ️ <strong>Technical Model Basis:</strong> Prototype uses a Q10 temperature-quality model. Biological respiration rates scale exponentially with temperature excursions above optimal profile setting.
        </div>

      </div>

    </div>
  `;
}
