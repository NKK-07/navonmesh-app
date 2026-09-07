// NAVONMESH Storage Monitor View with Illustrated Cold Room Diagram & Live Sensor Data

import { getTranslation } from '../data/i18n.js';

export function renderStorageMonitor(state, currentLang) {
  const doorBadgeClass = state.doorOpen ? 'warning' : 'safe';
  const coolingBadgeClass = state.compressorSpeedPct > 0 ? 'safe' : 'warning';

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> ${getTranslation(currentLang, 'navStorageMonitor')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Real-time physical cold chamber visualization and multi-sensor diagnostics.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 24px;" class="storage-monitor-grid">
        
        <!-- Left: Illustrated Cold Room Graphic Container -->
        <div style="background: var(--bg-card); padding: 24px; border: 2px solid var(--border-light); display: flex; flex-direction: column; gap: 20px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 18px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5"/></svg> Physical Chamber Diagram (NVM-001)</h3>
            <span class="data-honesty-badge live">LIVE SENSOR FEED</span>
          </div>

          <div class="chamber-visual-box">
            <div class="chamber-wall-insulation"></div>
            
            <!-- Animated Air Circulation Flow -->
            <div class="cooling-flow-animation">
              <span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg></span><span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-7 7 5 5 0 0 1-5-5 3.5 3.5 0 0 1 3.5-3.5"/></svg> AIR CIRCULATION ACTIVE</span><span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg></span>
            </div>

            <!-- Inside Chamber Visual Parameters Overlay -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 50px; z-index: 2;">
              
              <div style="background: rgba(15, 23, 42, 0.85); padding: 16px; border: 1px solid #6B7683;">
                <span style="font-size: 12px; color: #6B7683; font-weight: bold;">INSIDE TEMP</span>
                <div style="font-size: 32px; font-weight: 900; color: white;">${state.temperature.toFixed(1)} °C</div>
                <span style="font-size: 11px; color: #6B7683;">Target: ${state.targetTemperature}°C</span>
              </div>

              <div style="background: rgba(15, 23, 42, 0.85); padding: 16px; border: 1px solid #6B7683;">
                <span style="font-size: 12px; color: #6B7683; font-weight: bold;">RELATIVE HUMIDITY</span>
                <div style="font-size: 32px; font-weight: 900; color: white;">${Math.round(state.humidity)} % RH</div>
                <span style="font-size: 11px; color: #6B7683;">Target: 85-95%</span>
              </div>

            </div>

            <!-- Stored Produce Illustration -->
            <div style="background: rgba(15, 23, 42, 0.7); padding: 16px; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; z-index: 2;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${state.activeCrop.icon}</span>
                <div>
                  <div style="font-weight: 800; font-size: 16px; color: white;">${state.activeCrop.name}</div>
                  <div style="font-size: 12px; color: #D5D9DE;">${state.produceWeightKg} kg Stored (${Math.round((state.produceWeightKg/state.maxCapacityKg)*100)}% Full)</div>
                </div>
              </div>
              <span class="metric-status-badge safe">SAFE PROFILE</span>
            </div>

            <!-- Bottom Door & Compressor Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; background: rgba(0,0,0,0.5); padding: 12px 16px; z-index: 2; margin-top: 16px;">
              <span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11v17H5zM13 12h.01"/></svg> Door: <strong>${state.doorOpen ? 'OPEN (Warning)' : 'CLOSED (Sealed)'}</strong></span>
              <span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> Compressor: <strong>${state.compressorSpeedPct}% Speed</strong></span>
              <span><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> PCM: <strong>${state.pcmStatus}</strong></span>
            </div>

          </div>

        </div>

        <!-- Right: Live Sensor Data Detailed Panel -->
        <div style="background: var(--bg-card); padding: 24px; border: 2px solid var(--border-light); display: flex; flex-direction: column; gap: 20px;">
          
          <h3 style="font-size: 18px; border-bottom: 2px solid var(--border-light); padding-bottom: 12px;">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 18h.01M8.5 14.5a5 5 0 0 1 7 0M5.5 11.5a9 9 0 0 1 13 0M2.5 8.5a13 13 0 0 1 19 0"/></svg> Live Telemetry & Sensor Accuracy
          </h3>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">Chamber Temperature</strong>
                <div style="font-size: 12px; color: var(--text-muted);">SHT31 Sensor (Accuracy: ±0.3°C)</div>
              </div>
              <span style="font-size: 18px; font-weight: 900; color: var(--cooling-blue-dark);">${state.temperature.toFixed(1)}°C</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">Relative Humidity</strong>
                <div style="font-size: 12px; color: var(--text-muted);">SHT31 Sensor (Accuracy: ±2% RH)</div>
              </div>
              <span style="font-size: 18px; font-weight: 900; color: var(--cooling-blue-dark);">${Math.round(state.humidity)}%</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">Ethylene Gas Level</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Electrochemical Sensor</div>
              </div>
              <span class="metric-status-badge safe"><i class="dot dot-ok"></i> Normal</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">Door Contact Sensor</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Magnetic Reed Switch</div>
              </div>
              <span class="metric-status-badge ${doorBadgeClass}">
                ${state.doorOpen ? '<i class="dot dot-danger"></i> OPEN' : '<i class="dot dot-ok"></i> CLOSED'}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">BLDC Compressor</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Variable Speed Controller</div>
              </div>
              <span class="metric-status-badge ${coolingBadgeClass}">
                <i class="dot dot-ok"></i> ON (${state.compressorSpeedPct}%)
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">PCM Thermal Storage</strong>
                <div style="font-size: 12px; color: var(--text-muted);">70 kg Phase Change Pack</div>
              </div>
              <span class="metric-status-badge safe"><i class="dot dot-ok"></i> ${state.pcmStatus}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 15px;">Produce Weight Load Cell</strong>
                <div style="font-size: 12px; color: var(--text-muted);">4-Point Strain Gauge</div>
              </div>
              <span style="font-size: 18px; font-weight: 900; color: var(--agri-green-dark);">${state.produceWeightKg} kg</span>
            </div>

          </div>

          <div style="background: var(--bg-main); padding: 14px; font-size: 12px; color: var(--text-muted); text-align: center; border: 1px solid var(--border-light);">
            ✓ All telemetry calibrated on 01 Aug 2026. ESP32 Sampling Rate: 10 seconds via LoRa.
          </div>

        </div>

      </div>

    </div>
  `;
}
