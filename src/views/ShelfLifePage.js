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
        <h1 style="font-size: 28px; margin-bottom: 4px;">⏳ Smart Shelf-Life Estimator</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Real-time prediction of remaining produce freshness based on cumulative temperature exposure.</p>
      </div>

      <!-- Main Shelf Life Card -->
      <div class="card" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: white; border-radius: var(--radius-lg); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 54px;">${crop.icon}</span>
            <div>
              <h2 style="font-size: 28px; color: #FFFFFF;">${crop.name.toUpperCase()}</h2>
              <span style="color: #94A3B8; font-size: 14px;">Stored: ${state.produceWeightKg} kg | Stored Since: 02 Sep 2026</span>
            </div>
          </div>
          
          <span class="data-honesty-badge estimated" style="font-size: 12px; padding: 6px 14px;">
            ℹ️ Smart Q10 Temperature-Quality Model
          </span>
        </div>

        <!-- Big Countdown Number -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 13px; color: #94A3B8; font-weight: 800; letter-spacing: 1px;">ESTIMATED REMAINING SHELF LIFE</span>
          <div style="font-size: 64px; font-weight: 900; font-family: var(--font-display); color: #10B981; line-height: 1;">
            ${days} DAYS
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
            <span>Freshness Grade: <strong style="color: #10B981;">${quality}</strong></span>
            <span>${pctRemaining}% Viability Remaining</span>
          </div>
          <div style="width: 100%; height: 16px; background: #334155; border-radius: var(--radius-full); overflow: hidden; position: relative;">
            <div style="width: ${pctRemaining}%; height: 100%; background: linear-gradient(90deg, #10B981, #34D399); border-radius: var(--radius-full);"></div>
          </div>
        </div>

        <!-- Exposure Factor Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 10px;">
          
          <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700;">TEMP EXPOSURE</span>
            <div style="font-size: 18px; font-weight: 800; color: white; margin-top: 4px;">${factors.tempExposure}</div>
            <span style="font-size: 11px; color: #94A3B8;">Mean: ${state.temperature.toFixed(1)}°C</span>
          </div>

          <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700;">HUMIDITY STATUS</span>
            <div style="font-size: 18px; font-weight: 800; color: white; margin-top: 4px;">${factors.humidityStatus}</div>
            <span style="font-size: 11px; color: #94A3B8;">Target RH: ${crop.humidityTarget}%</span>
          </div>

          <div style="background: rgba(255,255,255,0.06); padding: 16px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700;">STORAGE QUALITY</span>
            <div style="font-size: 18px; font-weight: 800; color: #10B981; margin-top: 4px;">${factors.qualityGrade}</div>
            <span style="font-size: 11px; color: #94A3B8;">Zero Chilling Injury</span>
          </div>

        </div>

        <div style="font-size: 12px; color: #94A3B8; background: rgba(0,0,0,0.3); padding: 12px; border-radius: var(--radius-sm); border: 1px dashed rgba(255,255,255,0.2);">
          ℹ️ <strong>Technical Model Basis:</strong> Prototype uses a Q10 temperature-quality model. Biological respiration rates scale exponentially with temperature excursions above optimal profile setting.
        </div>

      </div>

    </div>
  `;
}
