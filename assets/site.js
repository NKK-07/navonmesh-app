/* NAVONMESH site — interactions.
   One file, page-scoped: each init() no-ops when its root is absent. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- mobile nav drawer ---------- */

function initNav() {
  const toggle = $('.navtoggle');
  const drawer = $('.drawer');
  if (!toggle || !drawer) return;

  const iconOpen = 'M3.5 7h17M3.5 12h17M3.5 17h17';
  const iconClose = 'M5 5l14 14M19 5L5 19';

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    drawer.classList.toggle('open', !open);
    $('path', toggle).setAttribute('d', open ? iconOpen : iconClose);
  });
}

/* ---------- generic segmented / list selector ---------- */

function selector(buttons, onPick, initial = 0) {
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      onPick(btn.dataset.id, btn);
    });
    btn.setAttribute('aria-pressed', String(i === initial));
  });
  if (buttons[initial]) onPick(buttons[initial].dataset.id, buttons[initial]);
}

/* ---------- home: control panel ---------- */

const SCENARIOS = {
  clear: {
    temp: '8.2', hum: '91', solar: '2.4', batt: '78', pcm: '82',
    battW: '78%', pcmW: '82%', solarNote: 'ARRAY AT FULL OUTPUT',
    clock: '11:40 / 07 SEP',
    status: 'ALL SYSTEMS NORMAL', statusFg: '#34D399', statusBd: '#1E6B52',
    pcmNote: 'Fully charged. 8.6 h of cooling in reserve.',
    note: 'Compressor running at 42% duty. Surplus solar is topping up the battery and re-freezing the thermal pack for tonight.'
  },
  cloud: {
    temp: '8.6', hum: '92', solar: '0.6', batt: '54', pcm: '74',
    battW: '54%', pcmW: '74%', solarNote: 'HEAVY CLOUD COVER',
    clock: '13:05 / 07 SEP',
    status: 'RUNNING ON BATTERY', statusFg: '#F59E0B', statusBd: '#7A5312',
    pcmNote: 'Holding charge. 7.7 h in reserve.',
    note: 'Solar has dropped to a quarter of rated output. The controller has slowed the compressor and is drawing from the battery rather than spending the thermal reserve.'
  },
  door: {
    temp: '11.4', hum: '84', solar: '2.1', batt: '76', pcm: '80',
    battW: '76%', pcmW: '80%', solarNote: 'ARRAY AT 88% OUTPUT',
    clock: '09:22 / 07 SEP',
    status: 'DOOR OPEN 4 MIN', statusFg: '#F87171', statusBd: '#7F2626',
    pcmNote: 'Reserve untouched. 8.4 h available.',
    note: 'The reed switch has been open for four minutes. Compressor speed is boosted and an alert has already gone to the farmer in their own language.'
  },
  night: {
    temp: '8.0', hum: '91', solar: '0.0', batt: '41', pcm: '46',
    battW: '41%', pcmW: '46%', solarNote: 'NO GENERATION UNTIL 05:40',
    clock: '02:15 / 08 SEP',
    status: 'ON THERMAL RESERVE', statusFg: '#A78BFA', statusBd: '#4C3A85',
    pcmNote: 'Discharging. 4.1 h of cold left before sunrise.',
    note: 'Compressor off. The phase-change pack is releasing stored cold to hold the set-point, sparing the battery for the sensors and the radio.'
  }
};

function initPanel() {
  const root = $('[data-panel]');
  if (!root) return;

  const set = (sel, value) => { const el = $(sel, root); if (el) el.textContent = value; };

  selector($$('[data-scenario]', root.closest('section') || document), (id) => {
    const s = SCENARIOS[id];
    if (!s) return;
    set('[data-f=temp]', s.temp);
    set('[data-f=hum]', s.hum);
    set('[data-f=solar]', s.solar);
    set('[data-f=batt]', s.batt);
    set('[data-f=pcm]', s.pcm + ' %');
    set('[data-f=solarNote]', s.solarNote);
    set('[data-f=clock]', s.clock);
    set('[data-f=note]', s.note);
    set('[data-f=pcmNote]', s.pcmNote);

    const status = $('[data-f=status]', root);
    if (status) {
      $('span', status).textContent = s.status;
      status.style.color = s.statusFg;
      status.style.borderColor = s.statusBd;
    }
    const battBar = $('[data-f=battBar]', root);
    if (battBar) battBar.style.width = s.battW;
    const pcmBar = $('[data-f=pcmBar]', root);
    if (pcmBar) pcmBar.style.width = s.pcmW;
  });
}

