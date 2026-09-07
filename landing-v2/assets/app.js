/* ==========================================================================
   NAVONMESH Landing v2 — Interactions
   Scroll-driven exploded view, counter-up, parallax, reveal.
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

/* =========================================================================
   1. EXPLODED VIEW — the hero feature
   ========================================================================= */

const PARTS = [
  { id: 'part-solar',      label: 0, tx: 0,    ty: -120, name: 'SOLAR ARRAY' },
  { id: 'part-mppt',       label: 1, tx: -160, ty: -80,  name: 'MPPT CONTROLLER' },
  { id: 'part-battery',    label: 2, tx: -180, ty: 0,    name: 'BATTERY BANK' },
  { id: 'part-controller', label: 3, tx: 160,  ty: -100, name: 'ESP32 CONTROLLER' },
  { id: 'part-compressor', label: 4, tx: -60,  ty: 120,  name: 'BLDC COMPRESSOR' },
  { id: 'part-pcm',        label: 5, tx: -180, ty: 100,  name: 'THERMAL STORE' },
  { id: 'part-chamber',    label: 6, tx: 120,  ty: 40,   name: 'COLD CHAMBER' }
];

// Each part "activates" at a specific scroll phase
const PHASE_COUNT = PARTS.length + 1; // +1 for the assembled state
function getActivePartIndex(progress) {
  // 0-0.08: assembled, then each part gets a ~0.13 slice
  if (progress < 0.08) return -1; // assembled
  const partProgress = (progress - 0.08) / 0.92;
  return Math.min(PARTS.length - 1, Math.floor(partProgress * PARTS.length));
}

function initExplodedView() {
  const wrap = $('#exploded');
  const sticky = $('.exploded-sticky');
  if (!wrap || !sticky) return;

  const parts = PARTS.map(p => ({
    ...p,
    el: $(`#${p.id}`),
    labelEl: $(`#label-${p.label}`)
  }));

  const progressFill = $('#progressFill');
  const progressLabel = $('#progressLabel');
  const connLines = $('#connLines');
  const heading = $('#explodedHeading');

  let lastProgress = -1;

  function update() {
    const rect = wrap.getBoundingClientRect();
    const wrapHeight = wrap.offsetHeight;
    const viewHeight = window.innerHeight;

    // How far we've scrolled into the exploded section (0 → 1)
    const scrolled = -rect.top;
    const scrollRange = wrapHeight - viewHeight;
    const progress = clamp(scrolled / scrollRange, 0, 1);

    // Skip tiny changes
    if (Math.abs(progress - lastProgress) < 0.002) return;
    lastProgress = progress;

    // --- Update progress bar ---
    if (progressFill) progressFill.style.height = (progress * 100) + '%';

    const activeIndex = getActivePartIndex(progress);

    // --- Update progress label ---
    if (progressLabel) {
      if (activeIndex < 0) {
        progressLabel.textContent = 'ASSEMBLED';
      } else {
        progressLabel.textContent = parts[activeIndex].name;
      }
    }

    // --- Explosion factor: 0 = assembled, 1 = fully exploded ---
    const explosionFactor = clamp((progress - 0.05) / 0.6, 0, 1);
    const eased = 1 - Math.pow(1 - explosionFactor, 3); // ease-out cubic

    // --- Move each part ---
    parts.forEach((part, i) => {
      if (!part.el) return;

      const dx = part.tx * eased;
      const dy = part.ty * eased;
      part.el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;

      // Dim non-active parts when one is active
      if (activeIndex >= 0) {
        if (i === activeIndex) {
          part.el.classList.add('is-active');
          part.el.classList.remove('is-dim');
        } else {
          part.el.classList.remove('is-active');
          part.el.classList.add('is-dim');
        }
      } else {
        part.el.classList.remove('is-active', 'is-dim');
      }

      // Show label when this part is active AND explosion has started
      if (part.labelEl) {
        if (i === activeIndex && explosionFactor > 0.3) {
          part.labelEl.classList.add('is-visible');
        } else {
          part.labelEl.classList.remove('is-visible');
        }
      }
    });

    // --- Connection lines fade in with explosion ---
    if (connLines) {
      connLines.style.opacity = clamp(eased * 1.5, 0, 0.6);
    }

    // --- Heading transition ---
    if (heading) {
      if (activeIndex < 0) {
        heading.textContent = 'Seven components. Zero grid dependency.';
      } else {
        const texts = [
          'The sun hits the roof and the cold chain starts.',
          'Every watt tracked through monsoon cloud.',
          'Power that lasts through the night.',
          'One chip runs the entire system.',
          'Variable speed. No inrush. No waste.',
          'Cold stored as ice, not as electricity.',
          'Two hundred kilograms. One week gained.'
        ];
        heading.textContent = texts[activeIndex] || '';
      }
    }
  }

  if (!reduce.matches) {
    addEventListener('scroll', update, { passive: true });
    update();
  }
}

