const express = require('express');
const Seat = require('../models/Seat');

const router = express.Router();
const allowedRoles = new Set(['admin', 'subcomision', 'mantenimiento', 'profesores', 'entrenador']);

function canManage(req) {
  const role = String(req.header('x-user-role') || req.body?.userRole || '').trim().toLowerCase();
  return allowedRoles.has(role);
}

router.get('/', async (req, res) => {
  const seats = await Seat.find().sort({ fechaIngreso: -1, _id: -1 });
  res.json(seats);
});

router.post('/', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    const payload = { ...req.body };
    const seat = new Seat(payload);
    await seat.save();
    res.status(201).json(seat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    const payload = { ...req.body };
    const seat = await Seat.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json(seat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    await Seat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asiento eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
