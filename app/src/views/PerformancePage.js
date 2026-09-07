// NAVONMESH Real-Time Performance & Historical Charts View (SVG Data Visualizations)

export function renderPerformancePage(state, timeframe = '24h') {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V11M9.5 20V5M15 20v-6M20.5 20V8M2.5 20h19"/></svg> Storage Performance & Energy Telemetry</h1>
          <p style="color: var(--text-muted); font-size: 15px;">24-Hour continuous environmental & power trends for cold-storage validation.</p>
        </div>

        <div style="display: flex; background: var(--bg-card); padding: 4px; border: 2px solid var(--border-light);">
          <button class="btn-timeframe ${timeframe === '24h' ? 'active' : ''}" data-tf="24h" style="padding: 8px 16px; font-weight: 700; ${timeframe === '24h' ? 'background: var(--agri-green); color: white;' : ''}">24 Hours</button>
          <button class="btn-timeframe ${timeframe === '7d' ? 'active' : ''}" data-tf="7d" style="padding: 8px 16px; font-weight: 700; ${timeframe === '7d' ? 'background: var(--agri-green); color: white;' : ''}">7 Days</button>
          <button class="btn-timeframe ${timeframe === '30d' ? 'active' : ''}" data-tf="30d" style="padding: 8px 16px; font-weight: 700; ${timeframe === '30d' ? 'background: var(--agri-green); color: white;' : ''}">30 Days</button>
        </div>
      </div>

      <!-- Compressor Runtime & Energy Stats Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">COMPRESSOR RUNTIME</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">5h 24m</div>
          <span style="font-size: 12px; color: var(--text-muted);">Duty cycle: 42% today</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">ENERGY CONSUMED</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--text-dark); margin-top: 4px;">8.4 kWh</div>
          <span style="font-size: 12px; color: var(--text-muted);">Cooling load load</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">SOLAR GENERATED</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">10.2 kWh</div>
          <span style="font-size: 12px; color: #047857; font-weight: bold;">+1.8 kWh Net Surplus</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">PCM THERMAL SUPPORT</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--pcm-purple); margin-top: 4px;">4.1 Hours</div>
          <span style="font-size: 12px; color: var(--text-muted);">Grid-free thermal buffer</span>
        </div>
      </div>

      <!-- Interactive SVG Chart 1: Temperature & Humidity Trend -->
      <div class="card" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 18px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0M12 9v5.5"/></svg> Temperature & <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2-5.3 5.5-9.3Z"/></svg> Humidity — Last 24 Hours</h3>
          <div style="display: flex; gap: 16px; font-size: 13px; font-weight: 700;">
            <span style="color: #4A5461;">━ Temperature (°C)</span>
            <span style="color: #4A5461;">┅ Humidity (% RH)</span>
          </div>
        </div>

        <!-- SVG Line Chart -->
        <svg viewBox="0 0 700 200" style="width: 100%; height: 220px; overflow: visible;">
          <!-- Gridlines -->
          <line x1="40" y1="20" x2="680" y2="20" stroke="#D5D9DE" stroke-width="1"/>
          <line x1="40" y1="70" x2="680" y2="70" stroke="#D5D9DE" stroke-width="1"/>
          <line x1="40" y1="120" x2="680" y2="120" stroke="#D5D9DE" stroke-width="1"/>
          <line x1="40" y1="170" x2="680" y2="170" stroke="#D5D9DE" stroke-width="2"/>

          <!-- Target Temp Line (8°C) -->
          <line x1="40" y1="120" x2="680" y2="120" stroke="#047857" stroke-dasharray="4,4" stroke-width="2"/>
          <text x="685" y="124" fill="#047857" font-size="11" font-weight="bold">Target (8°C)</text>

          <!-- Temperature Path -->
          <path d="M 40 115 Q 150 110 250 125 T 450 118 T 680 120" fill="none" stroke="#4A5461" stroke-width="4"/>

          <!-- Temperature Points -->
          <circle cx="40" cy="115" r="5" fill="#4A5461"/>
          <circle cx="250" cy="125" r="5" fill="#4A5461"/>
          <circle cx="450" cy="118" r="5" fill="#4A5461"/>
          <circle cx="680" cy="120" r="5" fill="#4A5461"/>
          
          <!-- Temp values overlay -->
          <text x="40" y="100" font-size="11" font-weight="bold" fill="#4A5461">8.5°C</text>
          <text x="250" y="145" font-size="11" font-weight="bold" fill="#4A5461">7.8°C</text>
          <text x="450" y="105" font-size="11" font-weight="bold" fill="#4A5461">8.1°C</text>
          <text x="660" y="105" font-size="11" font-weight="bold" fill="#4A5461">${state.temperature.toFixed(1)}°C</text>

          <!-- Humidity Path (Dashed Blue) -->
          <path d="M 40 40 Q 150 45 250 35 T 450 42 T 680 38" fill="none" stroke="#4A5461" stroke-dasharray="6,4" stroke-width="3"/>
          <text x="685" y="42" fill="#4A5461" font-size="11" font-weight="bold">91% RH</text>

          <!-- Time X Labels -->
          <text x="40" y="192" font-size="11" fill="#4A5461">00:00</text>
          <text x="200" y="192" font-size="11" fill="#4A5461">06:00</text>
          <text x="360" y="192" font-size="11" fill="#4A5461">12:00 (Peak)</text>
          <text x="520" y="192" font-size="11" fill="#4A5461">18:00</text>
          <text x="660" y="192" font-size="11" fill="#4A5461">Now</text>
        </svg>
      </div>

      <!-- Interactive SVG Chart 2: Solar Generation vs Battery SOC -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- Solar Generation Bar Chart -->
        <div class="card">
          <h3 style="font-size: 16px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg> Solar PV Generation (kW)</h3>
          <svg viewBox="0 0 350 160" style="width: 100%; height: 160px;">
            <rect x="20" y="120" width="30" height="20" fill="#D9A441" rx="4"/>
            <rect x="70" y="80" width="30" height="60" fill="#D9A441" rx="4"/>
            <rect x="120" y="30" width="30" height="110" fill="#B45309" rx="4"/>
            <rect x="170" y="20" width="30" height="120" fill="#B45309" rx="4"/>
            <rect x="220" y="45" width="30" height="95" fill="#B45309" rx="4"/>
            <rect x="270" y="90" width="30" height="50" fill="#D9A441" rx="4"/>

            <text x="135" y="20" font-size="11" font-weight="bold" fill="#B45309">2.8kW</text>
            <text x="185" y="12" font-size="11" font-weight="bold" fill="#B45309">3.0kW</text>
            
            <line x1="10" y1="140" x2="330" y2="140" stroke="#D5D9DE" stroke-width="2"/>
            <text x="25" y="155" font-size="10" fill="#4A5461">06h</text>
            <text x="75" y="155" font-size="10" fill="#4A5461">09h</text>
            <text x="125" y="155" font-size="10" fill="#4A5461">12h</text>
            <text x="175" y="155" font-size="10" fill="#4A5461">14h</text>
            <text x="225" y="155" font-size="10" fill="#4A5461">16h</text>
            <text x="275" y="155" font-size="10" fill="#4A5461">18h</text>
          </svg>
        </div>

        <!-- Battery SOC Area Chart -->
        <div class="card">
          <h3 style="font-size: 16px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg> Battery State of Charge (%)</h3>
          <svg viewBox="0 0 350 160" style="width: 100%; height: 160px;">
            <path d="M 20 70 Q 100 90 180 30 T 330 45 L 330 140 L 20 140 Z" fill="#EAF1EE" opacity="0.6"/>
            <path d="M 20 70 Q 100 90 180 30 T 330 45" fill="none" stroke="#047857" stroke-width="3"/>
            <circle cx="330" cy="45" r="5" fill="#047857"/>
            <text x="290" y="35" font-size="12" font-weight="bold" fill="#047857">${Math.round(state.batterySoc)}% SOC</text>

            <line x1="10" y1="140" x2="330" y2="140" stroke="#D5D9DE" stroke-width="2"/>
            <line x1="10" y1="110" x2="330" y2="110" stroke="#B91C1C" stroke-dasharray="3,3" stroke-width="1"/>
            <text x="15" y="105" font-size="9" fill="#B91C1C" font-weight="bold">30% PCM Threshold</text>
          </svg>
        </div>

      </div>

    </div>
  `;
}

export function bindPerformanceEvents(onTimeframeChange) {
  const btns = document.querySelectorAll('.btn-timeframe');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      onTimeframeChange(btn.getAttribute('data-tf'));
    });
  });
}
