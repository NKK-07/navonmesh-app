/* NAVONMESH cinematic page: the scroll drive.

   There is no video here. The hero is hand drawn SVG, so the Blob loader and
   the seek gate from the standard pipeline do not apply. Everything else does:
   a rAF loop that rests, delta gated DOM writes, bands paced in scroll
   distance, the five static hero gates decided live, and reduced motion
   honoured in both directions. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p, e0, e1) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/* seeded generator, so the scatter offsets are identical on every load */
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const hero   = $('#hero');
const stage  = $('#stage');
const cam    = $('#cam');
const cue    = $('#cue');
const hudDepth = $('#hudDepth');
const hudTemp  = $('#hudTemp');

/* ------------------------------------------------------------------ split */
/* Each band's line becomes word and character spans, once, at load. */
function splitLines() {
  $$('.band').forEach((band, bi) => {
    const line = $('.line', band);
    if (!line) return;
    const text = line.dataset.text || '';
    const entrance = band.dataset.entrance;
    const rand = rng(9973 + bi * 131);

    if (entrance === 'blur') {
      /* two stacked copies crossfaded; the soft one carries a static blur */
      line.innerHTML =
        '<span class="sr">' + text + '</span>' +
        '<span class="soft" aria-hidden="true">' + text + '</span>' +
        '<span class="sharp" aria-hidden="true">' + text + '</span>';
      return;
    }

    const words = text.split(' ');
    const spread = parseFloat(band.dataset.spread || '0.45');
    let html = '<span class="sr">' + text + '</span><span aria-hidden="true">';
    let ci = 0;
    const totalChars = text.replace(/ /g, '').length;

    words.forEach((w, wi) => {
      const wth = (wi / Math.max(1, words.length - 1)) * spread;
      html += '<span class="w" style="--th:' + wth.toFixed(3) + '">';
      for (const ch of w) {
        if (entrance === 'scatter') {
          const th = (ci / Math.max(1, totalChars)) * spread + rand() * 0.06;
          const jx = (rand() * 2 - 1) * 26;
          const jy = (rand() * 2 - 1) * 22;
          const jr = (rand() * 2 - 1) * 14;
          html += '<span class="c" style="--th:' + th.toFixed(3) +
                  ';--jx:' + jx.toFixed(1) + 'px;--jy:' + jy.toFixed(1) +
                  'px;--jr:' + jr.toFixed(1) + 'deg">' + ch + '</span>';
        } else {
          html += '<span class="c">' + ch + '</span>';
        }
        ci++;
      }
      html += '</span>';
      if (wi < words.length - 1) html += ' ';
    });
    html += '</span>';
    line.innerHTML = html;
  });
}
splitLines();

/* ------------------------------------------------------------------ bands */
const bands = $$('.band').map(el => ({
  el,
  a: parseFloat(el.dataset.a),
  b: parseFloat(el.dataset.b),
  ramp: parseFloat(el.dataset.ramp || '0') || 0,
  op: -1,
  k: -1
}));

/* every drawable in the scene carries its own progress window */
const draws = $$('#cam [data-from]').map(el => {
  let len = 1200;
  const measurable = el.tagName === 'path' || el.tagName === 'rect' || el.tagName === 'circle';
  try {
    if (typeof el.getTotalLength === 'function') len = Math.ceil(el.getTotalLength()) || 1200;
  } catch (e) { /* text and groups have no length; the default is fine */ }
  return {
    el,
    from: parseFloat(el.dataset.from),
    to: parseFloat(el.dataset.to),
    d: -1,
    load: el.hasAttribute('data-load'),
    kids: el.tagName === 'g' ? $$('path,rect,circle', el) : []
  };
});

/* measure each stroke so the dash reveal is exact */
draws.forEach(o => {
  const targets = o.kids.length ? o.kids : [o.el];
  targets.forEach(t => {
    let len = 1200;
    try { if (t.getTotalLength) len = Math.ceil(t.getTotalLength()) || 1200; } catch (e) {}
    t.style.setProperty('--len', len);
  });
});

const CAM_TRAVEL = 1860;   // the drawing is 2480 tall inside a 620 window

let target = 0, shown = 0, rafId = null, lastTick = 0;
let heroOnScreen = true;
let scrubOn = false;

function heroProgress() {
  if (!hero) return 0;
  const range = hero.offsetHeight - window.innerHeight;
  if (range <= 0) return 0;
  return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
}

