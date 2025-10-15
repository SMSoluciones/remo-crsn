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
