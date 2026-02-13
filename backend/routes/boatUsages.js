const express = require('express');
const router = express.Router();
const BoatUsage = require('../models/BoatUsage');
const Boat = require('../models/Boat');

// POST /api/boat-usages
router.post('/', async (req, res) => {
  try {
    const { boatId, durationHours, note } = req.body || {};
    if (!boatId) return res.status(400).json({ error: 'boatId required' });
    const hours = Number(durationHours) || 0;
    if (hours <= 0) return res.status(400).json({ error: 'durationHours must be > 0' });

    const boat = await Boat.findById(boatId).lean();
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

    // Read user info from headers if available
    const userId = req.header('x-user-id') || null;
    const userEmail = req.header('x-user-email') || '';
    const userName = req.header('x-user-name') || req.header('x-user-fullname') || req.header('x-user') || 'Desconocido';

    const requestedAt = new Date();
    const estimatedReturn = new Date(requestedAt.getTime() + hours * 60 * 60 * 1000);

    const usage = await BoatUsage.create({
      boatId,
      userId: userId || undefined,
      userName,
      userEmail,
      requestedAt,
      durationHours: hours,
      estimatedReturn,
      note: note || '',
    });

    return res.status(201).json(usage);
  } catch (err) {
    console.error('Error creating boat usage:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/boat-usages - simple list
router.get('/', async (req, res) => {
  try {
    const list = await BoatUsage.find().sort({ requestedAt: -1 }).limit(200).lean();
    return res.json(list);
  } catch (err) {
    console.error('Error fetching boat usages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
