// NAVONMESH Desktop Sidebar Navigation Component

import { getTranslation } from '../data/i18n.js';

export function renderSidebar(currentTab, currentLang, userRole) {
  const items = [
    { id: 'dashboard', icon: '🏠', labelKey: 'navDashboard' },
    { id: 'storage', icon: '❄️', labelKey: 'navStorageMonitor' },
    { id: 'produce', icon: '🥬', labelKey: 'navProduce' },
    { id: 'crops', icon: '🌱', labelKey: 'navCropProfiles' },
    { id: 'energy', icon: '⚡', labelKey: 'navEnergy' },
    { id: 'pcm', icon: '🧊', labelKey: 'navPcm' },
    { id: 'performance', icon: '📊', labelKey: 'navPerformance' },
    { id: 'alerts', icon: '🔔', labelKey: 'navAlerts' },
    { id: 'health', icon: '🩺', labelKey: 'navHealth' },
    { id: 'connectivity', icon: '📡', labelKey: 'navConnectivity' },
    { id: 'how_it_works', icon: '💡', labelKey: 'navHowItWorks' },
    { id: 'built_for_ner', icon: '🌄', labelKey: 'navBuiltForNer' },
    { id: 'impact', icon: '📈', labelKey: 'navImpact' },
    { id: 'troubleshoot', icon: '🆘', labelKey: 'navTroubleshoot' }
  ];

  if (userRole === 'retailer') {
    items.unshift({ id: 'retailer', icon: '🛒', labelKey: 'navRetailer' });
  } else if (userRole === 'fpo') {
    items.unshift({ id: 'fpo', icon: '🏢', labelKey: 'navFpo' });
  }

  items.push({ id: 'settings', icon: '⚙️', labelKey: 'navSettings' });

  const navHtml = items.map(item => {
    const isActive = currentTab === item.id;
    return `
      <button class="sidebar-item ${isActive ? 'active' : ''}" data-tab="${item.id}">
        <span class="sidebar-item-icon">${item.icon}</span>
        <span>${getTranslation(currentLang, item.labelKey)}</span>
      </button>
    `;
  }).join('');

  return `
    <aside class="app-sidebar">
      ${navHtml}
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
