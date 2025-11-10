import axios from 'axios';

const API_URL = 'https://remo-crsn.onrender.com/api/events';

export const fetchEvents = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await axios.post(API_URL, eventData);
    return response.data;
  } catch (error) {
    console.error('Error al crear el evento:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await axios.put(`${API_URL}/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await axios.delete(`${API_URL}/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    throw error;
  }
};