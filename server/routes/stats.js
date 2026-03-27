const express = require('express');
const router = express.Router();
const Prospect = require('../models/Prospect');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [total, p0, inbox, qualifying, proposal, closed, dead, b2b, b2c] = await Promise.all([
      Prospect.countDocuments(),
      Prospect.countDocuments({ priorite: 'P0', stage: { $nin: ['04_Closed', '99_Dead'] } }),
      Prospect.countDocuments({ stage: '01_Inbox' }),
      Prospect.countDocuments({ stage: '02_Qualifying' }),
      Prospect.countDocuments({ stage: '03_Proposal' }),
      Prospect.countDocuments({ stage: '04_Closed' }),
      Prospect.countDocuments({ stage: '99_Dead' }),
      Prospect.countDocuments({ type: 'B2B' }),
      Prospect.countDocuments({ type: 'B2C' }),
    ]);

    const recentProspects = await Prospect.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('prenom nom entreprise ville priorite stage createdAt');

    const byCity = await Prospect.aggregate([
      { $group: { _id: '$ville', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const bySignal = await Prospect.aggregate([
      { $group: { _id: '$signal', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    res.json({
      total, p0, inbox, qualifying, proposal, closed, dead, b2b, b2c,
      conversionRate, recentProspects, byCity, bySignal
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
