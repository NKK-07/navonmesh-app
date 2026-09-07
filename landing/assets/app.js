/* The page has one argument and three ways to interrogate it.
 *
 *   the divider   how much of the cold room you can see
 *   the day       what hour it is, which moves the outside and not the inside
 *   the crop      what is on the shelf, which moves the set point and the stakes
 *
 * All three write custom properties or text and let CSS do the rest.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const $ = s => document.querySelector(s);

const split   = $('#split');
const handle  = $('#handle');
const readOut = $('#readOut');
const readIn  = $('#readIn');
const dayPlot = $('#dayPlot');
const dayPlay = $('#dayPlay');

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 860px)');

/* ---------------------------------------------------------------- data */

/* A hot season day in Ri-Bhoi, hour by hour. Coolest before dawn, peaking
   mid afternoon. Illustrative of the season rather than a logged reading,
   which is why the page labels it a typical day. */
const OUTSIDE = [20,19.5,19,18.5,18.5,19,20.5,22.5,25,27.5,29.5,31.5,
                 33,34,34,33,31,29,26.5,24.5,23,22,21,20.5];

/* Set points and shelf life come from app/src/data/crops.js. The ambient
   figure is derived from that file's own multiplier for tomato and estimated
   in the same proportion for the rest, so it is a claim about ratio, not a
   measured number. */
const CROPS = {
  tomato:   { name:'Tomato',         set:9,  band:'8 to 10',  cold:18,  amb:4,  note:'' },
  chilli:   { name:'King Chilli',    set:6,  band:'5 to 7',   cold:28,  amb:6,  note:'never below 4, or it takes chilling injury' },
  ginger:   { name:'Ginger',         set:13, band:'12 to 14', cold:120, amb:30, note:'' },
  mandarin: { name:'Khasi Mandarin', set:5.5,band:'4 to 7',   cold:45,  amb:12, note:'a strong ethylene producer, store it apart' },
  cabbage:  { name:'Cabbage',        set:1,  band:'0 to 2',   cold:35,  amb:8,  note:'' }
};

/* One path per crop, drawn on a 120 box. Deliberately simple: a silhouette
   reads at this size where detail would not. */
const SHAPE = {
  tomato:   'M60 34c17 0 30 13 30 30s-13 30-30 30-30-13-30-30 13-30 30-30Z M60 34c0-6-4-10-4-10M52 30l8 4 8-4',
  chilli:   'M46 30c14-6 24 2 26 14 3 16-6 34-18 44-8 7-16 4-16-6 0-16 4-40 8-52Z M46 30c-2-6 2-10 8-10',
  ginger:   'M34 58c0-12 10-18 20-14 6 2 8-8 18-6s12 12 8 20c-4 9 6 12 4 22-2 11-16 14-24 8-7-5-14 2-20-4-6-7-6-20-6-26Z',
  mandarin: 'M60 32c17 0 32 14 32 31S77 94 60 94 28 80 28 63s15-31 32-31Z M60 32v62M32 63h56M38 45l44 36M82 45 38 81',
  cabbage:  'M60 30c18 0 32 14 32 32S78 94 60 94 28 80 28 62s14-32 32-32Z M60 30c-10 12-14 22-14 32s4 20 14 32M60 30c10 12 14 22 14 32s-4 20-14 32'
};

/* wrinkles that fade in as the hot side loses condition */
const WRINKLE =
  'M42 58q8 6 16 0t16 0M40 70q9 7 18 0t18 0M46 84q7 5 14 0t14 0';

let crop = 'tomato';
let hour = 14;
let x = 50;                 /* divider, percent */
let moved = false;

/* --------------------------------------------------------------- paint */

function outsideAt(h) {
  const a = OUTSIDE[Math.floor(h) % 24];
  const b = OUTSIDE[(Math.floor(h) + 1) % 24];
  return a + (b - a) * (h - Math.floor(h));
}

