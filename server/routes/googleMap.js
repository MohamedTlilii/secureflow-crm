const express = require('express');
const router = express.Router();
const GoogleMap = require('../models/GoogleMap');
const auth = require('../middleware/auth');
const { generateMapMessage } = require('../services/claudeService');
const { sendEmail, buildEmailHTML } = require('../services/emailService');

// GET all map leads
router.get('/', auth, async (req, res) => {
  try {
    const { status, region, categorie } = req.query;
    let query = {};
    if (status) query.status = status;
    if (region) query.region = region;
    if (categorie) query.categorie = categorie;
    const places = await GoogleMap.find(query).sort({ createdAt: -1 });
    res.json(places);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create map lead manually
router.post('/', auth, async (req, res) => {
  try {
    const place = await GoogleMap.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(place);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST generate AI message
router.post('/:id/generate-message', auth, async (req, res) => {
  try {
    const place = await GoogleMap.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Introuvable' });
    const message = await generateMapMessage(place);
    place.aiMessage = message;
    await place.save();
    res.json({ message, place });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST send email
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const place = await GoogleMap.findById(req.params.id);
    if (!place) return res.status(404).json({ message: 'Introuvable' });
    if (!place.email) return res.status(400).json({ message: 'Pas d\'email' });
    await sendEmail({
      to: place.email,
      subject: `Solution de sécurité pour ${place.nom}`,
      html: buildEmailHTML(place.aiMessage)
    });
    place.emailSent = true;
    place.emailSentAt = new Date();
    place.status = 'contacted';
    await place.save();
    res.json({ success: true, place });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update
router.put('/:id', auth, async (req, res) => {
  try {
    const place = await GoogleMap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(place);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await GoogleMap.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
