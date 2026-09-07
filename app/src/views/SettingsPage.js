// NAVONMESH Settings & Preferences View

import { getTranslation } from '../data/i18n.js';
import { hardwareService } from '../data/mockHardware.js';

export function renderSettingsPage(state, currentLang, userRole, tempUnit = 'C') {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2.5v2.6M12 18.9v2.6M4.2 7l2.2 1.3M17.6 14.7l2.2 1.3M4.2 17l2.2-1.3M17.6 9.3l2.2-1.3"/></svg> ${getTranslation(currentLang, 'navSettings')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Configure interface preferences, rural audio alerts, and hardware unit parameters.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        
        <!-- Language & Audio Settings -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/></svg> Language & Voice Accessibility</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">App Language</label>
              <select id="selectSettingsLang" class="lang-select" style="width: 100%;">
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

            <label style="display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 14px; cursor: pointer;">
              <input type="checkbox" checked style="width: 20px; height: 20px;">
              <span>Enable Automatic Voice Alerts (Browser Speech Synthesis)</span>
            </label>
          </div>
        </div>

        <!-- User Role Switcher -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>‍<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5"/></svg> Active User Interface Mode</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn-secondary ${userRole === 'farmer' ? 'active' : ''}" id="btnSetFarmerRole" style="${userRole === 'farmer' ? 'border-color: var(--agri-green); background: var(--agri-green-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>‍<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5"/></svg> Farmer Simple View (Default)
            </button>
            <button class="btn-secondary ${userRole === 'retailer' ? 'active' : ''}" id="btnSetRetailerRole" style="${userRole === 'retailer' ? 'border-color: var(--solar-yellow); background: var(--solar-yellow-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h2.5l2 11h11M8 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M16 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M7 9h13l-1.5 5H8"/></svg> Small Vegetable Retailer Mode
            </button>
            <button class="btn-secondary ${userRole === 'fpo' ? 'active' : ''}" id="btnSetFpoRole" style="${userRole === 'fpo' ? 'border-color: var(--cooling-blue); background: var(--cooling-blue-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5V6l7-2.5V20.5M10.5 20.5h10V10h-10M13.5 13.5h1M17 13.5h1M13.5 17h1M17 17h1M6 8.5h1.5M6 12h1.5M6 15.5h1.5"/></svg> FPO / Cooperative Manager Fleet View
            </button>
          </div>
        </div>

        <!-- Temperature Units & Hardware -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0M12 9v5.5"/></svg> Measurement Units & Reset</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">Temperature Scale</label>
              <select id="selectTempUnit" class="lang-select" style="width: 100%;">
                <option value="C" ${tempUnit === 'C' ? 'selected' : ''}>Celsius (°C)</option>
                <option value="F" ${tempUnit === 'F' ? 'selected' : ''}>Fahrenheit (°F)</option>
              </select>
            </div>

            <button class="btn-secondary" id="btnResetDemoData" style="border-color: #B91C1C; color: #B91C1C; margin-top: 10px;">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 0 1 14.6-6M20.5 12a8.5 8.5 0 0 1-14.6 6M18.5 3v3.5H15M5.5 21v-3.5H9"/></svg> Reset Demo Hardware State
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

export function bindSettingsEvents(currentLang, onLangChange, onSelectRole) {
  const langSel = document.getElementById('selectSettingsLang');
  if (langSel) langSel.addEventListener('change', (e) => onLangChange(e.target.value));

  const fBtn = document.getElementById('btnSetFarmerRole');
  if (fBtn) fBtn.addEventListener('click', () => onSelectRole('farmer'));

  const rBtn = document.getElementById('btnSetRetailerRole');
  if (rBtn) rBtn.addEventListener('click', () => onSelectRole('retailer'));

  const fpoBtn = document.getElementById('btnSetFpoRole');
  if (fpoBtn) fpoBtn.addEventListener('click', () => onSelectRole('fpo'));

  const resetBtn = document.getElementById('btnResetDemoData');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('navonmesh_hw_state');
      hardwareService.triggerScenario('normal');
      alert('✓ Hardware simulation reset to default state.');
    });
  }
}
