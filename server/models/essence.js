// models/Essence.js
const mongoose = require('mongoose');

const EssenceSchema = new mongoose.Schema({
  annee:          { type: Number, required: true },
  mois:           { type: Number, required: true, min: 0, max: 11 }, // 0=Jan ... 11=Dec
  joursOuvres:    { type: Number, required: true },
  montantParJour: { type: Number, default: 5 },
  montantAttendu: { type: Number, required: true },
  recu:           { type: Boolean, default: false },
  dateReception:  { type: Date, default: null },
  note:           { type: String, default: '' },
  createdAt:      { type: Date, default: Date.now },
}, { timestamps: true });

// Un seul doc par (annee, mois)
EssenceSchema.index({ annee: 1, mois: 1 }, { unique: true });

module.exports = mongoose.model('Essence', EssenceSchema);