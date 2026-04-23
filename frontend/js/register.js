// ============================================
// frontend/js/register.js
// Handles registration form submission
// ============================================

import { register, getAuthStatus } from './api.js';
import { showAlert, hideAlert, showToast } from './ui.js';

const fnameEl   = document.getElementById('fname');
const lnameEl   = document.getElementById('lname');
const emailEl   = document.getElementById('email');
const areaEl    = document.getElementById('area');
const passEl    = document.getElementById('password');
const btnReg    = document.getElementById('btn-register');
const alertEl   = document.getElementById('reg-alert');

// If already logged in, redirect home
(async () => {
  try {
    const auth = await getAuthStatus();
    if (auth.data.logged_in) location.href = 'index.html';
  } catch (_) { /* ignore */ }
})();

btnReg.addEventListener('click', handleRegister);

// Enter key on last field
passEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });

async function handleRegister() {
  hideAlert(alertEl);

  const fname    = fnameEl.value.trim();
  const lname    = lnameEl.value.trim();
  const email    = emailEl.value.trim();
  const area     = areaEl.value.trim();
  const password = passEl.value;

  // Client-side validation
  if (!fname || !lname || !email || !area || !password) {
    showAlert(alertEl, 'Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showAlert(alertEl, 'Password must be at least 6 characters.');
    return;
  }

  // Loading state
  btnReg.textContent = 'Creating account…';
  btnReg.disabled    = true;

  try {
    const res = await register({ fname, lname, email, password, area });
    showToast(`Account created! Welcome, ${res.data.name}! 🎉`, 'success');
    setTimeout(() => { location.href = 'index.html'; }, 800);
  } catch (err) {
    showAlert(alertEl, err.message);
    btnReg.textContent = 'Create Account';
    btnReg.disabled    = false;
  }
}
