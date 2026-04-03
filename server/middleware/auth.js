// ════════════════════════════════════════════════════════════════════════════
// middleware/auth.js
// Express middleware — verifies JWT on every protected route.
// Usage: add it to any route that requires login → router.get('/me', auth, handler)
// ════════════════════════════════════════════════════════════════════════════

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Extract token from Authorization header → "Bearer <token>"
    // Change 'Authorization' here if your frontend sends a different header name
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // No token at all → reject immediately
    if (!token) return res.status(401).json({ message: 'Accès non autorisé' });

    // Verify signature + expiry using JWT_SECRET from .env
    // If expired or tampered → throws, caught below → 401
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ← JWT_SECRET must be in .env

    // Fetch fresh user from DB to ensure account still exists and is not deleted
    // decoded.id comes from the payload set during login (see auth route)
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

    // Attach full user object to request — accessible as req.user in all route handlers
    // Add role checks here if you need: if (user.role !== 'admin') return res.status(403)...
    req.user = user;

    next(); // Token valid, user found → continue to the actual route handler
  } catch {
    // Catches: expired token, bad signature, malformed token
    res.status(401).json({ message: 'Token invalide' }); // ← Edit error message here
  }
};