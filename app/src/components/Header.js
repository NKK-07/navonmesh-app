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
        <div class="brand-logo-icon">☀️❄️</div>
        <div class="brand-text-wrapper">
          <span class="brand-title">${getTranslation(currentLang, 'appName')}</span>
          <span class="brand-tagline">${getTranslation(currentLang, 'tagline')}</span>
        </div>
      </div>

      <div class="header-center-info">
        <span class="unit-badge">📍 ${getTranslation(currentLang, 'unitId')} | ${getTranslation(currentLang, 'location')}</span>
        
        <div class="system-status-pill ${statusClass}">
          <span class="pulse-dot"></span>
          <span>${statusText}</span>
        </div>

        <span class="data-honesty-badge ${state.isOnline ? 'live' : 'simulated'}">
          ${state.isOnline ? '🟢 ' + onlineText : '🔴 ' + onlineText}
        </span>
      </div>

      <div class="header-right-actions">
        <button class="audio-listen-btn" id="btnHeaderSpeak" title="Read Aloud Status">
          🔊 <span>${getTranslation(currentLang, 'listen')}</span>
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
