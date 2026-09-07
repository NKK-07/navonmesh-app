// NAVONMESH FPO & Cooperative Manager Fleet Dashboard View

export function renderFpoDashboard() {
  const units = [
    { id: 'NVM-001', location: 'Shillong Village Hub', status: '🟢 Healthy', produceKg: 186, capKg: 200, temp: 8.2, bat: 78 },
    { id: 'NVM-002', location: 'Tura Cluster Centre', status: '🟢 Healthy', produceKg: 140, capKg: 200, temp: 7.8, bat: 92 },
    { id: 'NVM-003', location: 'Aizawl Mountain Route', status: '🟡 Warning', produceKg: 192, capKg: 200, temp: 10.2, bat: 35 },
    { id: 'NVM-004', location: 'Kohima Collection Post', status: '🟢 Healthy', produceKg: 165, capKg: 200, temp: 8.0, bat: 84 },
    { id: 'NVM-005', location: 'Imphal Valley Hub', status: '🟢 Healthy', produceKg: 178, capKg: 200, temp: 7.5, bat: 89 },
    { id: 'NVM-006', location: 'Gangtok High Altitude', status: '🔴 Critical', produceKg: 198, capKg: 200, temp: 13.4, bat: 18 }
  ];

  const unitsCardsHtml = units.map(u => `
    <div class="card" style="border-top: 4px solid ${u.status.includes('Healthy') ? '#10B981' : u.status.includes('Warning') ? '#F59E0B' : '#EF4444'};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="font-size: 18px; color: var(--text-dark);">${u.id}</strong>
        <span class="metric-status-badge ${u.status.includes('Healthy') ? 'safe' : u.status.includes('Warning') ? 'warning' : 'critical'}">${u.status}</span>
      </div>
      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">📍 ${u.location}</div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: var(--bg-main); padding: 10px; border-radius: var(--radius-sm); font-size: 12px; text-align: center;">
        <div>
          <span style="color: var(--text-muted);">Weight</span>
          <div style="font-weight: bold; color: var(--agri-green-dark);">${u.produceKg}/${u.capKg}kg</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Temp</span>
          <div style="font-weight: bold; color: var(--cooling-blue-dark);">${u.temp}°C</div>
        </div>
        <div>
          <span style="color: var(--text-muted);">Battery</span>
          <div style="font-weight: bold;">${u.bat}%</div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">🏢 FPO / Cooperative Regional Fleet Manager</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Monitoring 12 NAVONMESH Mini Cold Storage units across North Eastern states.</p>
      </div>

      <!-- Fleet Stats Banner -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">TOTAL DEPLOYED UNITS</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--text-dark); margin-top: 4px;">12 Units</div>
          <span style="font-size: 12px; color: #10B981; font-weight: bold;">9 Healthy | 2 Warning | 1 Critical</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">TOTAL PRODUCE SAVED</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">1.82 Tonnes</div>
          <span style="font-size: 12px; color: var(--text-muted);">Fresh produce preserved</span>
        </div>
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">AVG CAPACITY UTILIZATION</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">76%</div>
          <span style="font-size: 12px; color: var(--text-muted);">Optimal storage loading</span>
        </div>
      </div>

      <!-- Unit Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${unitsCardsHtml}
      </div>

    </div>
  `;
}
