const mongoose = require('mongoose');

const GoogleMapSchema = new mongoose.Schema({
  // Données Google Maps
  placeId:      { type: String, default: '' },     // ID unique Google Maps
  nom:          { type: String, default: '' },      // nom du commerce
  categorie:    { type: String, default: '' },      // restaurant, pharmacie, etc.
  adresse:      { type: String, default: '' },
  ville:        { type: String, default: '' },
  region:       { type: String, default: '' },      // Montréal, Laval, etc.
  codePostal:   { type: String, default: '' },
  telephone:    { type: String, default: '' },
  email:        { type: String, default: '' },
  siteWeb:      { type: String, default: '' },
  rating:       { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // Coordonnées GPS
  lat:  { type: Number, default: 0 },
  lng:  { type: Number, default: 0 },

  // Keyword de recherche
  keyword:      { type: String, default: '' },      // mot-clé utilisé pour trouver

  // IA Claude
  aiMessage:    { type: String, default: '' },      // message personnalisé
  aiAnalysis:   { type: String, default: '' },      // pourquoi ce prospect est intéressant
  emailSent:    { type: Boolean, default: false },
  emailSentAt:  { type: Date },

  // Status
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'saved', 'ignored'],
    default: 'new'
  },

  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

GoogleMapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GoogleMap', GoogleMapSchema);
