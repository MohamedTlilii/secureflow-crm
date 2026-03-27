const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const auth = require('../middleware/auth');

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const { stage, type, ville, search, priorite } = req.query;
    let query = {};
    if (stage) query.stage = stage;
    if (type) query.type = type;
    if (ville) query.ville = ville;
    if (priorite) query.priorite = priorite;
    if (search) {
      query.$or = [
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
        { entreprise: { $regex: search, $options: 'i' } },
        { ville: { $regex: search, $options: 'i' } }
      ];
    }
    const prospects = await Prospect.find(query).sort({ createdAt: -1 }).populate('assignedTo', 'name email');
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET one
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Prospect.findById(req.params.id).populate('assignedTo', 'name email');
    if (!p) return res.status(404).json({ message: 'Prospect introuvable' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create
router.post('/', auth, async (req, res) => {
  try {
    const prospect = await Prospect.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(prospect);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Prospect.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Prospect introuvable' });
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST add note
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const p = await Prospect.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Prospect introuvable' });
    p.notes.push({ text: req.body.text, author: req.user.name });
    await p.save();
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await Prospect.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