/* ---------- home: crop profiles ---------- */

const CROPS = {
  cabbage: { code: 'C-01', name: 'Cabbage', local: 'বন্ধাকপি · बन्दागोभी · Kobi', temp: '0–2 °C', hum: '90–95 %', cold: 35, ambient: 6, gain: '6×',
    tip: 'Keep the bags ventilated, and store away from Khasi mandarin — the ethylene will yellow the leaves.' },
  king_chilli: { code: 'C-02', name: 'King Chilli', local: 'ভোট জলকীয়া · U-Morok · Hmar-cha', temp: '5–7 °C', hum: '90–95 %', cold: 28, ambient: 5, gain: '5.6×',
    tip: 'Never cool below 4 °C — chilling injury sets in fast. High humidity is what keeps the capsaicin and the colour intact.' },
  khasi_mandarin: { code: 'C-03', name: 'Khasi Mandarin', local: 'Soh Niamtra · कमला सुन्तला', temp: '4–7 °C', hum: '85–90 %', cold: 45, ambient: 8, gain: '5.6×',
    tip: 'A strong ethylene producer. Give it its own shelf so it does not ripen the tomatoes and beans stored alongside.' },
  ginger: { code: 'C-04', name: 'Ginger', local: 'আদা · अदुवा · Sying', temp: '12–14 °C', hum: '85–90 %', cold: 120, ambient: 20, gain: '6×',
    tip: 'Cure the rhizomes before loading. Below 10 °C the skin darkens and the flesh turns soft in storage.' },
  tomato: { code: 'C-05', name: 'Tomato', local: 'বিলাহী · गोलभेँडा · Soh Tyngkong', temp: '8–10 °C', hum: '85–90 %', cold: 18, ambient: 4, gain: '4.5×',
    tip: 'The default mixed-storage set-point of 8 °C suits tomatoes well. Load them at breaker stage, not fully red.' },
  large_cardamom: { code: 'C-06', name: 'Large Cardamom', local: 'বৰ ইলাচী · अलैंची · Elaka Tynhiang', temp: '10–15 °C', hum: '60–70 %', cold: 240, ambient: 45, gain: '5.3×',
    tip: 'This one wants it dry. Hold humidity below 70% or the essential-oil aroma goes and mould takes hold.' }
};

function initCrops() {
  const root = $('[data-crops]');
  if (!root) return;
  const set = (sel, value) => { const el = $(sel, root); if (el) el.textContent = value; };

  selector($$('.cbtn', root), (id) => {
    const c = CROPS[id];
    if (!c) return;
    set('[data-c=name]', c.name);
    set('[data-c=local]', c.local);
    set('[data-c=code]', 'PROFILE ' + c.code);
    set('[data-c=temp]', c.temp);
    set('[data-c=hum]', c.hum);
    set('[data-c=gain]', c.gain + ' longer');
    set('[data-c=ambient]', c.ambient + ' d');
    set('[data-c=cold]', c.cold + ' d');
    set('[data-c=tip]', c.tip);
    const bar = $('[data-c=ambBar]', root);
    if (bar) bar.style.width = Math.round((c.ambient / c.cold) * 100) + '%';
  });
}

/* ---------- how it works: schematic ---------- */

