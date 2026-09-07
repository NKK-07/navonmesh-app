// NAVONMESH Retailer Mode Dashboard View
// Focus on sales urgency, shelf life countdowns, and storage fees

import { getCropById } from '../data/crops.js';

export function renderRetailerDashboard(state) {
  const sellFirstItems = state.batches.filter(b => b.urgency === 'SELL_FIRST' || b.estDaysLeft < 10);

  const sellFirstCards = sellFirstItems.map(b => {
    const crop = getCropById(b.cropId);
    return `
      <div style="background: #FFFBEB; border: 2px solid #F59E0B; border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 36px;">${crop.icon}</span>
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: #B45309;">${crop.name}</h4>
            <span style="font-size: 12px; color: var(--text-muted);">${b.weightKg} kg Stored | Owner: ${b.owner}</span>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="metric-status-badge warning" style="font-size: 14px; font-weight: 900;">🔥 ${b.estDaysLeft} DAYS LEFT</span>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Sell Priority: URGENT</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;">🛒 Small Vegetable Retailer Dashboard</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Monitor inventory viability and prioritize produce sales to maximize profit.</p>
      </div>

      <!-- Urgent Sell First Highlight Container -->
      <div class="card" style="border: 2px solid #F59E0B; background: linear-gradient(180deg, #FEF3C7 0%, #FFFFFF 100%);">
        <h3 style="font-size: 18px; color: #B45309; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          🔥 SELL FIRST — Prevent Spoilage
        </h3>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${sellFirstCards.length > 0 ? sellFirstCards : '<p>All produce batches have extended shelf life remaining.</p>'}
        </div>
      </div>

      <!-- Retailer Financial & Capacity Summary -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">TOTAL STORED</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">${state.produceWeightKg} kg</div>
          <span style="font-size: 12px; color: var(--text-muted);">${state.batches.length} Active Batches</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">AVAILABLE SPACE</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">${state.maxCapacityKg - state.produceWeightKg} kg</div>
          <span style="font-size: 12px; color: var(--text-muted);">Of ${state.maxCapacityKg} kg Total</span>
        </div>

        <div class="card">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">DAILY STORAGE FEE</span>
          <div style="font-size: 32px; font-weight: 900; color: var(--solar-yellow-dark); margin-top: 4px;">₹2 / kg / day</div>
          <span style="font-size: 12px; color: var(--text-muted);">Cooperative Rate</span>
        </div>
      </div>

    </div>
  `;
}
