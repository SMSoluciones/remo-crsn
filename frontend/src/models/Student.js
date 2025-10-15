// Modelo de datos para Alumnos
export class Student {
  constructor({ id, nombre, apellido, dni, categoria, fechaIngreso }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.dni = dni;
    this.categoria = categoria;
    this.fechaIngreso = fechaIngreso;
  }
}
