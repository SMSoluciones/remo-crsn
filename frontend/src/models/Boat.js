import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

// Modelo de datos para Botes
export const BoatStatus = {
  ACTIVO: 'activo',
  MANTENIMIENTO: 'mantenimiento',
  FUERA_SERVICIO: 'fuera_servicio',
};

export const BoatTypes = [
  'single', 'doble', 'cuadruple', 'otros'
];

export class Boat {
  constructor({ id, nombre, tipo, estado, fechaIngreso }) {
    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo;
    this.estado = estado;
    this.fechaIngreso = fechaIngreso;
  }
}

export async function fetchBoats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/boats`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching boats:', error);
    return [];
  }
}

export async function updateBoat(id, data, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.put(`${API_BASE_URL}/api/boats/${id}`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error updating boat:', err);
    throw err;
  }
}

export async function deleteBoat(id, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.delete(`${API_BASE_URL}/api/boats/${id}`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error deleting boat:', err);
    throw err;
  }
}
