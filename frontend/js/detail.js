// ============================================
// frontend/js/detail.js
// Single mess detail page: info, reviews, review form
// ============================================

import { getMessDetail, addReview, getAuthStatus, logout } from './api.js';
import { showToast, updateNavbar, renderStars, typeBadge, messEmoji, formatDate, showAlert } from './ui.js';

// ── Get mess ID from URL ──────────────────
const params = new URLSearchParams(location.search);
const messId = parseInt(params.get('id'));

if (!messId) {
  location.href = 'index.html';
}

// ── DOM refs ─────────────────────────────
const headerWrap = document.getElementById('detail-header-wrap');
const bodyWrap   = document.getElementById('detail-body');
const btnLogout  = document.getElementById('nav-logout');

// ── Init ─────────────────────────────────
(async () => {
  try {
    const [auth, detail] = await Promise.all([
      getAuthStatus(),
      getMessDetail(messId)
    ]);

    updateNavbar(auth.data);
    renderPage(detail.data, auth.data);
  } catch (err) {
    bodyWrap.innerHTML = `
      <div class="state-msg">
        <div class="icon">❌</div>
        <p>${err.message}</p>
        <a href="index.html" class="btn btn--primary" style="margin-top:16px;display:inline-flex">← Back to Home</a>
      </div>`;
  }
})();

// ── Render full detail page ───────────────
function renderPage({ mess, reviews, already_reviewed, logged_in }, authData) {
  // Update page title
  document.title = `${mess.name} — MealForMe`;

  // ── Header ──
  headerWrap.innerHTML = `
    <div class="detail-header">
      <div class="container">
        <a href="index.html" class="detail-back">← Back to all messes</a>
        <div class="detail-header__title">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              ${typeBadge(mess.type)}
            </div>
            <h1>${esc(mess.name)}</h1>
          </div>
          <div style="text-align:right">
            <div class="price" style="font-size:1.8rem">₹${Number(mess.price).toLocaleString('en-IN')}</div>
            <div style="font-size:0.82rem;color:var(--text-muted)">per month</div>
          </div>
        </div>
        <div class="detail-meta">
          <span>📍 ${esc(mess.area)}</span>
          <span>🚶 ${mess.distance} km away</span>
          <span><div class="stars" style="display:inline-flex">${renderStars(mess.rating)}</div></span>
          <span>📝 ${mess.total_reviews} review${mess.total_reviews !== 1 ? 's' : ''}</span>
        </div>
        ${mess.description ? `<p style="margin-top:16px;max-width:640px;color:var(--text-muted);line-height:1.7">${esc(mess.description)}</p>` : ''}
      </div>
    </div>`;

  // ── Compute average sub-ratings from reviews ──
  let avgTaste = 0, avgHygiene = 0, avgQty = 0;
  if (reviews.length) {
    avgTaste   = reviews.reduce((s, r) => s + r.taste,    0) / reviews.length;
    avgHygiene = reviews.reduce((s, r) => s + r.hygiene,  0) / reviews.length;
    avgQty     = reviews.reduce((s, r) => s + r.quantity, 0) / reviews.length;
  }

  // ── Body ──
  bodyWrap.innerHTML = `
    <!-- Rating Breakdown -->
    <div class="rating-grid page">
      <div class="rating-item">
        <div class="rating-item__label">🍴 Taste</div>
        <div class="rating-item__val">${reviews.length ? avgTaste.toFixed(1) : '—'}</div>
      </div>
      <div class="rating-item">
        <div class="rating-item__label">🧹 Hygiene</div>
        <div class="rating-item__val">${reviews.length ? avgHygiene.toFixed(1) : '—'}</div>
      </div>
      <div class="rating-item">
        <div class="rating-item__label">🍽️ Quantity</div>
        <div class="rating-item__val">${reviews.length ? avgQty.toFixed(1) : '—'}</div>
      </div>
    </div>

    <!-- Review Form -->
    <div id="review-section"></div>

    <!-- Reviews List -->
    <div style="margin-top:36px">
      <h2 style="margin-bottom:20px;font-size:1.5rem">
        Reviews <span style="font-family:'DM Sans',sans-serif;font-size:1rem;font-weight:400;color:var(--text-muted)">(${reviews.length})</span>
      </h2>
      <div id="reviews-list">
        ${reviews.length ? renderReviews(reviews) : `
          <div class="state-msg" style="padding:32px">
            <div class="icon">💬</div>
            <p>No reviews yet. Be the first to review!</p>
          </div>`}
      </div>
    </div>`;

  // ── Review Form (depends on auth state) ──
  const reviewSection = document.getElementById('review-section');

  if (!logged_in) {
    reviewSection.innerHTML = `
      <div class="review-form" style="background:var(--accent-light);border-color:var(--accent)">
        <p style="font-weight:500">
          <a href="login.html" style="color:var(--accent);font-weight:700">Log in</a> or
          <a href="register.html" style="color:var(--accent);font-weight:700">create an account</a>
          to leave a review for this mess.
        </p>
      </div>`;
  } else if (already_reviewed) {
    reviewSection.innerHTML = `
      <div class="review-form" style="background:var(--surface-2)">
        <p style="color:var(--text-muted);font-weight:500">✅ You have already submitted a review for this mess.</p>
      </div>`;
  } else {
    reviewSection.innerHTML = buildReviewForm();
    attachReviewFormListeners(mess.id);
  }
}

