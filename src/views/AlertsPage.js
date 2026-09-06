// NAVONMESH Alerts & Notifications View with Voice Audio Alerts

import { hardwareService } from '../data/mockHardware.js';
import { speakText } from '../utils/audio.js';
import { getTranslation } from '../data/i18n.js';

export function renderAlertsPage(state, currentLang) {
  const alertsHtml = state.alerts.map(alt => {
    const isCrit = alt.type === 'critical';
    const isWarn = alt.type === 'warning';
    const badgeColor = isCrit ? 'critical' : isWarn ? 'warning' : 'safe';
    const icon = isCrit ? '🔴' : isWarn ? '🟡' : '🟢';

    return `
      <div class="card" style="border-left: 6px solid ${isCrit ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981'}; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${icon}</span>
            <h3 style="font-size: 18px; color: var(--text-dark);">${alt.title}</h3>
          </div>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">${alt.timestamp}</span>
        </div>

        <p style="font-size: 15px; color: var(--text-dark);">${alt.message}</p>

        <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); font-size: 13px; border: 1px solid var(--border-light);">
          <strong>Recommended Action:</strong> ${alt.action}
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px;">
          <button class="btn-secondary btn-alert-speak" data-text="${alt.title}. ${alt.message}. ${alt.action}">
            🔊 ${getTranslation(currentLang, 'playAlert')}
          </button>
          <button class="btn-secondary btn-alert-ack" data-id="${alt.id}">
            ✓ ${getTranslation(currentLang, 'acknowledge')}
          </button>
          <button class="btn-secondary" style="border-color: #DC2626; color: #DC2626;" onclick="alert('Calling FPO Village Operator: +91 98620 XXXXX')">
            📞 ${getTranslation(currentLang, 'callOperator')}
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">🔔 ${getTranslation(currentLang, 'navAlerts')}</h1>
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
