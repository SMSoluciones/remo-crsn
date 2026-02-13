import { API_BASE_URL } from '../utils/apiConfig';

export async function createBoatUsage({ boatId, durationHours, note }, user) {
  const headers = { 'Content-Type': 'application/json' };
  if (user) {
    if (user._id) headers['x-user-id'] = user._id;
    if (user.email) headers['x-user-email'] = user.email;
    if (user.nombre || user.name || user.fullName) headers['x-user-name'] = user.nombre || user.name || user.fullName;
  }
  const res = await fetch(`${API_BASE_URL}/api/boat-usages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ boatId, durationHours, note }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error creating boat usage');
  }
  return res.json();
}

export async function fetchBoatUsages() {
  const res = await fetch(`${API_BASE_URL}/api/boat-usages`);
  if (!res.ok) throw new Error('Error fetching boat usages');
  return res.json();
}
