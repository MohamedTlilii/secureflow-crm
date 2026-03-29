const axios = require('axios');

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';

const callClaude = async (prompt, maxTokens = 1000) => {
  const response = await axios.post(CLAUDE_API, {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    }
  });
  return response.data.content[0].text;
};

// Générer un message LinkedIn personnalisé
const generateLinkedInMessage = async (prospect) => {
  const prompt = `Tu es un expert en vente de systèmes de sécurité (alarme incendie, vol, urgence médicale) au Canada.

Prospect LinkedIn :
- Nom : ${prospect.prenom} ${prospect.nom}
- Poste : ${prospect.poste || 'inconnu'}
- Entreprise : ${prospect.entreprise || 'inconnue'}
- Ville : ${prospect.ville}
- Signal détecté : ${prospect.signalType}
- Contenu du post : ${prospect.postContent || 'aucun'}

Écris un message LinkedIn de 30 mots maximum :
- Naturel, pas commercial
- Fait référence au signal détecté
- Pose une seule question simple
- Pas de point d'exclamation
- En français canadien`;

  return callClaude(prompt, 300);
};

// Analyser une alerte Google et créer une fiche prospect
const analyzeGoogleAlert = async (alertText) => {
  const prompt = `Tu es un assistant qui analyse des alertes Google pour une entreprise qui vend des systèmes de sécurité (alarme incendie, vol, urgence médicale) au Canada (Montréal, Québec, Ottawa).

Texte de l'alerte Google :
"${alertText}"

Réponds UNIQUEMENT en JSON valide, sans markdown :
{
  "entreprise": "",
  "prenom": "",
  "nom": "",
  "adresse": "",
  "ville": "",
  "telephone": "",
  "email": "",
  "alertType": "incendie|vol|nouvelle_entreprise|ouverture|incident|autre",
  "urgencyScore": 0,
  "aiSummary": "résumé en 1 phrase",
  "aiMessage": "email personnalisé de 3 phrases pour vendre notre système de sécurité"
}`;

  const raw = await callClaude(prompt, 800);
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { aiSummary: raw, alertType: 'autre', urgencyScore: 0 };
  }
};

// Générer un message Google Maps
const generateMapMessage = async (place) => {
  const prompt = `Tu es un expert en vente de systèmes de sécurité au Canada.

Commerce trouvé sur Google Maps :
- Nom : ${place.nom}
- Catégorie : ${place.categorie}
- Adresse : ${place.adresse}, ${place.ville}
- Note Google : ${place.rating}/5 (${place.totalReviews} avis)

Écris un email court de 3 phrases pour proposer notre système de sécurité (alarme incendie/vol, centrale ULC certifiée, gestion depuis le cell).
Commence par une accroche liée à leur type de commerce.
En français canadien, ton professionnel mais direct.`;

  return callClaude(prompt, 400);
};

module.exports = { callClaude, generateLinkedInMessage, analyzeGoogleAlert, generateMapMessage };
