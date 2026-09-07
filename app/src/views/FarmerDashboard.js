// NAVONMESH Main Farmer Dashboard View
// Extremely visual, large touch buttons, low-literacy icon + number + short word design

import { getTranslation } from '../data/i18n.js';
import { speakCurrentStatus } from '../utils/audio.js';

export function renderFarmerDashboard(state, currentLang) {
  const isSafe = state.conditionScore > 80;
  const isWarning = state.conditionScore > 50 && state.conditionScore <= 80;

  const tempStatus = Math.abs(state.temperature - state.targetTemperature) <= 2 ? 'safe' : 'warning';
  const humidStatus = Math.abs(state.humidity - state.targetHumidity) <= 8 ? 'safe' : 'warning';
  const batStatus = state.batterySoc >= 50 ? 'safe' : state.batterySoc >= 30 ? 'warning' : 'critical';

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">

      <!-- Top Question Answer Header Banner -->
      <div style="background: var(--bg-card); padding: 20px; border: 2px solid var(--border-light); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="font-size: 40px;">${isSafe ? '<i class="dot dot-ok"></i>' : isWarning ? '<i class="dot dot-warn"></i>' : '<i class="dot dot-danger"></i>'}</div>
          <div>
            <h2 style="font-size: 24px; font-weight: 900; color: var(--text-dark);">
              ${isSafe ? 'STORAGE SAFE' : isWarning ? 'ATTENTION NEEDED' : 'CRITICAL ALERT'}
            </h2>
            <p style="font-size: 15px; color: var(--text-muted); font-weight: 600;">
              ${isSafe ? getTranslation(currentLang, 'vegSafeMsg') : getTranslation(currentLang, 'vegWarnMsg')}
            </p>
          </div>
        </div>

        <button class="btn-primary" id="btnDashboardSpeak" style="font-size: 18px; padding: 14px 28px;">
          <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg> <span>${getTranslation(currentLang, 'hearStatus')}</span>
        </button>
      </div>

      <!-- 6 Large Visual Cards Grid -->
      <div class="dashboard-grid">
        
        <!-- 1. Temperature Card -->
        <div class="farmer-metric-card accent-temp">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0M12 9v5.5"/></svg></span> ${getTranslation(currentLang, 'temperature')}
            </span>
            <span class="data-honesty-badge live">SHT31</span>
          </div>
          <div class="metric-value-huge">${state.temperature.toFixed(1)} °C</div>
          <div class="metric-subtext">${getTranslation(currentLang, 'target')}: ${state.targetTemperature}°C</div>
          <div class="metric-status-badge ${tempStatus}">
            ✓ ${tempStatus === 'safe' ? getTranslation(currentLang, 'safe') : getTranslation(currentLang, 'warning')}
          </div>
        </div>

        <!-- 2. Humidity Card -->
        <div class="farmer-metric-card accent-humid">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2-5.3 5.5-9.3Z"/></svg></span> ${getTranslation(currentLang, 'humidity')}
            </span>
            <span class="data-honesty-badge live">SHT31</span>
          </div>
          <div class="metric-value-huge">${Math.round(state.humidity)}%</div>
          <div class="metric-subtext">${getTranslation(currentLang, 'target')}: 85–95%</div>
          <div class="metric-status-badge ${humidStatus}">
            ✓ ${humidStatus === 'safe' ? getTranslation(currentLang, 'safe') : getTranslation(currentLang, 'warning')}
          </div>
        </div>

        <!-- 3. Battery Card -->
        <div class="farmer-metric-card accent-battery">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg></span> ${getTranslation(currentLang, 'battery')}
            </span>
            <span class="data-honesty-badge live">48V LiFePO4</span>
          </div>
          <div class="metric-value-huge">${Math.round(state.batterySoc)}%</div>
          <div class="metric-subtext">${state.operatingMode.modeTitle}</div>
          <div class="metric-status-badge ${batStatus}">
            ✓ ${batStatus === 'safe' ? getTranslation(currentLang, 'good') : getTranslation(currentLang, 'warning')}
          </div>
        </div>

        <!-- 4. Solar Power Card -->
        <div class="farmer-metric-card accent-solar">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg></span> ${getTranslation(currentLang, 'solar')}
            </span>
            <span class="data-honesty-badge live">MPPT</span>
          </div>
          <div class="metric-value-huge">${state.solarPowerKw.toFixed(1)} kW</div>
          <div class="metric-subtext">Peak Capacity: 3.0 kW</div>
          <div class="metric-status-badge safe">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg> ${state.solarPowerKw > 0.5 ? getTranslation(currentLang, 'charging') : 'STANDBY'}
          </div>
        </div>

        <!-- 5. Stored Produce Weight Card -->
        <div class="farmer-metric-card accent-produce">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon">${state.activeCrop.icon}</span> ${state.activeCrop.name}
            </span>
            <span class="data-honesty-badge live">Load Cell</span>
          </div>
          <div class="metric-value-huge">${state.produceWeightKg} kg</div>
          <div class="metric-subtext">${getTranslation(currentLang, 'capacity')}: ${state.maxCapacityKg} kg (${Math.round((state.produceWeightKg/state.maxCapacityKg)*100)}% Full)</div>
          <div class="metric-status-badge safe">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5"/></svg> STORAGE LOAD OK
          </div>
        </div>

        <!-- 6. Estimated Shelf Life Card -->
        <div class="farmer-metric-card accent-life">
          <div class="metric-card-header">
            <span class="metric-title">
              <span class="metric-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M12 7.5V12l3 2"/></svg></span> ${getTranslation(currentLang, 'estimatedShelfLife')}
            </span>
            <span class="data-honesty-badge estimated">Q10 Model</span>
          </div>
          <div class="metric-value-huge">${state.shelfLifeDays} ${getTranslation(currentLang, 'daysLeft')}</div>
          <div class="metric-subtext">Stored Produce Viability</div>
          <div class="metric-status-badge ${state.shelfLifeQuality === 'GOOD' ? 'safe' : 'warning'}">
            ✓ ${state.shelfLifeQuality}
          </div>
        </div>

      </div>

      <!-- COLD STORAGE HEALTH CIRCULAR GAUGE SCORE CARD -->
      <div class="health-score-card">
        <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
          <div class="score-circle-wrapper">
            <svg viewBox="0 0 100 100" style="width: 130px; height: 130px; transform: rotate(-90deg);">
              <circle cx="50" cy="50" r="42" stroke="#3C352F" stroke-width="12" fill="none"/>
              <circle cx="50" cy="50" r="42" stroke="${isSafe ? '#04785C' : isWarning ? '#A9601F' : '#A6321F'}" stroke-width="12" fill="none" stroke-dasharray="264" stroke-dashoffset="${264 - (264 * state.conditionScore) / 100}"/>
            </svg>
            <div style="position: absolute; display: flex; flex-direction: column; align-items: center;">
              <span class="score-number">${state.conditionScore}</span>
              <span class="score-label">/ 100</span>
            </div>
          </div>

          <div class="score-text-area">
            <span style="font-size: 13px; color: #8C7F73; font-weight: 800; text-transform: uppercase;">Overall System Score</span>
            <h3 class="score-main-title">
              ${state.conditionScore > 85 ? 'EXCELLENT COLD STORAGE STATE' : 'MONITORING REQUIRED'}
            </h3>
            <p class="score-desc">${getTranslation(currentLang, 'vegSafeMsg')}</p>
            
            <div class="score-breakdown-list">
              <span class="score-chip"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0M12 9v5.5"/></svg> Temp: 95%</span>
              <span class="score-chip"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2-5.3 5.5-9.3Z"/></svg> Humidity: 92%</span>
              <span class="score-chip"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg> Power: ${Math.round(state.batterySoc)}%</span>
              <span class="score-chip"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11v17H5zM13 12h.01"/></svg> Door: ${state.doorOpen ? 'Open <i class="dot dot-danger"></i>' : 'Closed <i class="dot dot-ok"></i>'}</span>
              <span class="score-chip"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> PCM: ${state.pcmStatus}</span>
            </div>
          </div>
        </div>

        <div style="align-self: center;">
          <button class="btn-secondary" id="btnGoToStorage" style="background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.2);">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg> View Cold Chamber Diagram ➔
          </button>
        </div>
      </div>

    </div>
  `;
}

export function bindFarmerDashboardEvents(state, currentLang, onNavigate) {
  const speakBtn = document.getElementById('btnDashboardSpeak');
  if (speakBtn) speakBtn.addEventListener('click', () => speakCurrentStatus(state, currentLang));

  const goStorageBtn = document.getElementById('btnGoToStorage');
  if (goStorageBtn) goStorageBtn.addEventListener('click', () => onNavigate('storage'));
}
