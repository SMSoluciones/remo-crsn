import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

export const SeatStatus = {
  ACTIVO: 'activo',
  MANTENIMIENTO: 'mantenimiento',
  FUERA_SERVICIO: 'fuera_servicio',
};

export async function fetchSeats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seats`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching seats:', error);
    return [];
  }
}

export async function createSeat(data, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.post(`${API_BASE_URL}/api/seats`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error creating seat:', err);
    throw err;
  }
}

export async function updateSeat(id, data, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.put(`${API_BASE_URL}/api/seats/${id}`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error updating seat:', err);
    throw err;
  }
}

export async function deleteSeat(id, user) {
  try {
    const headers = user ? { 'x-user-id': user.id || user._id || '', 'x-user-role': user.rol || '' } : {};
    const res = await axios.delete(`${API_BASE_URL}/api/seats/${id}`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error deleting seat:', err);
    throw err;
  }
}
