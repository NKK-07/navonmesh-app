// NAVONMESH Mobile & Tablet Bottom Navigation Component

import { getTranslation } from '../data/i18n.js';

export function renderBottomNav(currentTab, currentLang) {
  const items = [
    { id: 'dashboard', icon: '🏠', labelKey: 'navDashboard' },
    { id: 'storage', icon: '❄️', labelKey: 'navStorageMonitor' },
    { id: 'produce', icon: '🥬', labelKey: 'navProduce' },
    { id: 'energy', icon: '⚡', labelKey: 'navEnergy' },
    { id: 'alerts', icon: '🔔', labelKey: 'navAlerts' }
  ];

  const linksHtml = items.map(item => {
    const isActive = currentTab === item.id;
    return `
      <button class="bottom-nav-link ${isActive ? 'active' : ''}" data-tab="${item.id}">
        <span class="bottom-nav-link-icon">${item.icon}</span>
        <span>${getTranslation(currentLang, item.labelKey)}</span>
      </button>
    `;
  }).join('');

  return `
    <nav class="mobile-bottom-nav">
      ${linksHtml}
    </nav>
  `;
}

export function bindBottomNavEvents(onTabSelect) {
  const buttons = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-link');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onTabSelect(tabId);
    });
  });
}