/* The chamber is not perfectly flat: the compressor works hardest in the
   afternoon, so it drifts a little. Pretending otherwise would be a worse
   story than the truth, which is that it drifts by two tenths. */
function insideAt(h, set) {
  const load = Math.max(0, Math.sin((h - 8) / 24 * Math.PI * 2));
  return set + load * 0.2;
}

function shapeFor(kind, wilt) {
  const path = SHAPE[kind];
  let out = '<path d="' + path + '"/>';
  if (wilt > 0.02) {
    out += '<path class="wrinkle" style="opacity:' + wilt.toFixed(2) +
           '" d="' + WRINKLE + '"/>';
  }
  return out;
}

function paint() {
  const c = CROPS[crop];
  const tOut = outsideAt(hour);
  const tIn  = insideAt(hour, c.set);

  /* readings */
  $('#degOut').textContent = tOut.toFixed(0);
  $('#degIn').textContent  = tIn.toFixed(1);
  $('#noteOut').textContent = 'Ri-Bhoi, ' + String(Math.floor(hour)).padStart(2,'0') + ':00';
  $('#noteIn').textContent  = c.note
    ? c.name + ', ' + c.note
    : 'Set point ' + c.band + ' degrees, holding';
  $('#lifeOut').textContent = c.amb + (c.amb === 1 ? ' day' : ' days');
  $('#lifeIn').textContent  = c.cold + ' days';
  $('#dayClock').textContent = String(Math.floor(hour)).padStart(2,'0') + ':00';

  /* the headline states the actual gap, so it changes with the hour */
  const gap = Math.round(tOut - tIn);
  const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine',
    'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen',
    'eighteen','nineteen','twenty','twenty one','twenty two','twenty three',
    'twenty four','twenty five','twenty six','twenty seven','twenty eight',
    'twenty nine','thirty','thirty one','thirty two','thirty three','thirty four'];
  const word = WORDS[clamp(gap,0,34)] || gap;
  $('#sayLine').innerHTML =
    word.charAt(0).toUpperCase() + word.slice(1) + ' degrees<br>is the whole product.';

  /* the produce: the hot one loses condition with the heat, the cold one
     never does, which is the entire claim in one picture */
  const wilt = clamp((tOut - 20) / 15, 0, 1);
  $('#prodHotShape').innerHTML = shapeFor(crop, wilt);
  $('#prodColdShape').innerHTML = shapeFor(crop, 0);
  $('#prodHot').style.setProperty('--wilt', wilt.toFixed(3));

  /* the sun climbs and sets */
  const sunT = clamp((hour - 5) / 14, 0, 1);
  const sun = $('#sun');
  if (sun) {
    sun.style.top = (10 + Math.cos(sunT * Math.PI) * 22 + 22) + '%';
    sun.style.opacity = (hour > 5 && hour < 19) ? '1' : '.18';
  }
  document.documentElement.style.setProperty('--heat', (wilt * 100).toFixed(0) + '%');

  /* the divider */
  document.documentElement.style.setProperty('--x', x.toFixed(2) + '%');
  handle.setAttribute('aria-valuenow', Math.round(x));
  readOut.style.opacity = clamp((x - 12) / 26, 0, 1).toFixed(3);
  readIn.style.opacity  = clamp((88 - x) / 26, 0, 1).toFixed(3);

  drawDay(c);
}

/* ----------------------------------------------------------- the day plot */

function drawDay(c) {
  const W = 1000, H = 120, LO = 14, HI = 37;
  const y = t => H - ((t - LO) / (HI - LO)) * H;

  let out = '', inn = '';
  for (let h = 0; h < 24; h++) {
    const px = (h / 23) * W;
    out += px.toFixed(1) + ',' + y(OUTSIDE[h]).toFixed(1) + ' ';
    inn += px.toFixed(1) + ',' + y(insideAt(h, c.set)).toFixed(1) + ' ';
  }
  $('#traceOut').setAttribute('points', out.trim());
  $('#traceIn').setAttribute('points', inn.trim());

  dayPlay.style.left = ((hour / 23) * 100).toFixed(2) + '%';
  dayPlot.setAttribute('aria-valuenow', Math.round(hour));
}

