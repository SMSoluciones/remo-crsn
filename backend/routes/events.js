const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/events'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const image = req.file ? `/uploads/events/${req.file.filename}` : null;
    const newEvent = new Event({ title, date, description, image });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el evento', error });
  }
});

// Actualizar un evento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, description, image } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(id, { title, date, description, image }, { new: true });
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el evento', error });
  }
});

// Eliminar un evento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el evento', error });
  }
});

module.exports = router;