const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  socioN: { type: String },
  tipo: { type: String },
  ciudad: { type: String },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  categoria: { type: String },
  domicilio: { type: String },
  nacimiento: { type: Date },
  celular: { type: String },
  email: { type: String },
  beca: { type: Boolean, default: false },
  competitivo: { type: Boolean, default: false },
  federado: { type: Boolean, default: false },
  estado: { type: String, default: 'ACTIVO' },
  fechaIngreso: { type: Date, default: Date.now },
  avatar: { type: String },
});

module.exports = mongoose.model('Student', StudentSchema);
