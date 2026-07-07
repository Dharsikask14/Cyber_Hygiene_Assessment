export const CERT_STORE_KEY = 'hi_cert_store_v1';

export function navigateTo(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function linkTo(path, onBeforeNavigate) {
  return (event) => {
    event.preventDefault();
    onBeforeNavigate?.();
    navigateTo(path);
  };
}

export function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export async function sha256(message) {
  const buffer = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function genCertId() {
  const year = new Date().getFullYear();
  const rand = crypto.getRandomValues(new Uint8Array(5));
  const hex = Array.from(rand).map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 8);
  return `HIT-${year}-${hex}`;
}

export function escHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildVerifyUrl(certId, name, extra = {}) {
  const origin = `${location.origin}${location.pathname.includes('/html/') ? location.pathname.replace(/\/html\/.*$/, '') : ''}`;
  let url = `${origin}/html/cert_verify.html?id=${encodeURIComponent(certId)}&name=${encodeURIComponent(name)}`;
  if (extra.grade) url += `&grade=${encodeURIComponent(extra.grade)}`;
  if (extra.score) url += `&score=${encodeURIComponent(extra.score)}`;
  if (extra.pct) url += `&pct=${encodeURIComponent(extra.pct)}`;
  if (extra.date) url += `&date=${encodeURIComponent(extra.date)}`;
  return url;
}

export function buildQRPayload({ certId, name, grade, score, pct, date, issuer }) {
  return JSON.stringify({
    t: 'hit-cert',
    v: 1,
    id: certId,
    n: name,
    g: grade,
    s: score,
    p: pct,
    d: date,
    i: issuer || 'Hackers InfoTech',
  });
}

export function parseQRPayload(text) {
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    if (data.t === 'hit-cert' && data.id) return data;
  } catch {}
  return null;
}
