// NAVONMESH Mobile & Tablet Bottom Navigation Component

import { getTranslation } from '../data/i18n.js';
import { icon } from './icons.js';

export function renderBottomNav(currentTab, currentLang) {
  const items = [
    { id: 'dashboard', labelKey: 'navDashboard' },
    { id: 'storage', labelKey: 'navStorageMonitor' },
    { id: 'produce', labelKey: 'navProduce' },
    { id: 'energy', labelKey: 'navEnergy' },
    { id: 'alerts', labelKey: 'navAlerts' }
  ];

  const linksHtml = items.map(item => {
    const isActive = currentTab === item.id;
    return `
      <button class="bottom-nav-link ${isActive ? 'active' : ''}" data-tab="${item.id}">
        ${icon(item.id, 21)}
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
