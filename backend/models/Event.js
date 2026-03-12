const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  lugar: {
    type: String,
    default: '',
    trim: true,
  },
  elementosNecesarios: {
    type: [String],
    default: [],
  },
  observacionesGenerales: {
    type: String,
    default: '',
    trim: true,
  },
  encargado: {
    type: String,
    default: '',
    trim: true,
  },
  totalEntrada: {
    type: Number,
    default: 0,
    min: 0,
  },
  gastos: {
    type: [
      {
        concepto: { type: String, required: true, trim: true },
        monto: { type: Number, required: true, min: 0 },
        fecha: { type: Date, default: Date.now },
        detalle: { type: String, default: '', trim: true },
      },
    ],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);