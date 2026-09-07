// NAVONMESH Floating Demo Controller for Hackathon Demonstration & Judging

import { hardwareService } from '../data/mockHardware.js';

export function renderDemoPanel(isOpen) {
  if (!isOpen) {
    return `
      <button class="demo-floating-trigger" id="btnOpenDemoModal">
        <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15.5h16M6 8.5h12l2 11H4zM9 12h2M10 11v2M15 11.5h.01M17 13.5h.01"/></svg> <span>SIH DEMO SIMULATOR</span>
      </button>
    `;
  }

  return `
    <button class="demo-floating-trigger" id="btnOpenDemoModal">
      <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15.5h16M6 8.5h12l2 11H4zM9 12h2M10 11v2M15 11.5h.01M17 13.5h.01"/></svg> <span>SIH DEMO SIMULATOR</span>
    </button>

    <div class="demo-modal-overlay" id="demoOverlay">
      <div class="demo-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 20px; color: var(--solar-yellow-dark);"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15.5h16M6 8.5h12l2 11H4zM9 12h2M10 11v2M15 11.5h.01M17 13.5h.01"/></svg> Live Simulated Hardware Data Panel</h2>
          <button id="btnCloseDemoModal" style="font-size: 24px; font-weight: bold; padding: 4px 10px;">✕</button>
        </div>

        <p style="font-size: 13px; color: var(--text-muted);">
          Use these preset hardware scenarios to demonstrate SIH Problem Statement 26005 cold-storage state transitions to hackathon judges.
        </p>

        <div class="demo-buttons-grid">
          <button class="btn-demo-scenario" data-scenario="normal">
            <i class="dot dot-ok"></i> Normal Condition<br><span style="font-size:11px; font-weight:normal;">8°C | 91% | 78% Bat</span>
          </button>
          <button class="btn-demo-scenario" data-scenario="high_temp">
            <i class="dot dot-danger"></i> High Temp Alert<br><span style="font-size:11px; font-weight:normal;">12.8°C | Door Check</span>
          </button>
          <button class="btn-demo-scenario" data-scenario="low_battery">
            <i class="dot dot-warn"></i> Low Battery & PCM<br><span style="font-size:11px; font-weight:normal;">24% Bat ➔ PCM ONLY</span>
          </button>
          <button class="btn-demo-scenario" data-scenario="door_open">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11v17H5zM13 12h.01"/></svg> Door Open 4m<br><span style="font-size:11px; font-weight:normal;">Warning & Temp Rise</span>
          </button>
          <button class="btn-demo-scenario" data-scenario="cloudy">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5a4.5 4.5 0 0 1 .6-9A6 6 0 0 1 19 11a3.75 3.75 0 0 1-.5 7.5z"/></svg> Low Solar (Monsoon)<br><span style="font-size:11px; font-weight:normal;">0.4 kW Solar Gen</span>
          </button>
          <button class="btn-demo-scenario" data-scenario="emergency">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5 21.5 20h-19zM12 10v4.5M12 17.2h.01"/></svg> Emergency Fault<br><span style="font-size:11px; font-weight:normal;">12% Bat + Alarm</span>
          </button>
        </div>

        <div style="background: var(--bg-main); padding: 16px; border: 1px solid var(--border-light); margin-top: 10px;">
          <h4 style="font-size: 14px; margin-bottom: 8px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20v-3M9.3 20v-7M14.7 20v-11M20 20V6"/></svg> Offline Mode Toggle:</h4>
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold;">
            <input type="checkbox" id="toggleOfflineCheck" ${!hardwareService.state.isOnline ? 'checked' : ''} style="width: 20px; height: 20px;">
            <span>Simulate Rural Connection Loss (PWA Offline Mode)</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

export function bindDemoPanelEvents(onToggleModal) {
  const openBtn = document.getElementById('btnOpenDemoModal');
  if (openBtn) {
    openBtn.addEventListener('click', () => onToggleModal(true));
  }

  const closeBtn = document.getElementById('btnCloseDemoModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => onToggleModal(false));
  }

  const scenarioBtns = document.querySelectorAll('.btn-demo-scenario');
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-scenario');
      hardwareService.triggerScenario(scenario);
      onToggleModal(false);
    });
  });

  const offlineCheck = document.getElementById('toggleOfflineCheck');
  if (offlineCheck) {
    offlineCheck.addEventListener('change', (e) => {
      hardwareService.setOfflineMode(e.target.checked);
    });
  }
}
