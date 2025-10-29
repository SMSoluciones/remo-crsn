const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rol: { type: String, enum: ['admin', 'entrenador', 'mantenimiento', 'alumnos', 'subcomision'], required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);
