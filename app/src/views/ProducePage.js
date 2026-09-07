// NAVONMESH Inventory Management ("My Produce") View
// FIFO batch cards with color-coded SELL FIRST urgency indicators & Add Produce modal

import { CROPS_DATA, getCropById } from '../data/crops.js';
import { hardwareService } from '../data/mockHardware.js';
import { getTranslation } from '../data/i18n.js';

export function renderProducePage(state, currentLang, isAddModalOpen) {
  const loadPct = Math.round((state.produceWeightKg / state.maxCapacityKg) * 100);

  const batchesHtml = state.batches.map(batch => {
    const crop = getCropById(batch.cropId);
    const isUrgent = batch.urgency === 'SELL_FIRST';
    return `
      <div class="card" style="border: 2px solid ${isUrgent ? '#F59E0B' : 'var(--border-light)'}; background: ${isUrgent ? '#FFFBEB' : 'var(--bg-card)'}; position: relative;">
        ${isUrgent ? '<span class="metric-status-badge warning" style="position: absolute; top: 16px; right: 16px; font-weight: 900;">🔥 SELL FIRST</span>' : ''}
        
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
          <span style="font-size: 40px;">${crop.icon}</span>
          <div>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 800;">${batch.id}</span>
            <h3 style="font-size: 18px; color: var(--text-dark);">${crop.name}</h3>
            <span style="font-size: 13px; color: var(--text-muted);">Owner: ${batch.owner}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: var(--bg-main); padding: 12px; border-radius: var(--radius-sm); font-size: 13px;">
          <div><strong>Quantity:</strong> ${batch.weightKg} kg</div>
          <div><strong>Stored Date:</strong> ${batch.storedDate}</div>
          <div style="grid-column: 1 / -1; color: var(--agri-green-dark); font-weight: 800;">
            ⏳ Estimated Days Left: ${batch.estDaysLeft} Days
          </div>
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = isAddModalOpen ? `
    <div class="demo-modal-overlay" id="addProduceOverlay">
      <div class="demo-modal-card" style="max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 20px;">🥬 Add Stored Produce Batch</h2>
          <button id="btnCloseProduceModal" style="font-size: 22px; font-weight: bold;">✕</button>
        </div>

        <form id="formAddProduce" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">Select Crop</label>
            <select id="selectProduceCrop" class="lang-select" style="width: 100%;">
              ${CROPS_DATA.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">Weight (kg)</label>
            <input type="number" id="inputProduceWeight" class="lang-select" style="width: 100%;" value="25" min="1" max="100"/>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px;">Farmer / Owner Name</label>
            <input type="text" id="inputProduceOwner" class="lang-select" style="width: 100%;" value="Farmer Cooperative Member"/>
          </div>

          <button type="submit" class="btn-primary" style="margin-top: 10px; width: 100%;">
            ✓ Confirm Storage Batch
          </button>
        </form>
      </div>
    </div>
  ` : '';

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 28px; margin-bottom: 4px;">🥬 ${getTranslation(currentLang, 'navProduce')}</h1>
          <p style="color: var(--text-muted); font-size: 15px;">Manage stored vegetable batches with automated FIFO sale indicators.</p>
        </div>

        <button class="btn-primary" id="btnOpenAddProduceModal">
          ${getTranslation(currentLang, 'addProduce')}
        </button>
      </div>

      <!-- Live Weight Capacity Card -->
      <div class="card" style="border: 2px solid var(--agri-green); background: linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">TOTAL CURRENT LOAD</span>
            <div style="font-size: 36px; font-weight: 900; color: var(--agri-green-dark);">${state.produceWeightKg} kg / ${state.maxCapacityKg} kg</div>
          </div>
          <span class="metric-status-badge ${loadPct > 90 ? 'warning' : 'safe'}" style="font-size: 16px; padding: 8px 18px;">
            ${loadPct}% FULL
          </span>
        </div>

        <!-- Load cell capacity bar -->
        <div style="width: 100%; height: 16px; background: #E2E8F0; border-radius: var(--radius-full); overflow: hidden;">
          <div style="width: ${loadPct}%; height: 100%; background: ${loadPct > 90 ? '#F59E0B' : 'var(--agri-green)'}; border-radius: var(--radius-full);"></div>
        </div>
        <span style="font-size: 12px; color: var(--text-muted); margin-top: 8px; display: block;">
          Available Capacity: ${state.maxCapacityKg - state.produceWeightKg} kg
        </span>

        ${loadPct > 90 ? `
          <div style="margin-top: 12px; background: #FEF3C7; padding: 10px; border-radius: var(--radius-sm); color: #B45309; font-weight: bold; font-size: 13px;">
            ⚠️ Storage almost full (>90% capacity).
          </div>
        ` : ''}
      </div>

      <!-- Batches Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
        ${batchesHtml}
      </div>

      ${modalHtml}

    </div>
  `;
}

export function bindProduceEvents(onToggleModal) {
  const openBtn = document.getElementById('btnOpenAddProduceModal');
  if (openBtn) openBtn.addEventListener('click', () => onToggleModal(true));

  const closeBtn = document.getElementById('btnCloseProduceModal');
  if (closeBtn) closeBtn.addEventListener('click', () => onToggleModal(false));

  const form = document.getElementById('formAddProduce');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cropId = document.getElementById('selectProduceCrop').value;
      const weightKg = document.getElementById('inputProduceWeight').value;
      const owner = document.getElementById('inputProduceOwner').value;

      hardwareService.addProduceBatch({ cropId, weightKg, owner });
      onToggleModal(false);
      alert('✓ New produce batch stored into NAVONMESH cold room!');
    });
  }
}