/* =========================================================================
   2. COUNTER-UP ANIMATION
   ========================================================================= */

function countUp(el, target, decimals, duration = 900) {
  const start = performance.now();

  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target.toFixed(decimals).replace(/\.0$/, '');
  }
  requestAnimationFrame(frame);
}

function initCounters() {
  const counters = $$('[data-count-target]');
  if (!counters.length) return;

  const counted = new Set();

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (counted.has(el)) continue;
      counted.add(el);
      io.unobserve(el);

      const target = parseFloat(el.dataset.countTarget);
      const decimals = parseInt(el.dataset.decimals || '0', 10);

      if (reduce.matches) {
        el.textContent = target.toFixed(decimals).replace(/\.0$/, '');
      } else {
        countUp(el, target, decimals);
      }
    }
  }, { threshold: 0.3 });

  counters.forEach(el => io.observe(el));
}

/* =========================================================================
   3. SCROLL REVEAL
   ========================================================================= */

function initReveal() {
  const els = $$('[data-reveal], .stat, .decisions-head, .crops-head, .cta-inner');
  if (!els.length) return;

  if (reduce.matches) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

/* =========================================================================
   4. HERO PARALLAX
   ========================================================================= */

function initHeroParallax() {
  const hero = $('#hero');
  const glow = $('.hero-glow');
  const grid = $('.hero-grid');
  const scrollHint = $('#scrollHint');

  if (!hero || reduce.matches) return;

  let lastY = -1;

  function onScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 2) return;
    lastY = y;

    const h = hero.offsetHeight;
    const p = clamp(y / h, 0, 1.5);

    // Glow moves up as you scroll
    if (glow) glow.style.transform = `translateX(-50%) translateY(${p * -60}px) scale(${1 + p * 0.1})`;
    // Grid fades out
    if (grid) grid.style.opacity = (1 - p * 1.5).toFixed(3);
    // Scroll hint fades out
    if (scrollHint) scrollHint.style.opacity = clamp(1 - p * 4, 0, 1).toFixed(3);
  }

  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mouse parallax on glow
  const coarse = matchMedia('(pointer: coarse)');
  if (!coarse.matches) {
    let mx = 0, my = 0, sx = 0, sy = 0;
    let raf = null;

    function tick() {
      sx += (mx - sx) * 0.06;
      sy += (my - sy) * 0.06;
      if (glow) {
        const scrollP = clamp(window.scrollY / hero.offsetHeight, 0, 1);
        glow.style.transform = `translateX(calc(-50% + ${sx * 30}px)) translateY(${scrollP * -60 + sy * 20}px) scale(${1 + scrollP * 0.1})`;
      }
      if (Math.abs(mx - sx) > 0.001 || Math.abs(my - sy) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else { raf = null; }
    }

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width * 2 - 1;
      my = (e.clientY - r.top) / r.height * 2 - 1;
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      mx = 0; my = 0;
      if (raf === null) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }
}

/* =========================================================================
   5. CROP BAR ANIMATION
   ========================================================================= */

function initCropBars() {
  const cards = $$('.crop-card');
  if (!cards.length) return;

  // Set initial bar widths to 0 for animation
  cards.forEach(card => {
    $$('.crop-bar i', card).forEach(bar => {
      const target = bar.style.width;
      bar.dataset.targetWidth = target;
      bar.style.width = '0%';
    });
  });

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      // Animate bars to target width
      setTimeout(() => {
        $$('.crop-bar i', entry.target).forEach(bar => {
          bar.style.width = bar.dataset.targetWidth;
        });
      }, 200);
    }
  }, { threshold: 0.3 });

  cards.forEach(card => io.observe(card));
}

/* =========================================================================
   BOOT
   ========================================================================= */

const inits = [
  initExplodedView,
  initCounters,
  initReveal,
  initHeroParallax,
  initCropBars
];

for (const init of inits) {
  try { init(); } catch (err) { console.error('[navonmesh-v2]', err); }
}
