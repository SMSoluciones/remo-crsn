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
    // Debug: log received body keys (helps diagnosing missing form fields)
    console.log('POST /api/boat-reports - headers content-type:', req.headers['content-type']);
    console.log('POST /api/boat-reports - req.body keys:', Object.keys(req.body || {}));

    // Build payload from parsed bodies (accept multipart/form-data or application/json)
    let payload = {};
    // If client sent a JSON stringified payload inside a form field named `payload`, parse it
    if (req.body && typeof req.body.payload === 'string') {
      try {
        const parsed = JSON.parse(req.body.payload);
        payload = { ...parsed };
      } catch (e) {
        // ignore parse error and fallback to other fields
      }
    }
    // Merge direct body fields (multipart or json)
    payload = { ...payload, ...(req.body || {}) };

    // Helper to pick first available alias
    const pick = (obj, aliases) => {
      for (const a of aliases) {
        if (obj[a] !== undefined && obj[a] !== '') return obj[a];
      }
      return undefined;
    };

    // Normalize common field aliases
    payload.boatId = pick(payload, ['boatId', 'boat_id', 'boat', 'boatID', 'boat_id[]']);
    payload.descripcion = pick(payload, ['descripcion', 'description', 'desc']);
    payload.detectedByName = pick(payload, ['detectedByName', 'detected_by', 'detectedBy', 'detector']);
    payload.reporterId = pick(payload, ['reporterId', 'reporter_id', 'userId']);
    payload.reporterName = pick(payload, ['reporterName', 'reporter_name', 'reporter']);
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

    // Basic validation: require boatId and descripcion
    const missing = [];
    if (!payload.boatId) missing.push('boatId');
    if (!payload.descripcion) missing.push('descripcion');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
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
