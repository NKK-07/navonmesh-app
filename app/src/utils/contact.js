// Who to ring when the chamber is in trouble.
//
// The Alerts page used to do this:
//
//   onclick="alert('Calling FPO Village Operator: +91 98620 XXXXX')"
//
// which is a popup containing a number that is literally XXXXX. It cannot
// place a call, and the one time it matters is the one time a farmer is
// standing in front of warming produce. A tel: link hands the number to the
// dialler, which is the only thing that actually helps.
//
// The number lives on the device rather than in the schema for now. It belongs
// on the FPO record, and moves there when the app starts reading units from the
// API; until then a saved number beats a fake one.

const KEY = 'navonmesh_operator';

/** E.164 where we can manage it, so tel: works from any handset. */
export function normalisePhone(input) {
  let s = String(input || '').replace(/[\s()\-.]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) return s;
  s = s.replace(/^00/, '');
  if (s.startsWith('91') && s.length === 12) return '+' + s;
  s = s.replace(/^0/, '');
  if (s.length === 10) return '+91' + s;
  return '+' + s;
}

/** The saved operator number, or null. Never a placeholder. */
export function getOperatorNumber() {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}

export function setOperatorNumber(value) {
  const clean = normalisePhone(value);
  try {
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  } catch {}
  return clean || null;
}

/** Spaced for reading, not for dialling. */
export function formatOperatorNumber(value) {
  const s = String(value || '');
  const m = /^\+91(\d{5})(\d{5})$/.exec(s);
  return m ? '+91 ' + m[1] + ' ' + m[2] : s;
}
