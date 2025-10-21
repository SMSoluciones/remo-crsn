import { API_BASE_URL } from '../utils/apiConfig';

const BASE = `${API_BASE_URL}/api/technical-sheets`;

export class TechnicalSheet {
  constructor({ id, studentId, entrenadorId, fecha, postura, remada, equilibrio, observaciones }) {
    this.id = id;
    this.studentId = studentId;
    this.entrenadorId = entrenadorId;
    this.fecha = fecha;
    this.postura = postura;
    this.remada = remada;
    this.equilibrio = equilibrio;
    this.observaciones = observaciones;
  }
}

export async function fetchSheetsByStudent(studentId, user) {
  const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
  const res = await fetch(`${BASE}/student/${studentId}`, { headers });
  if (!res.ok) throw new Error('Error fetching technical sheets');
  return res.json();
}

export async function fetchAllSheets(user) {
  const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
  const res = await fetch(BASE, { headers });
  if (!res.ok) throw new Error('Error fetching all technical sheets');
  return res.json();
}

export default { fetchSheetsByStudent };

export async function createSheet(data, user) {
  // user: { id, rol }
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': user?.id || user?._id || '',
      'x-user-role': user?.rol || ''
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error creating technical sheet');
  return res.json();
}
