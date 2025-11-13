import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const BASE = `${API_BASE_URL}/api/announcements`;

export const fetchAnnouncements = async () => {
  try {
    const res = await axios.get(BASE);
    return res.data;
  } catch (err) {
    console.error('Error al obtener los anuncios:', err);
    throw err;
  }
};

export const createAnnouncement = async (data, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const res = await axios.post(BASE, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error al crear el anuncio:', err);
    throw err;
  }
};

export const updateAnnouncement = async (id, data, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const res = await axios.put(`${BASE}/${id}`, data, { headers });
    return res.data;
  } catch (err) {
    console.error('Error al actualizar el anuncio:', err);
    throw err;
  }
};

export const deleteAnnouncement = async (id, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const res = await axios.delete(`${BASE}/${id}`, { headers });
    return res.data;
  } catch (err) {
    console.error('Error al eliminar el anuncio:', err);
    throw err;
  }
};

export default { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
