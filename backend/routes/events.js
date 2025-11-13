const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

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
    const { title, date, description } = req.body;
    const newEvent = new Event({ title, date, description });
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
    const { title, date, description } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(id, { title, date, description }, { new: true });
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

module.exports = router;