const STAGES = {
  pv: { num: '01', name: 'Solar array', layer: 'ENERGY PATH',
    body: 'A 2.4 kW photovoltaic array sits on the roof of the chamber itself, so the unit needs no separate land and no grid connection. It is sized against NER irradiance of 3 to 5 kWh per square metre per day, not against a sunny plains average.',
    why: 'Most of the North East gets far less usable sun than the rest of India. Oversizing the array is cheaper than under-cooling the harvest.',
    specs: [['Rated output', '2.4 kW'], ['Design irradiance', '3–5 kWh/m²/day'], ['Mounting', 'Integrated rooftop'], ['Grid connection', 'None']] },
  mppt: { num: '02', name: 'MPPT controller', layer: 'ENERGY PATH',
    body: 'Maximum power point tracking keeps the array at its best operating voltage as cloud passes over, which happens constantly in the hills. It also protects the battery bank from over-charge and deep discharge.',
    why: 'Under broken monsoon cloud, MPPT recovers meaningfully more energy per day than a simple controller would.',
    specs: [['Type', 'MPPT'], ['Bus voltage', '48 V DC'], ['Protects', 'Battery bank'], ['Tracking', 'Continuous']] },
  batt: { num: '03', name: 'Battery bank', layer: 'ENERGY PATH',
    body: 'A 48 V, 100 Ah lithium iron phosphate pack carries the unit through the night and through cloudy stretches. Its BMS reports pack health back to the app alongside the state of charge.',
    why: 'LiFePO4 tolerates heat and deep cycling far better than lead-acid, and needs none of the ventilated battery room a village site cannot provide.',
    specs: [['Chemistry', 'LiFePO4'], ['Pack', '48 V / 100 Ah'], ['Reported health', '98%'], ['Managed by', 'Integrated BMS']] },
  mcu: { num: '04', name: 'Controller', layer: 'CONTROL',
    body: 'The ESP32 reads every sensor, decides compressor speed, chooses when to spend the thermal reserve rather than the battery, raises alerts and pushes telemetry out over LoRa. It is the only part of the system that makes decisions.',
    why: 'Cheap, field-replaceable, and low-power enough to run on the sensor budget alone when the compressor is off overnight.',
    specs: [['MCU', 'ESP32 dual core'], ['Operating temp', '41 °C'], ['Drives', 'Duty, alerts'], ['Radios', 'LoRa, Wi-Fi AP']] },
  comp: { num: '05', name: 'Compressor', layer: 'COLD PATH',
    body: 'A brushless DC compressor runs straight off the DC bus and varies its speed instead of switching hard on and off. At a typical duty of 42% it draws around 420 W, which is what makes a 2.4 kW array enough.',
    why: 'Variable speed avoids the inrush surge that would force a much larger array and battery just to survive start-up.',
    specs: [['Type', 'BLDC variable speed'], ['Typical draw', '420 W'], ['Typical duty', '42%'], ['Supply', 'Direct DC']] },
  pcm: { num: '06', name: 'Thermal store', layer: 'COLD PATH',
    body: 'Seventy kilograms of phase change material freeze while the sun is up and release that cold back into the chamber after dark. It gives roughly 8.6 hours of cooling with the compressor completely off.',
    why: 'Storing cold is far cheaper than storing the electricity to make it later. This is what lets the battery stay small.',
    specs: [['Mass', '70 kg'], ['Phase point', '≈ −0.8 °C'], ['Full reserve', '8.6 hours'], ['Recharges on', 'Surplus solar']] },
  room: { num: '07', name: 'Cold chamber', layer: 'COLD PATH',
    body: 'The room itself: 200 kg of produce behind 100 mm of polyurethane foam, with forced air circulation and a hermetic door seal holding 90 to 95% relative humidity.',
    why: 'Sized to fit on a pickup truck so it can reach high-altitude collection centres on roads no container lorry will attempt.',
    specs: [['Capacity', '200 kg'], ['Insulation', '100 mm PUF'], ['Humidity held', '90–95% RH'], ['Air handling', 'Forced circulation']] }
};

