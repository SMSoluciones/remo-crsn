const express = require('express');
const TechnicalSheet = require('../models/TechnicalSheet');
const router = express.Router();

router.get('/', async (req, res) => {
  const sheets = await TechnicalSheet.find();
  res.json(sheets);
});

router.post('/', async (req, res) => {
  try {
    const sheet = new TechnicalSheet(req.body);
    await sheet.save();
    res.status(201).json(sheet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const sheet = await TechnicalSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(sheet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await TechnicalSheet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ficha técnica eliminada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
