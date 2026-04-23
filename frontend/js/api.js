// ============================================
// frontend/js/api.js
// Centralised fetch wrapper for all API calls
// Uses credentials: "include" for session cookies
// ============================================

const API_BASE = '../backend/api';

/**
 * Generic fetch wrapper.
 * Returns parsed JSON or throws an Error with the server message.
 */
async function apiFetch(endpoint, options = {}) {
  const defaults = {
    credentials: 'include',          // send/receive session cookies
    headers: { 'Content-Type': 'application/json' }
  };

  const res = await fetch(`${API_BASE}/${endpoint}`, { ...defaults, ...options });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || 'Something went wrong.');
  }

  return json;            // { success, message, data }
}

// ── Auth ──────────────────────────────────

export async function getAuthStatus() {
  return apiFetch('auth_status.php');
}

export async function register(payload) {
  return apiFetch('register.php', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function login(payload) {
  return apiFetch('login.php', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function logout() {
  return apiFetch('logout.php');
}

// ── Messes ───────────────────────────────

/**
 * Fetch mess list with optional filters.
 * @param {object} filters – { type, area, max_price, sort }
 */
export async function getMesses(filters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch(`get_messes.php${qs}`);
}

/**
 * Fetch single mess detail + reviews.
 * @param {number} id
 */
export async function getMessDetail(id) {
  return apiFetch(`get_messes.php?id=${id}`);
}

// ── Reviews ──────────────────────────────

export async function addReview(payload) {
  return apiFetch('add_review.php', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
