const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const BoatReport = require('../models/BoatReport');
const router = express.Router();

// Configure Cloudinary from env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  const reports = await BoatReport.find().sort({ fechaReporte: -1 });
  res.json(reports);
});

// Accept multipart/form-data with optional 'foto' file
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    const payload = { ...req.body };
    // If file provided, upload to Cloudinary
    if (req.file && req.file.buffer) {
      const streamUpload = (buffer) => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'boatReports' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });
      const result = await streamUpload(req.file.buffer);
      payload.fotoURL = result.secure_url;
    }
    // fechaReporte can be provided as date+time string; fallback to now
    if (payload.fecha && payload.hora) {
      payload.fechaReporte = new Date(`${payload.fecha}T${payload.hora}`);
    }
    const report = new BoatReport(payload);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    console.error('Error creating boat report:', err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const report = await BoatReport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await BoatReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reporte eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
