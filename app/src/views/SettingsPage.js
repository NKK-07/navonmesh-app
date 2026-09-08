// NAVONMESH Settings & Preferences View

import { getTranslation } from '../data/i18n.js';
import { hardwareService } from '../data/mockHardware.js';
import * as notify from '../utils/notifications.js';
import { icon } from '../components/icons.js';
import { getUser, isRemembered } from '../utils/api.js';
import {
  getOperatorNumber, setOperatorNumber, formatOperatorNumber
} from '../utils/contact.js';

export function renderSettingsPage(state, currentLang, userRole, tempUnit = 'C') {
  const user = getUser();
  const remembered = isRemembered();
  const operatorNumber = getOperatorNumber();
  /* What this ACCOUNT may open, from the token. The buttons used to be an
     open choice, so any farmer could put themselves in the fleet view. */
  const actualRole = (user || {}).role;
  const canFpo = actualRole === 'fpo_manager' || actualRole === 'admin';
  const canRetailer = actualRole === 'retailer' || actualRole === 'admin';
  const roleWord = getTranslation(currentLang,
    canFpo ? 'roleFpoManager' : canRetailer ? 'roleRetailer' : 'roleFarmer');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2.5v2.6M12 18.9v2.6M4.2 7l2.2 1.3M17.6 14.7l2.2 1.3M4.2 17l2.2-1.3M17.6 9.3l2.2-1.3"/></svg> ${getTranslation(currentLang, 'navSettings')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Configure interface preferences, rural audio alerts, and hardware unit parameters.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        
        <!-- Notifications -->
        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 6px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10.5 19a1.8 1.8 0 0 0 3 0"/></svg> Alerts on your phone</h3>
          <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 16px;">
            Your unit already sends SMS over the LoRa link. Turn this on and it will also reach this phone directly, which is faster and costs nothing.
          </p>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <span style="font-size: 14px; font-weight: 600;">Notifications</span>
              <button id="btnToggleNotify" class="btn-secondary" style="min-height: 40px; padding: 8px 16px;">Checking</button>
            </div>

            <p id="notifyState" style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); letter-spacing: 0.04em;">Checking this device</p>

            <div id="notifyOptions" style="display: none; flex-direction: column; gap: 12px; border-top: 1px solid var(--border-light); padding-top: 14px;">
              <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="notifyAction" style="width: 18px; height: 18px;">
                <span>Things needing action <span style="color: var(--text-muted);">(temperature, door, power)</span></span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="notifyInfo" style="width: 18px; height: 18px;">
                <span>Routine updates <span style="color: var(--text-muted);">(daily summaries)</span></span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;">
                <input type="checkbox" id="notifyQuiet" style="width: 18px; height: 18px;">
                <span>Quiet from 9pm to 5am <span style="color: var(--text-muted);">(urgent still comes through)</span></span>
              </label>
              <button id="btnTestNotify" class="btn-secondary" style="min-height: 44px;">Send me a test</button>
            </div>
          </div>
        </div>

        
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
          <h3 style="font-size: 18px; margin-bottom: 6px;">${icon('fpo', 18)} Your view</h3>
          <p style="color: var(--text-muted); font-size: 13.5px; margin-bottom: 16px;">
            ${canFpo || canRetailer
              ? 'You are signed in as ' + roleWord + '. These are the views your account can open.'
              : 'You are signed in as ' + roleWord + '. This is the view your account opens; the fleet view belongs to your FPO manager.'}
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn-secondary ${userRole === 'farmer' ? 'active' : ''}" id="btnSetFarmerRole" style="${userRole === 'farmer' ? 'border-color: var(--agri-green); background: var(--agri-green-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>‍<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5"/></svg> Farmer Simple View (Default)
            </button>
            ${canRetailer ? `<button class="btn-secondary ${userRole === 'retailer' ? 'active' : ''}" id="btnSetRetailerRole" style="${userRole === 'retailer' ? 'border-color: var(--solar-yellow); background: var(--solar-yellow-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h2.5l2 11h11M8 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M16 20a1 1 0 1 0 2 0 1 1 0 0 0-2 0M7 9h13l-1.5 5H8"/></svg> Small Vegetable Retailer Mode
            </button>` : ''}
            ${canFpo ? `<button class="btn-secondary ${userRole === 'fpo' ? 'active' : ''}" id="btnSetFpoRole" style="${userRole === 'fpo' ? 'border-color: var(--cooling-blue); background: var(--cooling-blue-light); font-weight: bold;' : ''}">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5V6l7-2.5V20.5M10.5 20.5h10V10h-10M13.5 13.5h1M17 13.5h1M13.5 17h1M17 17h1M6 8.5h1.5M6 12h1.5M6 15.5h1.5"/></svg> FPO / Cooperative Manager Fleet View
            </button>` : ''}
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

            <button class="btn-secondary" id="btnResetDemoData" style="border-color: #A6321F; color: #A6321F; margin-top: 10px;">
              <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 0 1 14.6-6M20.5 12a8.5 8.5 0 0 1-14.6 6M18.5 3v3.5H15M5.5 21v-3.5H9"/></svg> Reset Demo Hardware State
            </button>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 6px;">
            ${icon('phone', 18)} ${getTranslation(currentLang, 'callOperatorNumber')}
          </h3>
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 14px;">
            The number the Call operator button on the Alerts page dials. Until
            this is set, that button has nobody to reach.
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input class="lang-select" id="inputOperatorNumber" type="tel" inputmode="tel"
                   style="flex: 1 1 190px; min-width: 0;"
                   placeholder="+91 98620 12345"
                   value="${operatorNumber ? formatOperatorNumber(operatorNumber) : ''}">
            <button class="btn-secondary" id="btnSaveOperator" type="button">Save</button>
          </div>
          <p id="operatorSaved" style="color: var(--agri-green); font-size: 13px; margin-top: 8px;" hidden>Saved.</p>
        </div>

        <div class="card">
          <h3 style="font-size: 18px; margin-bottom: 6px;">
            ${icon('signout', 18)} ${getTranslation(currentLang, 'signOut')}
          </h3>
          <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 14px;">
            ${user
              ? `${getTranslation(currentLang, 'signedInAs')} <strong>${escapeHtml(user.name || '')}</strong>.`
              : ''}
            ${remembered
              ? 'This phone is set to keep you signed in.'
              : 'This session ends when you close the app.'}
          </p>
          <button class="btn-secondary" id="btnSignOutSettings" type="button"
                  style="border-color: #A6321F; color: #A6321F;">
            ${icon('signout', 18)} ${getTranslation(currentLang, 'signOut')}
          </button>
        </div>

      </div>

    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function bindSettingsEvents(currentLang, onLangChange, onSelectRole, onSignOut) {
  /* ---- notifications ---- */
  const toggleBtn = document.getElementById('btnToggleNotify');
  const stateLine = document.getElementById('notifyState');
  const options = document.getElementById('notifyOptions');

  const LABELS = {
    unsupported: ['Not available', 'This browser cannot show notifications.'],
    denied: ['Blocked', 'Notifications are blocked. Allow them in your browser settings for this site, then come back.'],
    default: ['Turn on', 'Not set up yet on this phone.'],
    'local-only': ['Turn off', 'On. Alerts reach you while the app is open or in the background.'],
    subscribed: ['Turn off', 'On. Alerts reach you even with the app closed.']
  };

  async function paintNotify() {
    if (!toggleBtn) return;
    const prefs = notify.getPrefs();
    let key = await notify.pushState();
    if (key === 'granted') key = 'local-only';
    if (!prefs.enabled && (key === 'local-only' || key === 'subscribed')) key = 'default';

    const [btn, line] = LABELS[key] || LABELS.default;
    toggleBtn.textContent = btn;
    stateLine.textContent = line;
    toggleBtn.disabled = (key === 'unsupported' || key === 'denied');

    const on = prefs.enabled && (key === 'local-only' || key === 'subscribed');
    options.style.display = on ? 'flex' : 'none';
    if (on) {
      document.getElementById('notifyAction').checked = !!prefs.levels.action;
      document.getElementById('notifyInfo').checked = !!prefs.levels.info;
      document.getElementById('notifyQuiet').checked = !!prefs.quietHours.on;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', async () => {
      const prefs = notify.getPrefs();
      toggleBtn.disabled = true;
      if (prefs.enabled) {
        await notify.disable();
      } else {
        const res = await notify.enable({ lang: currentLang });
        if (!res.ok && res.reason === 'denied') {
          stateLine.textContent = LABELS.denied[1];
        }
      }
      await paintNotify();
    });

    ['notifyAction', 'notifyInfo', 'notifyQuiet'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const prefs = notify.getPrefs();
        if (id === 'notifyQuiet') {
          notify.setPrefs({ quietHours: { ...prefs.quietHours, on: el.checked } });
        } else {
          const level = id === 'notifyAction' ? 'action' : 'info';
          notify.setPrefs({ levels: { ...prefs.levels, [level]: el.checked } });
        }
      });
    });

    const testBtn = document.getElementById('btnTestNotify');
    if (testBtn) testBtn.addEventListener('click', () => notify.sendTest());

    paintNotify();
  }

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

  /* ---- operator number ---- */
  const opInput = document.getElementById('inputOperatorNumber');
  const opSave = document.getElementById('btnSaveOperator');
  const opSaved = document.getElementById('operatorSaved');
  if (opSave && opInput) {
    const save = () => {
      const stored = setOperatorNumber(opInput.value);
      opInput.value = stored ? formatOperatorNumber(stored) : '';
      if (opSaved) {
        opSaved.textContent = stored
          ? 'Saved. The Alerts page will dial ' + formatOperatorNumber(stored) + '.'
          : 'Cleared. The Alerts page has no number to dial.';
        opSaved.hidden = false;
      }
    };
    opSave.addEventListener('click', save);
    opInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
  }

  /* ---- sign out ---- */
  const outBtn = document.getElementById('btnSignOutSettings');
  if (outBtn && onSignOut) outBtn.addEventListener('click', onSignOut);
}
