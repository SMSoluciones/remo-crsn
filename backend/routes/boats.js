const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Boat = require('../models/Boat');
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadBufferToCloudinary = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder: 'boats' }, (error, result) => {
    if (error) return reject(error);
    resolve(result);
  });
  stream.end(buffer);
});

router.get('/', async (req, res) => {
  const boats = await Boat.find();
  res.json(boats);
});

router.post('/', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.ubicacion && payload.proveedor) payload.ubicacion = payload.proveedor;
    if (!payload.proveedor && payload.ubicacion) payload.proveedor = payload.ubicacion;
    const boat = new Boat(payload);
    await boat.save();
    res.status(201).json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.ubicacion && payload.proveedor) payload.ubicacion = payload.proveedor;
    if (!payload.proveedor && payload.ubicacion) payload.proveedor = payload.ubicacion;
    const boat = await Boat.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/photo', upload.single('foto'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No se recibio archivo de foto' });
    }
    const uploaded = await uploadBufferToCloudinary(req.file.buffer);
    const boat = await Boat.findByIdAndUpdate(
      req.params.id,
      { fotoURL: uploaded.secure_url },
      { new: true, runValidators: true },
    );
    if (!boat) return res.status(404).json({ error: 'Bote no encontrado' });
    res.json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Boat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bote eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
