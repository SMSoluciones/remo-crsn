const express = require('express');
const Oar = require('../models/Oar');

const router = express.Router();
const allowedRoles = new Set(['admin', 'subcomision', 'mantenimiento', 'profesores', 'entrenador']);

function canManage(req) {
  const role = String(req.header('x-user-role') || req.body?.userRole || '').trim().toLowerCase();
  return allowedRoles.has(role);
}

router.get('/', async (req, res) => {
  const oars = await Oar.find().sort({ fechaIngreso: -1, _id: -1 });
  res.json(oars);
});

router.post('/', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    const payload = { ...req.body };
    if (payload.tipo !== 'hacha') payload.largoHacha = null;
    const oar = new Oar(payload);
    await oar.save();
    res.status(201).json(oar);
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
    if (payload.tipo && payload.tipo !== 'hacha') payload.largoHacha = null;
    const oar = await Oar.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json(oar);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    await Oar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Par de remo eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
