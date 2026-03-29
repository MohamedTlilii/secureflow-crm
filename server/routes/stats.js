const express = require('express');
const router = express.Router();
const GoogleAlert = require('../models/GoogleAlert');
const LinkedIn = require('../models/LinkedIn');
const GoogleMap = require('../models/GoogleMap');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [
      totalAlerts,
      totalLinkedIn,
      totalMaps,
      alertsAnalyzed,
      alertsContacted,
      linkedinContacted,
      mapsContacted,
    ] = await Promise.all([
      GoogleAlert.countDocuments(),
      LinkedIn.countDocuments(),
      GoogleMap.countDocuments(),
      GoogleAlert.countDocuments({ status: 'analyzed' }),
      GoogleAlert.countDocuments({ status: 'contacted' }),
      LinkedIn.countDocuments({ status: 'contacted' }),
      GoogleMap.countDocuments({ status: 'contacted' }),
    ]);

    const total = totalAlerts + totalLinkedIn + totalMaps;
    const contacted = alertsContacted + linkedinContacted + mapsContacted;
    const conversionRate = total > 0 ? Math.round((contacted / total) * 100) : 0;

    // Récents toutes sources
    const [recentAlerts, recentLinkedIn, recentMaps] = await Promise.all([
      GoogleAlert.find().sort({ createdAt: -1 }).limit(3).select('prenom nom entreprise ville status createdAt'),
      LinkedIn.find().sort({ createdAt: -1 }).limit(3).select('prenom nom entreprise ville status createdAt'),
      GoogleMap.find().sort({ createdAt: -1 }).limit(3).select('nom ville status createdAt'),
    ]);

    const recentProspects = [
      ...recentAlerts.map(a => ({ ...a.toObject(), source: 'google_alert' })),
      ...recentLinkedIn.map(l => ({ ...l.toObject(), source: 'linkedin' })),
      ...recentMaps.map(m => ({ ...m.toObject(), prenom: '', nom: m.nom, source: 'google_map' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    // Top villes
    const [cityAlerts, cityLinkedIn, cityMaps] = await Promise.all([
      GoogleAlert.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]),
      LinkedIn.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]),
      GoogleMap.aggregate([{ $group: { _id: '$ville', count: { $sum: 1 } } }]),
    ]);

    const cityMap = {};
    [...cityAlerts, ...cityLinkedIn, ...cityMaps].forEach(c => {
      if (c._id) cityMap[c._id] = (cityMap[c._id] || 0) + c.count;
    });
    const byCity = Object.entries(cityMap)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Par signal/source
    const bySignal = [
      { _id: 'google_alert', count: totalAlerts },
      { _id: 'linkedin', count: totalLinkedIn },
      { _id: 'google_map', count: totalMaps },
    ];

    res.json({
      total,
      p0: 0,
      inbox: totalAlerts + totalLinkedIn + totalMaps - contacted,
      qualifying: alertsAnalyzed,
      proposal: 0,
      closed: contacted,
      dead: 0,
      b2b: totalLinkedIn + totalMaps,
      b2c: totalAlerts,
      conversionRate,
      recentProspects,
      byCity,
      bySignal,
      breakdown: {
        googleAlert: totalAlerts,
        linkedin: totalLinkedIn,
        googleMap: totalMaps,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;