function initSchematic() {
  const root = $('[data-schematic]');
  if (!root) return;
  const set = (sel, value) => { const el = $(sel, root); if (el) el.textContent = value; };

  selector($$('.blk', root), (id) => {
    const s = STAGES[id];
    if (!s) return;
    set('[data-s=num]', 'STAGE ' + s.num);
    set('[data-s=layer]', s.layer);
    set('[data-s=name]', s.name);
    set('[data-s=body]', s.body);
    set('[data-s=why]', s.why);
    const list = $('[data-s=specs]', root);
    if (list) {
      list.innerHTML = '';
      for (const [k, v] of s.specs) {
        const row = document.createElement('div');
        row.className = 'r';
        row.innerHTML = '<span></span><span></span>';
        row.children[0].textContent = k;
        row.children[1].textContent = v;
        list.appendChild(row);
      }
    }
  });
}

/* ---------- built for NER: constraint matrix ---------- */

const CONSTRAINTS = {
  solar: { num: 'CONSTRAINT 01', title: 'Not enough sun',
    problem: 'Heavy monsoon rainfall and dense cloud over hilly terrain cut peak solar hours well below what a plains installation counts on. A design that assumes a good sunny day will lose the harvest on the first bad week.',
    solution: 'The unit pairs a LiFePO4 battery with a 70 kg phase-change thermal store, so cooling continues through cloud and darkness without oversizing either the array or the battery. Cold is banked while the sun is out and spent when it is not.',
    parts: [['ARRAY', '2.4 kW'], ['BATTERY', '48 V LiFePO4'], ['THERMAL STORE', '70 kg PCM']] },
  humid: { num: 'CONSTRAINT 02', title: 'Air that is always wet',
    problem: 'Extreme humidity condenses on cool surfaces, feeds mould and rots produce in a traditional shed within days. Cooling alone does not solve it; a badly sealed cold room simply makes the condensation worse.',
    solution: 'A hermetic chamber behind 100 mm of PUF insulation, with SHT31 sensors driving humidity management, holds produce in the 90 to 95% band that keeps leaves crisp without wetting them. Cardamom gets a dry profile instead, below 70%.',
    parts: [['INSULATION', '100 mm PUF'], ['SENSING', 'SHT31, ±2% RH'], ['TARGET BAND', '90–95% RH']] },
  terrain: { num: 'CONSTRAINT 03', title: 'Mountains between farm and market',
    problem: 'Hill roads add days between harvest and the market hubs in Assam. Produce that leaves the field fresh does not arrive fresh, and the farmer has no leverage on price because the crop cannot wait.',
    solution: 'At 200 kg the chamber is modular enough to be carried by pickup to a high-altitude collection centre, so the cold chain starts at the village rather than at the hub. Storing on site turns a forced sale into a choice about when to sell.',
    parts: [['CAPACITY', '200 kg'], ['TRANSPORT', 'Pickup truck'], ['SITED AT', 'Village centre']] },
  grid: { num: 'CONSTRAINT 04', title: 'A grid that goes away for days',
    problem: 'Rural NER villages lose grid power for days at a time, and mobile coverage disappears with it. Any cold store that assumes mains electricity or a data connection will fail exactly when the weather is worst.',
    solution: 'The system is fully off-grid by design: solar in, DC bus throughout, no mains connection anywhere. Telemetry leaves over 868 MHz LoRa with SMS as a fallback, and the farmer app works fully offline from its own cache.',
    parts: [['GRID DRAW', 'None'], ['TELEMETRY', 'LoRa 868 MHz'], ['FALLBACK', 'GSM SMS']] }
};

function initMatrix() {
  const root = $('[data-matrix]');
  if (!root) return;
  const set = (sel, value) => { const el = $(sel, root); if (el) el.textContent = value; };

  selector($$('.mbtn', root), (id) => {
    const c = CONSTRAINTS[id];
    if (!c) return;
    set('[data-m=num]', c.num);
    set('[data-m=title]', c.title);
    set('[data-m=problem]', c.problem);
    set('[data-m=solution]', c.solution);
    const parts = $('[data-m=parts]', root);
    if (parts) {
      parts.innerHTML = '';
      for (const [k, v] of c.parts) {
        const cell = document.createElement('div');
        cell.innerHTML = '<span class="k"></span><span class="v"></span>';
        cell.children[0].textContent = k;
        cell.children[1].textContent = v;
        parts.appendChild(cell);
      }
    }
  });
}

