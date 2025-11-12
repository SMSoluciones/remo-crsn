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
