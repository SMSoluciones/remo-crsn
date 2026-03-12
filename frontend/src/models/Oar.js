import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export const OarStatus = {
  ACTIVO: 'activo',
  MANTENIMIENTO: 'mantenimiento',
  FUERA_SERVICIO: 'fuera_servicio',
};

export const OarTypes = ['hacha', 'cuchara'];
export const OarHachaSizes = ['largo', 'corto'];

export async function fetchOars() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/oars`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching oars:', error);
    return [];
  }
}

export async function createOar(data, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.post(`${API_BASE_URL}/api/oars`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error creating oar:', err);
    throw err;
  }
}

export async function updateOar(id, data, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.put(`${API_BASE_URL}/api/oars/${id}`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error updating oar:', err);
    throw err;
  }
}

export async function deleteOar(id, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.delete(`${API_BASE_URL}/api/oars/${id}`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error deleting oar:', err);
    throw err;
  }
}
