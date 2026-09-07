// NAVONMESH Master Application Controller & Router
// SIH 2026 Problem Statement 26005 Hardware Control Interface

import { hardwareService } from './data/mockHardware.js';
import * as notify from './utils/notifications.js';

// Components
import { renderHeader, bindHeaderEvents } from './components/Header.js';
import { renderSidebar, bindSidebarEvents } from './components/Sidebar.js';
import { renderBottomNav, bindBottomNavEvents } from './components/BottomNav.js';
import { renderDemoPanel, bindDemoPanelEvents } from './components/DemoPanel.js';

// Views
import { renderFarmerDashboard, bindFarmerDashboardEvents } from './views/FarmerDashboard.js';
import { renderStorageMonitor } from './views/StorageMonitor.js';
import { renderPerformancePage, bindPerformanceEvents } from './views/PerformancePage.js';
import { renderCropProfilesPage, bindCropProfilesEvents } from './views/CropProfilesPage.js';
import { renderShelfLifePage } from './views/ShelfLifePage.js';
import { renderProducePage, bindProduceEvents } from './views/ProducePage.js';
import { renderEnergyPage } from './views/EnergyPage.js';
import { renderPcmPage } from './views/PcmPage.js';
import { renderAlertsPage, bindAlertsEvents } from './views/AlertsPage.js';
import { renderSystemHealthPage } from './views/SystemHealthPage.js';
import { renderConnectivityPage } from './views/ConnectivityPage.js';
import { renderHelpPage, bindHelpEvents } from './views/HelpPage.js';
import { renderRetailerDashboard } from './views/RetailerDashboard.js';
import { renderFpoDashboard } from './views/FpoDashboard.js';
import { renderSettingsPage, bindSettingsEvents } from './views/SettingsPage.js';

class NavonmeshApp {
  constructor() {
    this.currentTab = 'dashboard'; // The site at ../index.html is the pitch; the app opens on live state
    this.currentLang = 'en';
    this.userRole = 'farmer';
    this.selectedCropId = 'cabbage';
    this.isDemoModalOpen = false;
    this.isAddProduceModalOpen = false;
    this.performanceTimeframe = '24h';

    // Register Service Worker for PWA Offline Caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('SW registration skipped:', err);
      });
    }

    // A notification tap asks for the Alerts tab, either through a message
    // from the worker (app already open) or through ?tab= (cold start).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'open-tab') this.setTab(event.data.tab);
      });
    }
    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (requestedTab) {
      this.currentTab = requestedTab;
      history.replaceState({}, '', location.pathname);
    }

    // Subscribe to hardware telemetry state updates
    hardwareService.subscribe(state => {
      // Notifications ride the same tick as the render, so an alert raised by
      // the hardware reaches the phone without a second polling loop.
      notify.syncFromState(state);
      this.render(state);
    });
    notify.syncFromState(hardwareService.getState());

    // Initial Render
    this.render();
  }

  setTab(tabId) {
    this.currentTab = tabId;
    window.scrollTo(0, 0);
    this.render();
  }

  setLang(langCode) {
    this.currentLang = langCode;
    this.render();
  }

  setUserRole(role) {
    this.userRole = role;
    if (role === 'retailer') this.currentTab = 'retailer';
    else if (role === 'fpo') this.currentTab = 'fpo';
    this.render();
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const hwState = hardwareService.getState();

    // Render active tab view
    let mainViewHtml = '';
    if (this.currentTab === 'dashboard') mainViewHtml = renderFarmerDashboard(hwState, this.currentLang);
    else if (this.currentTab === 'storage') mainViewHtml = renderStorageMonitor(hwState, this.currentLang);
    else if (this.currentTab === 'performance') mainViewHtml = renderPerformancePage(hwState, this.performanceTimeframe);
    else if (this.currentTab === 'crops') mainViewHtml = renderCropProfilesPage(hwState, this.currentLang, this.selectedCropId);
    else if (this.currentTab === 'shelflife') mainViewHtml = renderShelfLifePage(hwState, this.currentLang);
    else if (this.currentTab === 'produce') mainViewHtml = renderProducePage(hwState, this.currentLang, this.isAddProduceModalOpen);
    else if (this.currentTab === 'energy') mainViewHtml = renderEnergyPage(hwState, this.currentLang);
    else if (this.currentTab === 'pcm') mainViewHtml = renderPcmPage(hwState, this.currentLang);
    else if (this.currentTab === 'alerts') mainViewHtml = renderAlertsPage(hwState, this.currentLang);
    else if (this.currentTab === 'health') mainViewHtml = renderSystemHealthPage(hwState, this.currentLang);
    else if (this.currentTab === 'connectivity') mainViewHtml = renderConnectivityPage(hwState, this.currentLang);
    else if (this.currentTab === 'troubleshoot') mainViewHtml = renderHelpPage(hwState, this.currentLang);
    else if (this.currentTab === 'retailer') mainViewHtml = renderRetailerDashboard(hwState);
    else if (this.currentTab === 'fpo') mainViewHtml = renderFpoDashboard();
    else if (this.currentTab === 'settings') mainViewHtml = renderSettingsPage(hwState, this.currentLang, this.userRole);

    appEl.innerHTML = `
      ${renderHeader(hwState, this.currentLang, this.setLang.bind(this), (open) => { this.isDemoModalOpen = open; this.render(); })}
      
      <div class="app-wrapper">
        ${renderSidebar(this.currentTab, this.currentLang, this.userRole)}
        <main class="main-content">
          ${mainViewHtml}
        </main>
      </div>

      ${renderBottomNav(this.currentTab, this.currentLang)}
      ${renderDemoPanel(this.isDemoModalOpen)}
    `;

    // Event Bindings
    bindHeaderEvents(hwState, this.currentLang, this.setLang.bind(this));
    bindSidebarEvents(this.setTab.bind(this));
    bindBottomNavEvents(this.setTab.bind(this));
    bindDemoPanelEvents((open) => { this.isDemoModalOpen = open; this.render(); });

    if (this.currentTab === 'dashboard') bindFarmerDashboardEvents(hwState, this.currentLang, this.setTab.bind(this));
    else if (this.currentTab === 'performance') bindPerformanceEvents((tf) => { this.performanceTimeframe = tf; this.render(); });
    else if (this.currentTab === 'crops') bindCropProfilesEvents(this.selectedCropId, (cropId) => { this.selectedCropId = cropId; this.render(); });
    else if (this.currentTab === 'produce') bindProduceEvents((open) => { this.isAddProduceModalOpen = open; this.render(); });
    else if (this.currentTab === 'alerts') bindAlertsEvents(this.currentLang);
    else if (this.currentTab === 'troubleshoot') bindHelpEvents(this.currentLang);
    else if (this.currentTab === 'settings') bindSettingsEvents(this.currentLang, this.setLang.bind(this), this.setUserRole.bind(this));
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.navonmeshApp = new NavonmeshApp();
});