// ── Build review form HTML ────────────────
function buildReviewForm() {
  return `
    <div class="review-form page">
      <h3>Write a Review</h3>
      <div id="review-alert" class="alert"></div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:20px">
        ${ratingGroup('taste',    '🍴 Taste')}
        ${ratingGroup('hygiene',  '🧹 Hygiene')}
        ${ratingGroup('quantity', '🍽️ Quantity')}
      </div>

      <div class="form-group">
        <label for="comment">Your Comment <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
        <textarea class="form-control" id="comment" rows="3" placeholder="Share your experience…" style="resize:vertical"></textarea>
      </div>

      <button id="btn-submit-review" class="btn btn--primary" style="min-width:160px">Submit Review</button>
    </div>`;
}

function ratingGroup(name, label) {
  return `
    <div class="form-group" style="margin-bottom:0">
      <label>${label}</label>
      <div class="star-rating" id="stars-${name}">
        ${[5,4,3,2,1].map(n => `
          <input type="radio" name="${name}" id="${name}-${n}" value="${n}" />
          <label for="${name}-${n}" title="${n} star${n>1?'s':''}">★</label>
        `).join('')}
      </div>
    </div>`;
}

// ── Attach review form event listeners ───
function attachReviewFormListeners(messId) {
  const btn     = document.getElementById('btn-submit-review');
  const alertEl = document.getElementById('review-alert');

  btn.addEventListener('click', async () => {
    alertEl.className = 'alert';

    // Read star selections
    const taste    = getStarValue('taste');
    const hygiene  = getStarValue('hygiene');
    const quantity = getStarValue('quantity');
    const comment  = document.getElementById('comment').value.trim();

    if (!taste || !hygiene || !quantity) {
      showAlert(alertEl, 'Please rate all three categories.', 'error');
      return;
    }

    btn.textContent = 'Submitting…';
    btn.disabled    = true;

    try {
      const res = await addReview({ mess_id: messId, taste, hygiene, quantity, comment });
      showToast('Review submitted! Thank you 🙏', 'success');

      // Reload page to show updated reviews and new rating
      setTimeout(() => location.reload(), 900);
    } catch (err) {
      showAlert(alertEl, err.message, 'error');
      btn.textContent = 'Submit Review';
      btn.disabled    = false;
    }
  });
}

function getStarValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? parseInt(checked.value) : 0;
}

function showAlert(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `alert alert--${type} show`;
}

// ── Render reviews list ───────────────────
function renderReviews(reviews) {
  return `<div class="reviews-list">` +
    reviews.map(r => `
      <div class="review-card page">
        <div class="review-card__header">
          <div>
            <div class="review-card__author">${esc(r.fname)} ${esc(r.lname)}</div>
            <div class="review-card__date">${formatDate(r.created_at)}</div>
          </div>
          <div class="stars">${renderStars(((r.taste + r.hygiene + r.quantity) / 3).toFixed(1))}</div>
        </div>
        <div class="review-card__ratings">
          <span>🍴 Taste: <b>${r.taste}/5</b></span>
          <span>🧹 Hygiene: <b>${r.hygiene}/5</b></span>
          <span>🍽️ Quantity: <b>${r.quantity}/5</b></span>
        </div>
        ${r.comment ? `<p class="review-card__comment">"${esc(r.comment)}"</p>` : ''}
      </div>
    `).join('') +
  `</div>`;
}

// ── Logout ───────────────────────────────
btnLogout.addEventListener('click', async () => {
  const { logout: logoutFn } = await import('./api.js');
  try {
    await logoutFn();
    showToast('Logged out.', 'success');
    setTimeout(() => location.reload(), 600);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── XSS escaping ─────────────────────────
function esc(str) {
  const el = document.createElement('div');
  el.textContent = String(str ?? '');
  return el.innerHTML;
}
