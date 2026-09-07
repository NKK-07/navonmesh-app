// NAVONMESH Desktop Sidebar Navigation Component
//
// Operational views only. How It Works, Built for NER and Impact used to sit
// here; all three are pages on the marketing site, so the app no longer
// carries a second copy. The foot of the sidebar links back to the site for
// anything explanatory.

import { getTranslation } from '../data/i18n.js';
import { icon } from './icons.js';

const GROUPS = [
  {
    labelKey: 'navGroupMonitor',
    items: [
      { id: 'dashboard', labelKey: 'navDashboard' },
      { id: 'alerts', labelKey: 'navAlerts' },
      { id: 'storage', labelKey: 'navStorageMonitor' },
      { id: 'energy', labelKey: 'navEnergy' },
      { id: 'pcm', labelKey: 'navPcm' },
      { id: 'performance', labelKey: 'navPerformance' }
    ]
  },
  {
    labelKey: 'navGroupProduce',
    items: [
      { id: 'produce', labelKey: 'navProduce' },
      { id: 'crops', labelKey: 'navCropProfiles' }
    ]
  },
  {
    labelKey: 'navGroupSystem',
    items: [
      { id: 'health', labelKey: 'navHealth' },
      { id: 'connectivity', labelKey: 'navConnectivity' },
      { id: 'troubleshoot', labelKey: 'navTroubleshoot' },
      { id: 'settings', labelKey: 'navSettings' }
    ]
  }
];

export function renderSidebar(currentTab, currentLang, userRole) {
  const groups = GROUPS.map(group => ({ ...group, items: [...group.items] }));

  if (userRole === 'retailer') {
    groups[0].items.unshift({ id: 'retailer', labelKey: 'navRetailer' });
  } else if (userRole === 'fpo') {
    groups[0].items.unshift({ id: 'fpo', labelKey: 'navFpo' });
  }

  const groupsHtml = groups.map(group => {
    const itemsHtml = group.items.map(item => {
      const isActive = currentTab === item.id;
      return `
        <button class="sidebar-item ${isActive ? 'active' : ''}" data-tab="${item.id}"
          ${isActive ? 'aria-current="page"' : ''}>
          ${icon(item.id, 17)}
          <span>${getTranslation(currentLang, item.labelKey)}</span>
        </button>
      `;
    }).join('');

    return `
      <p class="sidebar-group">${getTranslation(currentLang, group.labelKey)}</p>
      ${itemsHtml}
    `;
  }).join('');

  return `
    <aside class="app-sidebar">
      ${groupsHtml}
      <a class="sidebar-out" href="../index.html">
        <span>${getTranslation(currentLang, 'navAboutProject')}</span>
        ${icon('external', 13)}
      </a>
    </aside>
  `;
}

export function bindSidebarEvents(onTabSelect) {
  const buttons = document.querySelectorAll('.app-sidebar .sidebar-item');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onTabSelect(tabId);
    });
  });
}