/* ---------- impact: deployment scale ---------- */

const SCALES = {
  one: { mult: 1, caveat: 'Figures for a single 200 kg chamber over one storage season, simulated from the prototype control panel. No field-season data exists yet.' },
  cluster: { mult: 5, caveat: 'A five-chamber FPO cluster, scaled linearly from the single-unit simulation. Real clusters share transport and aggregation gains this model does not attempt to capture.' },
  district: { mult: 20, caveat: 'A twenty-chamber district rollout, scaled linearly from the single-unit simulation. Treat this as an order-of-magnitude sketch for planning, not a forecast.' }
};

function initImpact() {
  const root = $('[data-impact]');
  if (!root) return;
  const set = (sel, value) => { const el = $(sel, root); if (el) el.textContent = value; };
  const inr = (n) => n.toLocaleString('en-IN');

  selector($$('[data-scale]', root), (id) => {
    const s = SCALES[id];
    if (!s) return;
    set('[data-i=saved]', inr(1240 * s.mult) + ' kg');
    set('[data-i=value]', '₹' + inr(48000 * s.mult));
    set('[data-i=waste]', inr(320 * s.mult) + ' kg');
    set('[data-i=caveat]', s.caveat);
  });
}

/* ---------- project: spec sheet ---------- */

const SPECS = {
  cooling: [
    ['Chamber capacity', 'Sized to load onto a pickup and reach a hill collection centre.', '200 kg'],
    ['Insulation', 'Hermetic polyurethane envelope, chosen for high ambient humidity.', '100 mm PUF'],
    ['Compressor', 'Runs directly off the DC bus, around 420 W at 42% duty.', 'BLDC variable speed'],
    ['Thermal store', 'Freezes on surplus solar, holds the set-point for about 8.6 hours alone.', '70 kg PCM'],
    ['Humidity held', 'Crop-dependent. Large cardamom runs a dry profile below 70%.', '90–95 % RH'],
    ['Air handling', 'Keeps the chamber even, so no shelf sits warmer than the sensor.', 'Forced circulation']
  ],
  power: [
    ['Solar array', 'Roof-mounted on the chamber, sized against 3–5 kWh/m²/day.', '2.4 kW'],
    ['Charge controller', 'Tracks the array through broken cloud and protects the pack.', 'MPPT'],
    ['Battery', 'Tolerates heat and deep cycling without a ventilated battery room.', '48 V / 100 Ah LiFePO4'],
    ['Battery health', 'Read from the BMS and surfaced in the app.', '98 % reported'],
    ['Grid connection', 'Fully off-grid by design, including through multi-day outages.', 'None'],
    ['Renewable fraction', 'Share of energy taken directly from solar in the simulation.', '82 %']
  ],
  electronics: [
    ['Controller', 'Reads every sensor and owns all control decisions.', 'ESP32 dual core'],
    ['Temperature / humidity', 'Rated ±0.3 °C and ±2% RH, calibrated at commissioning.', 'SHT31'],
    ['Weight', 'Strain gauge to 200 kg at ±0.1 kg, drives batch inventory.', '4-point load cell'],
    ['Ripening', 'Electrochemical, warns when a batch is gassing off.', 'Ethylene sensor'],
    ['Door', 'Triggers the door-open alert and the compressor boost.', 'Magnetic reed switch'],
    ['Radio', 'Primary telemetry link, with GSM SMS as emergency fallback.', 'SX1276 LoRa 868 MHz']
  ],
  software: [
    ['Application', 'Installs to the phone, opens and answers with no signal.', 'Offline-first PWA'],
    ['Languages', 'English, Hindi, Assamese, Nepali, Meitei, Khasi, Mizo, Nagamese.', '8, with speech'],
    ['Roles', 'Three dashboards over the same chamber telemetry.', 'Farmer / retailer / FPO'],
    ['Crop profiles', 'Set-point, humidity band, chilling limit and shelf life for each.', '10 NER crops'],
    ['Inventory', 'Per-owner batches with days-left and sell-first flagging.', 'FIFO batches'],
    ['Data labelling', 'Every figure in the app carries its provenance on the screen.', 'Live / simulated / est.']
  ]
};

