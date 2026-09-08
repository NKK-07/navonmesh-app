// My produce: what is in the chamber, and what the farmer wants to do with it.
//
// This screen used to list four batches out of mockHardware.js, one of which
// belonged to a different farmer at a different unit, and offered no way to
// change any of it. Storing produce is only half of what a cold room is for;
// the other half is deciding what to sell and at what price, which is the half
// that turns preservation into income.
//
// Everything here is the database. A farmer sees their own batches and the
// ones stored alongside them at the same unit, and can edit only their own,
// which is not enforced in this file: the batches_update policy refuses the
// rest, and the buttons simply are not drawn for produce that is not theirs.

import { CROPS_DATA, getCropById } from '../data/crops.js';
import { getTranslation } from '../data/i18n.js';
import { live, describeAge, isStale, unitFor } from '../data/live.js';
import { icon } from '../components/icons.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cropName(cropId, lang) {
  const crop = getCropById(cropId);
  if (!crop) return cropId;
  return (crop.nameLocal && crop.nameLocal[lang]) || crop.name || cropId;
}

const rupees = n => n === null || n === undefined
  ? null
  : '₹' + Number(n).toFixed(Number(n) % 1 ? 2 : 0);

export function renderProducePage(state, currentLang, isAddModalOpen, editingId = null) {
  const L = live();
  const unit = unitFor(L);
  const batches = L.batches;

  /* Null is not zero. Null means we have never had an answer, and an empty
     list means the chamber is genuinely empty. Those are different things to
     tell a farmer. */
  if (batches === null) {
    return shell(currentLang, `
      <div class="card produce-empty">
        <p class="produce-empty-t">${L.loading ? 'Loading your produce' : 'No connection yet'}</p>
        <p class="produce-empty-p">
          ${L.loading
            ? 'Reading what is in the chamber.'
            : 'Your produce is stored on the unit. Reconnect and it will appear here.'}
        </p>
      </div>
    `, unit, null);
  }

  const mine = batches.filter(b => b.is_mine);
  const others = batches.filter(b => !b.is_mine);
  const myKg = mine.reduce((n, b) => n + Number(b.weight_kg), 0);
  const totalKg = batches.reduce((n, b) => n + Number(b.weight_kg), 0);
  const capacity = unit ? Number(unit.capacity_kg) : null;
  const forSale = mine.filter(b => b.for_sale);

  const summary = `
    <div class="produce-summary">
      <div class="card produce-stat">
        <p class="produce-stat-n">${myKg.toFixed(0)}<span>kg</span></p>
        <p class="produce-stat-l">Yours, in store</p>
      </div>
      <div class="card produce-stat">
        <p class="produce-stat-n">${forSale.length}</p>
        <p class="produce-stat-l">Offered for sale</p>
      </div>
      <div class="card produce-stat">
        <p class="produce-stat-n">${capacity ? Math.round(100 * totalKg / capacity) : '—'}<span>%</span></p>
        <p class="produce-stat-l">
          Chamber full${capacity ? ' · ' + totalKg.toFixed(0) + ' of ' + capacity + ' kg' : ''}
        </p>
      </div>
    </div>
  `;

  const list = mine.length
    ? mine.map(b => batchCard(b, currentLang, editingId === b.id)).join('')
    : `<div class="card produce-empty">
         <p class="produce-empty-t">Nothing of yours in store</p>
         <p class="produce-empty-p">Add produce when you put a crate in the chamber.</p>
       </div>`;

  const neighbours = others.length ? `
    <h2 class="produce-h2">Also in this chamber</h2>
    <p class="produce-sub">
      Stored by other farmers at ${esc(unit ? unit.code : 'this unit')}. You can
      see what is taking up space; only the owner can change it.
    </p>
    <div class="produce-list produce-list-muted">
      ${others.map(b => neighbourCard(b, currentLang)).join('')}
    </div>
  ` : '';

  return shell(currentLang, `
    ${summary}
    <div class="produce-head">
      <h2 class="produce-h2">Your produce</h2>
      <button class="btn-primary" id="btnAddProduce" type="button">
        ${icon('produce', 17)} Add produce
      </button>
    </div>
    <div class="produce-list">${list}</div>
    ${neighbours}
    ${isAddModalOpen ? addModal(currentLang, unit) : ''}
  `, unit, L);
}

