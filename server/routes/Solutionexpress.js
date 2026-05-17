// ════════════════════════════════════════════════════════════════════════════
// routes/solutionExpress.js
// Routes Express pour Solution Express CRM
//
// ROUTES DISPONIBLES :
//   GET    /api/solution-express              → Liste toutes les fiches (+ filtres query)
//   POST   /api/solution-express              → Crée une fiche manuellement
//   PUT    /api/solution-express/:id          → Modifie une fiche (statut, notes, infos)
//   DELETE /api/solution-express/:id          → Supprime une fiche
//
// AJOUT DANS server.js :
//   const solutionExpressRoutes = require('./routes/solutionExpress');
//   app.use('/api/solution-express', solutionExpressRoutes);
// ════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const SolutionExpress = require('../models/Solutionexpress');
const auth    = require('../middleware/auth');  // middleware JWT existant

const VALID_STATUS = ['new','contacted','proposal','installation_en_cours','installe','installation_annulee'];

// ── GET ALL ──────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, leadType, ville, region } = req.query;
    if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ message: 'Statut invalide' });
    if (ville  && (typeof ville  !== 'string' || ville.length  > 100)) return res.status(400).json({ message: 'Ville invalide' });
    if (region && (typeof region !== 'string' || region.length > 100)) return res.status(400).json({ message: 'Région invalide' });

    let query = {};
    if (status)   query.status   = status;
    if (leadType) query.leadType = leadType;
    if (ville)    query.ville    = ville;
    if (region)   query.region   = region;

    const fiches = await SolutionExpress.find(query).sort({ createdAt: -1 });
    res.json(fiches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST CREATE ───────────────────────────────────────────────────────────────
// Crée une nouvelle fiche manuellement (saisie depuis l'interface)
router.post('/', auth, async (req, res) => {
  try {
    const fiche = await SolutionExpress.create({
      ...req.body,
      createdBy: req.user._id  // utilisateur connecté via JWT
    });
    res.status(201).json(fiche);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT UPDATE ────────────────────────────────────────────────────────────────
// Modifie une fiche existante — utilisé pour :
//   • Modification des infos générales (openEdit)
//   • Changement de statut rapide (changeStatus)
//   • Ajout de note (addNote → notes: [...existing, newNote])
const VALID_STATUTS = ['new','contacted','proposal','installation_en_cours','installe','installation_annulee'];

router.put('/:id', auth, async (req, res) => {
  try {
    const { createdBy, ...updateFields } = req.body; // createdBy immuable
    if (updateFields.status && !VALID_STATUTS.includes(updateFields.status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    const fiche = await SolutionExpress.findByIdAndUpdate(
      req.params.id,
      { ...updateFields, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!fiche) return res.status(404).json({ message: 'Fiche introuvable' });
    res.json(fiche);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────────
// Supprime définitivement une fiche
router.delete('/:id', auth, async (req, res) => {
  try {
    const fiche = await SolutionExpress.findByIdAndDelete(req.params.id);
    if (!fiche) return res.status(404).json({ message: 'Fiche introuvable' });
    res.json({ message: 'Fiche supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;