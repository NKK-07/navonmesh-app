// NAVONMESH Header Component with Multilingual Selector & Speech Synthesis button

import { getTranslation } from '../data/i18n.js';
import { speakCurrentStatus } from '../utils/audio.js';

export function renderHeader(state, currentLang, onLangChange, onToggleDemo) {
  const isSafe = state.conditionScore > 80;
  const isWarning = state.conditionScore > 50 && state.conditionScore <= 80;
  const statusClass = isSafe ? 'safe' : isWarning ? 'warning' : 'critical';
  const statusText = isSafe 
    ? getTranslation(currentLang, 'systemHealthy')
    : isWarning 
    ? getTranslation(currentLang, 'systemWarning')
    : getTranslation(currentLang, 'systemCritical');

  const onlineText = state.isOnline 
    ? getTranslation(currentLang, 'online') 
    : getTranslation(currentLang, 'offline');

  return `
    <header class="app-header">
      <div class="header-brand">
        <div class="brand-logo-icon"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/></svg></div>
        <div class="brand-text-wrapper">
          <span class="brand-title">${getTranslation(currentLang, 'appName')}</span>
          <span class="brand-tagline">${getTranslation(currentLang, 'tagline')}</span>
        </div>
      </div>

      <div class="header-center-info">
        <span class="unit-badge"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"/></svg> ${getTranslation(currentLang, 'unitId')} | ${getTranslation(currentLang, 'location')}</span>
        
        <div class="system-status-pill ${statusClass}">
          <span class="pulse-dot"></span>
          <span>${statusText}</span>
        </div>

        <span class="data-honesty-badge ${state.isOnline ? 'live' : 'simulated'}">
          ${state.isOnline ? '<i class="dot dot-ok"></i> ' + onlineText : '<i class="dot dot-danger"></i> ' + onlineText}
        </span>
      </div>

      <div class="header-right-actions">
        <button class="audio-listen-btn" id="btnHeaderSpeak" title="Read Aloud Status">
          <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg> <span>${getTranslation(currentLang, 'listen')}</span>
        </button>

        <select class="lang-select" id="headerLangSelect">
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
          <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
          <option value="as" ${currentLang === 'as' ? 'selected' : ''}>অসমীয়া (Assamese)</option>
          <option value="ne" ${currentLang === 'ne' ? 'selected' : ''}>नेपाली (Nepali)</option>
          <option value="mni" ${currentLang === 'mni' ? 'selected' : ''}>মণিপুরী (Meitei)</option>
          <option value="kha" ${currentLang === 'kha' ? 'selected' : ''}>Khasi</option>
          <option value="mizo" ${currentLang === 'mizo' ? 'selected' : ''}>Mizo</option>
          <option value="nag" ${currentLang === 'nag' ? 'selected' : ''}>Nagamese</option>
        </select>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(state, currentLang, onLangChange, onToggleDemo) {
  const langSelect = document.getElementById('headerLangSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => onLangChange(e.target.value));
  }

  const speakBtn = document.getElementById('btnHeaderSpeak');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => speakCurrentStatus(state, currentLang));
  }
}
