const mongoose = require('mongoose');

const BoatUsageSchema = new mongoose.Schema({
  boatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boat', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  userEmail: { type: String },
  requestedAt: { type: Date, default: Date.now },
  durationHours: { type: Number, required: true },
  estimatedReturn: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  note: { type: String },
});

module.exports = mongoose.model('BoatUsage', BoatUsageSchema);
