// NAVONMESH Technical Hardware Architecture ("How It Works") View

import { getTranslation } from '../data/i18n.js';

export function renderHowItWorksPage(currentLang) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">💡 ${getTranslation(currentLang, 'navHowItWorks')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Hardware & Embedded System Data Flow Architecture (SIH 2026 PS 26005).</p>
      </div>

      <!-- Main Animated System Schematic -->
      <div class="card" style="display: flex; flex-direction: column; gap: 24px;">
        <h3 style="font-size: 18px;">⚡ Hardware Flow Architecture Schematic</h3>

        <div style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
          
          <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; width: 100%;">
            
            <div style="background: #FFFBEB; border: 2px solid #F59E0B; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 140px;">
              <div style="font-size: 32px;">☀️</div>
              <strong style="color: #B45309;">SOLAR PV</strong>
              <div style="font-size: 11px;">2.4 kW Array</div>
            </div>

            <div style="font-size: 20px; color: #F59E0B;">➔</div>

            <div style="background: #F1F5F9; border: 2px solid #64748B; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 130px;">
              <div style="font-size: 32px;">⚡</div>
              <strong style="color: #334155;">MPPT</strong>
              <div style="font-size: 11px;">Charge Controller</div>
            </div>

            <div style="font-size: 20px; color: #10B981;">➔</div>

            <div style="background: #ECFDF5; border: 2px solid #10B981; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 150px;">
              <div style="font-size: 32px;">🔋</div>
              <strong style="color: #047857;">LiFePO4 BATTERY</strong>
              <div style="font-size: 11px;">48V 100Ah Pack</div>
            </div>

            <div style="font-size: 20px; color: #0284C7;">➔</div>

            <div style="background: #E0F2FE; border: 2px solid #0284C7; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 160px;">
              <div style="font-size: 32px;">🧠</div>
              <strong style="color: #0369A1;">ESP32 MCU</strong>
              <div style="font-size: 11px;">Smart Algorithm</div>
            </div>

          </div>

          <div style="font-size: 24px; color: #3B82F6;">⬇️</div>

          <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; width: 100%;">
            
            <div style="background: #EFF6FF; border: 2px solid #3B82F6; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 160px;">
              <div style="font-size: 32px;">❄️</div>
              <strong style="color: #1E40AF;">BLDC COMPRESSOR</strong>
              <div style="font-size: 11px;">Variable DC Inverter</div>
            </div>

            <div style="font-size: 20px; color: #7C3AED;">➔</div>

            <div style="background: #EDE9FE; border: 2px solid #7C3AED; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 160px;">
              <div style="font-size: 32px;">🧊</div>
              <strong style="color: #5B21B6;">PCM THERMAL</strong>
              <div style="font-size: 11px;">70 kg Storage Pack</div>
            </div>

            <div style="font-size: 20px; color: #10B981;">➔</div>

            <div style="background: #1E293B; color: white; border: 2px solid #38BDF8; padding: 14px 20px; border-radius: var(--radius-md); text-align: center; min-width: 170px;">
              <div style="font-size: 32px;">🏠</div>
              <strong style="color: #38BDF8;">COLD CHAMBER</strong>
              <div style="font-size: 11px;">100mm PUF Room</div>
            </div>

          </div>

        </div>
      </div>

      <!-- Sensor & Telemetry Layer Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <div class="card">
          <h4 style="font-size: 16px; margin-bottom: 10px; color: var(--cooling-blue-dark);">🌡️ Sensor Array Layer</h4>
          <ul style="font-size: 13px; color: var(--text-muted); line-height: 1.8; list-style: none;">
            <li>✓ <strong>SHT31:</strong> Air Temp & Relative Humidity</li>
            <li>✓ <strong>Door Switch:</strong> Magnetic Reed Contact</li>
            <li>✓ <strong>Load Cell:</strong> 4-Point Strain Gauge (200kg)</li>
            <li>✓ <strong>Ethylene Sensor:</strong> Ripening Gas Monitor</li>
            <li>✓ <strong>Thermocouples:</strong> PCM Core Temperature</li>
          </ul>
        </div>

        <div class="card">
          <h4 style="font-size: 16px; margin-bottom: 10px; color: var(--agri-green-dark);">📡 Telemetry Communication Layer</h4>
          <ul style="font-size: 13px; color: var(--text-muted); line-height: 1.8; list-style: none;">
            <li>✓ <strong>LoRa Radio (868MHz):</strong> Primary long range telemetry</li>
            <li>✓ <strong>GSM SMS Unit:</strong> Secondary emergency alert fallback</li>
            <li>✓ <strong>Wi-Fi AP:</strong> Direct tablet local diagnostic connection</li>
            <li>✓ <strong>PWA Service Worker:</strong> Local caching & sync</li>
          </ul>
        </div>
      </div>

    </div>
  `;
}
