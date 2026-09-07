// NAVONMESH Multi-Tier Connectivity Architecture & Offline First View

import { getTranslation } from '../data/i18n.js';

export function renderConnectivityPage(state, currentLang) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 18h.01M8.5 14.5a5 5 0 0 1 7 0M5.5 11.5a9 9 0 0 1 13 0M2.5 8.5a13 13 0 0 1 19 0"/></svg> ${getTranslation(currentLang, 'navConnectivity')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Resilient multi-tier wireless telemetry built for remote North Eastern villages.</p>
      </div>

      <!-- Offline First Guarantee Card -->
      <div class="card" style="background: linear-gradient(135deg, #E4EFE9 0%, #FFFDFA 100%); border: 2px solid var(--agri-green);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 40px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3 7.7 7.5 9 4.5-1.3 7.5-4.5 7.5-9V6z"/></svg></span>
          <div>
            <h2 style="font-size: 20px; color: var(--agri-green-dark);">100% Offline-First Protection</h2>
            <p style="font-size: 15px; color: var(--text-dark); font-weight: 600; margin-top: 2px;">
              “Your cold storage is completely self-contained. It monitors, cools, and protects produce even when zero cellular internet is available.”
            </p>
          </div>
        </div>
      </div>

      <!-- Connection Status Badges -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">LORA RADIO (868 MHz)</span>
          <div style="font-size: 24px; font-weight: 900; color: #04785C; margin-top: 4px;"><i class="dot dot-ok"></i> CONNECTED</div>
          <span style="font-size: 12px; color: var(--text-muted);">Primary Village Network</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">GSM / SMS BACKUP</span>
          <div style="font-size: 24px; font-weight: 900; color: #04785C; margin-top: 4px;"><i class="dot dot-ok"></i> READY</div>
          <span style="font-size: 12px; color: var(--text-muted);">Fallback Alert Dispatch</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">WI-FI LOCAL AP</span>
          <div style="font-size: 24px; font-weight: 900; color: #A9601F; margin-top: 4px;"><i class="dot dot-warn"></i> STANDBY</div>
          <span style="font-size: 12px; color: var(--text-muted);">Direct Tablet Connection</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">CLOUD SYNC</span>
          <div style="font-size: 24px; font-weight: 900; color: #6B5F55; margin-top: 4px;">${state.isOnline ? '<i class="dot dot-ok"></i> ONLINE' : '<i class="dot dot-danger"></i> OFFLINE'}</div>
          <span style="font-size: 12px; color: var(--text-muted);">Cached Locally via PWA</span>
        </div>
      </div>

      <!-- Communication Hierarchy Flow -->
      <div class="card">
        <h3 style="font-size: 18px; margin-bottom: 20px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21M12 3C9.5 5.6 8.2 8.6 8.2 12s1.3 6.4 3.8 9"/></svg> Multi-Tier Failover Communication Hierarchy</h3>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: #E4EFE9; border: 2px solid #04785C; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #04785C;">1. LoRa Primary (868 MHz)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Transmits telemetry to local village collection hub up to 10 km away with ultra-low power consumption.</div>
            </div>
            <span class="metric-status-badge safe">PRIMARY ACTIVE</span>
          </div>

          <div style="background: #F8EEDF; border: 2px solid #A9601F; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #A9601F;">2. SMS Fallback (2G/4G GSM)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Sends critical emergency SMS alerts directly to farmer and operator mobile phones during zero-data blackouts.</div>
            </div>
            <span class="metric-status-badge warning">STANDBY READY</span>
          </div>

          <div style="background: #FBF7F1; border: 2px solid #8C7F73; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #3C352F;">3. Wi-Fi / Cloud Sync (When Available)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Syncs long-term historical analytics to regional FPO database whenever internet connectivity is restored.</div>
            </div>
            <span class="metric-status-badge" style="background: #E5DDD2; color: #6B5F55;">OPPORTUNISTIC</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
