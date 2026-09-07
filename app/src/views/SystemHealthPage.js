// NAVONMESH System Diagnostics & Device Health View

import { getTranslation } from '../data/i18n.js';

export function renderSystemHealthPage(state, currentLang) {
  const s = state.sensors;

  const sensorRows = [
    { name: 'ESP32 Dual-Core MCU', desc: 'Main System Controller & Sensor Bus', status: '<i class="dot dot-ok"></i> Healthy', detail: s.esp32.temp },
    { name: 'SHT31 Temperature Sensor', desc: 'Chamber Air Temp (Accuracy ±0.3°C)', status: '<i class="dot dot-ok"></i> Calibrated', detail: 'Calibrated 01 Aug' },
    { name: 'SHT31 Humidity Sensor', desc: 'Chamber Relative Humidity (Accuracy ±2%)', status: '<i class="dot dot-ok"></i> Calibrated', detail: 'Calibrated 01 Aug' },
    { name: '48V LiFePO4 BMS', desc: 'Battery Management System', status: '<i class="dot dot-ok"></i> Healthy', detail: `${s.batteryBms.healthPct}% Health` },
    { name: 'BLDC Variable Compressor', desc: 'DC Inverter Refrigeration Loop', status: '<i class="dot dot-ok"></i> Healthy', detail: s.compressor.runtimeHours },
    { name: 'Magnetic Reed Door Switch', desc: 'Door Seal Contact Switch', status: state.doorOpen ? '<i class="dot dot-warn"></i> Open' : '<i class="dot dot-ok"></i> Healthy', detail: 'Real-time' },
    { name: '4-Point Load Cell', desc: 'Produce Weight Strain Gauge', status: '<i class="dot dot-ok"></i> Healthy', detail: s.loadCell.accuracy },
    { name: 'Electrochemical Ethylene Sensor', desc: 'Ripening Gas Detector', status: '<i class="dot dot-ok"></i> Healthy', detail: 'Normal' },
    { name: 'SX1276 LoRa Transceiver', desc: 'Long Range 868MHz Radio', status: '<i class="dot dot-ok"></i> Healthy', detail: '8km Range' }
  ];

  const rowsHtml = sensorRows.map(r => `
    <tr style="border-bottom: 1px solid var(--border-light);">
      <td style="padding: 14px;">
        <strong style="font-size: 15px; color: var(--text-dark);">${r.name}</strong>
        <div style="font-size: 12px; color: var(--text-muted);">${r.desc}</div>
      </td>
      <td style="padding: 14px; font-weight: bold; font-size: 14px;">${r.status}</td>
      <td style="padding: 14px; font-size: 13px; color: var(--text-muted);">${r.detail}</td>
    </tr>
  `).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12h4l2-5 3.5 10 2.5-5h7"/></svg> ${getTranslation(currentLang, 'navHealth')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Self-diagnostic status of all physical sensors, MCU, and actuators.</p>
      </div>

      <!-- Maintenance Schedule Banner -->
      <div class="card" style="background: var(--bg-card); border-left: 6px solid var(--agri-green); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <strong style="font-size: 16px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 5.5h17v15h-17zM3.5 10h17M8 3v4M16 3v4"/></svg> Hardware Maintenance Schedule</strong>
          <div style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">
            Last Maintenance: <strong>${state.lastMaintenanceDate}</strong> | Next Recommended Check: <strong>${state.nextCheckDate}</strong>
          </div>
        </div>
        <span class="metric-status-badge safe">✓ SYSTEM FULLY INSPECTED</span>
      </div>

      <!-- Sensor Diagnostic Matrix -->
      <div class="card" style="padding: 0; overflow-hidden;">
        <div style="padding: 20px 24px; border-bottom: 2px solid var(--border-light);">
          <h3 style="font-size: 18px;">Hardware Sensor Health Matrix</h3>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--bg-main); text-align: left; font-size: 13px; color: var(--text-muted);">
                <th style="padding: 12px 14px;">Sensor / Module Component</th>
                <th style="padding: 12px 14px;">Diagnostic Status</th>
                <th style="padding: 12px 14px;">Specification / Telemetry</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
