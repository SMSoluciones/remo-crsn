const mongoose = require('mongoose');

const BoatSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['single', 'doble', 'cuadruple', 'yola', 'otros'], required: true },
  estado: { type: String, enum: ['activo', 'mantenimiento', 'fuera_servicio'], default: 'activo' },
  fechaIngreso: { type: Date, default: Date.now },
  nivelDif: { type: Number, min: 1, max: 5, required: true }, // Nivel de dificultad del 1 al 5
  row: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Boat', BoatSchema);
