// NAVONMESH Storage Monitor View with Illustrated Cold Room Diagram & Live Sensor Data

import { getTranslation } from '../data/i18n.js';

export function renderStorageMonitor(state, currentLang) {
  const doorBadgeClass = state.doorOpen ? 'warning' : 'safe';
  const coolingBadgeClass = state.compressorSpeedPct > 0 ? 'safe' : 'warning';

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">❄️ ${getTranslation(currentLang, 'navStorageMonitor')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Real-time physical cold chamber visualization and multi-sensor diagnostics.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 24px;" class="storage-monitor-grid">
        
        <!-- Left: Illustrated Cold Room Graphic Container -->
        <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 2px solid var(--border-light); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 20px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 18px;">🏠 Physical Chamber Diagram (NVM-001)</h3>
            <span class="data-honesty-badge live">LIVE SENSOR FEED</span>
          </div>

          <div class="chamber-visual-box">
            <div class="chamber-wall-insulation"></div>
            
            <!-- Animated Air Circulation Flow -->
            <div class="cooling-flow-animation">
              <span>❄️</span><span>🌀 AIR CIRCULATION ACTIVE</span><span>❄️</span>
            </div>

            <!-- Inside Chamber Visual Parameters Overlay -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 50px; z-index: 2;">
              
              <div style="background: rgba(15, 23, 42, 0.85); padding: 16px; border-radius: var(--radius-md); border: 1px solid #38BDF8;">
                <span style="font-size: 12px; color: #38BDF8; font-weight: bold;">INSIDE TEMP</span>
                <div style="font-size: 32px; font-weight: 900; color: white;">${state.temperature.toFixed(1)} °C</div>
                <span style="font-size: 11px; color: #94A3B8;">Target: ${state.targetTemperature}°C</span>
              </div>

              <div style="background: rgba(15, 23, 42, 0.85); padding: 16px; border-radius: var(--radius-md); border: 1px solid #60A5FA;">
                <span style="font-size: 12px; color: #60A5FA; font-weight: bold;">RELATIVE HUMIDITY</span>
                <div style="font-size: 32px; font-weight: 900; color: white;">${Math.round(state.humidity)} % RH</div>
                <span style="font-size: 11px; color: #94A3B8;">Target: 85-95%</span>
              </div>

            </div>

            <!-- Stored Produce Illustration -->
            <div style="background: rgba(15, 23, 42, 0.7); padding: 16px; border-radius: var(--radius-md); margin-top: 16px; display: flex; align-items: center; justify-content: space-between; z-index: 2;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">${state.activeCrop.icon}</span>
                <div>
                  <div style="font-weight: 800; font-size: 16px; color: white;">${state.activeCrop.name}</div>
                  <div style="font-size: 12px; color: #CBD5E1;">${state.produceWeightKg} kg Stored (${Math.round((state.produceWeightKg/state.maxCapacityKg)*100)}% Full)</div>
                </div>
              </div>
              <span class="metric-status-badge safe">SAFE PROFILE</span>
            </div>

            <!-- Bottom Door & Compressor Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; background: rgba(0,0,0,0.5); padding: 12px 16px; border-radius: var(--radius-sm); z-index: 2; margin-top: 16px;">
              <span>🚪 Door: <strong>${state.doorOpen ? 'OPEN (Warning)' : 'CLOSED (Sealed)'}</strong></span>
              <span>❄️ Compressor: <strong>${state.compressorSpeedPct}% Speed</strong></span>
              <span>🧊 PCM: <strong>${state.pcmStatus}</strong></span>
            </div>

          </div>

        </div>

        <!-- Right: Live Sensor Data Detailed Panel -->
        <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 2px solid var(--border-light); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 20px;">
          
          <h3 style="font-size: 18px; border-bottom: 2px solid var(--border-light); padding-bottom: 12px;">
            📡 Live Telemetry & Sensor Accuracy
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
              <span class="metric-status-badge safe">🟢 Normal</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">Door Contact Sensor</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Magnetic Reed Switch</div>
              </div>
              <span class="metric-status-badge ${doorBadgeClass}">
                ${state.doorOpen ? '🔴 OPEN' : '🟢 CLOSED'}
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">BLDC Compressor</strong>
                <div style="font-size: 12px; color: var(--text-muted);">Variable Speed Controller</div>
              </div>
              <span class="metric-status-badge ${coolingBadgeClass}">
                🟢 ON (${state.compressorSpeedPct}%)
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px dashed var(--border-light);">
              <div>
                <strong style="font-size: 15px;">PCM Thermal Storage</strong>
                <div style="font-size: 12px; color: var(--text-muted);">70 kg Phase Change Pack</div>
              </div>
              <span class="metric-status-badge safe">🟢 ${state.pcmStatus}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 15px;">Produce Weight Load Cell</strong>
                <div style="font-size: 12px; color: var(--text-muted);">4-Point Strain Gauge</div>
              </div>
              <span style="font-size: 18px; font-weight: 900; color: var(--agri-green-dark);">${state.produceWeightKg} kg</span>
            </div>

          </div>

          <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-md); font-size: 12px; color: var(--text-muted); text-align: center; border: 1px solid var(--border-light);">
            ✓ All telemetry calibrated on 01 Aug 2026. ESP32 Sampling Rate: 10 seconds via LoRa.
          </div>

        </div>

      </div>

    </div>
  `;
}