/* --------------------------------------------------------------- captions */
function updateCaptions(p) {
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const f = Math.min(0.02, (b.b - b.a) / 3);
    const inEase  = i === 0 ? 1 : smoothstep(p, b.a, b.a + f);
    const outEase = i === bands.length - 1 ? 1 : (1 - smoothstep(p, b.b - f, b.b));
    const op = inEase * outEase;

    const ramp = b.ramp || Math.min(0.025, (b.b - b.a) * 0.35);
    let k = clamp((p - b.a) / ramp, 0, 1);
    if (i === 0) k = Math.max(k, loadK);   /* band one's one time load ramp */

    if (Math.abs(op - b.op) > 0.004) {          /* delta gated */
      b.op = op;
      b.el.style.opacity = op.toFixed(3);
    }
    if (Math.abs(k - b.k) > 0.008) {
      b.k = k;
      b.el.style.setProperty('--k', k.toFixed(3));
      if (i === bands.length - 1) {
        b.el.style.setProperty('--ks', clamp((k - 0.55) * 3, 0, 1).toFixed(3));
        b.el.style.setProperty('--kb', clamp((k - 0.74) * 4, 0, 1).toFixed(3));
      }
    }
  }
}

/* ------------------------------------------------------------------ scene */
let lastCam = -1, lastHud = '', lastHudAt = 0, lastFade = -1;

function updateScene(p, now) {
  const y = -(p * CAM_TRAVEL);
  if (Math.abs(y - lastCam) > 0.4) {
    lastCam = y;
    cam.setAttribute('transform', 'translate(0 ' + y.toFixed(1) + ')');
  }

  for (const o of draws) {
    let d = clamp((p - o.from) / (o.to - o.from), 0, 1);
    if (o.load) d = Math.max(d, loadK);   /* opening beats assemble once on load */
    if (Math.abs(d - o.d) > 0.006) {
      o.d = d;
      o.el.style.setProperty('--d', d.toFixed(3));
    }
  }

  /* the journey has arrived: ease the whole stage out so it never collides
     with the nav or the first section on the way past */
  const fade = 1 - smoothstep(p, 0.955, 1);
  if (Math.abs(fade - lastFade) > 0.005) {
    lastFade = fade;
    stage.style.opacity = fade.toFixed(3);
  }

  /* the readout: throttled to about 10Hz and written only when it changes */
  if (now - lastHudAt > 100) {
    lastHudAt = now;
    const depth = p < 0.16 ? 'ROOF' : p < 0.44 ? 'POWER' : p < 0.72 ? 'CHAMBER WALL' : 'SHELF';
    const temp = (24 - 15.8 * smoothstep(p, 0.18, 0.74)).toFixed(1) + ' °C';
    const s = depth + '|' + temp;
    if (s !== lastHud) {
      lastHud = s;
      hudDepth.textContent = depth;
      hudTemp.textContent = temp;
    }
  }
}

/* band one assembles once on load, then hands over to scroll */
let loadK = 0;
(function loadRamp() {
  const t0 = performance.now();
  function step(now) {
    loadK = clamp((now - t0) / 900, 0, 1);
    if (scrubOn) { updateCaptions(shown); updateScene(shown, now); }
    if (loadK < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* ------------------------------------------------------------- the drive */
function tick(now) {
  const dt = Math.min(100, now - (lastTick || now));
  lastTick = now;
  const k = 0.16;
  shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));

  if (Math.abs(target - shown) < 0.0005) {
    shown = target;
    rafId = null;
    lastTick = 0;
  } else {
    rafId = requestAnimationFrame(tick);
  }

  updateScene(shown, now);
  updateCaptions(shown);

  const showCue = shown < 0.04;
  if (cue.dataset.on !== String(showCue)) {
    cue.dataset.on = String(showCue);
    cue.style.opacity = showCue ? '1' : '0';
  }
}

function onScroll() {
  target = heroProgress();
  if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
}

if (hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(es => {
    heroOnScreen = es[0].isIntersecting;
    if (heroOnScreen && scrubOn && rafId === null) rafId = requestAnimationFrame(tick);
  }, { rootMargin: '10% 0px' }).observe(hero);
}

/* ------------------------------------------------- the five static gates */
/* character for character identical to the media query block in style.css */
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];

function pinToFinalStates() {
  draws.forEach(o => { o.d = 1; o.el.style.setProperty('--d', '1'); });
  bands.forEach((b, i) => {
    b.op = 1; b.k = 1;
    b.el.style.opacity = i === bands.length - 1 ? '1' : '0';
    b.el.style.setProperty('--k', '1');
    b.el.style.setProperty('--ks', '1');
    b.el.style.setProperty('--kb', '1');
  });
  $$('.reveal').forEach(s => s.classList.add('in', 'done'));
  setHold(1, true);
}

function unpinFinalStates() {
  draws.forEach(o => { o.d = -1; });
  bands.forEach(b => { b.op = -1; b.k = -1; });
}

function enableScrub() {
  if (scrubOn) return;
  scrubOn = true;
  addEventListener('scroll', onScroll, { passive: true });
  unpinFinalStates();
  updateCaptions(heroProgress());
  onScroll();
}

function disableScrub() {
  if (!scrubOn) return;
  scrubOn = false;
  removeEventListener('scroll', onScroll);
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}

function applyHeroMode() {
  if (GATES.some(q => matchMedia(q).matches)) disableScrub();
  else enableScrub();
}

const MQLS = GATES.map(q => matchMedia(q));
MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
applyHeroMode();

matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  if (e.matches) pinToFinalStates();
  else applyHeroMode();
});

