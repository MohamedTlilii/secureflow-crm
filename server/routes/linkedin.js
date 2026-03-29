const express = require('express');
const router = express.Router();
const LinkedIn = require('../models/LinkedIn');
const auth = require('../middleware/auth');
const { generateLinkedInMessage } = require('../services/claudeService');
const { sendEmail, buildEmailHTML } = require('../services/emailService');

// GET all LinkedIn leads
router.get('/', auth, async (req, res) => {
  try {
    const { status, region, signalType, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (region) query.region = region;
    if (signalType) query.signalType = signalType;
    if (search) {
      query.$or = [
        { prenom: { $regex: search, $options: 'i' } },
        { nom: { $regex: search, $options: 'i' } },
        { entreprise: { $regex: search, $options: 'i' } },
        { ville: { $regex: search, $options: 'i' } }
      ];
    }
    const leads = await LinkedIn.find(query).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create LinkedIn lead manually
router.post('/', auth, async (req, res) => {
  try {
    const lead = await LinkedIn.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(lead);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST generate AI message for a lead
router.post('/:id/generate-message', auth, async (req, res) => {
  try {
    const lead = await LinkedIn.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead introuvable' });
    const message = await generateLinkedInMessage(lead);
    lead.aiMessage = message;
    await lead.save();
    res.json({ message, lead });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST send email to LinkedIn lead
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const lead = await LinkedIn.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead introuvable' });
    if (!lead.email) return res.status(400).json({ message: 'Pas d\'email pour ce lead' });
    await sendEmail({
      to: lead.email,
      subject: `Solution de sécurité pour ${lead.entreprise || 'votre commerce'}`,
      html: buildEmailHTML(lead.aiMessage, lead.prenom)
    });
    lead.emailSent = true;
    lead.emailSentAt = new Date();
    lead.status = 'contacted';
    await lead.save();
    res.json({ success: true, lead });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update status
router.put('/:id', auth, async (req, res) => {
  try {
    const lead = await LinkedIn.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lead);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    await LinkedIn.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
