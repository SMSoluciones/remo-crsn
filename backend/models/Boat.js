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
  pesoMinimo: {
    type: Number,
    min: 0,
  },
  pesoMaximo: {
    type: Number,
    min: 0,
  },
  fotoURL: {
    type: String,
    trim: true,
  },
  ubicacion: {
    type: String,
    trim: true,
  },
  proveedor: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model('Boat', BoatSchema);
