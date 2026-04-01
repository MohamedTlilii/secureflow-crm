const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const [prospectCount, linkedinCount, alertCount, mapsCount] = await Promise.all([
      db.collection('prospects').countDocuments(),
      db.collection('linkedins').countDocuments(),
      db.collection('googlealerts').countDocuments(),
      db.collection('googlemaps').countDocuments(),
    ]);

    const dbStats = await db.command({ dbStats: 1, scale: 1024 * 1024 });

    const totalDocs = prospectCount + linkedinCount + alertCount + mapsCount;
    const storageMB = parseFloat((dbStats.dataSize || 0).toFixed(2));
    const storageLimit = 512;
    const storagePercent = Math.min(100, Math.round((storageMB / storageLimit) * 100));

    res.json({
      collections: {
        prospects: prospectCount,
        linkedin: linkedinCount,
        googleAlerts: alertCount,
        googleMaps: mapsCount,
      },
      totalDocs,
      storageMB,
      storageLimit,
      storagePercent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;