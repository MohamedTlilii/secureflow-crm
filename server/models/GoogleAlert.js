const mongoose = require('mongoose');

const GoogleAlertSchema = new mongoose.Schema({
  alertText:    { type: String, required: true },
  keyword:      { type: String, default: '' },
  sourceUrl:    { type: String, default: '' },
  entreprise:   { type: String, default: '' },
  prenom:       { type: String, default: '' },
  nom:          { type: String, default: '' },
  telephone:    { type: String, default: '' },
  adresse:      { type: String, default: '' },
  ville:        { type: String, default: '' },
  region:       { type: String, default: '' },
  alertType: {
    type: String,
    enum: ['incendie', 'vol', 'nouvelle_entreprise', 'ouverture', 'incident', 'autre'],
    default: 'autre'
  },
  aiSummary:    { type: String, default: '' },
  urgencyScore: { type: Number, default: 0, min: 0, max: 10 },
  status: {
    type: String,
    enum: ['new', 'analyzed', 'contacted', 'saved', 'ignored'],
    default: 'new'
  },
  notes:        [{ type: String }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now }
});

GoogleAlertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('GoogleAlert', GoogleAlertSchema);