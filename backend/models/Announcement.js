const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  targetRoles: {
    type: [String],
    default: [],
  },
  sourceType: {
    type: String,
    default: 'general',
  },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
