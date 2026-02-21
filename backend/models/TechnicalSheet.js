const mongoose = require('mongoose');

const TechnicalSheetSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha: { type: Date, default: Date.now },
  // prueba metadata
  prueba: { type: String },
  peso: { type: Number },
  categoria: { type: String },
  // attach readonly student identity fields (copied from Student on creation)
  studentDni: { type: String },
  studentNacimiento: { type: Date },
  // performance metrics
  picoWatts: { type: Number },
  promedioFinalWatts: { type: Number },
  tiempoFinal: { type: String },
  rpm: { type: Number },
  // flexible test entries (distance-based results)
  tests: [{
    distance: { type: Number },
    tiempo: { type: String },
    promedioWatts: { type: Number },
    rpm: { type: Number },
    parcial500: { type: String },
    parcial1000: { type: String },
    parcial1500: { type: String },
    parcial2000: { type: String }
  }],
  // postura, remada y equilibrio eliminados (no se evalúan)
  observaciones: { type: String },
});

module.exports = mongoose.model('TechnicalSheet', TechnicalSheetSchema);
