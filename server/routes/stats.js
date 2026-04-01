// ════════════════════════════════════════════════════════════════════════════
// server/routes/stats.js
// Stats pour Google Alerts + Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const GoogleAlert     = require('../models/GoogleAlert');
const SolutionExpress = require('../models/Solutionexpress');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {

    // ── COMPTEURS DE BASE ──────────────────────────────────────────────────
    const [
      totalGA, totalSE,
      gaNew, gaAnalyzed, gaContacted, gaSaved, gaIgnored,
      seNew, seContacted, seInterested, seProposal, seWon, seLost, seIgnored,
      urgent_ga, urgent_se,
      b2b, b2c,
    ] = await Promise.all([
      GoogleAlert.countDocuments(),
      SolutionExpress.countDocuments(),
      // Google Alerts statuts
      GoogleAlert.countDocuments({ status: 'new'       }),
      GoogleAlert.countDocuments({ status: 'analyzed'  }),
      GoogleAlert.countDocuments({ status: 'contacted' }),
      GoogleAlert.countDocuments({ status: 'saved'     }),
      GoogleAlert.countDocuments({ status: 'ignored'   }),
      // Solution Express statuts
      SolutionExpress.countDocuments({ status: 'new'       }),
      SolutionExpress.countDocuments({ status: 'contacted' }),
      SolutionExpress.countDocuments({ status: 'interested'}),
      SolutionExpress.countDocuments({ status: 'proposal'  }),
      SolutionExpress.countDocuments({ status: 'won'       }),
      SolutionExpress.countDocuments({ status: 'lost'      }),
      SolutionExpress.countDocuments({ status: 'ignored'   }),
      // Urgents
      GoogleAlert.countDocuments({ urgencyScore: { $gte: 7 } }),
      SolutionExpress.countDocuments({ urgencyScore: { $gte: 7 } }),
      // B2B / B2C
      SolutionExpress.countDocuments({ typeClient: 'b2b' }),
      SolutionExpress.countDocuments({ typeClient: 'b2c' }),
    ]);

    const total   = totalGA + totalSE;
    const won     = seWon;
    const urgent  = urgent_ga + urgent_se;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

    // ── URGENCE MOYENNE ────────────────────────────────────────────────────
    const [avgGA, avgSE] = await Promise.all([
      GoogleAlert.aggregate([{ $group: { _id: null, avg: { $avg: '$urgencyScore' } } }]),
      SolutionExpress.aggregate([{ $group: { _id: null, avg: { $avg: '$urgencyScore' } } }]),
    ]);
    const avgUrgence = Math.round(
      (((avgGA[0]?.avg||0) + (avgSE[0]?.avg||0)) / 2) * 10
    ) / 10;

    // ── TOP VILLES ─────────────────────────────────────────────────────────
    const [cityGA, citySE] = await Promise.all([
      GoogleAlert.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]),
      SolutionExpress.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]),
    ]);
    const cityMap = {};
    [...cityGA, ...citySE].forEach(c => {
      if (c._id) cityMap[c._id] = (cityMap[c._id]||0) + c.count;
    });
    const byCity = Object.entries(cityMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a,b) => b.count - a.count).slice(0, 8);

    // ── PRODUITS ───────────────────────────────────────────────────────────
    const seProduits = await SolutionExpress.find({}, 'produits');
    const produitCounts = {};
    seProduits.forEach(x => (x.produits||[]).forEach(p => {
      produitCounts[p] = (produitCounts[p]||0) + 1;
    }));
    const byProduit = Object.entries(produitCounts)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a,b) => b.count - a.count);

    // ── QUALIFICATION SYSTÈME ──────────────────────────────────────────────
    const byQualif = await SolutionExpress.aggregate([
      { $match: { qualificationSysteme: { $exists: true, $nin: ['inconnu',''] } } },
      { $group: { _id: '$qualificationSysteme', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // ── TOP FOURNISSEURS ACTUELS ───────────────────────────────────────────
    const fournData = await SolutionExpress.aggregate([{ $facet: {
      alarme:   [{ $match: { fournisseurAlarme:   { $nin: ['inconnu','aucun',''] } } }, { $group: { _id: '$fournisseurAlarme',   count: { $sum: 1 } } }],
      internet: [{ $match: { fournisseurInternet: { $nin: ['inconnu','aucun',''] } } }, { $group: { _id: '$fournisseurInternet', count: { $sum: 1 } } }],
      mobile:   [{ $match: { fournisseurMobile:   { $nin: ['inconnu','aucun',''] } } }, { $group: { _id: '$fournisseurMobile',   count: { $sum: 1 } } }],
    }}]);
    const fournMap = {};
    const fd = fournData[0] || {};
    [...(fd.alarme||[]),...(fd.internet||[]),...(fd.mobile||[])].forEach(f => {
      if (f._id) fournMap[f._id] = (fournMap[f._id]||0) + f.count;
    });
    const byFourn = Object.entries(fournMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a,b) => b.count - a.count).slice(0, 6);

    // ── TYPES DE LEAD ──────────────────────────────────────────────────────
    const byLeadType = await SolutionExpress.aggregate([
      { $group: { _id: '$leadType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── TYPES D'ALERTE Google ──────────────────────────────────────────────
    const byAlertType = await GoogleAlert.aggregate([
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ── LEADS RÉCENTS ──────────────────────────────────────────────────────
    const [recentGA, recentSE] = await Promise.all([
      GoogleAlert.find().sort({ createdAt: -1 }).limit(4)
        .select('prenom nom entreprise ville status createdAt urgencyScore alertType'),
      SolutionExpress.find().sort({ createdAt: -1 }).limit(4)
        .select('prenom nom entreprise ville status createdAt urgencyScore typeClient produits'),
    ]);
    const recentProspects = [
      ...recentGA.map(a => ({ ...a.toObject(), source: 'google_alert'     })),
      ...recentSE.map(s => ({ ...s.toObject(), source: 'solution_express' })),
    ].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    // ── RÉPONSE ────────────────────────────────────────────────────────────
    res.json({
      // Totaux
      total, won, urgent, avgUrgence, b2b, b2c, conversionRate,
      totalGA, totalSE,

      // Statuts Google Alerts
      gaStatuts: { new: gaNew, analyzed: gaAnalyzed, contacted: gaContacted, saved: gaSaved, ignored: gaIgnored },

      // Statuts Solution Express
      seStatuts: { new: seNew, contacted: seContacted, interested: seInterested, proposal: seProposal, won: seWon, lost: seLost, ignored: seIgnored },

      // Détails
      byCity, byProduit, byQualif, byFourn, byLeadType, byAlertType,
      recentProspects,

      // Pipeline (données pour graphique)
      pipelineData: [
        { name: 'Nouveau',    value: gaNew + gaAnalyzed + seNew,          color: '#3b6cf8' },
        { name: 'Contacté',   value: gaContacted + seContacted,           color: '#f79009' },
        { name: 'Intéressé',  value: seInterested,                        color: '#12b76a' },
        { name: 'Soumission', value: seProposal,                          color: '#a764f8' },
        { name: 'Gagné',      value: seWon,                               color: '#12b76a' },
        { name: 'Perdu',      value: seLost,                              color: '#f04438' },
      ].filter(x => x.value > 0),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;