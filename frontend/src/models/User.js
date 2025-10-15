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
