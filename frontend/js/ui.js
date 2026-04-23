// ============================================
// frontend/js/ui.js
// Shared UI helpers used across pages
// ============================================

// ── Toast Notification ───────────────────

let toastTimer = null;

/**
 * Show a temporary toast message at the bottom-right.
 * @param {string} msg
 * @param {'success'|'error'|''} type
 */
export function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.className = 'show' + (type ? ` toast--${type}` : '');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = '';
  }, 3500);
}

// ── Alert inside form ────────────────────

export function showAlert(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `alert alert--${type} show`;
}

export function hideAlert(el) {
  el.className = 'alert';
}

// ── Star renderer ────────────────────────

/**
 * Renders ★ characters for a rating value (0–5).
 * @param {number} rating
 * @returns {string} HTML string
 */
export function renderStars(rating) {
  const full  = Math.round(rating);
  const empty = 5 - full;
  return (
    `<span class="stars__filled">${'★'.repeat(full)}</span>` +
    `<span class="stars__empty">${'★'.repeat(empty)}</span>` +
    `<span class="stars__value">${Number(rating).toFixed(1)}</span>`
  );
}

// ── Type badge ───────────────────────────

export function typeBadge(type) {
  const icons = { veg: '🥦', nonveg: '🍗', jain: '🌸' };
  const labels = { veg: 'Veg', nonveg: 'Non-Veg', jain: 'Jain' };
  return `<span class="mess-card__badge badge--${type}">${icons[type] ?? ''} ${labels[type] ?? type}</span>`;
}

// ── Navbar: update auth links ────────────

export function updateNavbar(authData) {
  const loginLink    = document.getElementById('nav-login');
  const registerLink = document.getElementById('nav-register');
  const logoutLink   = document.getElementById('nav-logout');
  const userGreet    = document.getElementById('nav-user');

  if (!authData?.logged_in) {
    loginLink?.classList.remove('hidden');
    registerLink?.classList.remove('hidden');
    logoutLink?.classList.add('hidden');
    if (userGreet) userGreet.classList.add('hidden');
  } else {
    loginLink?.classList.add('hidden');
    registerLink?.classList.add('hidden');
    logoutLink?.classList.remove('hidden');
    if (userGreet) {
      userGreet.textContent = `Hi, ${authData.name}`;
      userGreet.classList.remove('hidden');
    }
  }
}

// ── Skeleton loaders ─────────────────────

export function renderSkeletonCards(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="mess-card" style="pointer-events:none">
      <div class="mess-card__img skeleton" style="font-size:0"></div>
      <div class="mess-card__body" style="gap:12px">
        <div class="skeleton" style="height:20px;width:70%"></div>
        <div class="skeleton" style="height:14px;width:50%"></div>
        <div class="skeleton" style="height:14px;width:40%"></div>
        <div class="mess-card__footer" style="border:none">
          <div class="skeleton" style="height:22px;width:30%"></div>
          <div class="skeleton" style="height:18px;width:25%"></div>
        </div>
      </div>
    </div>`).join('');
}

// ── Format date ──────────────────────────

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// ── Emoji for mess type ──────────────────

export function messEmoji(type) {
  return { veg: '🥗', nonveg: '🍖', jain: '🌺' }[type] ?? '🍽️';
}
