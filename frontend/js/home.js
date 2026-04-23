// ============================================
// frontend/js/home.js
// Home page: mess listing, filters, auth nav
// ============================================

import { getMesses, getAuthStatus, logout } from './api.js';
import { showToast, updateNavbar, renderSkeletonCards, renderStars, typeBadge, messEmoji } from './ui.js';

// ── DOM refs ─────────────────────────────
const grid       = document.getElementById('mess-grid');
const countEl    = document.getElementById('mess-count');
const emptyEl    = document.getElementById('mess-empty');
const btnFilter  = document.getElementById('btn-filter');
const selType    = document.getElementById('filter-type');
const inputArea  = document.getElementById('filter-area');
const inputPrice = document.getElementById('filter-price');
const selSort    = document.getElementById('filter-sort');
const btnLogout  = document.getElementById('nav-logout');

// ── Init ─────────────────────────────────
(async () => {
  // Show skeletons while loading
  grid.innerHTML = renderSkeletonCards(6);

  try {
    // Check auth state and update navbar
    const auth = await getAuthStatus();
    updateNavbar(auth.data);

    // Load messes
    await loadMesses();
  } catch (err) {
    showToast(err.message, 'error');
    grid.innerHTML = '';
    emptyEl.style.display = 'block';
  }
})();

// ── Load and render messes ────────────────
async function loadMesses() {
  const filters = {
    type:      selType.value,
    area:      inputArea.value.trim(),
    max_price: inputPrice.value.trim(),
    sort:      selSort.value
  };

  try {
    const res = await getMesses(filters);
    renderMesses(res.data.messes);
  } catch (err) {
    showToast(err.message, 'error');
    renderMesses([]);
  }
}

function renderMesses(messes) {
  if (!messes.length) {
    grid.innerHTML = '';
    emptyEl.style.display = 'block';
    countEl.textContent = '';
    return;
  }

  emptyEl.style.display = 'none';
  countEl.textContent = `${messes.length} mess${messes.length !== 1 ? 'es' : ''} found`;

  grid.innerHTML = messes.map(m => `
    <article class="mess-card page" onclick="location.href='detail.html?id=${m.id}'">
      <div class="mess-card__img">
        ${typeBadge(m.type)}
        <span style="z-index:1">${messEmoji(m.type)}</span>
      </div>
      <div class="mess-card__body">
        <div class="mess-card__name">${escHtml(m.name)}</div>
        <div class="mess-card__meta">
          <span>📍 ${escHtml(m.area)}</span>
          <span>🚶 ${m.distance} km</span>
          <span>📝 ${m.total_reviews} review${m.total_reviews !== 1 ? 's' : ''}</span>
        </div>
        <div class="stars">${renderStars(m.rating)}</div>
        <div class="mess-card__footer">
          <div class="price">₹${Number(m.price).toLocaleString('en-IN')}<sub>/mo</sub></div>
          <button class="btn btn--primary" style="padding:7px 14px;font-size:0.82rem">View →</button>
        </div>
      </div>
    </article>
  `).join('');
}

// ── Filter ───────────────────────────────
btnFilter.addEventListener('click', () => {
  grid.innerHTML = renderSkeletonCards(6);
  emptyEl.style.display = 'none';
  loadMesses();
});

// Trigger on Enter in text/number inputs
[inputArea, inputPrice].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') btnFilter.click(); });
});

// ── Logout ───────────────────────────────
btnLogout.addEventListener('click', async () => {
  try {
    await logout();
    showToast('Logged out successfully.', 'success');
    updateNavbar({ logged_in: false });
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── XSS helper ───────────────────────────
function escHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}
