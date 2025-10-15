const express = require('express');
const BoatReport = require('../models/BoatReport');
const router = express.Router();

router.get('/', async (req, res) => {
  const reports = await BoatReport.find();
  res.json(reports);
});

router.post('/', async (req, res) => {
  try {
    const report = new BoatReport(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
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
