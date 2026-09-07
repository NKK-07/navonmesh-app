/* The divider.
 *
 * Dragging it is the page's one idea: you pull the cold across the heat and
 * watch the number fall. Everything here exists to make that feel physical.
 *
 * One custom property, --x, drives the clip on the cold side, the handle's
 * position, and nothing else. CSS does the compositing.
 */

const split  = document.getElementById('split');
const handle = document.getElementById('handle');
const readOut = document.getElementById('readOut');
const readIn  = document.getElementById('readIn');

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 860px)');

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let x = 50;          // where the divider is, in percent
let dragging = false;
let moved = false;

function paint() {
  document.documentElement.style.setProperty('--x', x.toFixed(2) + '%');
  handle.setAttribute('aria-valuenow', Math.round(x));

  /* The readings fade as the divider covers them, so neither number is ever
     sitting on the wrong side of the split saying the wrong thing. */
  const outVis = clamp((x - 12) / 26, 0, 1);
  const inVis  = clamp((88 - x) / 26, 0, 1);
  readOut.style.opacity = outVis.toFixed(3);
  readIn.style.opacity  = inVis.toFixed(3);
}

function setFromPointer(clientX, clientY) {
  const r = split.getBoundingClientRect();
  const pct = narrow.matches
    ? ((clientY - r.top) / r.height) * 100
    : ((clientX - r.left) / r.width) * 100;
  x = clamp(pct, 6, 94);
  if (!moved) { moved = true; handle.classList.add('moved'); }
  paint();
}

/* pointer events cover mouse, touch and pen in one path */
handle.addEventListener('pointerdown', event => {
  dragging = true;
  handle.setPointerCapture(event.pointerId);
  event.preventDefault();
});

addEventListener('pointermove', event => {
  if (!dragging) return;
  setFromPointer(event.clientX, event.clientY);
});

addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointercancel', () => { dragging = false; });

/* Clicking anywhere on the split jumps the divider there. Faster than
   dragging, and it makes the whole surface feel live. */
split.addEventListener('pointerdown', event => {
  if (event.target.closest('.nav, .say, .handle')) return;
  setFromPointer(event.clientX, event.clientY);
});

/* Keyboard: the handle is a real slider, so arrows move it. */
handle.addEventListener('keydown', event => {
  const step = event.shiftKey ? 10 : 3;
  let next = x;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = x - step;
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = x + step;
  else if (event.key === 'Home') next = 6;
  else if (event.key === 'End') next = 94;
  else return;
  event.preventDefault();
  x = clamp(next, 6, 94);
  if (!moved) { moved = true; handle.classList.add('moved'); }
  paint();
});

/* A one time nudge on load, so the divider announces that it moves. Runs
   once, hands over to the user the moment they touch it, and is skipped
   entirely under reduced motion. */
function nudge() {
  if (reduce.matches) return;
  const from = 50, to = 62, ms = 1100;
  const t0 = performance.now();
  function step(now) {
    if (moved) return;                       // the user took over
    const p = Math.min(1, (now - t0) / ms);
    const eased = p < 0.5
      ? 4 * p * p * p
      : 1 - Math.pow(-2 * p + 2, 3) / 2;
    /* out and back, so it returns to where it started */
    const swing = Math.sin(eased * Math.PI);
    x = from + (to - from) * swing;
    paint();
    if (p < 1) requestAnimationFrame(step);
    else { x = from; paint(); }
  }
  requestAnimationFrame(step);
}

/* Switching between the vertical and horizontal split needs a repaint, or
   the divider keeps the other axis's position. */
narrow.addEventListener('change', paint);

paint();
setTimeout(nudge, 900);
