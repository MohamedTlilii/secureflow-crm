const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── SECURITY ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://secureflow-crm.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// ── RATE LIMITING ─────────────────────────────────────────────────────────
// Auth — 50 tentatives max (login/register) par 15 minutes
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' }
}));

// Toutes les autres routes API — 1000 requêtes par 15 minutes
// (Pipeline fait 4 requêtes simultanées, les pages se rechargent souvent)
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
}));

// ── MONGODB ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ── ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/auth'));
app.use('/api/database',        require('./routes/database'));
app.use('/api/solution-express',require('./routes/Solutionexpress'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/essence', require('./routes/essence'));


// ── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));