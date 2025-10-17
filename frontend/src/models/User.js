const API_URL = 'http://localhost:5000/api/users';

export async function fetchUsers() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Error fetching users');
  return res.json();
}

export async function fetchTrainers() {
  const users = await fetchUsers();
  return (users || []).filter(u => u.rol === 'entrenador');
}

export async function createUser(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creating user');
  return await res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating user');
  return await res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting user');
  return await res.json();
}

// Modelo de datos para Usuarios y roles
export const UserRoles = {
  ADMIN: 'admin',
  ENTRENADOR: 'entrenador',
  MANTENIMIENTO: 'mantenimiento',
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
