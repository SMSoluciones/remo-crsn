// Modelo de datos para Reportes de Fallas de Botes
export const BoatReportStatus = {
  ABIERTO: 'abierto',
  EN_REPARACION: 'en_reparacion',
  CERRADO: 'cerrado',
};

export class BoatReport {
  constructor({ id, boatId, descripcion, fotoURL, fechaReporte, status }) {
    this.id = id;
    this.boatId = boatId;
    this.descripcion = descripcion;
    this.fotoURL = fotoURL;
    this.fechaReporte = fechaReporte;
    this.status = status;
  }
}

import { API_BASE_URL } from '../utils/apiConfig';

export async function fetchBoatReports() {
  const res = await fetch(`${API_BASE_URL}/api/boat-reports`);
  if (!res.ok) throw new Error('Error fetching boat reports');
  return res.json();
}

export async function createBoatReport(formData, user) {
  // formData should be a FormData instance (multipart)
  const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '', 'x-user-email': user.email || '' } : {};
  const res = await fetch(`${API_BASE_URL}/api/boat-reports`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error creating report');
  }
  return res.json();
}

export async function deleteBoatReport(id, user) {
  const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
  const res = await fetch(`${API_BASE_URL}/api/boat-reports/${id}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Error deleting report');
  return res.json();
}

export async function updateBoatReport(id, data, user) {
  const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '', 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE_URL}/api/boat-reports/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Error updating report');
  }
  return res.json();
}
