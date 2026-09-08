// NAVONMESH Desktop Sidebar Navigation Component
//
// Operational views only. How It Works, Built for NER and Impact used to sit
// here; all three are pages on the marketing site, so the app no longer
// carries a second copy. The foot of the sidebar links back to the site for
// anything explanatory.

import { getTranslation } from '../data/i18n.js';
import { icon } from './icons.js';
import { getUser } from '../utils/api.js';

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

  const user = getUser();

  return `
    <aside class="app-sidebar">
      ${groupsHtml}
      <a class="sidebar-out" href="../index.html">
        <span>${getTranslation(currentLang, 'navAboutProject')}</span>
        ${icon('external', 13)}
      </a>
      ${user ? `
        <div class="sidebar-account">
          <p class="sidebar-who">
            <span class="sidebar-who-name">${escapeHtml(user.name || '')}</span>
            <span class="sidebar-who-role">${roleLabel(currentLang, user.role)}</span>
          </p>
          <button class="sidebar-signout" id="btnSignOut" type="button">
            ${icon('signout', 15)}
            <span>${getTranslation(currentLang, 'signOut')}</span>
          </button>
        </div>
      ` : ''}
    </aside>
  `;
}

function roleLabel(lang, role) {
  if (role === 'fpo_manager') return getTranslation(lang, 'roleFpoManager');
  if (role === 'admin') return getTranslation(lang, 'roleAdmin');
  if (role === 'retailer') return getTranslation(lang, 'roleRetailer');
  return getTranslation(lang, 'roleFarmer');
}

/* The name comes from the database and is rendered into innerHTML. It is our
   own row rather than anything a stranger controls, but a name with an
   apostrophe or an ampersand in it should not be able to break the markup. */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function bindSidebarEvents(onTabSelect, onSignOut) {
  const buttons = document.querySelectorAll('.app-sidebar .sidebar-item');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onTabSelect(tabId);
    });
  });

  const out = document.getElementById('btnSignOut');
  if (out && onSignOut) out.addEventListener('click', onSignOut);
}