/* ------------------------------------------------------------- controls */

function setDivider(clientX, clientY) {
  const r = split.getBoundingClientRect();
  const pct = narrow.matches
    ? ((clientY - r.top) / r.height) * 100
    : ((clientX - r.left) / r.width) * 100;
  x = clamp(pct, 6, 94);
  if (!moved) { moved = true; handle.classList.add('moved'); }
  paint();
}

let draggingHandle = false;
handle.addEventListener('pointerdown', e => {
  draggingHandle = true; handle.setPointerCapture(e.pointerId); e.preventDefault();
});
addEventListener('pointermove', e => { if (draggingHandle) setDivider(e.clientX, e.clientY); });
addEventListener('pointerup', () => { draggingHandle = false; });
addEventListener('pointercancel', () => { draggingHandle = false; });

handle.addEventListener('keydown', e => {
  const step = e.shiftKey ? 10 : 3;
  let n = x;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = x - step;
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = x + step;
  else if (e.key === 'Home') n = 6;
  else if (e.key === 'End') n = 94;
  else return;
  e.preventDefault(); x = clamp(n, 6, 94);
  if (!moved) { moved = true; handle.classList.add('moved'); }
  paint();
});

/* the day scrubber */
let draggingDay = false;
function setHour(clientX) {
  const r = dayPlot.getBoundingClientRect();
  hour = clamp(((clientX - r.left) / r.width) * 23, 0, 23);
  stopPlay();
  paint();
}
dayPlot.addEventListener('pointerdown', e => {
  draggingDay = true; dayPlot.setPointerCapture(e.pointerId); setHour(e.clientX); e.preventDefault();
});
addEventListener('pointermove', e => { if (draggingDay) setHour(e.clientX); });
addEventListener('pointerup', () => { draggingDay = false; });

dayPlot.addEventListener('keydown', e => {
  let n = hour;
  if (e.key === 'ArrowLeft') n = hour - 1;
  else if (e.key === 'ArrowRight') n = hour + 1;
  else if (e.key === 'Home') n = 0;
  else if (e.key === 'End') n = 23;
  else return;
  e.preventDefault(); hour = clamp(n, 0, 23); stopPlay(); paint();
});

/* the crop */
document.querySelectorAll('.crop').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.crop').forEach(b => b.classList.remove('is-on'));
    btn.classList.add('is-on');
    crop = btn.dataset.crop;
    paint();
  });
});

/* --------------------------------------------------------------- autoplay */
/* The day runs on its own until the visitor takes over, so the flat line is
   seen holding rather than having to be discovered. */

let playRaf = null, playLast = 0;
function playStep(now) {
  const dt = Math.min(80, now - (playLast || now));
  playLast = now;
  hour = (hour + dt / 1000 * 1.6) % 23;
  paint();
  playRaf = requestAnimationFrame(playStep);
}
function startPlay() {
  if (reduce.matches || playRaf !== null) return;
  playRaf = requestAnimationFrame(playStep);
}
function stopPlay() {
  if (playRaf !== null) { cancelAnimationFrame(playRaf); playRaf = null; playLast = 0; }
  document.getElementById('day').classList.add('scrubbed');
}

/* stop burning frames when the hero is off screen or the tab is hidden */
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!document.getElementById('day').classList.contains('scrubbed')) startPlay();
    } else if (playRaf !== null) {
      cancelAnimationFrame(playRaf); playRaf = null; playLast = 0;
    }
  }, { rootMargin: '0px' }).observe(split);
}
addEventListener('visibilitychange', () => {
  if (document.hidden && playRaf !== null) {
    cancelAnimationFrame(playRaf); playRaf = null; playLast = 0;
  }
});

narrow.addEventListener('change', paint);
reduce.addEventListener('change', e => { if (e.matches) stopPlay(); });

paint();
setTimeout(startPlay, 1200);