function initSpecSheet() {
  const root = $('[data-specsheet]');
  if (!root) return;
  const body = $('[data-sp=rows]', root);

  selector($$('[data-spec]', root), (id) => {
    const rows = SPECS[id];
    if (!rows || !body) return;
    body.innerHTML = '';
    for (const [k, note, v] of rows) {
      const row = document.createElement('div');
      row.className = 'trow t-spec';
      row.innerHTML = '<span class="c-name"></span><span class="c-note"></span><span class="c-val"></span>';
      row.children[0].textContent = k;
      row.children[1].textContent = note;
      row.children[2].textContent = v;
      body.appendChild(row);
    }
  });
}

/* ---------- scroll reveal ----------
   Marks elements from here rather than from the markup, so the five pages
   stay free of presentational hooks and a new section inherits the behaviour
   by being a .cell or a .sec-head like every other. */

const REVEAL_SINGLES = [
  '.sec-head', '.figure', '.panel', '.detail', '.crops', '.matrix',
  '.figbox', '.table', '.callout', '.chain', '.speclist', '.spec-list'
];

/* Containers whose direct children come in one after another. */
const REVEAL_GROUPS = [
  ['.hgrid', '.cell'],
  ['.hero-copy', ':scope > *'],
  ['.keylist', 'li']
];

const STAGGER_MS = 60;
const STAGGER_CAP = 6;   // past six the wait reads as lag, not rhythm

function countUp(el, done) {
  const raw = el.textContent.trim();
  const m = raw.match(/^([\d]+(?:[.,][\d]+)?)(.*)$/s);
  if (!m) { done(); return; }

  const target = parseFloat(m[1].replace(/,/g, ''));
  if (!isFinite(target)) { done(); return; }

  const decimals = (m[1].split('.')[1] || '').length;
  const suffix = m[2];
  const DURATION = 850;
  const start = performance.now();

  function frame(now) {
    const p = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = raw;   // restore the authored string exactly
      done();
    }
  }
  requestAnimationFrame(frame);
}

function initReveal() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const marked = new Set();
  const mark = (el, delay) => {
    if (!el || marked.has(el)) return;
    marked.add(el);
    el.setAttribute('data-reveal', '');
    if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
  };

  for (const sel of REVEAL_SINGLES) $$(sel).forEach((el) => mark(el, 0));

  for (const [containerSel, childSel] of REVEAL_GROUPS) {
    for (const container of $$(containerSel)) {
      $$(childSel, container).forEach((child, i) => {
        mark(child, Math.min(i, STAGGER_CAP) * STAGGER_MS);
      });
    }
  }

  const counters = $$('.keyfig .val');
  counters.forEach((el) => el.setAttribute('data-count', ''));

  if (!marked.size) return;
  root.classList.add('has-reveal');

  const showNow = (el) => {
    el.classList.add('is-in');
    if (el.hasAttribute('data-count')) el.removeAttribute('data-count');
  };

  // No observer, or the visitor asked for less motion: everything renders in
  // its final state and the counters keep their authored text.
  if (reduce || !('IntersectionObserver' in window)) {
    marked.forEach(showNow);
    counters.forEach((el) => el.removeAttribute('data-count'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      io.unobserve(el);
      el.classList.add('is-in');

      // A key figure inside a revealing cell counts up once, after the cell
      // has begun to fade in so the two do not fight for attention.
      const figure = el.querySelector && el.querySelector('[data-count]');
      if (figure) {
        const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
        figure.removeAttribute('data-count');
        setTimeout(() => countUp(figure, () => {}), delay + 160);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  marked.forEach((el) => io.observe(el));
}

/* ---------- boot ---------- */

for (const init of [initNav, initPanel, initCrops, initSchematic, initMatrix, initImpact, initSpecSheet, initReveal]) {
  try { init(); } catch (err) { console.error('[navonmesh] init failed:', err); }
}
