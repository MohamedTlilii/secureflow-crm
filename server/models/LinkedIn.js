const mongoose = require('mongoose');

const LinkedInSchema = new mongoose.Schema({
  // Infos du prospect
  prenom:      { type: String, default: '' },
  nom:         { type: String, default: '' },
  email:       { type: String, default: '' },
  telephone:   { type: String, default: '' },
  poste:       { type: String, default: '' },      // ex: "Owner", "Gérant"
  entreprise:  { type: String, default: '' },
  adresse:     { type: String, default: '' },
  ville:       { type: String, default: '' },
  region:      { type: String, default: '' },      // Montréal, Laval, etc.

  // Source LinkedIn
  linkedinUrl:    { type: String, default: '' },
  linkedinPhoto:  { type: String, default: '' },
  postContent:    { type: String, default: '' },   // contenu du post détecté
  keyword:        { type: String, default: '' },   // mot-clé qui a déclenché
  hashtags:       [{ type: String }],              // hashtags trouvés

  // Signal détecté
  signalType: {
    type: String,
    enum: ['nouveau_poste', 'nouvelle_entreprise', 'post_securite', 'post_incendie', 'post_vol', 'ouverture', 'manuel'],
    default: 'manuel'
  },

  // IA Claude
  aiMessage:   { type: String, default: '' },      // message généré par Claude
  aiAnalysis:  { type: String, default: '' },      // analyse du profil par Claude
  emailSent:   { type: Boolean, default: false },
  emailSentAt: { type: Date },

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

LinkedInSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LinkedIn', LinkedInSchema);
