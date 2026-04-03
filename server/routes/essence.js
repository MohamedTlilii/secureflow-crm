// routes/essence.js
const express  = require('express');
const router   = express.Router();
const Essence  = require('../models/Essence');

// ─── Helper : calcule jours ouvrés lun→ven d'un mois ────────────────────────
function joursOuvres(annee, mois0) {
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
  const now     = new Date();
  // Pour l'année en cours : seulement les mois passés + mois actuel
  // Pour les années antérieures complètes : tous les 12 mois
  const maxMois = annee < now.getFullYear() ? 11 : now.getMonth();

  const ops = [];
  for (let m = 0; m <= maxMois; m++) {
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
router.get('/', async (req, res) => {
  try {
    const annee = parseInt(req.query.annee) || new Date().getFullYear();
    await ensureYear(annee);
    const data = await Essence.find({ annee }).sort({ mois: 1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/essence/annees  → liste des années disponibles ─────────────────
router.get('/annees', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    // Années dynamiques depuis 2026 jusqu'à l'année actuelle
    const annees = [];
    for (let y = 2026; y <= currentYear; y++) annees.push(y);
    res.json(annees);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/essence/stats?annee=2026  → stats rapides ─────────────────────
router.get('/stats', async (req, res) => {
  try {
    const annee   = parseInt(req.query.annee) || new Date().getFullYear();
    await ensureYear(annee);
    const data    = await Essence.find({ annee });
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
router.put('/:id', async (req, res) => {
  try {
    const { recu, note, montantParJour } = req.body;
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
    await doc.save();

    // ── Si décembre reçu → supprimer toute l'année et passer à l'année suivante
    if (doc.recu && doc.mois === 11) {
      const nextAnnee   = doc.annee + 1;
      const allMonths   = await Essence.find({ annee: doc.annee });
      const allReceived = allMonths.every(m => m.recu);

      if (allReceived) {
        await Essence.deleteMany({ annee: doc.annee });
        await ensureYear(nextAnnee);
      }

      return res.json({ ...doc.toObject(), nextAnnee: allReceived ? nextAnnee : null });
    }

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/essence/mark-all  → marquer tous les mois d'une année ────────
router.post('/mark-all', async (req, res) => {
  try {
    const { annee, recu } = req.body;
    await Essence.updateMany(
      { annee },
      { $set: { recu, dateReception: recu ? new Date() : null } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;