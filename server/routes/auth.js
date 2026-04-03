// ════════════════════════════════════════════════════════════════════════════
// routes/auth.js
// Auth routes: /register, /login, /me
// All routes are prefixed with /api/auth (set in server.js)
// ════════════════════════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const auth    = require('../middleware/auth'); // JWT middleware — protects /me

// Fallback avatar — must match DEFAULT_AVATAR in models/User.js
const DEFAULT_AVATAR = "https://img.freepik.com/vecteurs-libre/illustration-garde-du-corps-dessinee-main_23-2150308174.jpg?semt=ais_hybrid&w=740&q=80";

// ── Token Generator ───────────────────────────────────────────────────────────
// Creates a signed JWT containing the user's MongoDB _id.
// '30d' = token expires in 30 days — change here to adjust session length
// JWT_SECRET must be defined in .env — same secret used in middleware/auth.js
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Creates a new user account. Returns token + user object.
// Password is hashed automatically by the pre-save hook in models/User.js
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    // Prevent duplicate accounts — email must be unique
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' }); // ← Edit message here

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'agent',  // Default role if not provided — change default here
      // Use provided avatar only if non-empty, otherwise fall back to default
      avatar: (avatar && avatar.trim() !== '') ? avatar : DEFAULT_AVATAR
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user }); // user.password stripped automatically by toJSON() in model
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Validates credentials and returns token + user object.
// comparePassword() is defined in models/User.js
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Single vague error message for both wrong email and wrong password
    // (avoids telling attackers which one is wrong — keep this intentionally vague)
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' }); // ← Edit message here

    const token = signToken(user._id);
    res.json({ token, user }); // user.password stripped automatically by toJSON() in model
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the currently logged-in user. Protected by auth middleware.
// Called by AuthContext on app startup to restore session from stored token.
router.get('/me', auth, (req, res) => {
  const user = req.user.toJSON(); // toJSON() strips password field (defined in model)

  // Extra avatar sanitization — catches any bad values that slipped past the model setter
  // Add more invalid patterns here if needed
  if (!user.avatar || user.avatar === 'https://freepik.com' || !user.avatar.startsWith('https://img')) {
    user.avatar = DEFAULT_AVATAR; // ← Change DEFAULT_AVATAR at the top to update fallback
  }

  res.json({ user });
});

module.exports = router;