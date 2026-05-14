// ════════════════════════════════════════════════════════════════════════════
// server/routes/stats.js
// Stats pour Solution Express uniquement
// ════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const SolutionExpress = require('../models/Solutionexpress');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {

    // ── COMPTEURS DE BASE ──────────────────────────────────────────────────
    const [
      totalSE,
      seNew, seContacted, seProposal,
      seInstallationEnCours, seInstalle, seInstallationAnnulee,
      urgent_se,
      b2b, b2c,
    ] = await Promise.all([
      SolutionExpress.countDocuments(),
      SolutionExpress.countDocuments({ status: 'new'                   }),
      SolutionExpress.countDocuments({ status: 'contacted'             }),
      SolutionExpress.countDocuments({ status: 'proposal'              }),
      SolutionExpress.countDocuments({ status: 'installation_en_cours' }),
      SolutionExpress.countDocuments({ status: 'installe'              }),
      SolutionExpress.countDocuments({ status: 'installation_annulee'  }),
      SolutionExpress.countDocuments({ urgencyScore: { $gte: 7 }       }),
      SolutionExpress.countDocuments({ typeClient: 'b2b'               }),
      SolutionExpress.countDocuments({ typeClient: 'b2c'               }),
    ]);

    const total   = totalSE;
    const won     = seInstalle;
    const urgent  = urgent_se;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

    // ── URGENCE MOYENNE ────────────────────────────────────────────────────
    const avgSE = await SolutionExpress.aggregate([{ $group: { _id: null, avg: { $avg: '$urgencyScore' } } }]);
    const avgUrgence = Math.round((avgSE[0]?.avg||0) * 10) / 10;

    // ── TOP VILLES ─────────────────────────────────────────────────────────
    const citySE = await SolutionExpress.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]);
    const byCity = citySE.filter(c => c._id).sort((a,b) => b.count - a.count).slice(0, 8);

    // ── PRODUITS ───────────────────────────────────────────────────────────
    const byProduit = await SolutionExpress.aggregate([
      { $unwind: { path: '$produits', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$produits', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

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

    // ── LEADS RÉCENTS ──────────────────────────────────────────────────────
    const recentSE = await SolutionExpress.find().sort({ createdAt: -1 }).limit(6)
      .select('prenom nom entreprise ville status createdAt urgencyScore typeClient produits');
    const recentProspects = recentSE.map(s => ({ ...s.toObject(), source: 'solution_express' }));

    // ── COMMISSIONS ───────────────────────────────────────────────────
    const periode = req.query.periode || 'mois';
    const now = new Date();
    const debut = new Date(0);
    if (periode === 'jour')    { const d = new Date(); d.setHours(0,0,0,0); debut.setTime(d.getTime()); }
    if (periode === 'semaine') debut.setTime(now.getTime() - 7*24*60*60*1000);
    if (periode === 'mois')    { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); debut.setTime(d.getTime()); }
    if (periode === 'annee')   { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); debut.setTime(d.getTime()); }

    const avecComm = await SolutionExpress.find({ $or: [{ commissionTotale: { $gt: 0 } }, { commissionFixe: { $gt: 0 } }] })
      .select('entreprise prenom nom ville commissionTotale commissionFixe commissionExtra commissionPayee dateVente datePaiementCommission createdAt')
      .sort({ dateVente: -1, createdAt: -1 });

    const periodeComm = periode === 'tout'
      ? avecComm
      : avecComm.filter(x => new Date(x.dateVente || x.createdAt) >= debut);

    const totalGagne = periodeComm.reduce((s,x) => s + (x.commissionTotale||0), 0);
    const totalPaye  = periodeComm.filter(x => x.commissionPayee).reduce((s,x) => s + (x.commissionTotale||0), 0);
    const commissions = periodeComm.length > 0 ? {
      totalGagne: Math.round(totalGagne * 100) / 100,
      totalPaye:  Math.round(totalPaye  * 100) / 100,
      enAttente:  Math.round(Math.max(0, totalGagne - totalPaye) * 100) / 100,
      moyenne:    Math.round((periodeComm.length > 0 ? totalGagne / periodeComm.length : 0) * 100) / 100,
      historique: periodeComm,
    } : null;

    res.json({
      total, won, urgent, avgUrgence, b2b, b2c, conversionRate,
      totalSE,
      seStatuts: { new: seNew, contacted: seContacted, proposal: seProposal, installation_en_cours: seInstallationEnCours, installe: seInstalle, installation_annulee: seInstallationAnnulee },
      byCity, byProduit, byQualif, byFourn, byLeadType,
      recentProspects, commissions,
      pipelineData: [
        { name: 'Nouveau',          value: seNew,                   color: '#3b6cf8' },
        { name: 'Contacté',         value: seContacted,             color: '#f79009' },
        { name: 'Soumission',       value: seProposal,              color: '#a764f8' },
        { name: 'Installation...',  value: seInstallationEnCours,   color: '#f97316' },
        { name: 'Installé',         value: seInstalle,              color: '#22c55e' },
        { name: 'Install. annulée', value: seInstallationAnnulee,   color: '#be123c' },
      ].filter(x => x.value > 0),
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;