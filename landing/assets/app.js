/* The deck reacts to two things: where the pointer is, and how far down the
 * page you are. Both write CSS custom properties and let CSS do the compositing,
 * so nothing here touches layout and the whole thing stays on the compositor.
 *
 * The resting fan lives in CSS (--dx, --dy, --rot per card). This only ever
 * adds an offset on top of it, so the layout is still correct with JS disabled.
 */

const stage = document.getElementById('stage');
const deck = document.getElementById('deck');
const cards = [...document.querySelectorAll('.card')];
const wordmark = document.getElementById('wordmark');
const hudFill = document.getElementById('hudFill');

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ------------------------------------------------------------- pointer */
/* Each card leans by an amount proportional to its depth in the fan, so the
 * deck parallaxes rather than moving as one slab. */

let pointerX = 0, pointerY = 0;   // -1 .. 1
let shownX = 0, shownY = 0;
let raf = null;

function applyPointer() {
  cards.forEach((card, i) => {
    const depth = (i - (cards.length - 1) / 2) / cards.length;  // -0.4 .. 0.4
    const lift = 1 + Math.abs(depth) * 1.4;
    card.style.setProperty('--px', (shownX * 26 * lift).toFixed(1) + 'px');
    card.style.setProperty('--py', (shownY * 16 * lift).toFixed(1) + 'px');
    card.style.setProperty('--prot', (shownX * 2.4 * (depth * 2)).toFixed(2) + 'deg');
  });
  if (wordmark) {
    wordmark.style.transform =
      'translate(-50%,-50%) translate(' + (shownX * -14).toFixed(1) + 'px,' +
      (shownY * -8).toFixed(1) + 'px)';
  }
}

function tick() {
  shownX += (pointerX - shownX) * 0.08;
  shownY += (pointerY - shownY) * 0.08;
  applyPointer();

  if (Math.abs(pointerX - shownX) < 0.001 && Math.abs(pointerY - shownY) < 0.001) {
    shownX = pointerX; shownY = pointerY;
    applyPointer();
    raf = null;               // converged: stop burning frames
    return;
  }
  raf = requestAnimationFrame(tick);
}

function onPointer(event) {
  const r = stage.getBoundingClientRect();
  pointerX = clamp((event.clientX - r.left) / r.width * 2 - 1, -1, 1);
  pointerY = clamp((event.clientY - r.top) / r.height * 2 - 1, -1, 1);
  if (raf === null) raf = requestAnimationFrame(tick);
}

/* Pointer parallax is a desktop affordance. On a touch screen there is no
 * hover, and running it would only cost battery. */
if (!reduce.matches && !coarse.matches) {
  stage.addEventListener('pointermove', onPointer, { passive: true });
  stage.addEventListener('pointerleave', () => {
    pointerX = 0; pointerY = 0;
    if (raf === null) raf = requestAnimationFrame(tick);
  }, { passive: true });
}

/* -------------------------------------------------------------- scroll */
/* The deck drifts apart and sinks as you leave the hero, so the cards feel
 * like objects in space rather than a painted background. */

let lastP = -1;

function onScroll() {
  const h = stage.offsetHeight || window.innerHeight;
  const p = clamp(window.scrollY / h, 0, 1);
  if (Math.abs(p - lastP) < 0.004) return;      // delta gate
  lastP = p;

  cards.forEach((card, i) => {
    const spread = (i - (cards.length - 1) / 2);
    card.style.setProperty('--sc', (p * 150).toFixed(1) + 'px');
    card.style.setProperty('--prot', (p * spread * 3).toFixed(2) + 'deg');
    card.style.opacity = (1 - p * 0.85).toFixed(3);
  });

  if (wordmark) wordmark.style.opacity = (1 - p * 1.25).toFixed(3);
  if (hudFill) hudFill.style.setProperty('--h', (18 + p * 82).toFixed(0) + '%');
}

if (!reduce.matches) {
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* Reduced motion, live in both directions: pin everything to its resting
 * state on the way in, and re-arm on the way out. */
reduce.addEventListener('change', event => {
  if (event.matches) {
    removeEventListener('scroll', onScroll);
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    cards.forEach(card => {
      ['--px', '--py', '--prot', '--sc'].forEach(v => card.style.removeProperty(v));
      card.style.opacity = '';
    });
    if (wordmark) { wordmark.style.transform = 'translate(-50%,-50%)'; wordmark.style.opacity = ''; }
  } else {
    addEventListener('scroll', onScroll, { passive: true });
    lastP = -1;
    onScroll();
  }
});

/* A card is a real destination, not decoration. */
cards.forEach(card => {
  card.addEventListener('click', () => { location.href = '../app/'; });
  card.style.cursor = 'pointer';
});
