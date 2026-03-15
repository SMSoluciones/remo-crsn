const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  detalle: {
    type: String,
    default: '',
    trim: true,
  },
  categoria: {
    type: String,
    enum: ['hablado', 'a_tratar'],
    default: 'a_tratar',
  },
  estado: {
    type: String,
    enum: ['abierto', 'cerrado', 'archivado'],
    default: 'abierto',
  },
  closedAt: {
    type: Date,
    default: null,
  },
  archivedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

const meetingSchema = new mongoose.Schema({
  tituloReunion: {
    type: String,
    required: true,
    trim: true,
  },
  fechaReunion: {
    type: Date,
    required: true,
    default: Date.now,
  },
  descripcion: {
    type: String,
    default: '',
    trim: true,
  },
  temas: {
    type: [topicSchema],
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);