const express = require('express');
const router = express.Router();
const GoogleAlert = require('../models/GoogleAlert');
const auth = require('../middleware/auth');

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const { status, alertType, region } = req.query;
    let query = {};
    if (status) query.status = status;
    if (alertType) query.alertType = alertType;
    if (region) query.region = region;
    const alerts = await GoogleAlert.find(query).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create (Gemini analyse déjà fait dans le frontend)
router.post('/', auth, async (req, res) => {
  try {
    const alert = await GoogleAlert.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(alert);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const alert = await GoogleAlert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alerte introuvable' });
    res.json(alert);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await GoogleAlert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;