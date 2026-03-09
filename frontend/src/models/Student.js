import { API_BASE_URL } from '../utils/apiConfig';

const BASE = `${API_BASE_URL}/api/students`;

export async function fetchStudents() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Error fetching students');
  return res.json();
}

export async function createStudent(data) {
  const res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Error creating student');
  return res.json();
}

export async function updateStudent(id, data) {
  const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Error updating student');
  return res.json();
}

export async function updateStudentByIdentifier(identifier, data) {
  const res = await fetch(`${BASE}/by-identifier`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, data }) });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch (e) { console.warn('Error parsing response body as JSON', e, 'Response text:', text); body = null; }
  if (!res.ok) {
    const err = new Error('Error updating student by identifier');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function updateMyProfile(data, token) {
  // pre-JWT behavior: update by identifier via existing endpoint
  // here `token` parameter is actually the identifier if provided
  const identifier = token;
  if (!identifier) throw new Error('Identifier required to update profile');
  return updateStudentByIdentifier(identifier, data);
}

export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting student');
  return res.json();
}

export async function downloadStudentsExcel(studentIds = []) {
  const hasIds = Array.isArray(studentIds) && studentIds.length > 0;
  const res = hasIds
    ? await fetch(`${BASE}/export/excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: studentIds }),
    })
    : await fetch(`${BASE}/export/excel`);
  if (!res.ok) throw new Error('Error downloading students excel');

  const disposition = res.headers.get('content-disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch ? filenameMatch[1] : 'alumnos.xls';
  const blob = await res.blob();
  return { blob, filename };
}

export default { fetchStudents, createStudent, updateStudent, deleteStudent, downloadStudentsExcel };
// Modelo de datos para Alumnos (clase ligera para manejo en frontend)
export class Student {
  constructor({ id, socioN, tipo, ciudad, nombre, apellido, dni, categoria, domicilio, nacimiento, celular, email, beca, competitivo, federado, estado, fechaIngreso, botesHabilitados }) {
    this.id = id;
    this.socioN = socioN;
    this.tipo = tipo;
    this.ciudad = ciudad;
    this.nombre = nombre;
    this.apellido = apellido;
    this.dni = dni;
    this.categoria = categoria;
    this.domicilio = domicilio;
    this.nacimiento = nacimiento;
    this.celular = celular;
    this.email = email;
    this.beca = beca || false;
    this.competitivo = competitivo || false;
    this.federado = federado || false;
    this.estado = estado || '';
    this.fechaIngreso = fechaIngreso;
    this.botesHabilitados = Array.isArray(botesHabilitados) ? botesHabilitados : [];
  }
}
