const express = require('express');
const Boat = require('../models/Boat');
const router = express.Router();

router.get('/', async (req, res) => {
  const boats = await Boat.find();
  res.json(boats);
});

router.post('/', async (req, res) => {
  try {
    const boat = new Boat(req.body);
    await boat.save();
    res.status(201).json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const boat = await Boat.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
