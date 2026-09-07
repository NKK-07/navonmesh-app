// NAVONMESH Settings & Preferences View

import { getTranslation } from '../data/i18n.js';
import { hardwareService } from '../data/mockHardware.js';

export function renderSettingsPage(state, currentLang, userRole, tempUnit = 'C') {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">⚙️ ${getTranslation(currentLang, 'navSettings')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Configure interface preferences, rural audio alerts, and hardware unit parameters.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        
        <!-- Language & Audio Settings -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 16px;">🌐 Language & Voice Accessibility</h3>
          
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
          <h3 style="font-size: 18px; margin-bottom: 16px;">👨‍🌾 Active User Interface Mode</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn-secondary ${userRole === 'farmer' ? 'active' : ''}" id="btnSetFarmerRole" style="${userRole === 'farmer' ? 'border-color: var(--agri-green); background: var(--agri-green-light); font-weight: bold;' : ''}">
              👨‍🌾 Farmer Simple View (Default)
            </button>
            <button class="btn-secondary ${userRole === 'retailer' ? 'active' : ''}" id="btnSetRetailerRole" style="${userRole === 'retailer' ? 'border-color: var(--solar-yellow); background: var(--solar-yellow-light); font-weight: bold;' : ''}">
              🛒 Small Vegetable Retailer Mode
            </button>
            <button class="btn-secondary ${userRole === 'fpo' ? 'active' : ''}" id="btnSetFpoRole" style="${userRole === 'fpo' ? 'border-color: var(--cooling-blue); background: var(--cooling-blue-light); font-weight: bold;' : ''}">
              🏢 FPO / Cooperative Manager Fleet View
            </button>
          </div>
        </div>

        <!-- Temperature Units & Hardware -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 16px;">🌡️ Measurement Units & Reset</h3>
          
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">Temperature Scale</label>
              <select id="selectTempUnit" class="lang-select" style="width: 100%;">
                <option value="C" ${tempUnit === 'C' ? 'selected' : ''}>Celsius (°C)</option>
                <option value="F" ${tempUnit === 'F' ? 'selected' : ''}>Fahrenheit (°F)</option>
              </select>
            </div>

            <button class="btn-secondary" id="btnResetDemoData" style="border-color: #DC2626; color: #DC2626; margin-top: 10px;">
              🔄 Reset Demo Hardware State
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
