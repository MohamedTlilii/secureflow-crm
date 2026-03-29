const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security
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

// Rate limiting
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' }
}));
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ─── ROUTES ───────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/stats',        require('./routes/stats'));
app.use('/api/linkedin',     require('./routes/linkedin'));
app.use('/api/google-alerts',require('./routes/googleAlert'));
app.use('/api/google-maps',  require('./routes/googleMap'));
// ──────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
