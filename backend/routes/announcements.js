const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

function headerAuth(req, res, next) {
  const role = req.header('x-user-role');
  if (role) req.user = { rol: String(role).toLowerCase() };
  next();
}

function requireAnnouncementEditors(req, res, next) {
  const rol = req.user && req.user.rol;
  const allowed = ['admin', 'entrenador', 'mantenimiento', 'subcomision'];
  if (allowed.includes(rol)) return next();
  return res.status(403).json({ error: 'No autorizado' });
}

// Obtener todos los anuncios
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los anuncios', error });
  }
});

// Crear un nuevo anuncio
router.post('/', headerAuth, requireAnnouncementEditors, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const newAnnouncement = new Announcement({ title, date, description });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el anuncio', error });
  }
});

// Actualizar un anuncio
router.put('/:id', headerAuth, requireAnnouncementEditors, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, description } = req.body;
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { title, date, description },
      { new: true }
    );
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el anuncio', error });
  }
});

// Eliminar un anuncio
router.delete('/:id', headerAuth, requireAnnouncementEditors, async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Anuncio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el anuncio', error });
  }
});

module.exports = router;
