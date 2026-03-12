const express = require('express');
const Seat = require('../models/Seat');

const router = express.Router();

router.get('/', async (req, res) => {
  const seats = await Seat.find().sort({ fechaIngreso: -1, _id: -1 });
  res.json(seats);
});

router.post('/', async (req, res) => {
  try {
    const seat = new Seat(req.body);
    await seat.save();
    res.status(201).json(seat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(seat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Seat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Asiento eliminado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
