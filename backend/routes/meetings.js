const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Announcement = require('../models/Announcement');

function headerAuth(req, res, next) {
  const role = req.header('x-user-role');
  if (role) req.user = { rol: String(role).toLowerCase() };
  next();
}

function requireMeetingEditors(req, res, next) {
  const rol = req.user && req.user.rol;
  const allowed = ['admin', 'entrenador', 'mantenimiento', 'subcomision'];
  if (allowed.includes(rol)) return next();
  return res.status(403).json({ error: 'No autorizado' });
}

function normalizeCategory(value) {
  const category = String(value || '').trim().toLowerCase();
  if (category === 'hablado' || category === 'a_tratar') return category;
  return 'a_tratar';
}

function buildMeetingPayload(body = {}) {
  return {
    tituloReunion: String(body.tituloReunion || '').trim(),
    fechaReunion: body.fechaReunion,
    descripcion: String(body.descripcion || '').trim(),
  };
}

function buildTopicPayload(body = {}) {
  return {
    titulo: String(body.titulo || '').trim(),
    detalle: String(body.detalle || '').trim(),
    categoria: normalizeCategory(body.categoria),
  };
}

async function createMeetingAnnouncement(meeting) {
  const title = `Nueva reunion: ${String(meeting?.tituloReunion || '').trim() || 'Sin titulo'}`;
  const fecha = meeting?.fechaReunion ? new Date(meeting.fechaReunion) : new Date();
  const description = `Se registro una nueva reunion para el ${fecha.toLocaleDateString('es-AR')}.`;

  const announcement = new Announcement({
    title,
    date: fecha,
    description,
    targetRoles: ['admin', 'subcomision'],
    sourceType: 'meeting',
  });
  await announcement.save();
}

router.get('/', async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ fechaReunion: -1, updatedAt: -1 });
    return res.status(200).json(meetings);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener las reuniones', error });
  }
});

router.post('/', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const payload = buildMeetingPayload(req.body);
    if (!payload.tituloReunion) {
      return res.status(400).json({ error: 'El titulo de la reunion es obligatorio' });
    }
    if (!payload.fechaReunion) {
      return res.status(400).json({ error: 'La fecha de la reunion es obligatoria' });
    }

    const meeting = new Meeting(payload);
    await meeting.save();

    try {
      await createMeetingAnnouncement(meeting);
    } catch (notificationError) {
      console.warn('No se pudo crear notificacion de reunion:', notificationError);
    }

    return res.status(201).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la reunion', error });
  }
});

router.put('/:id', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const payload = buildMeetingPayload(req.body);
    if (!payload.tituloReunion) {
      return res.status(400).json({ error: 'El titulo de la reunion es obligatorio' });
    }
    if (!payload.fechaReunion) {
      return res.status(400).json({ error: 'La fecha de la reunion es obligatoria' });
    }

    const meeting = await Meeting.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Reunion no encontrada' });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar la reunion', error });
  }
});

router.post('/:id/topics', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const payload = buildTopicPayload(req.body);
    if (!payload.titulo) {
      return res.status(400).json({ error: 'El titulo del tema es obligatorio' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Reunion no encontrada' });
    }

    meeting.temas.push(payload);
    await meeting.save();

    return res.status(201).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear el tema', error });
  }
});

router.put('/:id/topics/:topicId', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const payload = buildTopicPayload(req.body);
    if (!payload.titulo) {
      return res.status(400).json({ error: 'El titulo del tema es obligatorio' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Reunion no encontrada' });
    }

    const topic = meeting.temas.id(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    topic.titulo = payload.titulo;
    topic.detalle = payload.detalle;
    topic.categoria = payload.categoria;

    await meeting.save();
    return res.status(200).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el tema', error });
  }
});

router.patch('/:id/topics/:topicId/status', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const nextStatus = String(req.body?.estado || '').trim().toLowerCase();
    if (!['abierto', 'cerrado', 'archivado'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Estado invalido' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Reunion no encontrada' });
    }

    const topic = meeting.temas.id(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    topic.estado = nextStatus;
    if (nextStatus === 'cerrado') {
      topic.closedAt = new Date();
      topic.archivedAt = null;
    }
    if (nextStatus === 'abierto') {
      topic.closedAt = null;
      topic.archivedAt = null;
    }
    if (nextStatus === 'archivado') {
      topic.archivedAt = new Date();
    }

    await meeting.save();
    return res.status(200).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar estado del tema', error });
  }
});

router.delete('/:id', headerAuth, requireMeetingEditors, async (req, res) => {
  try {
    const deleted = await Meeting.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Reunion no encontrada' });
    }
    return res.status(200).json({ message: 'Reunion eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar la reunion', error });
  }
});

module.exports = router;
