const mongoose = require('mongoose');

const BoatReportSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boat', required: true },
  descripcion: { type: String, required: true },
  fotoURL: { type: String },
  fechaReporte: { type: Date, default: Date.now },
  // Quién creó el reporte (usuario que lo cargó)
  reporterId: { type: String },
  reporterName: { type: String },
  // Quién detectó la falla realmente (puede ser otra persona)
  detectedById: { type: String },
  detectedByName: { type: String },
  status: { type: String, enum: ['abierto', 'en_reparacion', 'cerrado'], default: 'abierto' },
});

module.exports = mongoose.model('BoatReport', BoatReportSchema);
