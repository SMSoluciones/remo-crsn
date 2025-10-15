const mongoose = require('mongoose');

const TechnicalSheetSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, default: Date.now },
  postura: { type: String },
  remada: { type: String },
  equilibrio: { type: String },
  observaciones: { type: String },
});

module.exports = mongoose.model('TechnicalSheet', TechnicalSheetSchema);
