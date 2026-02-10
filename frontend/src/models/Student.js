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

export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting student');
  return res.json();
}

export default { fetchStudents, createStudent, updateStudent, deleteStudent };
// Modelo de datos para Alumnos (clase ligera para manejo en frontend)
export class Student {
  constructor({ id, socioN, tipo, ciudad, nombre, apellido, dni, categoria, domicilio, nacimiento, celular, email, beca, competitivo, federado, estado, fechaIngreso }) {
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
  }
}
