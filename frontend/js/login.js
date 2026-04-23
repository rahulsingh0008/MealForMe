// ============================================
// frontend/js/login.js
// Handles login form submission
// ============================================

import { login, getAuthStatus } from './api.js';
import { showAlert, hideAlert, showToast } from './ui.js';

const emailEl   = document.getElementById('email');
const passEl    = document.getElementById('password');
const btnLogin  = document.getElementById('btn-login');
const alertEl   = document.getElementById('login-alert');

// If already logged in, redirect home
(async () => {
  try {
    const auth = await getAuthStatus();
    if (auth.data.logged_in) {
      location.href = 'index.html';
    }
  } catch (_) { /* ignore */ }
})();

btnLogin.addEventListener('click', handleLogin);

// Allow Enter key to submit
[emailEl, passEl].forEach(el =>
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); })
);

async function handleLogin() {
  hideAlert(alertEl);

  const email    = emailEl.value.trim();
  const password = passEl.value;

  // Client-side validation
  if (!email || !password) {
    showAlert(alertEl, 'Please fill in all fields.');
    return;
  }

  // Loading state
  btnLogin.textContent = 'Logging in…';
  btnLogin.disabled    = true;

  try {
    const res = await login({ email, password });
    showToast(`Welcome back, ${res.data.fname}! 🎉`, 'success');

    // Redirect after short delay so toast is visible
    setTimeout(() => { location.href = 'index.html'; }, 800);
  } catch (err) {
    showAlert(alertEl, err.message);
    btnLogin.textContent = 'Log In';
    btnLogin.disabled    = false;
  }
}
