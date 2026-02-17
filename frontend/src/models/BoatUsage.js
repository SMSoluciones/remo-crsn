import { API_BASE_URL } from '../utils/apiConfig';

export async function createBoatUsage({ boatId, durationHours, note, zone }, user) {
  const url = `${API_BASE_URL}/api/boat-usages`;
  const headers = { 'Content-Type': 'application/json' };
  // Only send custom x-user-* headers in local development (backend on localhost).
  // Remote deployments may block these headers via CORS; prefer server-side CORS update.
  const isLocalBackend = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
  if (isLocalBackend && user) {
    if (user._id) headers['x-user-id'] = user._id;
    if (user.email) headers['x-user-email'] = user.email;
    if (user.documento) headers['x-user-documento'] = user.documento;
    // Prefer full name composed of nombre + apellido when available
    const first = user.nombre || user.name || user.firstName || '';
    const last = user.apellido || user.lastname || user.lastName || '';
    const fullName = [first, last].filter(Boolean).join(' ').trim();
    if (fullName) headers['x-user-name'] = fullName;
    else if (user.fullName) headers['x-user-name'] = user.fullName;
  }
  try {
    // build body and include user identifying fields as fallback for servers that
    // don't accept custom headers or when CORS blocks them
    const first = user?.nombre || user?.name || user?.firstName || '';
    const last = user?.apellido || user?.lastname || user?.lastName || '';
    const fullName = [first, last].filter(Boolean).join(' ').trim() || undefined;
    console.debug('createBoatUsage -> POST', url, { body: { boatId, durationHours, note, zone, userName: fullName }, headers });
    const body = { boatId, durationHours, note };
    if (fullName) body.userName = fullName;
    if (user?.email) body.userEmail = user.email;
    if (user?.documento) body.userDocumento = user.documento;
    if (zone) body.zone = zone;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
