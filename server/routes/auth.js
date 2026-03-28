const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const DEFAULT_AVATAR = "https://img.freepik.com/vecteurs-libre/illustration-garde-du-corps-dessinee-main_23-2150308174.jpg?semt=ais_hybrid&w=740&q=80";

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '5h' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, avatar } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'agent',
      avatar: (avatar && avatar.trim() !== '') ? avatar : DEFAULT_AVATAR
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Me
router.get('/me', auth, (req, res) => {
  const user = req.user.toJSON();
  if (!user.avatar || user.avatar === 'https://freepik.com' || !user.avatar.startsWith('https://img')) {
    user.avatar = DEFAULT_AVATAR;
  }
  res.json({ user });
});

module.exports = router;