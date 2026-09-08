// NAVONMESH Master Application Controller & Router
// SIH 2026 Problem Statement 26005 Hardware Control Interface

import { hardwareService } from './data/mockHardware.js';
import * as notify from './utils/notifications.js';
import { isSignedIn, getUser, signOut } from './utils/api.js';
import {
  live, onLiveChange, refreshLive, refreshAfterWrite, hydrateFromCache, clearLive
} from './data/live.js';
import {
  createBatch, updateBatch, removeBatch, setFleetSetpoint
} from './utils/api.js';
import { renderLoginPage, bindLoginEvents } from './views/LoginPage.js';

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
import { renderFpoDashboard, bindFpoEvents } from './views/FpoDashboard.js';
import { renderSettingsPage, bindSettingsEvents } from './views/SettingsPage.js';

/* The database spells it fpo_manager; the views have always said fpo. One
   translation, in one place, rather than both spellings leaking everywhere. */
function roleOf(user) {
  const r = user && user.role;
  if (r === 'fpo_manager') return 'fpo';
  if (r === 'admin') return 'admin';
  if (r === 'retailer') return 'retailer';
  return 'farmer';
}

class NavonmeshApp {
  constructor() {
    /* Where you land is who you are. A manager reopening the app wants the
       fleet, not one farmer's chamber; setting this only on the sign-in path
       meant every reload dropped them back on the farmer dashboard. */
    this.currentTab = roleOf(getUser()) === 'fpo' ? 'fpo' : 'dashboard';
    this.currentLang = 'en';
    /* The role comes from the signed token, not from a button. Settings used
       to offer 'FPO Manager Fleet View' as a free choice, so any farmer could
       click once and be looking at a regional fleet screen. The backend has
       app_is_manager() and a policy set written to stop exactly that; the app
       simply never asked. */
    this.userRole = roleOf(getUser());
    this.selectedCropId = 'cabbage';
    this.isDemoModalOpen = false;
    this.isAddProduceModalOpen = false;
    this.editingBatchId = null;
    this.fleetNotice = null;
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

    // A token that expired or was revoked drops the app back to the login
    // screen rather than leaving it showing data it can no longer refresh.
    window.addEventListener('navonmesh:signed-out', () => this.render());

    // Subscribe to hardware telemetry state updates
    hardwareService.subscribe(state => {
      // Notifications ride the same tick as the render, so an alert raised by
      // the hardware reaches the phone without a second polling loop.
      notify.syncFromState(state);
      this.render(state);
    });
    notify.syncFromState(hardwareService.getState());

    // Real data, kept apart from the simulation above. The cache paints first
    // so a farmer opening the app on a weak signal sees this morning's produce
    // instead of an empty screen, then the network confirms or corrects it.
    onLiveChange(() => this.render());
    hydrateFromCache();
    this.refreshLive();

    // The database is not a telemetry feed; a minute is plenty and it keeps
    // the compute from being woken on every animation tick.
    this.liveTimer = setInterval(() => this.refreshLive(), 60_000);
    window.addEventListener('online', () => this.refreshLive());

    // Coming back to the app is the moment its data is most likely to be
    // wrong, and the poll above is a minute wide. A manager sets a target
    // temperature in one window, switches to the farmer login in another, and
    // nothing fired: not a write, not `online`, and the timer had fifty
    // seconds left. Refreshing on focus is what makes the two agree.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refreshLive(true);
    });
    window.addEventListener('focus', () => this.refreshLive(true));

    // Initial Render
    this.render();
  }

  /**
   * @param light  fetch only what a manager can have changed under you: the
   *   units (setpoint, totals) and the produce. The other three calls are
   *   alerts, readings and the profile, and dragging them along made coming
   *   back to the window take fifteen seconds to show a new target
   *   temperature. The full refresh still runs on load and on the timer.
   */
  refreshLive(light = false) {
    if (!isSignedIn()) return;
    const opts = light ? { only: ['units', 'batches'] } : {};
    refreshLive(opts).catch(err => console.warn('[live] refresh failed:', err.message));
  }

  setTab(tabId) {
    this.fleetNotice = null;
    this.currentTab = tabId;
    window.scrollTo(0, 0);
    this.render();
    /* Opening a screen is asking to see what is on it. Cheap because the
       refresh only fetches units and produce, and it means a farmer who taps
       Produce sees the setpoint their manager changed a moment ago. */
    this.refreshLive(true);
  }

  /* Signing out has to clear more than the token. The tab, the selected crop
     and the role view are all about the person who was signed in, and leaving
     them set means the next person to sign in on a shared handset lands on the
     last screen the previous one was looking at. */
  handleSignOut() {
    signOut();
    /* The cache holds this farmer's produce and their unit. It cannot be
       left on the device for whoever signs in next. */
    clearLive();
    this.currentTab = 'dashboard';
    this.selectedCropId = null;
    this.userRole = roleOf(getUser());   // null user, so back to 'farmer'
    this.isDemoModalOpen = false;
    this.isAddProduceModalOpen = false;
    this.editingBatchId = null;
    this.render();
  }

  setLang(langCode) {
    this.currentLang = langCode;
    this.render();
  }

  /* A view a role is not entitled to is not offered, and asking for it
     anyway does nothing. The server would refuse the data regardless, so this
     is about not showing a screen that cannot be filled. */
  setUserRole(role) {
    if (!this.canUseView(role)) return;
    this.userRole = role;
    if (role === 'retailer') this.currentTab = 'retailer';
    else if (role === 'fpo') this.currentTab = 'fpo';
    else this.currentTab = 'dashboard';
    this.render();
  }

  canUseView(view) {
    const actual = roleOf(getUser());
    if (view === 'farmer') return true;            // everyone stores produce
    if (view === 'fpo') return actual === 'fpo' || actual === 'admin';
    if (view === 'retailer') return actual === 'retailer' || actual === 'admin';
    return false;
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    // Nothing renders until there is a session. The unit's readings belong to
    // whoever the FPO registered, and the server will refuse them anyway, so
    // showing a dashboard first would only ever be a dashboard of nothing.
    if (!isSignedIn()) {
      appEl.innerHTML = renderLoginPage();
      bindLoginEvents(() => {
        /* Whoever just signed in decides the role and the opening screen. A
           manager lands on their fleet, a farmer on their own unit. */
        this.userRole = roleOf(getUser());
        this.currentTab = this.userRole === 'fpo' ? 'fpo' : 'dashboard';
        this.refreshLive();
        this.render();
      });
      return;
    }

    const hwState = hardwareService.getState();

    // Render active tab view
    let mainViewHtml = '';
    if (this.currentTab === 'dashboard') mainViewHtml = renderFarmerDashboard(hwState, this.currentLang);
    else if (this.currentTab === 'storage') mainViewHtml = renderStorageMonitor(hwState, this.currentLang);
    else if (this.currentTab === 'performance') mainViewHtml = renderPerformancePage(hwState, this.performanceTimeframe);
    else if (this.currentTab === 'crops') mainViewHtml = renderCropProfilesPage(hwState, this.currentLang, this.selectedCropId);
    else if (this.currentTab === 'shelflife') mainViewHtml = renderShelfLifePage(hwState, this.currentLang);
    else if (this.currentTab === 'produce') mainViewHtml = renderProducePage(hwState, this.currentLang, this.isAddProduceModalOpen, this.editingBatchId);
    else if (this.currentTab === 'energy') mainViewHtml = renderEnergyPage(hwState, this.currentLang);
    else if (this.currentTab === 'pcm') mainViewHtml = renderPcmPage(hwState, this.currentLang);
    else if (this.currentTab === 'alerts') mainViewHtml = renderAlertsPage(hwState, this.currentLang);
    else if (this.currentTab === 'health') mainViewHtml = renderSystemHealthPage(hwState, this.currentLang);
    else if (this.currentTab === 'connectivity') mainViewHtml = renderConnectivityPage(hwState, this.currentLang);
    else if (this.currentTab === 'troubleshoot') mainViewHtml = renderHelpPage(hwState, this.currentLang);
    else if (this.currentTab === 'retailer') mainViewHtml = renderRetailerDashboard(hwState);
    else if (this.currentTab === 'fpo') mainViewHtml = renderFpoDashboard(this.currentLang, this.fleetNotice);
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
    bindSidebarEvents(this.setTab.bind(this), this.handleSignOut.bind(this));

    /* Any control anywhere can send the user to a tab by carrying
       data-goto-tab, so a view does not need its own navigation callback
       threaded through app.js just to link somewhere. */
    document.querySelectorAll('[data-goto-tab]').forEach(el => {
      el.addEventListener('click', () => this.setTab(el.dataset.gotoTab));
    });
    bindBottomNavEvents(this.setTab.bind(this));
    bindDemoPanelEvents((open) => { this.isDemoModalOpen = open; this.render(); });

    if (this.currentTab === 'dashboard') bindFarmerDashboardEvents(hwState, this.currentLang, this.setTab.bind(this));
    else if (this.currentTab === 'performance') bindPerformanceEvents((tf) => { this.performanceTimeframe = tf; this.render(); });
    else if (this.currentTab === 'crops') bindCropProfilesEvents(this.selectedCropId, (cropId) => { this.selectedCropId = cropId; this.render(); });
    else if (this.currentTab === 'produce') bindProduceEvents({
      onToggleModal: open => { this.isAddProduceModalOpen = open; this.render(); },
      onEdit: id => { this.editingBatchId = id; this.render(); },
      /* Each of these refreshes from the server rather than patching local
         state from the response. The database is the thing that decides what
         happened, and a screen that updates itself optimistically is a screen
         that can disagree with it. */
      onSave: async (id, changes) => {
        await updateBatch(id, changes);
        this.editingBatchId = null;
        await refreshAfterWrite();
      },
      onCreate: async data => {
        const unit = (live().units || [])[0];
        if (!unit) throw new Error('no unit to store produce in yet');
        await createBatch({ ...data, unit_id: unit.id });
        this.isAddProduceModalOpen = false;
        await refreshAfterWrite();
      },
      onRemove: async id => {
        await removeBatch(id);
        this.editingBatchId = null;
        await refreshAfterWrite();
      }
    });
    else if (this.currentTab === 'alerts') bindAlertsEvents(this.currentLang);
    else if (this.currentTab === 'troubleshoot') bindHelpEvents(this.currentLang);
    else if (this.currentTab === 'fpo') bindFpoEvents({
      onSetpoint: async value => {
        const result = await setFleetSetpoint(value);
        this.fleetNotice = 'Set to ' + value.toFixed(1) + '°C on ' +
          (result && result.updated ? result.updated : 'all') +
          ' units. Every farmer on them sees this now.';
        await refreshAfterWrite();
        return result;
      }
    });
    else if (this.currentTab === 'settings') bindSettingsEvents(this.currentLang, this.setLang.bind(this), this.setUserRole.bind(this), this.handleSignOut.bind(this));
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.navonmeshApp = new NavonmeshApp();
});
