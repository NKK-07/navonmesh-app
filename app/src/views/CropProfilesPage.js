// NAVONMESH Crop Selection & Storage Profiles View
// Complete NER Technical Crop Profiles

import { CROPS_DATA } from '../data/crops.js';
import { hardwareService } from '../data/mockHardware.js';
import { getTranslation } from '../data/i18n.js';

export function renderCropProfilesPage(state, currentLang, selectedCropId) {
  const currentCrop = CROPS_DATA.find(c => c.id === selectedCropId) || CROPS_DATA[0];
  const isActive = state.activeCropId === currentCrop.id;

  const cropCardsHtml = CROPS_DATA.map(crop => {
    const isSelected = crop.id === currentCrop.id;
    const isCurrentActive = state.activeCropId === crop.id;
    return `
      <div class="crop-card-item" data-cropid="${crop.id}" style="background: var(--bg-card); border: 2px solid ${isSelected ? 'var(--agri-green)' : 'var(--border-light)'}; padding: 16px; cursor: pointer; display: flex; align-items: center; gap: 14px; position: relative; transition: all 0.2s ease; ${isSelected ? ' background: var(--agri-green-light);' : ''}">
        <span style="font-size: 36px;">${crop.icon}</span>
        <div style="flex: 1;">
          <strong style="font-size: 16px; color: var(--text-dark); display: block;">${crop.name}</strong>
          <span style="font-size: 12px; color: var(--text-muted);">${crop.tempRange[0]}–${crop.tempRange[1]}°C | ${crop.shelfLifeDays} Days</span>
        </div>
        ${isCurrentActive ? '<span class="metric-status-badge safe" style="font-size: 10px;">ACTIVE PROFILE</span>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      
      <div>
        <h1 style="font-size: 28px; margin-bottom: 4px;"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5"/></svg> ${getTranslation(currentLang, 'navCropProfiles')}</h1>
        <p style="color: var(--text-muted); font-size: 15px;">Select your produce type to apply optimized thermal & humidity targets.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr; gap: 24px;" class="crop-page-grid">
        
        <!-- Left: Crop Selection Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;">
          ${cropCardsHtml}
        </div>

        <!-- Right: Active Crop Profile Detail Card -->
        <div style="background: var(--bg-card); padding: 28px; border: 2px solid var(--agri-green); display: flex; flex-direction: column; gap: 20px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <span style="font-size: 48px;">${currentCrop.icon}</span>
              <div>
                <h2 style="font-size: 24px; color: var(--agri-green-dark);">${currentCrop.name}</h2>
                <span style="font-size: 13px; color: var(--text-muted);">${currentCrop.description}</span>
              </div>
            </div>
            ${isActive ? '<span class="metric-status-badge safe"><i class="dot dot-ok"></i> CURRENTLY RUNNING</span>' : ''}
          </div>

          <!-- Parameter Readouts -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background: var(--bg-main); padding: 20px; border: 1px solid var(--border-light);">
            
            <div>
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">TEMPERATURE TARGET</span>
              <div style="font-size: 26px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">
                ${currentCrop.tempRange[0]}–${currentCrop.tempRange[1]}°C
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">Mixed Mode: ${currentCrop.mixedStorageTempTarget}°C</span>
            </div>

            <div>
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">HUMIDITY TARGET</span>
              <div style="font-size: 26px; font-weight: 900; color: var(--cooling-blue-dark); margin-top: 4px;">
                ${currentCrop.humidityRange[0]}–${currentCrop.humidityRange[1]}% RH
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">Target: ${currentCrop.humidityTarget}%</span>
            </div>

            <div>
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">EXPECTED SHELF LIFE</span>
              <div style="font-size: 26px; font-weight: 900; color: var(--agri-green-dark); margin-top: 4px;">
                ${currentCrop.shelfLifeDays} Days
              </div>
              <span style="font-size: 11px; color: #B91C1C;">(Ambient: ${currentCrop.ambientShelfLifeDays} Days)</span>
            </div>

            <div>
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 800;">ETHYLENE SENSITIVITY</span>
              <div style="font-size: 20px; font-weight: 800; color: var(--solar-yellow-dark); margin-top: 6px;">
                ${currentCrop.ethyleneSensitivity}
              </div>
              <span style="font-size: 11px; color: var(--text-muted);">${currentCrop.chillingSensitivity}</span>
            </div>

          </div>

          <!-- Storage Tips -->
          <div style="background: #FBF3E2; padding: 14px; border: 1px solid var(--solar-yellow); font-size: 13px; color: var(--solar-yellow-dark);">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/></svg> <strong>Farmer Storage Tip:</strong> ${currentCrop.tips}
          </div>

          <!-- Action Button -->
          <button class="btn-primary" id="btnActivateCropProfile" style="font-size: 18px; padding: 16px;">
            <svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 5 13h6l-1 9 8-11h-6z"/></svg> ${getTranslation(currentLang, 'startProfile')}
          </button>

        </div>

      </div>

    </div>
  `;
}

export function bindCropProfilesEvents(selectedCropId, onSelectCrop) {
  const cards = document.querySelectorAll('.crop-card-item');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      onSelectCrop(card.getAttribute('data-cropid'));
    });
  });

  const activateBtn = document.getElementById('btnActivateCropProfile');
  if (activateBtn) {
    activateBtn.addEventListener('click', () => {
      hardwareService.setCropProfile(selectedCropId);
      alert(`✓ Cold Storage Profile activated for ${selectedCropId.toUpperCase()}! Target temperature set.`);
    });
  }
}
