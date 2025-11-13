import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const BASE = `${API_BASE_URL}/api/events`;


export const fetchEvents = async () => {
  try {
    const response = await axios.get(BASE);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    throw error;
  }
};

export const createEvent = async (eventData, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const response = await axios.post(BASE, eventData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error al crear el evento:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const response = await axios.put(`${BASE}/${eventId}`, eventData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId, auth) => {
  try {
    const headers = {};
    if (auth?.rol) headers['x-user-role'] = auth.rol;
    const response = await axios.delete(`${BASE}/${eventId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    throw error;
  }
};