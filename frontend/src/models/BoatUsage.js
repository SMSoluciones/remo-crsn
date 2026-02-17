import { API_BASE_URL } from '../utils/apiConfig';

export async function createBoatUsage({ boatId, durationHours, note }, user) {
  const url = `${API_BASE_URL}/api/boat-usages`;
  const headers = { 'Content-Type': 'application/json' };
  // Only send custom x-user-* headers in local development (backend on localhost).
  // Remote deployments may block these headers via CORS; prefer server-side CORS update.
  const isLocalBackend = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
  if (isLocalBackend && user) {
    if (user._id) headers['x-user-id'] = user._id;
    if (user.email) headers['x-user-email'] = user.email;
    if (user.documento) headers['x-user-documento'] = user.documento;
    if (user.nombre || user.name || user.fullName) headers['x-user-name'] = user.nombre || user.name || user.fullName;
  }
  try {
    console.debug('createBoatUsage -> POST', url, { body: { boatId, durationHours, note }, headers });
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ boatId, durationHours, note }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const errMsg = body && (body.error || body.message) ? (body.error || body.message) : `HTTP ${res.status}`;
      throw new Error(errMsg);
    }
    return res.json();
  } catch (err) {
    console.error('createBoatUsage fetch failed:', err);
    throw new Error(err.message || 'Network error');
  }
}

export async function fetchBoatUsages() {
  const url = `${API_BASE_URL}/api/boat-usages`;
  try {
    console.debug('fetchBoatUsages -> GET', url);
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error('fetchBoatUsages failed:', err);
    throw new Error(err.message || 'Network error');
  }
}
