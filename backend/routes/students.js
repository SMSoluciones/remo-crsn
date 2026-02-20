const express = require('express');
const Student = require('../models/Student');
const router = express.Router();

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

router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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

  

router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Estudiante eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
