// NAVONMESH Visual Farmer Troubleshoot Help View
// Low-literacy icon-driven troubleshooting guide with audio play support

import { speakText } from '../utils/audio.js';
import { getTranslation } from '../data/i18n.js';

export function renderHelpPage(state, currentLang) {
  const issues = [
    {
      icon: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11v17H5zM13 12h.01"/></svg>',
      title: 'Door Open Warning',
      problem: 'The cold room door was left open.',
      solution: 'Please close the cold-room door firmly to prevent cold air leakage.',
      actionText: 'CLOSE DOOR',
      speakText: 'The cold room door is open. Please close the door firmly.'
    },
    {
      icon: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0M12 9v5.5"/></svg>',
      title: 'Temperature is High (>10°C)',
      problem: 'Sun is very hot or door was opened recently.',
      solution: 'Keep door closed. Check if compressor is running. PCM thermal backup will start automatically.',
      actionText: 'CHECK COMPRESSOR',
      speakText: 'Temperature is high. Keep the door closed. Cooling is active.'
    },
    {
      icon: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3.5 4 5.5 6.6 5.5 9.3a5.5 5.5 0 0 1-11 0c0-2.7 2-5.3 5.5-9.3Z"/></svg>',
      title: 'Humidity is Low (<80%)',
      problem: 'Vegetables may wilt or dry out.',
      solution: 'Ensure vegetable crates are covered with perforated plastic liners.',
      actionText: 'COVER CRATES',
      speakText: 'Humidity is low. Cover vegetable crates to retain moisture.'
    },
    {
      icon: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h14v8h-14zM18.5 11h2v2h-2"/></svg>',
      title: 'Battery Low (<30%)',
      problem: 'Solar power was low due to monsoon clouds.',
      solution: 'System has switched to PCM thermal backup. Cooling is maintained safely.',
      actionText: 'PCM ACTIVE',
      speakText: 'Battery is low. PCM thermal cooling is maintaining temperature automatically.'
    },
    {
      icon: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>',
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

      <div style="background: #F8EEDF; padding: 14px; border: 1px solid var(--solar-yellow); font-size: 14px; color: var(--solar-yellow-dark); font-weight: 600;">
        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/></svg> <strong>What should I do?</strong> ${iss.solution}
      </div>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn-primary btn-help-speak" data-text="${iss.speakText}" style="padding: 10px 20px; font-size: 14px;">
          <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg> Listen Solution
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
