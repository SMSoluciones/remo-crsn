const express = require('express');
const Oar = require('../models/Oar');

const router = express.Router();
const allowedRoles = new Set(['admin', 'subcomision', 'mantenimiento', 'profesores', 'entrenador']);

function canManage(req) {
  const role = String(req.header('x-user-role') || req.body?.userRole || '').trim().toLowerCase();
  return allowedRoles.has(role);
}

function requiresCause(estado) {
  return estado === 'mantenimiento' || estado === 'fuera_servicio';
}

function normalizeCause(value) {
  return String(value || '').trim();
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
    payload.causa = normalizeCause(payload.causa);
    if (requiresCause(payload.estado) && !payload.causa) {
      return res.status(400).json({ error: 'La causa es obligatoria cuando el estado es mantenimiento o fuera de servicio' });
    }
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
    if (Object.prototype.hasOwnProperty.call(payload, 'causa')) payload.causa = normalizeCause(payload.causa);

    const current = await Oar.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Par de remo no encontrado' });

    const nextEstado = payload.estado ?? current.estado;
    const nextCausa = normalizeCause(Object.prototype.hasOwnProperty.call(payload, 'causa') ? payload.causa : current.causa);
    if (requiresCause(nextEstado) && !nextCausa) {
      return res.status(400).json({ error: 'La causa es obligatoria cuando el estado es mantenimiento o fuera de servicio' });
    }

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