function shell(currentLang, inner, unit, L) {
  const age = L ? describeAge(currentLang) : null;
  const stale = L ? isStale() : true;

  return `
    <div class="produce-wrap">
      <div class="produce-title">
        <div>
          <h1>${getTranslation(currentLang, 'navProduce')}</h1>
          <p class="produce-sub">
            ${unit ? esc(unit.code) + ' · ' + esc(unit.label) : 'Your unit'}
            ${unit && unit.setpoint_c !== null && unit.setpoint_c !== undefined
              ? ' · held at ' + Number(unit.setpoint_c).toFixed(1) + '°C'
              : ''}
          </p>
        </div>
        ${age ? `<p class="data-age ${stale ? 'is-stale' : ''}">
                   ${L && L.lastError ? 'Not refreshed · ' : stale ? 'Last confirmed ' : 'Updated '}${age}
                 </p>` : ''}
      </div>
      ${inner}
    </div>
  `;
}

function batchCard(b, lang, isEditing) {
  const price = rupees(b.ask_price_inr);

  if (isEditing) {
    return `
      <div class="card produce-card is-editing" data-batch="${esc(b.id)}">
        <p class="produce-crop">${esc(cropName(b.crop_id, lang))}</p>
        <div class="produce-edit">
          <label>
            <span>Weight in the chamber</span>
            <input class="lang-select" type="number" inputmode="decimal" min="0.1" max="10000"
                   step="0.5" id="editWeight" value="${esc(b.weight_kg)}">
          </label>
          <label class="produce-check">
            <input type="checkbox" id="editForSale" ${b.for_sale ? 'checked' : ''}>
            <span>Offer this for sale</span>
          </label>
          <label>
            <span>Asking price per kg (optional)</span>
            <input class="lang-select" type="number" inputmode="decimal" min="0" step="1"
                   id="editPrice" placeholder="e.g. 110"
                   value="${b.ask_price_inr === null || b.ask_price_inr === undefined ? '' : esc(b.ask_price_inr)}">
          </label>
          <p class="produce-err" id="editError" hidden></p>
          <div class="produce-actions">
            <button class="btn-primary" type="button" data-save="${esc(b.id)}">Save</button>
            <button class="btn-secondary" type="button" data-cancel="1">Cancel</button>
            <button class="btn-secondary produce-remove" type="button" data-remove="${esc(b.id)}">
              Take out of store
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="card produce-card" data-batch="${esc(b.id)}">
      <div class="produce-card-top">
        <div>
          <p class="produce-crop">${esc(cropName(b.crop_id, lang))}</p>
          <p class="produce-meta">
            Stored ${esc(String(b.stored_on).slice(0, 10))}
            ${b.note ? ' · ' + esc(b.note) : ''}
          </p>
        </div>
        <p class="produce-kg">${Number(b.weight_kg).toFixed(1)}<span>kg</span></p>
      </div>
      <div class="produce-card-bottom">
        ${b.for_sale
          ? `<span class="produce-tag is-sale">
               For sale${price ? ' · ' + price + '/kg' : ''}
             </span>`
          : '<span class="produce-tag">Storing</span>'}
        <button class="btn-secondary produce-edit-btn" type="button" data-edit="${esc(b.id)}">
          Adjust
        </button>
      </div>
    </div>
  `;
}

function neighbourCard(b, lang) {
  return `
    <div class="card produce-card is-muted">
      <div class="produce-card-top">
        <div>
          <p class="produce-crop">${esc(cropName(b.crop_id, lang))}</p>
          <p class="produce-meta">
            ${b.owner_name ? esc(b.owner_name) : 'Another farmer'}
          </p>
        </div>
        <p class="produce-kg">${Number(b.weight_kg).toFixed(1)}<span>kg</span></p>
      </div>
    </div>
  `;
}

function addModal(lang, unit) {
  const options = CROPS_DATA.map(c =>
    `<option value="${esc(c.id)}">${esc((c.nameLocal && c.nameLocal[lang]) || c.name)}</option>`
  ).join('');

  return `
    <div class="produce-modal" id="produceModal">
      <div class="card produce-modal-card">
        <h3>Add produce</h3>
        <p class="produce-sub">
          Into ${unit ? esc(unit.code) : 'your unit'}. This is recorded against
          your name, so only you can change it afterwards.
        </p>
        <label>
          <span>Crop</span>
          <select class="lang-select" id="addCrop">${options}</select>
        </label>
        <label>
          <span>Weight in kg</span>
          <input class="lang-select" type="number" inputmode="decimal" min="0.1" max="10000"
                 step="0.5" id="addWeight" placeholder="e.g. 35">
        </label>
        <label class="produce-check">
          <input type="checkbox" id="addForSale">
          <span>Offer this for sale straight away</span>
        </label>
        <label>
          <span>Asking price per kg (optional)</span>
          <input class="lang-select" type="number" inputmode="decimal" min="0" step="1"
                 id="addPrice" placeholder="e.g. 110">
        </label>
        <p class="produce-err" id="addError" hidden></p>
        <div class="produce-actions">
          <button class="btn-primary" id="btnAddSave" type="button">Add to store</button>
          <button class="btn-secondary" id="btnAddCancel" type="button">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param handlers.onToggleModal open/close the add form
 * @param handlers.onEdit        start editing one batch, or null to stop
 * @param handlers.onSave        persist changes, returns a promise
 * @param handlers.onCreate      add a batch, returns a promise
 * @param handlers.onRemove      take a batch out of store, returns a promise
 */
export function bindProduceEvents(handlers = {}) {
  const {
    onToggleModal = () => {}, onEdit = () => {},
    onSave = async () => {}, onCreate = async () => {}, onRemove = async () => {}
  } = handlers;

  const add = document.getElementById('btnAddProduce');
  if (add) add.addEventListener('click', () => onToggleModal(true));

  document.querySelectorAll('[data-edit]').forEach(el =>
    el.addEventListener('click', () => onEdit(el.dataset.edit)));

  document.querySelectorAll('[data-cancel]').forEach(el =>
    el.addEventListener('click', () => onEdit(null)));

  /* A save takes a moment against a database that may be waking up. The button
     says so and stops accepting a second press, because two taps on "Save"
     used to be two writes. */
  const guard = async (btn, errEl, run) => {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving';
    if (errEl) errEl.hidden = true;
    try {
      await run();
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.hidden = false; }
      btn.disabled = false;
      btn.textContent = original;
    }
  };

  document.querySelectorAll('[data-save]').forEach(btn =>
    btn.addEventListener('click', () => {
      const weight = document.getElementById('editWeight');
      const sale = document.getElementById('editForSale');
      const price = document.getElementById('editPrice');
      guard(btn, document.getElementById('editError'), () => onSave(btn.dataset.save, {
        weight_kg: Number(weight.value),
        for_sale: !!sale.checked,
        ask_price_inr: price.value === '' ? null : Number(price.value)
      }));
    }));

  document.querySelectorAll('[data-remove]').forEach(btn =>
    btn.addEventListener('click', () =>
      guard(btn, document.getElementById('editError'), () => onRemove(btn.dataset.remove))));

  const addSave = document.getElementById('btnAddSave');
  if (addSave) {
    addSave.addEventListener('click', () => {
      const price = document.getElementById('addPrice');
      guard(addSave, document.getElementById('addError'), () => onCreate({
        crop_id: document.getElementById('addCrop').value,
        weight_kg: Number(document.getElementById('addWeight').value),
        for_sale: !!document.getElementById('addForSale').checked,
        ask_price_inr: price.value === '' ? null : Number(price.value)
      }));
    });
  }

  const addCancel = document.getElementById('btnAddCancel');
  if (addCancel) addCancel.addEventListener('click', () => onToggleModal(false));
}
