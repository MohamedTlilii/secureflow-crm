// routes/essence.js
const express  = require('express');
const router   = express.Router();
const Essence  = require('../models/Essence');
const auth     = require('../middleware/auth');

// ─── Date de début du poste ──────────────────────────────────────────────────
const DEBUT = { annee: 2025, mois: 5 }; // Juin 2025 (mois 0-indexé)

// ─── Helper : calcule jours ouvrés lun→ven d'un mois ────────────────────────
function joursOuvres(annee, mois0) {
  if (mois0 < 0 || mois0 > 11) return 0;
  let count = 0;
  const d = new Date(annee, mois0, 1);
  while (d.getMonth() === mois0) {
    const j = d.getDay();
    if (j !== 0 && j !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// ─── Helper : génère ou retrouve tous les mois d'une année ──────────────────
async function ensureYear(annee, tauxJour = 5) {
  const now      = new Date();
  const maxMois  = annee < now.getFullYear() ? 11 : now.getMonth();
  const startMois = annee < DEBUT.annee ? 12 : annee === DEBUT.annee ? DEBUT.mois : 0;

  const ops = [];
  for (let m = startMois; m <= maxMois; m++) {
    const jours    = joursOuvres(annee, m);
    const attendu  = +(jours * tauxJour).toFixed(3);
    ops.push({
      updateOne: {
        filter: { annee, mois: m },
        update: { $setOnInsert: { annee, mois: m, joursOuvres: jours, montantParJour: tauxJour, montantAttendu: attendu } },
        upsert: true,
      }
    });
  }
  if (ops.length) await Essence.bulkWrite(ops);
}

// ─── GET /api/essence?annee=2026 ────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    const realYear = new Date().getFullYear();
    if (annee < 2020 || annee > realYear + 1) return res.status(400).json({ error: 'Année invalide' });
    const startMois = annee < DEBUT.annee ? 12 : annee === DEBUT.annee ? DEBUT.mois : 0;
    await ensureYear(annee);
    const data = await Essence.find({ annee, mois: { $gte: startMois } }).sort({ mois: 1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/essence/annees  → liste des années disponibles ─────────────────
router.get('/annees', auth, (req, res) => {
  const currentYear = new Date().getFullYear();
  const annees = [];
  for (let y = DEBUT.annee; y <= currentYear; y++) annees.push(y);
  res.json(annees);
});

// ─── GET /api/essence/stats?annee=2026  → stats rapides ─────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const annee   = parseInt(req.query.annee) || new Date().getFullYear();
    const startMois = annee < DEBUT.annee ? 12 : annee === DEBUT.annee ? DEBUT.mois : 0;
    await ensureYear(annee);
    const data    = await Essence.find({ annee, mois: { $gte: startMois } });
    const attendu = data.reduce((s, d) => s + d.montantAttendu, 0);
    const recu    = data.filter(d => d.recu).reduce((s, d) => s + d.montantAttendu, 0);
    const jours   = data.reduce((s, d) => s + d.joursOuvres, 0);
    res.json({
      annee,
      totalAttendu:  +attendu.toFixed(3),
      totalRecu:     +recu.toFixed(3),
      totalManquant: +(attendu - recu).toFixed(3),
      totalJours:    jours,
      moisTotal:     data.length,
      moisRecus:     data.filter(d => d.recu).length,
      pctRecu:       attendu > 0 ? Math.round((recu / attendu) * 100) : 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PUT /api/essence/:id  → toggle reçu + note + taux ──────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { recu, note, montantParJour, montantAttendu } = req.body;
    const doc = await Essence.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (typeof recu === 'boolean') {
      doc.recu          = recu;
      doc.dateReception = recu ? new Date() : null;
    }
    if (note !== undefined)           doc.note           = note;
    if (montantParJour !== undefined) {
      doc.montantParJour = montantParJour;
      doc.montantAttendu = +(doc.joursOuvres * montantParJour).toFixed(3);
    }
    if (montantAttendu !== undefined && !doc.recu) doc.montantAttendu = +Number(montantAttendu).toFixed(3);
    await doc.save();

    // ── Si décembre reçu → supprimer toute l'année et passer à l'année suivante
    if (doc.recu && doc.mois === 11) {
      const nextAnnee  = doc.annee + 1;
      const unreceived = await Essence.countDocuments({ annee: doc.annee, recu: false });

      if (unreceived === 0) {
        await Essence.deleteMany({ annee: doc.annee });
        await ensureYear(nextAnnee);
      }

      return res.json({ ...doc.toObject(), nextAnnee: unreceived === 0 ? nextAnnee : null });
    }

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;