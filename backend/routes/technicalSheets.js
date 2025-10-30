const express = require('express');
const TechnicalSheet = require('../models/TechnicalSheet');
const Student = require('../models/Student');
const User = require('../models/User');
const mongoose = require('mongoose');
const router = express.Router();

function headerAuth(req, res, next) {
  const userId = req.header('x-user-id');
  const userRole = req.header('x-user-role');
  const userEmail = req.header('x-user-email');
  if (userId) req.user = { id: userId, rol: userRole ? String(userRole).toLowerCase() : undefined };
  if (userEmail) {
    req.user = req.user || {};
    req.user.email = String(userEmail).trim().toLowerCase();
  }
  next();
}

function requireTrainerOrAdmin(req, res, next) {
  const rol = req.user && req.user.rol;
  if (rol === 'admin' || rol === 'entrenador') return next();
  return res.status(403).json({ error: 'No autorizado' });
}

// Permite acceso si el usuario es admin/entrenador o si el email del usuario coincide con el
// email del estudiante solicitado (propietario). Usar sólo en rutas de consulta del alumno.
async function allowTrainerOrAdminOrOwner(req, res, next) {
  const rol = req.user && req.user.rol;
  if (rol === 'admin' || rol === 'entrenador') return next();
  // Si no tenemos email del usuario, no podemos comprobar propietario
  const userEmail = req.user && req.user.email;
  if (!userEmail) return res.status(403).json({ error: 'No autorizado' });

  // Resolver studentId param a documento y comparar emails
  try {
    let { studentId } = req.params;
    let studentDoc = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentDoc = await Student.findById(studentId).select('email');
    }
    if (!studentDoc) {
      studentDoc = await Student.findOne({ dni: studentId }).select('email');
    }
    if (!studentDoc) return res.status(403).json({ error: 'No autorizado' });
    const studentEmail = (studentDoc.email || '').toString().trim().toLowerCase();
    if (studentEmail && studentEmail === userEmail) return next();
    return res.status(403).json({ error: 'No autorizado' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

router.get('/', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    let sheets = await TechnicalSheet.find().populate('studentId', 'nombre apellido dni').populate('entrenadorId', 'nombre apellido email');
    async function enrichSheets(sheetsArr) {
      return Promise.all((sheetsArr || []).map(async s => {
        const obj = (s && s.toObject) ? s.toObject() : (s || {});
        try {
          if (!obj.studentId || !obj.studentId.nombre) {
            const sid = obj.studentId && (obj.studentId._id || obj.studentId);
            let studentDoc = null;
            if (sid && mongoose.Types.ObjectId.isValid(String(sid))) studentDoc = await Student.findById(sid).select('nombre apellido dni');
            if (!studentDoc && obj.studentId && typeof obj.studentId === 'string') studentDoc = await Student.findOne({ dni: obj.studentId }).select('nombre apellido dni');
            if (studentDoc) obj.studentId = studentDoc;
          }
  } catch (e) { }

        
        try {
          if (!obj.entrenadorId || !obj.entrenadorId.nombre) {
            const tid = obj.entrenadorId && (obj.entrenadorId._id || obj.entrenadorId);
            let trainerDoc = null;
            if (tid && mongoose.Types.ObjectId.isValid(String(tid))) trainerDoc = await User.findById(tid).select('nombre apellido email rol');
            if (!trainerDoc && obj.entrenadorId && typeof obj.entrenadorId === 'string') trainerDoc = await User.findOne({ email: obj.entrenadorId }).select('nombre apellido email rol');
            if (trainerDoc) obj.entrenadorId = trainerDoc;
          }
  } catch (e) { }

        return obj;
      }));
    }

    sheets = await enrichSheets(sheets);
    res.json(sheets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/student/:studentId', headerAuth, allowTrainerOrAdminOrOwner, async (req, res) => {
  try {
    const { studentId } = req.params;
    let idToQuery = studentId;
    
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      const student = await Student.findOne({ dni: studentId });
  if (!student) return res.json([]);
      idToQuery = student._id;
    }
  let sheets = await TechnicalSheet.find({ studentId: idToQuery }).populate('studentId', 'nombre apellido dni').populate('entrenadorId', 'nombre email rol');

  async function enrichSheets(sheetsArr) {
    return Promise.all((sheetsArr || []).map(async s => {
      const obj = (s && s.toObject) ? s.toObject() : (s || {});
      try {
        if (!obj.studentId || !obj.studentId.nombre) {
          const sid = obj.studentId && (obj.studentId._id || obj.studentId);
          let studentDoc = null;
          if (sid && mongoose.Types.ObjectId.isValid(String(sid))) studentDoc = await Student.findById(sid).select('nombre apellido dni');
          if (!studentDoc && obj.studentId && typeof obj.studentId === 'string') studentDoc = await Student.findOne({ dni: obj.studentId }).select('nombre apellido dni');
          if (studentDoc) obj.studentId = studentDoc;
        }
      } catch (e) { }
      try {
        if (!obj.entrenadorId || !obj.entrenadorId.nombre) {
          const tid = obj.entrenadorId && (obj.entrenadorId._id || obj.entrenadorId);
          let trainerDoc = null;
          if (tid && mongoose.Types.ObjectId.isValid(String(tid))) trainerDoc = await User.findById(tid).select('nombre apellido email rol');
          if (!trainerDoc && obj.entrenadorId && typeof obj.entrenadorId === 'string') trainerDoc = await User.findOne({ email: obj.entrenadorId }).select('nombre apellido email rol');
          if (trainerDoc) obj.entrenadorId = trainerDoc;
        }
      } catch (e) { }
      return obj;
    }));
  }

  sheets = await enrichSheets(sheets);
  res.json(sheets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', headerAuth, requireTrainerOrAdmin, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId es requerido' });

    
    let studentDoc = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentDoc = await Student.findById(studentId);
    } else {
      studentDoc = await Student.findOne({ dni: studentId });
    }
    if (!studentDoc) return res.status(400).json({ error: 'studentId no corresponde a ningún alumno' });

    
    const entrenadorId = req.user?.id || req.body.entrenadorId;
    const payload = { ...req.body, entrenadorId, studentId: studentDoc._id };
  const sheet = new TechnicalSheet(payload);
  await sheet.save();
  
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
