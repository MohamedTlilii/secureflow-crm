// ════════════════════════════════════════════════════════════════════════════
// routes/stats.js
// Single route: GET /api/stats
// Returns document counts per collection + MongoDB storage usage.
// Used by the Dashboard to display KPI cards.
// ════════════════════════════════════════════════════════════════════════════

const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const auth      = require('../middleware/auth'); // Requires valid JWT to access

// ── GET /api/stats ────────────────────────────────────────────────────────────
// Counts documents in each collection and calculates storage usage.
// All 4 counts run in parallel with Promise.all for better performance.
router.get('/stats', auth, async (req, res) => {
  try {
    const db = mongoose.connection.db; // Raw MongoDB driver — bypasses Mongoose models

    // Count documents in each collection simultaneously
    // To add a new collection: add a new countDocuments() call here AND add it to the response below
    const [prospectCount, linkedinCount, alertCount, mapsCount] = await Promise.all([
      db.collection('prospects').countDocuments(),
      db.collection('linkedins').countDocuments(),
      db.collection('googlealerts').countDocuments(),
      db.collection('googlemaps').countDocuments(),
    ]);

    // Fetch MongoDB storage stats — scale: 1024*1024 converts bytes → MB
    const dbStats = await db.command({ dbStats: 1, scale: 1024 * 1024 });

    // Total documents across all tracked collections
    const totalDocs = prospectCount + linkedinCount + alertCount + mapsCount;

    // Storage used in MB — dataSize = actual data, not allocated storage
    const storageMB = parseFloat((dbStats.dataSize || 0).toFixed(2));

    // Free tier storage limit in MB — change this if you upgrade your MongoDB plan
    const storageLimit = 512; // ← Edit here (e.g. 5120 for 5GB)

    // Percentage used — capped at 100 to avoid overflow in progress bars
    const storagePercent = Math.min(100, Math.round((storageMB / storageLimit) * 100));

    // Response shape — frontend Dashboard reads these exact keys
    // If you rename a key here, update the Dashboard component too
    res.json({
      collections: {
        prospects:    prospectCount,
        linkedin:     linkedinCount,
        googleAlerts: alertCount,
        googleMaps:   mapsCount,
      },
      totalDocs,      // Sum of all 4 collection counts
      storageMB,      // Current usage in MB
      storageLimit,   // Cap in MB (for progress bar max)
      storagePercent, // 0–100 value for the storage progress bar
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;