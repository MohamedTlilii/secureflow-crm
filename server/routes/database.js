// ════════════════════════════════════════════════════════════════════════════
// server/routes/database.js
// GET /api/database/stats — MongoDB storage + compteurs des vraies collections
// ════════════════════════════════════════════════════════════════════════════

const express          = require('express');
const router           = express.Router();
const mongoose         = require('mongoose');
const auth             = require('../middleware/auth');
const SolutionExpress  = require('../models/Solutionexpress');
const User             = require('../models/User');
const Essence          = require('../models/Essence');

// ── GET /api/database/stats ───────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Utilise les modèles Mongoose pour avoir le bon nom de collection
    const [seCount, usersCount, essenceCount] = await Promise.all([
      SolutionExpress.countDocuments(),
      User.countDocuments(),
      Essence.countDocuments(),
    ]);

    // Statistiques de stockage MongoDB
    const dbStats = await db.command({ dbStats: 1, scale: 1024 * 1024 });

    const totalDocs     = seCount + usersCount + essenceCount;
    const storageMB     = parseFloat((dbStats.dataSize || 0).toFixed(2));
    const storageLimit  = 512; // Free tier MongoDB Atlas (MB)
    const storagePercent = Math.min(100, Math.round((storageMB / storageLimit) * 100));

    res.json({
      collections: {
        solutionexpress: seCount,
        users:           usersCount,
        essences:        essenceCount,
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
