// NAVONMESH Visual Farmer Troubleshoot Help View
// Low-literacy icon-driven troubleshooting guide with audio play support

import { speakText } from '../utils/audio.js';
import { getTranslation } from '../data/i18n.js';

export function renderHelpPage(state, currentLang) {
  const issues = [
    {
      icon: '🚪',
      title: 'Door Open Warning',
      problem: 'The cold room door was left open.',
      solution: 'Please close the cold-room door firmly to prevent cold air leakage.',
      actionText: 'CLOSE DOOR',
      speakText: 'The cold room door is open. Please close the door firmly.'
    },
    {
      icon: '🌡️',
      title: 'Temperature is High (>10°C)',
      problem: 'Sun is very hot or door was opened recently.',
      solution: 'Keep door closed. Check if compressor is running. PCM thermal backup will start automatically.',
      actionText: 'CHECK COMPRESSOR',
      speakText: 'Temperature is high. Keep the door closed. Cooling is active.'
    },
    {
      icon: '💧',
      title: 'Humidity is Low (<80%)',
      problem: 'Vegetables may wilt or dry out.',
      solution: 'Ensure vegetable crates are covered with perforated plastic liners.',
      actionText: 'COVER CRATES',
      speakText: 'Humidity is low. Cover vegetable crates to retain moisture.'
    },
    {
      icon: '🔋',
      title: 'Battery Low (<30%)',
      problem: 'Solar power was low due to monsoon clouds.',
      solution: 'System has switched to PCM thermal backup. Cooling is maintained safely.',
      actionText: 'PCM ACTIVE',
      speakText: 'Battery is low. PCM thermal cooling is maintaining temperature automatically.'
    },
    {
      icon: '☀️',
      title: 'Solar Power Low',
      problem: 'Heavy rain or cloud cover in hill region.',
      solution: 'No action needed. System operates on LiFePO4 battery and PCM thermal storage.',
      actionText: 'NORMAL HYBRID',
      speakText: 'Solar power is low. Battery and PCM are powering the cold storage.'
    }
  ];

  const cardsHtml = issues.map(iss => `
    <div class="card" style="display: flex; flex-direction: column; gap: 14px; border-left: 6px solid var(--solar-yellow);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 40px;">${iss.icon}</span>
        <div>
          <h3 style="font-size: 18px; color: var(--text-dark);">${iss.title}</h3>
          <span style="font-size: 13px; color: var(--text-muted);">${iss.problem}</span>
        </div>
      </div>

      <div style="background: #FFFBEB; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--solar-yellow); font-size: 14px; color: var(--solar-yellow-dark); font-weight: 600;">
        💡 <strong>What should I do?</strong> ${iss.solution}
      </div>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn-primary btn-help-speak" data-text="${iss.speakText}" style="padding: 10px 20px; font-size: 14px;">
          🔊 Listen Solution
        </button>
      </div>
    </div>
  `).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">🆘 ${getTranslation(currentLang, 'navTroubleshoot')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Simple visual guide for solving cold storage alerts in rural villages.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        ${cardsHtml}
      </div>

    </div>
  `;
}

export function bindHelpEvents(currentLang) {
  const btns = document.querySelectorAll('.btn-help-speak');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      speakText(btn.getAttribute('data-text'), currentLang);
    });
  });
}
