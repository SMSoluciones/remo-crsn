const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

function normalizeElementos(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function buildEventPayload(body = {}) {
  const totalEntradaNumber = Number(body.totalEntrada);
  const payload = {
    title: String(body.title || '').trim(),
    date: body.date,
    description: String(body.description || '').trim(),
    lugar: String(body.lugar || '').trim(),
    elementosNecesarios: normalizeElementos(body.elementosNecesarios),
    observacionesGenerales: String(body.observacionesGenerales || '').trim(),
    encargado: String(body.encargado || '').trim(),
    totalEntrada: Number.isFinite(totalEntradaNumber) && totalEntradaNumber >= 0 ? totalEntradaNumber : 0,
  };
  return payload;
}

function headerAuth(req, res, next) {
  const role = req.header('x-user-role');
  if (role) req.user = { rol: String(role).toLowerCase() };
  next();
}

function requireEventEditors(req, res, next) {
  const rol = req.user && req.user.rol;
  const allowed = ['admin', 'entrenador', 'mantenimiento', 'subcomision'];
  if (allowed.includes(rol)) return next();
  return res.status(403).json({ error: 'No autorizado' });
}

// Obtener todos los eventos
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los eventos', error });
  }
});

// Crear un nuevo evento
router.post('/', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const payload = buildEventPayload(req.body);
    const newEvent = new Event(payload);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el evento', error });
  }
});

// Actualizar un evento
router.put('/:id', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = buildEventPayload(req.body);
    const updatedEvent = await Event.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el evento', error });
  }
});

// Eliminar un evento
router.delete('/:id', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el evento', error });
  }
});

router.patch('/:id/finalize', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndUpdate(
      id,
      { isFinalizado: true, finalizadoAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    return res.status(200).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Error al finalizar el evento', error });
  }
});

router.post('/:id/expenses', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const { id } = req.params;
    const concepto = String(req.body?.concepto || '').trim();
    const monto = Number(req.body?.monto);
    const fecha = req.body?.fecha;
    const detalle = String(req.body?.detalle || '').trim();

    if (!concepto) {
      return res.status(400).json({ error: 'El concepto del gasto es obligatorio' });
    }
    if (!Number.isFinite(monto) || monto < 0) {
      return res.status(400).json({ error: 'El monto debe ser un numero valido' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    event.gastos.push({
      concepto,
      monto,
      fecha: fecha || new Date().toISOString(),
      detalle,
    });

    await event.save();
    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Error al agregar gasto del evento', error });
  }
});

router.delete('/:id/expenses/:expenseId', headerAuth, requireEventEditors, async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const originalLength = event.gastos.length;
    event.gastos = event.gastos.filter((gasto) => String(gasto._id) !== String(expenseId));
    if (event.gastos.length === originalLength) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    await event.save();
    return res.status(200).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar gasto del evento', error });
  }
});

module.exports = router;