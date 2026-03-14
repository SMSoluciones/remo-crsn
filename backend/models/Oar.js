const mongoose = require('mongoose');

const OarSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  tipo: { type: String, enum: ['hacha', 'cuchara'], required: true },
  largoHacha: { type: String, enum: ['largo', 'corto'], default: null },
  estado: { type: String, enum: ['activo', 'mantenimiento', 'fuera_servicio'], default: 'activo' },
  causa: { type: String, trim: true, default: '' },
  fechaIngreso: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Oar', OarSchema);
