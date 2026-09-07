// Sign in.
//
// Phone and a four digit PIN. Farmers in Ri-Bhoi have phones and most do not
// have email, so phone is the identity. A PIN is short enough to remember and
// to type on a cheap handset with cold hands, which is why the server locks an
// account after five wrong tries rather than relying on the PIN being strong.

import { login } from '../utils/api.js';

export function renderLoginPage() {
  return `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-brand">
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <circle cx="13" cy="19" r="4.5" stroke="var(--agri-green)" stroke-width="1.7"/>
            <path d="M27 11v16M21.1 14.5l11.8 7M32.9 14.5l-11.8 7" stroke="currentColor" stroke-width="1.7"/>
          </svg>
          <div>
            <p class="login-name">NAVONMESH</p>
            <p class="login-sub">Solar mini cold storage</p>
          </div>
        </div>

        <h1 class="login-title">Sign in to your unit</h1>
        <p class="login-lede">Use the phone number registered with your FPO.</p>

        <form id="loginForm" novalidate>
          <label class="login-label" for="loginPhone">Phone number</label>
          <input class="login-input" id="loginPhone" name="phone" type="tel"
                 inputmode="tel" autocomplete="username" placeholder="+91"
                 required>

          <label class="login-label" for="loginPin">PIN</label>
          <input class="login-input" id="loginPin" name="pin" type="password"
                 inputmode="numeric" autocomplete="current-password"
                 maxlength="6" placeholder="4 digits" required>

          <p class="login-error" id="loginError" role="alert" hidden></p>

          <button class="login-btn" id="loginBtn" type="submit">Sign in</button>
        </form>

        <p class="login-help">
          Forgotten your PIN? Your FPO manager can reset it. There is no way to
          recover it from this screen, which is deliberate.
        </p>
      </div>
    </div>
  `;
}

export function bindLoginEvents(onSignedIn) {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const errEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  const fail = message => {
    errEl.textContent = message;
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign in';
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    errEl.hidden = true;

    const phone = document.getElementById('loginPhone').value.trim();
    const pin = document.getElementById('loginPin').value.trim();

    if (!phone || !pin) return fail('Enter your phone number and PIN.');

    btn.disabled = true;
    btn.textContent = 'Signing in';

    let result;
    try {
      result = await login(phone, pin);
    } catch {
      return fail('Cannot reach the server. Check your connection and try again.');
    }

    if (result.ok) {
      onSignedIn(result.user);
      return;
    }
    if (result.reason === 'locked') {
      const until = result.until ? new Date(result.until) : null;
      const when = until
        ? until.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'a few minutes';
      return fail('Too many wrong tries. Try again after ' + when + ', or ask your FPO manager.');
    }
    if (result.reason === 'rate') {
      return fail('Too many attempts from this phone. Wait a minute and try again.');
    }
    return fail('That phone number and PIN do not match.');
  });
}
