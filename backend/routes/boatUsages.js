const express = require('express');
const router = express.Router();
const BoatUsage = require('../models/BoatUsage');
const Boat = require('../models/Boat');

// POST /api/boat-usages
router.post('/', async (req, res) => {
  try {
    const { boatId, durationHours, note, zone } = req.body || {};
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

    // Read user info from headers if available; fall back to body fields (frontend may send these)
    const userId = req.header('x-user-id') || req.body.userId || null;
    const userEmail = req.header('x-user-email') || req.body.userEmail || '';
    const userDocumento = req.header('x-user-documento') || req.body.userDocumento || '';
    const userName = req.header('x-user-name') || req.header('x-user-fullname') || req.header('x-user') || req.body.userName || 'Desconocido';

    const requestedAt = new Date();
    const estimatedReturn = new Date(requestedAt.getTime() + hours * 60 * 60 * 1000);
    // Prevent abuse: if the same user started+stopped this same boat > 3 times in the last hour,
    // block creating a new usage for 1 hour.
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const userConditions = [];
      if (userId) userConditions.push({ userId: String(userId) });
      if (userEmail) userConditions.push({ userEmail: new RegExp(`^${userEmail}$`, 'i') });
      if (userName) userConditions.push({ userName: userName });
      if (userConditions.length > 0) {
        const recentStops = await BoatUsage.countDocuments({
          boatId,
          actualReturn: { $gte: oneHourAgo },
          $or: userConditions,
        });
        if (recentStops >= 3) {
          return res.status(429).json({ error: 'Has detenido este bote más de 3 veces en la última hora. Intenta de nuevo en 1 hora.' });
        }
      }
    } catch (err) {
      console.warn('could not evaluate recent stop count', err);
    }
    // Check for overlapping usages for the same boat
    // Only consider usages that have NOT been stopped yet (no actualReturn)
    const overlapping = await BoatUsage.findOne({
      boatId,
      requestedAt: { $lte: estimatedReturn },
      estimatedReturn: { $gte: requestedAt },
      $or: [
        { actualReturn: { $exists: false } },
        { actualReturn: null }
      ]
    }).lean();
    if (overlapping) {
      return res.status(409).json({ error: 'Boat already in use during the requested time' });
    }

    const usage = await BoatUsage.create({
      boatId,
      userId: userId || undefined,
      userName,
      userEmail,
      userDocumento,
      requestedAt,
      durationHours: hours,
      estimatedReturn,
      note: note || '',
      zone: zone ? String(zone).slice(0,20) : '',
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
    q = q.populate('boatId', 'nombre name');
    const list = await q.lean();
    // Normalize output: provide a string `boatDisplay` and keep boatId as id
    const out = (Array.isArray(list) ? list : []).map((item) => {
      const b = item.boatId;
      let boatDisplay = '';
      let boatRef = item.boatId || item.boat || '';
      if (b && typeof b === 'object') {
        boatDisplay = b.nombre || b.name || String(b._id || '');
        boatRef = b._id || boatRef;
      } else {
        boatDisplay = b || item.boat || '';
      }
      return { ...item, boatDisplay, boatId: boatRef };
    });
    console.log(`GET /api/boat-usages -> returned ${out.length} items (filter: ${JSON.stringify(filter)})`);
    return res.json(out);
  } catch (err) {
    console.error('Error fetching boat usages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/boat-usages/:id/stop - allow the user who created the usage to stop it
router.post('/:id/stop', async (req, res) => {
  try {
    const id = req.params.id;
    const usage = await BoatUsage.findById(id);
    if (!usage) return res.status(404).json({ error: 'Registro no encontrado' });

    const userId = req.header('x-user-id') || req.body.userId || null;
    const userEmail = req.header('x-user-email') || req.body.userEmail || '';
    const userName = req.header('x-user-name') || req.body.userName || '';

    let owner = false;
    if (usage.userId && userId && String(usage.userId) === String(userId)) owner = true;
    else if (usage.userEmail && userEmail && String(usage.userEmail).toLowerCase() === String(userEmail).toLowerCase()) owner = true;
    else if (usage.userName && userName && String(usage.userName).trim() === String(userName).trim()) owner = true;

    if (!owner) return res.status(403).json({ error: 'Solo el usuario que creó la remada puede detenerla' });
    if (usage.actualReturn) return res.status(400).json({ error: 'Remada ya detenida' });

    usage.actualReturn = new Date();
    await usage.save();
    console.log('Stopped BoatUsage', id, 'at', usage.actualReturn);
    return res.json(usage);
  } catch (err) {
    console.error('Error stopping boat usage:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/boat-usages/:id - only admin can delete
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const role = String(req.header('x-user-role') || req.body.userRole || '').toLowerCase();
    if (role !== 'admin') return res.status(403).json({ error: 'Acceso restringido a admin' });
    const existing = await BoatUsage.findById(id);
    if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });
    await BoatUsage.findByIdAndDelete(id);
    console.log('Deleted BoatUsage', id);
    return res.json({ message: 'Eliminado' });
  } catch (err) {
    console.error('Error deleting boat usage:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

