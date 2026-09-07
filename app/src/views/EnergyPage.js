// NAVONMESH Energy & Solar Power View
// Animated Energy Flow Schematic & SOC Operating Mode Logic (Mode A-E)

import { getTranslation } from '../data/i18n.js';

export function renderEnergyPage(state, currentLang) {
  const mode = state.operatingMode;
  const soc = state.batterySoc;

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z"/></svg> ${getTranslation(currentLang, 'navEnergy')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Smart power management & hybrid solar-battery-PCM energy flow.</p>
      </div>

      <!-- Active Mode Prominent Display Card -->
      <div class="card" style="background: linear-gradient(135deg, #241F1B 0%, #231F1C 100%); color: white; padding: 28px; border-left: 8px solid var(--solar-yellow);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 12px; color: #8C7F73; font-weight: 800; letter-spacing: 1px;">CURRENT SYSTEM POWER MODE</span>
            <h2 style="font-size: 28px; color: var(--solar-yellow); margin-top: 4px;">${mode.modeTitle}</h2>
            <p style="color: #E5DDD2; font-size: 15px; margin-top: 4px;">${mode.modeDesc}</p>
          </div>

          <div style="text-align: right;">
            <span style="font-size: 12px; color: #8C7F73;">LiFePO4 SOC</span>
            <div style="font-size: 38px; font-weight: 900; color: #04785C;">${Math.round(soc)}%</div>
          </div>
        </div>
      </div>

      <!-- 5 Large Power Metrics Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg> SOLAR GENERATION</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">${state.solarPowerKw.toFixed(1)} kW</div>
          <span class="metric-status-badge safe" style="font-size: 11px;">MPPT Active</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg> BATTERY SOC</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">${Math.round(state.batterySoc)}%</div>
          <span style="font-size: 11px; color: var(--text-muted);">48V 100Ah LiFePO4</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z"/></svg> CURRENT LOAD</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--text-dark); margin-top: 4px;">${state.currentLoadKw.toFixed(1)} kW</div>
          <span style="font-size: 11px; color: var(--text-muted);">Total Chamber Draw</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v6M15 3v6M6.5 9h11v3a5.5 5.5 0 0 1-11 0zM12 17.5V21"/></svg> COMPRESSOR DRAW</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">${state.compressorWatts} W</div>
          <span style="font-size: 11px; color: var(--text-muted);">BLDC Variable Speed</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> PCM THERMAL BACKUP</span>
          <div style="font-size: 24px; font-weight: 900; color: var(--pcm-purple); margin-top: 6px;">${state.pcmStatus}</div>
          <span style="font-size: 11px; color: var(--text-muted);">${state.pcmEstimatedHours}h Thermal Reserve</span>
        </div>
      </div>

      <!-- Animated Energy Flow Diagram -->
      <div class="card">
        <h3 style="font-size: 18px; margin-bottom: 20px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z"/></svg> System Energy Flow Architecture</h3>
        
        <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 20px; text-align: center;">
          <div style="background: var(--solar-yellow-light); border: 2px solid var(--solar-yellow); padding: 16px 24px; width: 140px;">
            <div style="font-size: 32px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg></div>
            <strong style="font-size: 14px; color: var(--solar-yellow-dark);">SOLAR PV</strong>
            <div style="font-size: 12px;">${state.solarPowerKw.toFixed(1)} kW</div>
          </div>

          <div style="font-size: 24px; color: var(--solar-yellow);">➔</div>

          <div style="background: var(--bg-main); border: 2px solid var(--border-light); padding: 16px 24px; width: 130px;">
            <div style="font-size: 32px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z"/></svg></div>
            <strong style="font-size: 14px;">MPPT</strong>
            <div style="font-size: 12px;">98% Eff</div>
          </div>

          <div style="font-size: 24px; color: var(--agri-green);">➔</div>

          <div style="background: var(--agri-green-light); border: 2px solid var(--agri-green); padding: 16px 24px; width: 140px;">
            <div style="font-size: 32px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg></div>
            <strong style="font-size: 14px; color: var(--agri-green-dark);">BATTERY</strong>
            <div style="font-size: 12px;">${Math.round(state.batterySoc)}% SOC</div>
          </div>

          <div style="font-size: 24px; color: var(--cooling-blue);">➔</div>

          <div style="background: var(--cooling-blue-light); border: 2px solid var(--cooling-blue); padding: 16px 24px; width: 140px;">
            <div style="font-size: 32px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg></div>
            <strong style="font-size: 14px; color: var(--cooling-blue-dark);">COOLING</strong>
            <div style="font-size: 12px;">${state.compressorWatts} W</div>
          </div>
        </div>
      </div>

      <!-- SOC Logic Reference Table -->
      <div class="card">
        <h3 style="font-size: 18px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h9l4 4V20.5H6zM14.5 3.5V8h4.5M9 12h6M9 15.5h6"/></svg> Automated Battery SOC Mode Control Matrix</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: var(--bg-main); text-align: left;">
                <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">Battery SOC</th>
                <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">Operating Mode</th>
                <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">Power Source</th>
                <th style="padding: 12px; border-bottom: 2px solid var(--border-light);">PCM Thermal Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border-light); ${soc > 80 ? 'background: #E4EFE9; font-weight: bold;' : ''}">
                <td style="padding: 12px;">&gt; 80%</td>
                <td style="padding: 12px; color: var(--agri-green-dark);">MODE A — Full Solar</td>
                <td style="padding: 12px;">100% Solar Generation</td>
                <td style="padding: 12px;">Thermal Charge PCM</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-light); ${soc >= 50 && soc <= 80 ? 'background: #E4EFE9; font-weight: bold;' : ''}">
                <td style="padding: 12px;">50% – 80%</td>
                <td style="padding: 12px; color: var(--cooling-blue-dark);">MODE B — Solar + Battery</td>
                <td style="padding: 12px;">Solar PV + Battery Supplement</td>
                <td style="padding: 12px;">PCM Standby Reserve</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-light); ${soc >= 30 && soc < 50 ? 'background: #F8EEDF; font-weight: bold;' : ''}">
                <td style="padding: 12px;">30% – 50%</td>
                <td style="padding: 12px; color: var(--solar-yellow-dark);">MODE C — Battery Only</td>
                <td style="padding: 12px;">LiFePO4 Reserve</td>
                <td style="padding: 12px;">PCM Standby Reserve</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-light); ${soc >= 15 && soc < 30 ? 'background: #F1EBE3; font-weight: bold;' : ''}">
                <td style="padding: 12px;">15% – 30%</td>
                <td style="padding: 12px; color: var(--pcm-purple);">MODE D — PCM ONLY</td>
                <td style="padding: 12px;">Battery Off (Protect)</td>
                <td style="padding: 12px; color: var(--pcm-purple); font-weight: bold;">ACTIVE Thermal Discharge</td>
              </tr>
              <tr style="${soc < 15 ? 'background: #F6E4E0; font-weight: bold;' : ''}">
                <td style="padding: 12px;">&lt; 15%</td>
                <td style="padding: 12px; color: #A6321F;">MODE E — Emergency</td>
                <td style="padding: 12px;">Emergency Shutoff</td>
                <td style="padding: 12px;">LoRa / SMS Emergency Dispatch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
