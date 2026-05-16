const mongoose = require('mongoose');

const SolutionExpressSchema = new mongoose.Schema({
  sourceText: { type: String, default: '' },
  sourceUrl:  { type: String, default: '' },

  entreprise:      { type: String, default: '' },
  typeCommerce:    { type: String, default: 'autre' },   // plus d'enum — géré dans settings
  ancienneAdresse: { type: String, default: '' },
  typeClient:      { type: String, enum: ['b2b','b2c'], default: 'b2b' },

  prenom:    { type: String, default: '' },
  nom:       { type: String, default: '' },
  telephone: { type: String, default: '' },
  email:     { type: String, default: '' },
  sexe:      { type: String, enum: ['homme','femme','inconnu'], default: 'inconnu' },

  adresse: { type: String, default: '' },
  ville:   { type: String, default: '' },
  region:  { type: String, default: '' },

  leadType:             { type: String, default: 'autre' },      // plus d'enum
  qualificationSysteme: { type: String, default: 'inconnu' },   // plus d'enum
  produits:             [{ type: String }],                      // plus d'enum

  // ── Fournisseurs et équipements ──────────────────────────────────────────
  // { alarme: { actuel:'adt', propose:'gardaworld' }, tv: { actuel:'videotron', propose:'aucun' } }
  fournisseurs: { type: mongoose.Schema.Types.Mixed, default: {} },
  // { alarme: ['panneau', 'contact_porte'], internet: [] }
  equipements:  { type: mongoose.Schema.Types.Mixed, default: {} },

  status:       { type: String, enum: ['new','contacted','proposal','installation_en_cours','installe','installation_annulee'], default: 'new' },
  urgencyScore: { type: Number, default: 0, min: 0, max: 10 },
  summary:      { type: String, default: '' },
  notes:        [{ type: String }],

  montantContrat:         { type: Number, default: 0 },
  commissionFixe:         { type: Number, default: 0 },
  commissionExtra:        { type: Number, default: 0 },
  commissionPourcentage:  { type: Number, default: 0 },
  commissionTotale:       { type: Number, default: 0 },
  commissionPayee:        { type: Boolean, default: false },
  dateVente:              { type: Date },
  datePaiementCommission: { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SolutionExpressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SolutionExpress', SolutionExpressSchema);
