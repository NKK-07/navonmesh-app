// NAVONMESH Master Application Controller & Router
// SIH 2026 Problem Statement 26005 Hardware Control Interface

import { hardwareService } from './data/mockHardware.js';

// Components
import { renderHeader, bindHeaderEvents } from './components/Header.js';
import { renderSidebar, bindSidebarEvents } from './components/Sidebar.js';
import { renderBottomNav, bindBottomNavEvents } from './components/BottomNav.js';
import { renderDemoPanel, bindDemoPanelEvents } from './components/DemoPanel.js';

// Views
import { renderLandingPage, bindLandingPageEvents } from './views/LandingPage.js';
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
import { renderHowItWorksPage } from './views/HowItWorksPage.js';
import { renderBuiltForNerPage } from './views/BuiltForNerPage.js';
import { renderImpactPage } from './views/ImpactPage.js';
import { renderSettingsPage, bindSettingsEvents } from './views/SettingsPage.js';

class NavonmeshApp {
  constructor() {
    this.currentTab = 'landing'; // Default landing page
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

    // Subscribe to hardware telemetry state updates
    hardwareService.subscribe(this.render.bind(this));

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
    else if (this.currentTab === 'landing') this.currentTab = 'dashboard';
    this.render();
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const hwState = hardwareService.getState();

    // If on Landing Page view
    if (this.currentTab === 'landing') {
      appEl.innerHTML = `
        ${renderHeader(hwState, this.currentLang, this.setLang.bind(this), (open) => { this.isDemoModalOpen = open; this.render(); })}
        <main class="main-content">
          ${renderLandingPage(this.currentLang, this.setUserRole.bind(this))}
        </main>
        ${renderDemoPanel(this.isDemoModalOpen)}
      `;

      bindHeaderEvents(hwState, this.currentLang, this.setLang.bind(this));
      bindLandingPageEvents((role) => this.setUserRole(role));
      bindDemoPanelEvents((open) => { this.isDemoModalOpen = open; this.render(); });
      return;
    }

    // Offline Banner if applicable
    const offlineBanner = !hwState.isOnline ? `
      <div style="background: #FEE2E2; border-bottom: 2px solid #EF4444; color: #B91C1C; text-align: center; padding: 10px; font-weight: 800; font-size: 14px;">
        🔴 OFFLINE MODE — Your cold storage is still working safely. Viewing locally cached hardware telemetry.
      </div>
    ` : '';

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
    else if (this.currentTab === 'how_it_works') mainViewHtml = renderHowItWorksPage(this.currentLang);
    else if (this.currentTab === 'built_for_ner') mainViewHtml = renderBuiltForNerPage(this.currentLang);
    else if (this.currentTab === 'impact') mainViewHtml = renderImpactPage(this.currentLang);
    else if (this.currentTab === 'settings') mainViewHtml = renderSettingsPage(hwState, this.currentLang, this.userRole);

    appEl.innerHTML = `
      ${renderHeader(hwState, this.currentLang, this.setLang.bind(this), (open) => { this.isDemoModalOpen = open; this.render(); })}
      ${offlineBanner}
      
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
