// ════════════════════════════════════════════════════════════════════════════
// models/SolutionExpress.js
// Modèle MongoDB pour les leads trouvés via Solution Express
// Courtier en sécurité — alarmes, caméras, systèmes B2B/B2C Québec
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// server/models/SolutionExpress.js
// ════════════════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

const SolutionExpressSchema = new mongoose.Schema({
  // ── Source ────────────────────────────────────────────────────────────────

  sourceText: { type: String, default: '' },
  sourceUrl:  { type: String, default: '' },
  // ── Entreprise ────────────────────────────────────────────────────────────

  entreprise: { type: String, default: '' },

  typeCommerce: {
    type: String,
    enum: [
      'restaurant','pizzeria','boulangerie','traiteur','cafe','bar_resto',
      'salon_coiffure','esthetique','spa','massotherapie','barbier',
      'garage_auto','carrosserie','esthetique_auto','lave_auto','pneus','concessionnaire',
      'clinique_dentaire','clinique_privee','pharmacie','optometrie','cabinet_infirmier',
      'boutique','epicerie','boucherie','librairie','quincaillerie',
      'bureau','cabinet_comptable','agence','assurance','immobilier',
      'garderie','ecole_privee','centre_formation',
      'gym','centre_sportif','studio_yoga',
      'entrepot','transport','manufacture','construction',
      'veterinaire','animalerie','autre'
    ],
    default: 'autre'
  },

  ancienneAdresse: { type: String, default: '' },

  typeClient: { type: String, enum: ['b2b','b2c'], default: 'b2b' },
  // ── Contact ───────────────────────────────────────────────────────────────

  prenom:    { type: String, default: '' },
  nom:       { type: String, default: '' },
  telephone: { type: String, default: '' },
  email:     { type: String, default: '' },
  sexe:      { type: String, enum: ['homme','femme','inconnu'], default: 'inconnu' },
  // ── Localisation ─────────────────────────────────────────────────────────

  adresse: { type: String, default: '' },
  ville:   { type: String, default: '' },
  region:  { type: String, default: '' },
  // ── Lead ─────────────────────────────────────────────────────────────────

  leadType: {
    type: String,
    enum: ['nouvelle_entreprise','demenagement','reouverture','commerce_existant','autre'],
    default: 'autre'
  },
  // ── Système ───────────────────────────────────────────────────────────────

  qualificationSysteme: {
    type: String,
    enum: [
      'pas_de_systeme','systeme_plus_10_ans',
      'systeme_non_connecte_nouveau_proprio','systeme_non_connecte_insatisfait',
      'systeme_non_connecte_diy','systeme_moins_5_ans_avec_contrat',
      'systeme_moins_5_ans_sans_contrat','systeme_5_10_ans_panneau_tactile',
      'systeme_5_10_ans_panneau_boutons','inconnu'
    ],
    default: 'inconnu'
  },
  // ── Produits ──────────────────────────────────────────────────────────────

  produits: [{ type: String, enum: ['alarme','cameras','internet','mobile','controle_acces','autre'] }],

  // ── FOURNISSEURS ACTUELS — 3 champs séparés ────────────────────────────────

  fournisseurAlarme: {
    type: String,
    enum: [
      'adt','bell_alarme','telus_alarme','gardaworld','api_alarm','securitas',
      'alarme_mirabel','alarme_signal_teck','allo_alarme',
      'protection_incendie_laval','multialarme','alarme_expert',
      'autre','inconnu','aucun'
    ],
    default: 'inconnu'
  },

  fournisseurInternet: {
    type: String,
    enum: ['videotron','bell_internet','cogeco','distributel','teksavvy','ebox','autre','inconnu','aucun'],
    default: 'inconnu'
  },

  fournisseurMobile: {
    type: String,
    enum: ['bell_mobile','telus_mobile','rogers','fizz','koodo','public_mobile','fido','chatr','virgin_plus','autre','inconnu','aucun'],
    default: 'inconnu'
  },

  // ── FOURNISSEURS PROPOSÉS — 3 champs séparés ──────────────────────────────

  fournisseurProposeAlarme: {
    type: String,
    enum: [
      'adt','bell_alarme','telus_alarme','gardaworld','api_alarm','securitas',
      'alarme_mirabel','alarme_signal_teck','allo_alarme','autre','aucun'
    ],
    default: 'aucun'
  },

  fournisseurProposeInternet: {
    type: String,
    enum: ['videotron','bell_internet','cogeco','distributel','teksavvy','ebox','autre','aucun'],
    default: 'aucun'
  },

  fournisseurProposeMobile: {
    type: String,
    enum: ['bell_mobile','telus_mobile','rogers','fizz','koodo','public_mobile','fido','chatr','virgin_plus','autre','aucun'],
    default: 'aucun'
  },
  // ── Statut & priorité ────────────────────────────────────────────────────

  status: {
    type: String,
    enum: ['new','contacted','interested','proposal','won','lost','ignored'],
    default: 'new'
  },

  urgencyScore: { type: Number, default: 0, min: 0, max: 10 },


    // ── Contenu ───────────────────────────────────────────────────────────────

  summary:      { type: String, default: '' },

  notes: [{ type: String }],






 // ════════════════════════════════════════════════════════════════════
  // COMMISSION — champs ajoutés
  // ════════════════════════════════════════════════════════════════════
  montantContrat:         { type: Number, default: 0 },
  commissionFixe:         { type: Number, default: 0 },
  commissionPourcentage:  { type: Number, default: 0 },
  commissionTotale:       { type: Number, default: 0 },
  commissionPayee:        { type: Boolean, default: false },
  dateVente:              { type: Date },
  datePaiementCommission: { type: Date },
  // ════════════════════════════════════════════════════════════════════





  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SolutionExpressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SolutionExpress', SolutionExpressSchema);