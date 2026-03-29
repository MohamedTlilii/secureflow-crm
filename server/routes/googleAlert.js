const express = require('express');
const router = express.Router();
// const fetch = require('node-fetch');
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

// POST analyze with Gemini (backend — clé cachée)
router.post('/analyze-gemini', auth, async (req, res) => {
  try {
    const { alertText } = req.body;
    if (!alertText) return res.status(400).json({ message: 'alertText requis' });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Tu es un assistant CRM pour une entreprise de securite au Quebec. Analyse ce texte et retourne UNIQUEMENT un JSON sans markdown:
{"entreprise":"","prenom":"","nom":"","telephone":"","adresse":"","ville":"Montreal","alertType":"incendie|vol|nouvelle_entreprise|ouverture|incident|autre","aiSummary":"resume en 2 phrases","urgencyScore":0,"keyword":""}
Texte: ${alertText}` }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();

    if (data.error?.code === 429) {
      return res.status(429).json({ message: 'Limite Gemini atteinte — réessaie dans 1 minute' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let analysis = {};
    try {
      analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return res.status(500).json({ message: 'Erreur parsing Gemini' });
    }

    const alert = await GoogleAlert.create({
      alertText,
      ...analysis,
      urgencyScore: Number(analysis.urgencyScore) || 0,
      status: 'analyzed',
      createdBy: req.user._id
    });

    res.status(201).json(alert);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create manually
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