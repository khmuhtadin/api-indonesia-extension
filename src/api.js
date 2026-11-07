// Shared helpers for popup and options. No remote code, no analytics.
const API_BASE = "https://use.apiindonesia.id";
const ext = globalThis.chrome || globalThis.browser;

function storageGet(keys) {
  return new Promise((resolve) => ext.storage.local.get(keys, (v) => resolve(v || {})));
}
function storageSet(obj) {
  return new Promise((resolve) => ext.storage.local.set(obj, () => resolve()));
}

// Local date (user's timezone) as YYYY-MM-DD.
function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function apiGet(path, apiKey) {
  const res = await fetch(API_BASE + path, { headers: { "x-api-key": apiKey } });
  let body = null;
  try { body = await res.json(); } catch (_) { /* non-JSON */ }
  if (!res.ok || (body && body.success === false)) {
    const msg = body && body.error ? `${body.error.code}: ${body.error.message}` : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return body ? body.data : null;
}

// Cache a response for the given local day so the popup does not spend credits on every open.
async function cachedGet(cacheKey, path, apiKey) {
  const today = localDate();
  const store = await storageGet([cacheKey]);
  const hit = store[cacheKey];
  if (hit && hit.day === today && hit.path === path) return hit.data;
  const data = await apiGet(path, apiKey);
  await storageSet({ [cacheKey]: { day: today, path, data } });
  return data;
}
