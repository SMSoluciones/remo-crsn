const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  estado: { type: String, enum: ['activo', 'mantenimiento', 'fuera_servicio'], default: 'activo' },
  fechaIngreso: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Seat', SeatSchema);
