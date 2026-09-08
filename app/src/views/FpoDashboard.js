// The FPO manager's view.
//
// This used to be a page of invented totals: "12 units, 1.82 tonnes saved,
// 76% utilisation", identical in structure to the farmer screen and reachable
// by any farmer who clicked a button in Settings. It is now the manager's
// actual FPO, and the only reason it holds more than the farmer view is that
// row level security returns more rows to this token. Nothing here filters by
// role; app_can_see_unit already did.
//
// The one thing a manager can do that a farmer cannot is set the target
// temperature, which then applies to every unit in the FPO and shows on every
// farmer's screen.

import { live, describeAge, isStale } from '../data/live.js';
import { getTranslation } from '../data/i18n.js';
import { icon } from '../components/icons.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderFpoDashboard(currentLang = 'en', notice = null) {
  const L = live();
  const units = L.units;

  if (units === null) {
    return `
      <div class="fleet-wrap">
        <h1>Fleet</h1>
        <div class="card produce-empty">
          <p class="produce-empty-t">${L.loading ? 'Loading your fleet' : 'No connection yet'}</p>
          <p class="produce-empty-p">The units your FPO owns will appear here.</p>
        </div>
      </div>
    `;
  }

  const alerts = L.alerts || [];
  const openAlerts = alerts.filter(a => !a.cleared_at);
  const stored = units.reduce((n, u) => n + Number(u.stored_kg || 0), 0);
  const capacity = units.reduce((n, u) => n + Number(u.capacity_kg || 0), 0);
  const batches = units.reduce((n, u) => n + Number(u.batch_count || 0), 0);

  /* One setpoint if every unit agrees, otherwise say they differ rather than
     picking one and quietly overwriting the rest on the next save. */
  const setpoints = [...new Set(units.map(u =>
    u.setpoint_c === null || u.setpoint_c === undefined ? null : Number(u.setpoint_c)))];
  const common = setpoints.length === 1 ? setpoints[0] : null;
  const mixed = setpoints.length > 1;

  const age = describeAge(currentLang);
  const stale = isStale();
  const L2 = L;   // named for the shared age-line snippet below

  return `
    <div class="fleet-wrap">
      <div class="produce-title">
        <div>
          <h1>${getTranslation(currentLang, 'roleFpoManager')}</h1>
          <p class="produce-sub">
            ${units.length} unit${units.length === 1 ? '' : 's'} in your FPO
          </p>
        </div>
        ${age ? `<p class="data-age ${stale ? 'is-stale' : ''}">
                   ${L2 && L2.lastError ? 'Not refreshed · ' : stale ? 'Last confirmed ' : 'Updated '}${age}
                 </p>` : ''}
      </div>

      <div class="produce-summary">
        <div class="card produce-stat">
          <p class="produce-stat-n">${units.length}</p>
          <p class="produce-stat-l">Units</p>
        </div>
        <div class="card produce-stat">
          <p class="produce-stat-n">${stored.toFixed(0)}<span>kg</span></p>
          <p class="produce-stat-l">
            In store${capacity ? ' · ' + Math.round(100 * stored / capacity) + '% of capacity' : ''}
          </p>
        </div>
        <div class="card produce-stat">
          <p class="produce-stat-n">${batches}</p>
          <p class="produce-stat-l">Batches</p>
        </div>
        <div class="card produce-stat ${openAlerts.length ? 'is-warn' : ''}">
          <p class="produce-stat-n">${openAlerts.length}</p>
          <p class="produce-stat-l">Open alerts</p>
        </div>
      </div>

      <div class="card fleet-setpoint">
        <h2 class="produce-h2">${icon('pcm', 17)} Target temperature</h2>
        <p class="produce-sub">
          Applies to every unit in your FPO and shows on every farmer's screen.
          ${mixed
            ? '<strong>Your units are currently set differently.</strong>'
            : common === null
              ? 'No target is set yet.'
              : 'Currently ' + common.toFixed(1) + '°C everywhere.'}
        </p>
        <div class="fleet-setpoint-row">
          <input class="lang-select" id="fleetSetpoint" type="number"
                 inputmode="decimal" min="0" max="25" step="0.5"
                 value="${common === null ? '' : esc(common)}"
                 placeholder="8.0">
          <span class="fleet-unit">°C</span>
          <button class="btn-primary" id="btnSaveSetpoint" type="button">
            Apply to all units
          </button>
        </div>
        <p class="produce-sub fleet-band">
          Between 0 and 25. Most produce here takes chilling injury below 4°C;
          king chilli should not go under it at all.
        </p>
        <p class="produce-err" id="setpointError" hidden></p>
        ${notice ? `<p class="fleet-ok">${esc(notice)}</p>` : ''}
      </div>

      <h2 class="produce-h2">Units</h2>
      <div class="fleet-list">
        ${units.map(u => unitCard(u, alerts)).join('')}
      </div>
    </div>
  `;
}

function unitCard(u, alerts) {
  const mine = alerts.filter(a => a.unit_id === u.id && !a.cleared_at);
  const worst = mine.some(a => a.level === 'action') ? 'is-critical'
              : mine.length ? 'is-warn' : '';
  const pct = u.capacity_kg
    ? Math.round(100 * Number(u.stored_kg || 0) / Number(u.capacity_kg))
    : null;

  return `
    <div class="card fleet-card ${worst}">
      <div class="fleet-card-top">
        <div>
          <p class="fleet-code">${esc(u.code)}</p>
          <p class="produce-meta">${esc(u.label)}${u.district ? ' · ' + esc(u.district) : ''}</p>
        </div>
        <p class="fleet-temp">
          ${u.setpoint_c === null || u.setpoint_c === undefined
            ? '<span class="fleet-unset">not set</span>'
            : Number(u.setpoint_c).toFixed(1) + '<span>°C</span>'}
        </p>
      </div>
      <div class="fleet-card-bottom">
        <span class="produce-tag">
          ${Number(u.stored_kg || 0).toFixed(0)} kg${pct !== null ? ' · ' + pct + '%' : ''}
        </span>
        <span class="produce-tag">${u.batch_count || 0} batches</span>
        ${mine.length
          ? `<span class="produce-tag is-alert">${mine.length} open alert${mine.length === 1 ? '' : 's'}</span>`
          : ''}
      </div>
    </div>
  `;
}

export function bindFpoEvents({ onSetpoint = async () => {} } = {}) {
  const btn = document.getElementById('btnSaveSetpoint');
  const input = document.getElementById('fleetSetpoint');
  const err = document.getElementById('setpointError');
  if (!btn || !input) return;

  btn.addEventListener('click', async () => {
    const value = Number(input.value);
    if (err) err.hidden = true;

    if (!Number.isFinite(value) || value < 0 || value > 25) {
      if (err) { err.textContent = 'Enter a temperature between 0 and 25.'; err.hidden = false; }
      return;
    }

    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Applying';
    try {
      /* The confirmation is returned, not written into the DOM. Refreshing
         after the write re-renders this whole panel, which used to delete the
         success line a few milliseconds after it appeared. */
      await onSetpoint(value);
    } catch (e) {
      if (err) { err.textContent = e.message; err.hidden = false; }
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}
