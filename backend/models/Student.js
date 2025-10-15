const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  categoria: { type: String },
  fechaIngreso: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', StudentSchema);
