

// const express = require('express');
// const router = express.Router();
// const GoogleAlert = require('../models/GoogleAlert');
// const auth = require('../middleware/auth');

// // GET all
// router.get('/', auth, async (req, res) => {
//   try {
//     const { status, alertType, region } = req.query;
//     let query = {};
//     if (status) query.status = status;
//     if (alertType) query.alertType = alertType;
//     if (region) query.region = region;
//     const alerts = await GoogleAlert.find(query).sort({ createdAt: -1 });
//     res.json(alerts);
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// // POST analyze with Groq (gratuit, sans limite stricte)
// router.post('/analyze-gemini', auth, async (req, res) => {
//   try {
//     const { alertText } = req.body;
//     if (!alertText) return res.status(400).json({ message: 'alertText requis' });

//     const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
//       },
//       body: JSON.stringify({
//         model: 'llama-3.3-70b-versatile',

//         temperature: 0.1,
//         max_tokens: 500,
//         messages: [{
//           role: 'user',
//           content: `Tu es un assistant CRM pour une entreprise de securite au Quebec. Analyse ce texte et retourne UNIQUEMENT un JSON sans markdown:
// {"entreprise":"","prenom":"","nom":"","telephone":"","adresse":"","ville":"Montreal","alertType":"incendie|vol|nouvelle_entreprise|ouverture|incident|autre","aiSummary":"resume en 2 phrases pourquoi opportunite","urgencyScore":5,"keyword":""}
// Texte: ${alertText}`
//         }]
//       })
//     });

//     const data = await response.json();
//     console.log('GROQ FULL:', JSON.stringify(data));
//     const text = data.choices?.[0]?.message?.content || '{}';

//     let analysis = {};
//     try {
//       analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
//     } catch {
//       return res.status(500).json({ message: 'Erreur parsing Groq' });
//     }

//     const alert = await GoogleAlert.create({
//       alertText,
//       ...analysis,
//       urgencyScore: Number(analysis.urgencyScore) || 0,
//       status: 'analyzed',
//       createdBy: req.user._id
//     });

//     res.status(201).json(alert);
//   } catch (err) {
//     console.error('Groq error:', err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // POST create manually
// router.post('/', auth, async (req, res) => {
//   try {
//     const alert = await GoogleAlert.create({ ...req.body, createdBy: req.user._id });
//     res.status(201).json(alert);
//   } catch (err) { res.status(400).json({ message: err.message }); }
// });

// // PUT update
// router.put('/:id', auth, async (req, res) => {
//   try {
//     const alert = await GoogleAlert.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!alert) return res.status(404).json({ message: 'Alerte introuvable' });
//     res.json(alert);
//   } catch (err) { res.status(400).json({ message: err.message }); }
// });

// // DELETE
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     await GoogleAlert.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Supprimé' });
//   } catch (err) { res.status(500).json({ message: err.message }); }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const GoogleAlert = require('../models/GoogleAlert');
const auth = require('../middleware/auth');