/* ------------------------------------------------------ section entrances */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      /* retire the stagger delays once the entrance has played, so later
         hovers on these elements do not inherit the delay forever */
      setTimeout(() => e.target.classList.add('done'), 1100);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  $$('.reveal').forEach(s => io.observe(s));
} else {
  $$('.reveal').forEach(s => s.classList.add('in', 'done'));
}

/* ------------------------------------------- the one interactive moment */
/* Press and hold to keep it cold. Holding is the product, so holding is the
   interaction. Release early and it eases back rather than snapping. */

const CROPS = {
  mandarin: { name: 'Khasi Mandarin', ambient: 12,  cold: 45,  price: '₹85 / kg' },
  ginger:   { name: 'Ginger',         ambient: 30,  cold: 120, price: '₹110 / kg' },
  chilli:   { name: 'King Chilli',    ambient: 6,   cold: 28,  price: '₹1,200 / kg dry' },
  cabbage:  { name: 'Cabbage',        ambient: 8,   cold: 35,  price: 'sold by the crate' },
  tomato:   { name: 'Tomato',         ambient: 4,   cold: 18,  price: 'sold by the crate' }
};

let crop = CROPS.mandarin;
let hold = 0, holding = false, holdRaf = null, holdLast = 0;

const gFill  = $('#gFill');
const gAmb   = $('#gAmb');
const gDays  = $('#gDays');
const gPrice = $('#gPrice');
const holdBtn  = $('#holdBtn');
const holdFill = $('#holdFill');

let lastDays = -1;

function setHold(v, instant) {
  hold = clamp(v, 0, 1);
  const ambFrac = crop.ambient / crop.cold;
  const g = ambFrac + (1 - ambFrac) * hold;
  gFill.style.setProperty('--g', g.toFixed(4));
  gAmb.style.setProperty('--amb', (ambFrac * 100).toFixed(2) + '%');
  holdFill.style.setProperty('--h', hold.toFixed(4));

  const days = Math.round(crop.ambient + (crop.cold - crop.ambient) * hold);
  if (days !== lastDays) {
    lastDays = days;
    gDays.textContent = days;
  }
  if (instant) { holdBtn.setAttribute('aria-pressed', hold >= 1 ? 'true' : 'false'); }
}

function holdTick(now) {
  const dt = Math.min(100, now - (holdLast || now));
  holdLast = now;
  const dir = holding ? 1 : -1;
  const speed = holding ? 1 / 1100 : 1 / 700;    /* fills in 1.1s, eases back faster */
  const next = clamp(hold + dir * dt * speed, 0, 1);
  setHold(next);
  if ((holding && next < 1) || (!holding && next > 0)) {
    holdRaf = requestAnimationFrame(holdTick);
  } else {
    holdRaf = null; holdLast = 0;
    holdBtn.setAttribute('aria-pressed', next >= 1 ? 'true' : 'false');
  }
}

function startHold(e) {
  if (e) e.preventDefault();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setHold(1, true); return; }
  holding = true;
  if (holdRaf === null) holdRaf = requestAnimationFrame(holdTick);
}
function endHold() {
  holding = false;
  if (holdRaf === null) holdRaf = requestAnimationFrame(holdTick);
}

if (holdBtn) {
  holdBtn.addEventListener('pointerdown', startHold);
  addEventListener('pointerup', endHold);
  addEventListener('pointercancel', endHold);
  holdBtn.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startHold(); }
  });
  holdBtn.addEventListener('keyup', e => {
    if (e.key === ' ' || e.key === 'Enter') endHold();
  });
}

$$('.crop').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.crop').forEach(b => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    crop = CROPS[btn.dataset.crop];
    gPrice.textContent = crop.price === 'sold by the crate'
      ? 'Shillong mandi reference: sold by the crate'
      : 'Shillong mandi reference: ' + crop.price;
    lastDays = -1;
    setHold(hold, true);
  });
});
setHold(0, true);

/* ------------------------------------------------------------------ form */
const form = $('#bookForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    $('#formDone').hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
  });
}

/* --------------------------------------------- pause drives on hidden tab */
addEventListener('visibilitychange', () => {
  document.body.classList.toggle('paused', document.hidden);
});
