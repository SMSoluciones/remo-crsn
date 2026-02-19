const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  documento: { type: String, required: false, unique: true, sparse: true },
  rol: { type: String, enum: ['admin', 'entrenador', 'mantenimiento', 'alumnos', 'subcomision'], required: true },
  password: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpires: { type: Date },
});

module.exports = mongoose.model('User', UserSchema);
