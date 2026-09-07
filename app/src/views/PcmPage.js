// NAVONMESH PCM Thermal Backup Storage Monitor View
// Phase Change Material 70kg thermal storage buffer details

import { getTranslation } from '../data/i18n.js';

export function renderPcmPage(state, currentLang) {
  const isPcmActive = state.pcmStatus === 'ACTIVE' || state.batterySoc < 30;

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> Phase Change Material (PCM) Thermal Backup</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Zero-electricity thermal storage keeping your cold chamber cool even when battery power is depleted.</p>
      </div>

      <!-- Active PCM Banner if Battery low -->
      ${isPcmActive ? `
        <div style="background: var(--pcm-purple-light); border: 2px solid var(--pcm-purple); padding: 20px; color: var(--pcm-purple); font-weight: 800; font-size: 16px; display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 36px;"><i class="dot dot-mute"></i></span>
          <div>
            <div style="font-size: 20px;">PCM MODE ACTIVE</div>
            <div>Battery protected. Cold storage cooling is currently maintained using Phase Change thermal energy storage.</div>
          </div>
        </div>
      ` : ''}

      <!-- PCM Metrics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">PCM STATUS</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--pcm-purple); margin-top: 4px;">${state.pcmStatus}</div>
          <span class="metric-status-badge safe" style="font-size: 11px;">70 kg Prototype Design</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">ESTIMATED BACKUP HOURS</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">${state.pcmEstimatedHours} HOURS</div>
          <span style="font-size: 11px; color: var(--text-muted);">Zero Power Holdover</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">PCM CORE TEMP</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">${state.pcmTemperature}°C</div>
          <span style="font-size: 11px; color: var(--text-muted);">Eutectic Freezing Point</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">THERMAL CHARGE LEVEL</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">${state.pcmChargePct}%</div>
          <span style="font-size: 11px; color: var(--text-muted);">Fully Charged during Peak Solar</span>
        </div>
      </div>

      <!-- PCM Diagram Illustration Card -->
      <div class="card" style="display: flex; flex-direction: column; gap: 20px;">
        <h3 style="font-size: 18px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> How Phase Change Material (PCM) Thermal Storage Works</h3>

        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;" class="pcm-grid-diagram">
          <div style="background: #231F1C; padding: 24px; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 16px;">
            <div style="font-size: 64px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> ➔ <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2-5.3 5.5-9.3Z"/></svg></div>
            <h4 style="font-size: 20px; color: #8C7F73;">Latent Heat Absorption</h4>
            <p style="font-size: 14px; color: #E5DDD2; max-width: 450px;">
              During peak sunny hours, surplus solar power freezes the 70kg inorganic salt-hydrate PCM eutectic pack at 0°C.
              When solar & battery power drop at night or during heavy monsoon rain, the PCM absorbs heat from the cold room as it slowly melts, keeping vegetables at 8°C for over 8 hours without compressor electricity.
            </p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; justify-content: center;">
            <div style="background: var(--bg-main); padding: 16px; border: 1px solid var(--border-light);">
              <strong><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg> Daytime Solar Charging:</strong> Excess solar electricity runs compressor to freeze PCM pack.
            </div>
            <div style="background: var(--bg-main); padding: 16px; border: 1px solid var(--border-light);">
              <strong><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg> Nighttime Passive Cooling:</strong> PCM melts slowly, maintaining cold chamber temperature.
            </div>
            <div style="background: var(--bg-main); padding: 16px; border: 1px solid var(--border-light);">
              <strong><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 19h19L15 7l-4 6.5L8.5 10z"/></svg> NER Off-Grid Resilience:</strong> Eliminates diesel generator requirement during grid blackouts.
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}