// ─── GET ALL ──────────────────────────────────────────
// Retourne toutes les alertes avec filtres optionnels
router.get('/', auth, async (req, res) => {
  try {
    const { status, alertType, region } = req.query;
    let query = {};
    if (status) query.status = status;
    if (alertType) query.alertType = alertType;
    if (region) query.region = region;
    const alerts = await GoogleAlert.find(query).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST ANALYZE WITH GROQ ───────────────────────────
// Reçoit texte et/ou URL → Groq analyse → sauvegarde MongoDB
router.post('/analyze-gemini', auth, async (req, res) => {
  try {
    const { alertText, sourceUrl } = req.body;

    // Erreur seulement si les DEUX sont vides
    if (!alertText && !sourceUrl) {
      return res.status(400).json({ message: 'alertText ou sourceUrl requis' });
    }

    // Si pas de texte → analyse via URL
    const textToAnalyze = alertText || `Analyse cet article : ${sourceUrl}`;

    // ─── APPEL GROQ AI ────────────────────────────────
    // Clé API dans .env → GEMINI_API_KEY
    // Modèle gratuit : llama-3.3-70b-versatile
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
    body: JSON.stringify({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.1,
  max_tokens: 800,
  messages: [{
    role: 'user',
   content: `Tu es un assistant CRM pour Alex Saad, courtier en securite au Quebec (alarmes incendie, cameras, systemes de securite).

MISSION: Detecter UNIQUEMENT les commerces B2B prives qui representent une opportunite de vente.

IMPORTANT: Retourne UN SEUL objet JSON, pas un array. Meme si plusieurs commerces sont detectes, retourne seulement le plus pertinent.

SIGNAUX A DETECTER (retourne exclure: false):

1. NOUVEAU COMMERCE — Premier ouverture d'un commerce prive:
Salon de coiffure, epicerie, boucherie, librairie, garage auto, esthetique auto, lave auto, mecanique, pneus, carrosserie, restaurant SANS alcool, pizzeria, boulangerie, traiteur, veterinaire, clinique dentaire, cabinet infirmier, massotherapie, boutique, bureau, entrepot, clinique privee, pharmacie, garderie, gym, spa, tout commerce B2B prive

2. DEMENAGEMENT — Commerce qui change d'adresse:
nouvelle adresse, nouveau local, on demenage, nouvel emplacement, on vous retrouve desormais au, transfert de local, relocalisation, nouveau siege

3. REOUVERTURE — Commerce qui rouvre:
apres fermeture, apres renovation, apres agrandissement, relance, retour, sous nouvelle direction, changement de proprietaire, apres pause, nouvelle saison

EXCLUSIONS AUTOMATIQUES (retourne exclure: true):
- Gouvernement, municipal, politique, elu, maire, depute
- OBNL, organisme sans but lucratif, association, fondation
- Alcool confirme: bar, taverne, brasserie, microbrasserie, SAQ, pub, club, boite de nuit
- Immobilier residentiel: maison, condo, appartement, logement
- Medias, journaux, blogues, emissions, podcasts
- Evenements culturels: salon, festival, exposition, conference, gala
- Evenements sportifs, equipes sportives, arenas
- Academique: ecole, universite, cegep, garderie gouvernementale
- Sante publique: hopital, CLSC, clinique gouvernementale

Si c'est clairement pas un commerce prive → retourne exclure: true

Si AUCUN signal detecte:
{"exclure": true, "raison": "raison courte en francais"}

Si signal detecte:
{"exclure": false, "entreprise":"","prenom":"","nom":"","telephone":"","adresse":"","ville":"",email:"","alertType":"ouverture","aiSummary":"POURQUOI ce commerce a besoin d un systeme de securite MAINTENANT — 2 phrases percutantes","urgencyScore":8,"keyword":""}

URGENCE:
- Nouveau commerce ou demenagement = urgencyScore 8-9
- Reouverture ou renovation = urgencyScore 5-6

Retourne UNIQUEMENT le JSON, sans markdown, sans explication.
Texte: ${textToAnalyze}`
  }]
})
    });

    const data = await response.json();
    console.log('GROQ FULL:', JSON.stringify(data)); // debug terminal backend

    const text = data.choices?.[0]?.message?.content || '{}';

    // Parse le JSON retourné par Groq
    let analysis = {};
    try {
      analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return res.status(500).json({ message: 'Erreur parsing Groq — réponse non-JSON' });
    }
if (analysis.exclure === true) {
  return res.status(200).json({
    exclure: true,
    raison: analysis.raison || 'Non pertinent',
    message: 'Alerte exclue'
  });
}
    // ─── VALIDATION alertType ─────────────────────────
    // Si Groq retourne une valeur invalide (ex: "nouvelle_entreprise|ouverture")
    // on force à 'autre' pour ne pas planter MongoDB
const validTypes = ['incendie', 'vol', 'nouvelle_entreprise', 'ouverture', 'demenagement', 'reouverture', 'incident', 'autre'];
    if (!validTypes.includes(analysis.alertType)) {
      console.log('alertType invalide reçu:', analysis.alertType, '→ forcé à "autre"');
      analysis.alertType = 'autre';
    }

    // ─── VALIDATION urgencyScore ──────────────────────
    // Force entre 0 et 10 pour respecter le modèle MongoDB
    const score = Number(analysis.urgencyScore) || 0;
    analysis.urgencyScore = Math.min(10, Math.max(0, score));

    // ─── SAUVEGARDE MONGODB ───────────────────────────
    const alert = await GoogleAlert.create({
      alertText: textToAnalyze,   // texte analysé ou URL
      sourceUrl: sourceUrl || '', // URL de l'article
      ...analysis,                // données extraites par Groq
      urgencyScore: analysis.urgencyScore,
      status: 'analyzed',         // statut auto après analyse
      createdBy: req.user._id     // utilisateur connecté
    });

    res.status(201).json(alert);
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST CREATE MANUALLY ─────────────────────────────
// Crée une alerte manuellement sans IA
router.post('/', auth, async (req, res) => {
  try {
    const alert = await GoogleAlert.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(alert);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─── PUT UPDATE ───────────────────────────────────────
// Modifie une alerte (statut, infos, notes...)
router.put('/:id', auth, async (req, res) => {
  try {
    const alert = await GoogleAlert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alerte introuvable' });
    res.json(alert);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─── DELETE ───────────────────────────────────────────
// Supprime une alerte définitivement
router.delete('/:id', auth, async (req, res) => {
  try {
    await GoogleAlert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;