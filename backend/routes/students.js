const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR');
};

const buildStudentsExcelHtml = (students) => {
  const headers = [
    'Nro Socio',
    'Nombre',
    'Apellido',
    'DNI',
    'Email',
    'Celular',
    'Categoria',
    'Estado',
    'Ciudad',
    'Domicilio',
    'Tipo',
    'Nacimiento',
    'Fecha Ingreso',
    'Beca',
    'Competitivo',
    'Federado',
  ];

  const rows = students.map((student) => [
    student.socioN,
    student.nombre,
    student.apellido,
    student.dni,
    student.email,
    student.celular,
    student.categoria,
    student.estado,
    student.ciudad,
    student.domicilio,
    student.tipo,
    formatDate(student.nacimiento),
    formatDate(student.fechaIngreso),
    student.beca ? 'SI' : 'NO',
    student.competitivo ? 'SI' : 'NO',
    student.federado ? 'SI' : 'NO',
  ]);

  const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const tableBody = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; font-family: Arial, sans-serif; font-size: 12px; }
      th { background: #f3f4f6; font-weight: bold; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>${tableHead}</tr>
      </thead>
      <tbody>
        ${tableBody}
      </tbody>
    </table>
  </body>
</html>`;
};

const sendStudentsExcel = (res, students, filenamePrefix = 'alumnos') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const filename = `${filenamePrefix}-${y}${m}${d}.xls`;

  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buildStudentsExcelHtml(students));
};

// Cloudinary setup (optional) - requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  } else {
    cloudinary = null;
    console.warn('Cloudinary env vars not set - image uploads will be skipped.');
  }
} catch (err) {
  cloudinary = null;
  console.warn('Cloudinary SDK not available. Install it with `npm i cloudinary` to enable uploads.');
}
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  sharp = null;
  console.warn('Sharp not available. Install it with `npm i sharp` to enable server-side image processing.');
}

router.get('/', async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

router.get('/export/excel', async (req, res) => {
  try {
    const students = await Student.find().sort({ apellido: 1, nombre: 1 }).lean();
    sendStudentsExcel(res, students, 'alumnos');
  } catch (err) {
    console.error('Error exporting students to excel:', err);
    res.status(500).json({ error: 'No se pudo generar el archivo de alumnos.' });
  }
});

router.post('/export/excel', async (req, res) => {
  try {
    const rawIds = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const validObjectIds = rawIds
      .map((id) => String(id || '').trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const filter = validObjectIds.length > 0 ? { _id: { $in: validObjectIds } } : {};
    const students = await Student.find(filter).sort({ apellido: 1, nombre: 1 }).lean();
    sendStudentsExcel(res, students, validObjectIds.length > 0 ? 'alumnos-filtrados' : 'alumnos');
  } catch (err) {
    console.error('Error exporting filtered students to excel:', err);
    res.status(500).json({ error: 'No se pudo generar el archivo de alumnos filtrados.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const mongoose = require('mongoose');

// Update student by identifier (dni or email)
router.put('/by-identifier', async (req, res) => {
  try {
    const { identifier, data } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier required' });
    const query = { $or: [{ dni: identifier }, { email: identifier }] };
    // avatar handling disabled — ignore data.avatar if present
    if (data && data.avatar) {
      delete data.avatar;
    }

    const student = await Student.findOneAndUpdate(query, data, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update by _id — validate ObjectId inside handler to avoid path parsing issues in some environments
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* previously a duplicate route was here and was removed to avoid conflicts */

  

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estudiante eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
