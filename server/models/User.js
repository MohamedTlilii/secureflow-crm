// ════════════════════════════════════════════════════════════════════════════
// models/User.js
// Mongoose model for users. Handles password hashing, avatar validation,
// and safe JSON serialization (strips password from responses).
// ════════════════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Default avatar used when user provides no image or an invalid one
// Change this URL to update the fallback avatar across the entire app
const DEFAULT_AVATAR = "https://img.freepik.com/vecteurs-libre/illustration-garde-du-corps-dessinee-main_23-2150308174.jpg?semt=ais_hybrid&w=740&q=80";

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 }, // Stored as bcrypt hash — never plaintext
  
  // Role controls access level — add new roles to enum here if needed (e.g. 'manager')
  role: { type: String, enum: ['admin', 'agent'], default: 'agent' },

  avatar: {
    type: String,
    default: DEFAULT_AVATAR,

    // Setter runs every time avatar is assigned — sanitizes bad values before saving
    set: function(v) {
      // Falls back to DEFAULT_AVATAR if the value is:
      // 1. Empty string ""
      // 2. Just the bare domain "https://freepik.com" (no actual image path)
      // 3. Has no dot — meaning it's not a valid file URL (no extension like .jpg/.png)
      // Add more invalid patterns here if needed
      if (!v || v.trim() === "" || v === "https://freepik.com" || !v.includes('.')) {
        return DEFAULT_AVATAR;
      }
      return v; // Valid URL → keep as-is
    }
  },

  createdAt: { type: Date, default: Date.now } // Set automatically on creation — no need to pass it manually
});

// ── Pre-save Hook ─────────────────────────────────────────────────────────────
// Runs automatically before every .save() call.
// Only hashes password if it was actually changed (avoids double-hashing on update).
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Skip if password field wasn't touched

  try {
    const salt = await bcrypt.genSalt(12); // Cost factor 12 — increase for more security, decrease for speed
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass error to Express error handler
  }
});

// ── Instance Methods ──────────────────────────────────────────────────────────

// comparePassword — use this in the login route to validate entered password
// Usage: const isMatch = await user.comparePassword(req.body.password)
UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// toJSON — automatically called when user object is sent in res.json()
// Strips the password field so it's never exposed in API responses
// Add other sensitive fields to delete here if needed (e.g. delete obj.__v)
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);