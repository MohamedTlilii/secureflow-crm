const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEFAULT_AVATAR = "https://img.freepik.com/vecteurs-libre/illustration-garde-du-corps-dessinee-main_23-2150308174.jpg?semt=ais_hybrid&w=740&q=80";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'agent'], default: 'agent' },
  avatar: { 
    type: String, 
    default: DEFAULT_AVATAR,
    set: function(v) {
      // console.log("--- DEBUG SCHEMA (SETTER) ---");
      // console.log("Valeur reçue :", `"${v}"`);
      
      // On force l'image par défaut si :
      // 1. C'est vide ("")
      // 2. C'est juste le lien du site (https://freepik.com)
      // 3. Ça ne finit pas par une extension d'image (jpg, png, etc.)
      if (!v || v.trim() === "" || v === "https://freepik.com" || !v.includes('.')) {
        // console.log("👉 Valeur invalide : Correction avec l'image par défaut");
        return DEFAULT_AVATAR;
      }
      return v;
    }
  },
  createdAt: { type: Date, default: Date.now }
});

// Middleware avant sauvegarde
UserSchema.pre('save', async function(next) {
  // 🧪 TEST 2 : Vérifie l'objet juste avant l'écriture en base
  // console.log("--- DEBUG SCHEMA (PRE-SAVE) ---");
  // console.log("Avatar final avant MongoDB :", this.avatar);

  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
