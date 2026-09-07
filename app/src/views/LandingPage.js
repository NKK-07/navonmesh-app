// NAVONMESH Landing / Login Screen View

import { getTranslation } from '../data/i18n.js';

export function renderLandingPage(currentLang, onSelectRole) {
  return `
    <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; padding: 20px 0;">
      
      <!-- SIH Badge Header -->
      <div style="background: linear-gradient(90deg, #FEF3C7, #E0F2FE); padding: 12px 20px; border-radius: var(--radius-md); border: 1px solid var(--solar-yellow); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: var(--solar-yellow); color: white; font-weight: 900; padding: 4px 10px; border-radius: var(--radius-sm); font-size: 12px;">SIH 2026</span>
          <span style="font-weight: 800; font-size: 14px; color: var(--text-dark);">Problem Statement 26005: Solar-Powered Smart Mini Cold Storage System for Vegetables in NER</span>
        </div>
        <span class="data-honesty-badge simulated">Hardware Prototype Control Panel</span>
      </div>

      <!-- Hero Section -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 32px; align-items: center;" class="landing-hero-grid">
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <h1 style="font-size: 44px; font-weight: 900; color: var(--agri-green-dark); line-height: 1.1;">
            ${getTranslation(currentLang, 'appName')}
          </h1>
          <h2 style="font-size: 24px; color: var(--cooling-blue-dark); font-weight: 700;">
            ${getTranslation(currentLang, 'subTitle')}
          </h2>
          <p style="font-size: 18px; color: var(--text-muted); line-height: 1.6;">
            “Solar-powered cold storage for farmers and rural markets in North Eastern Region (NER).”
          </p>

          <!-- User Role Buttons -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px;">
            <button class="btn-primary" id="btnFarmerLogin" style="font-size: 18px; padding: 16px 32px;">
              👨‍🌾 ${getTranslation(currentLang, 'farmerLogin')}
            </button>
            <button class="btn-secondary" id="btnRetailerLogin">
              🛒 ${getTranslation(currentLang, 'retailerLogin')}
            </button>
            <button class="btn-secondary" id="btnFpoLogin">
              🏢 ${getTranslation(currentLang, 'fpoLogin')}
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px;">
            <button class="btn-secondary" id="btnDemoMode" style="border-color: var(--solar-yellow); background: var(--solar-yellow-light); color: var(--solar-yellow-dark); font-weight: 900;">
              🎮 ${getTranslation(currentLang, 'viewDemo')} (Live Hardware Simulation)
            </button>
          </div>
        </div>

        <!-- Hardware Visual Illustration SVG -->
        <div style="background: var(--bg-card); border: 2px solid var(--border-light); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-md); text-align: center;">
          <svg viewBox="0 0 500 350" style="width: 100%; max-height: 320px;" xmlns="http://www.w3.org/2000/svg">
            <!-- Ground -->
            <rect x="10" y="300" width="480" height="40" rx="10" fill="#059669" opacity="0.15"/>
            
            <!-- Insulated Cold Room Structure -->
            <rect x="160" y="90" width="260" height="210" rx="16" fill="#1E293B" stroke="#0284C7" stroke-width="4"/>
            <rect x="175" y="105" width="230" height="180" rx="10" fill="#0F172A"/>
            <text x="290" y="130" fill="#38BDF8" font-weight="bold" font-size="14" text-anchor="middle">NAVONMESH PUF ROOM</text>

            <!-- Vegetables inside chamber -->
            <text x="210" y="200" font-size="36">🥬</text>
            <text x="270" y="200" font-size="36">🍅</text>
            <text x="330" y="200" font-size="36">🌶️</text>
            <text x="240" y="250" font-size="36">🍊</text>
            <text x="300" y="250" font-size="36">🍍</text>

            <!-- Solar Panel rooftop -->
            <polygon points="120,40 360,40 340,85 140,85" fill="#3B82F6" stroke="#1D4ED8" stroke-width="3"/>
            <line x1="200" y1="40" x2="210" y2="85" stroke="#93C5FD" stroke-width="2"/>
            <line x1="280" y1="40" x2="270" y2="85" stroke="#93C5FD" stroke-width="2"/>
            <text x="240" y="30" fill="#F59E0B" font-weight="bold" font-size="14" text-anchor="middle">☀️ 2.4 kW SOLAR PV</text>

            <!-- LiFePO4 Battery & PCM Box -->
            <rect x="40" y="180" width="90" height="120" rx="12" fill="#047857" stroke="#10B981" stroke-width="3"/>
            <text x="85" y="210" fill="#FFFFFF" font-weight="bold" font-size="12" text-anchor="middle">🔋 48V LiFePO4</text>
            <text x="85" y="235" fill="#6EE7B7" font-weight="bold" font-size="11" text-anchor="middle">+ ❄️ PCM (70kg)</text>
            
            <!-- Wiring connects -->
            <path d="M 85 180 L 85 65 L 140 65" stroke="#F59E0B" stroke-width="3" fill="none" stroke-dasharray="4,4"/>
            <path d="M 130 240 L 160 240" stroke="#10B981" stroke-width="3" fill="none"/>

            <!-- Farmer Icon -->
            <text x="30" y="150" font-size="48">👨‍🌾</text>
          </svg>
        </div>

      </div>

      <!-- 6 Key Highlights -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
        <div class="card" style="border-left: 4px solid var(--agri-green);">
          <div style="font-size: 28px; margin-bottom: 8px;">☀️</div>
          <h3 style="font-size: 16px; margin-bottom: 4px;">100% Solar Off-Grid</h3>
          <p style="font-size: 13px; color: var(--text-muted);">LiFePO4 battery + Phase Change Material thermal backup for 24/7 cooling.</p>
        </div>
        <div class="card" style="border-left: 4px solid var(--cooling-blue);">
          <div style="font-size: 28px; margin-bottom: 8px;">❄️</div>
          <h3 style="font-size: 16px; margin-bottom: 4px;">200 kg PUF Chamber</h3>
          <p style="font-size: 13px; color: var(--text-muted);">100mm PUF insulation tailored for high humidity NER mountain terrain.</p>
        </div>
        <div class="card" style="border-left: 4px solid var(--solar-yellow);">
          <div style="font-size: 28px; margin-bottom: 8px;">🔊</div>
          <h3 style="font-size: 16px; margin-bottom: 4px;">8 NER Languages</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Full local translation and voice read-aloud support for non-literate farmers.</p>
        </div>
        <div class="card" style="border-left: 4px solid var(--pcm-purple);">
          <div style="font-size: 28px; margin-bottom: 8px;">📡</div>
          <h3 style="font-size: 16px; margin-bottom: 4px;">LoRa / Offline First</h3>
          <p style="font-size: 13px; color: var(--text-muted);">Functions seamlessly without cellular internet connectivity in remote villages.</p>
        </div>
      </div>

    </div>
  `;
}

export function bindLandingPageEvents(onSelectRole) {
  const farmerBtn = document.getElementById('btnFarmerLogin');
  if (farmerBtn) farmerBtn.addEventListener('click', () => onSelectRole('farmer'));

  const retailerBtn = document.getElementById('btnRetailerLogin');
  if (retailerBtn) retailerBtn.addEventListener('click', () => onSelectRole('retailer'));

  const fpoBtn = document.getElementById('btnFpoLogin');
  if (fpoBtn) fpoBtn.addEventListener('click', () => onSelectRole('fpo'));

  const demoBtn = document.getElementById('btnDemoMode');
  if (demoBtn) demoBtn.addEventListener('click', () => onSelectRole('farmer'));
}
