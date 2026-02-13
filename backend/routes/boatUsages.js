const express = require('express');
const router = express.Router();
const BoatUsage = require('../models/BoatUsage');
const Boat = require('../models/Boat');

// POST /api/boat-usages
router.post('/', async (req, res) => {
  try {
    const { boatId, durationHours, note } = req.body || {};
    console.log('POST /api/boat-usages headers:', {
      id: req.header('x-user-id'),
      email: req.header('x-user-email'),
      name: req.header('x-user-name') || req.header('x-user-fullname') || req.header('x-user'),
    });
    console.log('POST /api/boat-usages body:', { boatId, durationHours, note });
    if (!boatId) return res.status(400).json({ error: 'boatId required' });
    const hours = Number(durationHours);
    if (!Number.isFinite(hours) || hours <= 0) return res.status(400).json({ error: 'durationHours must be > 0' });

    const boat = await Boat.findById(boatId).lean();
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

    // Read user info from headers if available
    const userId = req.header('x-user-id') || null;
    const userEmail = req.header('x-user-email') || '';
    const userName = req.header('x-user-name') || req.header('x-user-fullname') || req.header('x-user') || 'Desconocido';

    const requestedAt = new Date();
    const estimatedReturn = new Date(requestedAt.getTime() + hours * 60 * 60 * 1000);
    // Check for overlapping usages for the same boat
    const overlapping = await BoatUsage.findOne({
      boatId,
      $or: [
        { requestedAt: { $lte: estimatedReturn }, estimatedReturn: { $gte: requestedAt } },
      ],
    }).lean();
    if (overlapping) {
      return res.status(409).json({ error: 'Boat already in use during the requested time' });
    }

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

    console.log('Created BoatUsage', usage._id);
    return res.status(201).json(usage);
  } catch (err) {
    console.error('Error creating boat usage:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/boat-usages - simple list
router.get('/', async (req, res) => {
  try {
    const { boatId, start, end } = req.query || {};
    const filter = {};
    if (boatId) filter.boatId = boatId;
    if (start || end) {
      filter.requestedAt = {};
      if (start) filter.requestedAt.$gte = new Date(start);
      if (end) filter.requestedAt.$lte = new Date(end);
    }
    let q = BoatUsage.find(filter).sort({ requestedAt: -1 }).limit(200);
    // populate boat name
    q = q.populate('boatId', 'nombre');
    const list = await q.lean();
    console.log(`GET /api/boat-usages -> returned ${Array.isArray(list) ? list.length : 0} items (filter: ${JSON.stringify(filter)})`);
    return res.json(list);
  } catch (err) {
    console.error('Error fetching boat usages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
