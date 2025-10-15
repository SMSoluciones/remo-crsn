const mongoose = require('mongoose');

const BoatSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['single', 'doble', 'cuadruple', 'yola', 'otros'], required: true },
  estado: { type: String, enum: ['activo', 'mantenimiento', 'fuera_servicio'], default: 'activo' },
  fechaIngreso: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Boat', BoatSchema);
