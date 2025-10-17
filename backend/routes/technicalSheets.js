const express = require('express');
const TechnicalSheet = require('../models/TechnicalSheet');
const Student = require('../models/Student');
const mongoose = require('mongoose');
const router = express.Router();

// Simple header-based auth middleware (no JWT required)
function headerAuth(req, res, next) {
  // Expect headers: x-user-id and x-user-role
  const userId = req.header('x-user-id');
  const userRole = req.header('x-user-role');
  if (userId) req.user = { id: userId, rol: userRole ? String(userRole).toLowerCase() : undefined };
  next();
}

function requireTrainerOrAdmin(req, res, next) {
  const rol = req.user && req.user.rol;
  if (rol === 'admin' || rol === 'entrenador') return next();
  return res.status(403).json({ error: 'No autorizado' });
}

router.get('/', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    // populate both student and entrenador for display
    const sheets = await TechnicalSheet.find().populate('studentId', 'nombre apellido dni').populate('entrenadorId', 'nombre apellido email');
    res.json(sheets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get technical sheets for a specific student (protected by headerAuth + role check)
router.get('/student/:studentId', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    let idToQuery = studentId;
    // if studentId is not a valid ObjectId, try to resolve by DNI
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await Student.findOne({ dni: studentId });
      if (!student) return res.json([]); // no student found, return empty list
      idToQuery = student._id;
    }
  // find by studentId and populate both student and entrenador info
  const sheets = await TechnicalSheet.find({ studentId: idToQuery }).populate('studentId', 'nombre apellido dni').populate('entrenadorId', 'nombre email rol');
  res.json(sheets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId es requerido' });

    // resolve studentId whether it's an ObjectId or a DNI
    let studentDoc = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentDoc = await Student.findById(studentId);
    } else {
      studentDoc = await Student.findOne({ dni: studentId });
    }
    if (!studentDoc) return res.status(400).json({ error: 'studentId no corresponde a ningún alumno' });

    // allow entrenadorId override, else use header user id
    const entrenadorId = req.user?.id || req.body.entrenadorId;
    const payload = { ...req.body, entrenadorId, studentId: studentDoc._id };
  const sheet = new TechnicalSheet(payload);
  await sheet.save();
  // populate student and entrenador for response
  const populated = await TechnicalSheet.findById(sheet._id).populate('studentId', 'nombre apellido dni').populate('entrenadorId', 'nombre email');
  res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    const sheet = await TechnicalSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(sheet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    await TechnicalSheet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ficha técnica eliminada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
