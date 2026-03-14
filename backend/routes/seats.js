const express = require('express');
const Seat = require('../models/Seat');

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
  const seats = await Seat.find().sort({ fechaIngreso: -1, _id: -1 });
  res.json(seats);
});

router.post('/', async (req, res) => {
  if (!canManage(req)) {
    return res.status(403).json({ error: 'Acceso restringido a admin, subcomision, profesores o mantenimiento' });
  }
  try {
    const payload = { ...req.body };
    payload.causa = normalizeCause(payload.causa);
    if (requiresCause(payload.estado) && !payload.causa) {
      return res.status(400).json({ error: 'La causa es obligatoria cuando el estado es mantenimiento o fuera de servicio' });
    }
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
    if (Object.prototype.hasOwnProperty.call(payload, 'causa')) payload.causa = normalizeCause(payload.causa);

    const current = await Seat.findById(req.params.id);
    if (!current) return res.status(404).json({ error: 'Asiento no encontrado' });

    const nextEstado = payload.estado ?? current.estado;
    const nextCausa = normalizeCause(Object.prototype.hasOwnProperty.call(payload, 'causa') ? payload.causa : current.causa);
    if (requiresCause(nextEstado) && !nextCausa) {
      return res.status(400).json({ error: 'La causa es obligatoria cuando el estado es mantenimiento o fuera de servicio' });
    }

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
