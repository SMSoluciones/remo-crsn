import { API_BASE_URL } from '../utils/apiConfig';

const API_URL = `${API_BASE_URL}/api/users`;
const TRAINERS_URL = `${API_BASE_URL}/api/users/trainers`;

export async function fetchUsers(auth) {
  const headers = { };
  if (auth?.rol) headers['x-user-role'] = auth.rol;
  const res = await fetch(API_URL, { headers });
  if (!res.ok) throw new Error('Error fetching users');
  return res.json();
}

export async function fetchTrainers() {
  const res = await fetch(TRAINERS_URL);
  if (!res.ok) throw new Error('Error fetching trainers');
  return res.json();
}

export async function createUser(data, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth?.rol) headers['x-user-role'] = auth.rol;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creating user');
  return await res.json();
}

export async function updateUser(id, data, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth?.rol) headers['x-user-role'] = auth.rol;
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating user');
  return await res.json();
}

export async function deleteUser(id, auth) {
  const headers = { };
  if (auth?.rol) headers['x-user-role'] = auth.rol;
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Error deleting user');
  return await res.json();
}

// Modelo de datos para Usuarios y roles
export const UserRoles = {
  ADMIN: 'admin',
  ENTRENADOR: 'entrenador',
  MANTENIMIENTO: 'mantenimiento',
  ALUMNOS: 'alumnos',
  SUBCOMISION: 'subcomision',
};

export class User {
  constructor({ id, nombre, apellido, email, rol }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.rol = rol;
  }
}

export default { fetchUsers, fetchTrainers, createUser, updateUser, deleteUser };
