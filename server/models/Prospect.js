const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text: String,
  author: String,
  date: { type: Date, default: Date.now }
});

const ProspectSchema = new mongoose.Schema({
  prenom: { type: String, required: true },
  nom: { type: String, required: true },
  entreprise: { type: String, default: '' },
  type: { type: String, enum: ['B2B', 'B2C'], default: 'B2B' },
  ville: { type: String, required: true },
  region: { type: String, default: 'Montreal' },
  telephone: { type: String, default: '' },
  email: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  priorite: { type: String, enum: ['P0', 'P1', 'P2', 'P3'], default: 'P1' },
  stage: {
    type: String,
    enum: ['01_Inbox', '02_Qualifying', '03_Proposal', '04_Closed', '99_Dead'],
    default: '01_Inbox'
  },
  signal: {
    type: String,
    enum: ['ouverture', 'recrutement', 'nouveau-poste', 'expansion', 'commentaire', 'incident', 'manuel'],
    default: 'manuel'
  },
  produitInteresse: [{ type: String }],
  valeurEstimee: { type: Number, default: 0 },
  notes: [NoteSchema],
  messageSent: { type: Boolean, default: false },
  rdvDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProspectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Prospect', ProspectSchema);
