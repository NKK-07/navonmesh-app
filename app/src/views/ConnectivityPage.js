// NAVONMESH Multi-Tier Connectivity Architecture & Offline First View

import { getTranslation } from '../data/i18n.js';

export function renderConnectivityPage(state, currentLang) {
  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">📡 ${getTranslation(currentLang, 'navConnectivity')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Resilient multi-tier wireless telemetry built for remote North Eastern villages.</p>
      </div>

      <!-- Offline First Guarantee Card -->
      <div class="card" style="background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%); border: 2px solid var(--agri-green);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <span style="font-size: 40px;">🛡️</span>
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
          <div style="font-size: 24px; font-weight: 900; color: #10B981; margin-top: 4px;">🟢 CONNECTED</div>
          <span style="font-size: 12px; color: var(--text-muted);">Primary Village Network</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">GSM / SMS BACKUP</span>
          <div style="font-size: 24px; font-weight: 900; color: #10B981; margin-top: 4px;">🟢 READY</div>
          <span style="font-size: 12px; color: var(--text-muted);">Fallback Alert Dispatch</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">WI-FI LOCAL AP</span>
          <div style="font-size: 24px; font-weight: 900; color: #F59E0B; margin-top: 4px;">🟡 STANDBY</div>
          <span style="font-size: 12px; color: var(--text-muted);">Direct Tablet Connection</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">CLOUD SYNC</span>
          <div style="font-size: 24px; font-weight: 900; color: #64748B; margin-top: 4px;">${state.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}</div>
          <span style="font-size: 12px; color: var(--text-muted);">Cached Locally via PWA</span>
        </div>
      </div>

      <!-- Communication Hierarchy Flow -->
      <div class="card">
        <h3 style="font-size: 18px; margin-bottom: 20px;">🌐 Multi-Tier Failover Communication Hierarchy</h3>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: #F0FDF4; border: 2px solid #10B981; padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #047857;">1. LoRa Primary (868 MHz)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Transmits telemetry to local village collection hub up to 10 km away with ultra-low power consumption.</div>
            </div>
            <span class="metric-status-badge safe">PRIMARY ACTIVE</span>
          </div>

          <div style="background: #FFFBEB; border: 2px solid #F59E0B; padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #B45309;">2. SMS Fallback (2G/4G GSM)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Sends critical emergency SMS alerts directly to farmer and operator mobile phones during zero-data blackouts.</div>
            </div>
            <span class="metric-status-badge warning">STANDBY READY</span>
          </div>

          <div style="background: #F1F5F9; border: 2px solid #94A3B8; padding: 16px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <strong style="font-size: 16px; color: #334155;">3. Wi-Fi / Cloud Sync (When Available)</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Syncs long-term historical analytics to regional FPO database whenever internet connectivity is restored.</div>
            </div>
            <span class="metric-status-badge" style="background: #E2E8F0; color: #475569;">OPPORTUNISTIC</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
