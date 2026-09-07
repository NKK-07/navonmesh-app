// NAVONMESH Alerts & Notifications View with Voice Audio Alerts

import { hardwareService } from '../data/mockHardware.js';
import { speakText } from '../utils/audio.js';
import { getTranslation } from '../data/i18n.js';

export function renderAlertsPage(state, currentLang) {
  const alertsHtml = state.alerts.map(alt => {
    const isCrit = alt.type === 'critical';
    const isWarn = alt.type === 'warning';
    const badgeColor = isCrit ? 'critical' : isWarn ? 'warning' : 'safe';
    const icon = isCrit ? '<i class="dot dot-danger"></i>' : isWarn ? '<i class="dot dot-warn"></i>' : '<i class="dot dot-ok"></i>';

    return `
      <div class="card" style="border-left: 6px solid ${isCrit ? '#A6321F' : isWarn ? '#A9601F' : '#04785C'}; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${icon}</span>
            <h3 style="font-size: 18px; color: var(--text-dark);">${alt.title}</h3>
          </div>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${alt.timestamp}</span>
        </div>

        <p style="font-size: 15px; color: var(--text-dark);">${alt.message}</p>

        <div style="background: var(--bg-main); padding: 12px; font-size: 13px; border: 1px solid var(--border-light);">
          <strong>Recommended Action:</strong> ${alt.action}
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px;">
          <button class="btn-secondary btn-alert-speak" data-text="${alt.title}. ${alt.message}. ${alt.action}">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg> ${getTranslation(currentLang, 'playAlert')}
          </button>
          <button class="btn-secondary btn-alert-ack" data-id="${alt.id}">
            ✓ ${getTranslation(currentLang, 'acknowledge')}
          </button>
          <button class="btn-secondary" style="border-color: #A6321F; color: #A6321F;" onclick="alert('Calling FPO Village Operator: +91 98620 XXXXX')">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 5.5c0 8 5.5 13.5 13.5 13.5l2-3-4-2.5-2 2a15 15 0 0 1-6-6l2-2L7.5 3.5z"/></svg> ${getTranslation(currentLang, 'callOperator')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10.5 19a1.8 1.8 0 0 0 3 0"/></svg> ${getTranslation(currentLang, 'navAlerts')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Real-time hardware warnings, door notifications, and power alerts.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${alertsHtml.length > 0 ? alertsHtml : '<div class="card"><p>No active warnings or alerts.</p></div>'}
      </div>

    </div>
  `;
}

export function bindAlertsEvents(currentLang) {
  const speakBtns = document.querySelectorAll('.btn-alert-speak');
  speakBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      speakText(text, currentLang);
    });
  });

  const ackBtns = document.querySelectorAll('.btn-alert-ack');
  ackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Alert acknowledged.');
    });
  });
}
