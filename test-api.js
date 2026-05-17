// ═══════════════════════════════════════════════════════════════════
// test-api.js — Script de test API complet — SecureFlow CRM
//
// Usage :
//   node test-api.js <email> <motdepasse>
//
// Exemple :
//   node test-api.js solutionsexpress.tn@gmail.com MonMotDePasse
//
// Le serveur doit être lancé sur http://localhost:5000
// ═══════════════════════════════════════════════════════════════════

const BASE  = 'http://localhost:5000';
const EMAIL = process.argv[2];
const PASS  = process.argv[3];

if (!EMAIL || !PASS) {
  console.error('\n❌ Usage : node test-api.js <email> <motdepasse>\n');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────
let TOKEN = '';
let results = [];
let createdFicheId = null;

const api = async (method, path, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
};

const ok  = (label, cond, detail = '') => {
  const pass = !!cond;
  results.push({ label, pass, detail });
  console.log(`  ${pass ? '✅' : '❌'} ${label}${detail ? '  →  ' + detail : ''}`);
};

const section = (title) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
};

// ══════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════

async function testHealth() {
  section('1. HEALTH CHECK');
  const r = await api('GET', '/health');
  ok('Serveur accessible (200)', r.status === 200, `status=${r.status}`);
  ok('Champ status=ok',          r.data?.status === 'ok');
}

async function testAuth() {
  section('2. AUTHENTIFICATION');

  // Login avec mauvais mdp
  const bad = await api('POST', '/api/auth/login', { email: EMAIL, password: 'mauvais_mdp_xxx' });
  ok('Login mauvais mdp → 401', bad.status === 401);

  // Login correct
  const r = await api('POST', '/api/auth/login', { email: EMAIL, password: PASS });
  ok('Login correct → 200', r.status === 200, `status=${r.status}`);
  ok('Token reçu', !!r.data?.token);
  ok('User dans réponse', !!r.data?.user?.email);
  ok('Password absent de la réponse', !r.data?.user?.password);

  if (r.data?.token) TOKEN = r.data.token;

  // /me
  const me = await api('GET', '/api/auth/me');
  ok('/me → 200 avec token', me.status === 200);
  ok('/me retourne email correct', me.data?.user?.email === EMAIL.toLowerCase());
}

async function testSettings() {
  section('3. SETTINGS (Paramètres)');

  // GET
  const r = await api('GET', '/api/settings');
  ok('GET /api/settings → 200', r.status === 200);
  ok('Champ villes présent',              Array.isArray(r.data?.villes));
  ok('Champ typeCommerce présent',        Array.isArray(r.data?.typeCommerce));
  ok('Champ typeLead présent',            Array.isArray(r.data?.typeLead));
  ok('Champ qualificationSysteme présent',Array.isArray(r.data?.qualificationSysteme));
  ok('Champ motifsAnnulation présent',    Array.isArray(r.data?.motifsAnnulation));
  ok('Champ objectifAnnuel présent',      typeof r.data?.objectifAnnuel === 'object' && !Array.isArray(r.data.objectifAnnuel));
  ok('Champ services présent',            Array.isArray(r.data?.services));

  // PUT objectifAnnuel par année
  const objTest = { '2025': 3000, '2026': 5000 };
  const put = await api('PUT', '/api/settings', { objectifAnnuel: objTest });
  ok('PUT objectifAnnuel → ok', put.status === 200 && put.data?.ok === true);

  // Vérifier persistance objectifAnnuel
  const r2 = await api('GET', '/api/settings');
  ok('objectifAnnuel 2025 sauvegardé', r2.data?.objectifAnnuel?.['2025'] === 3000,
     `valeur=${r2.data?.objectifAnnuel?.['2025']}`);
  ok('objectifAnnuel 2026 sauvegardé', r2.data?.objectifAnnuel?.['2026'] === 5000);

  // PUT motifsAnnulation
  const motifs = ['Prix trop élevé','Délai trop long','Concurrent','Client non disponible','Autre'];
  const putM = await api('PUT', '/api/settings', { motifsAnnulation: motifs });
  ok('PUT motifsAnnulation → ok', putM.status === 200);

  // PUT villes — ajouter une ville test puis la retirer
  const villesOrig = r.data?.villes || [];
  const villesTest = [...villesOrig.filter(v => v !== 'VILLE_TEST_123'), 'VILLE_TEST_123'];
  await api('PUT', '/api/settings', { villes: villesTest });
  const r3 = await api('GET', '/api/settings');
  ok('Nouvelle ville sauvegardée', r3.data?.villes?.includes('VILLE_TEST_123'));

  // Retirer la ville test
  await api('PUT', '/api/settings', { villes: villesOrig });
  const r4 = await api('GET', '/api/settings');
  ok('Ville test supprimée', !r4.data?.villes?.includes('VILLE_TEST_123'));
}

async function testSolutionExpress() {
  section('4. SOLUTION EXPRESS (Fiches)');

  // GET liste
  const list = await api('GET', '/api/solution-express');
  ok('GET liste → 200', list.status === 200);
  ok('Réponse est un tableau', Array.isArray(list.data));

  // POST créer fiche test
  const fiche = {
    entreprise:   'Test Entreprise QA',
    prenom:       'Jean',
    nom:          'Dupont',
    telephone:    '514-000-0000',
    email:        'test@qa.com',
    ville:        'Montréal',
    status:       'new',
    leadType:     'nouvelle_entreprise',
    typeClient:   'b2b',
    montantContrat: 1200,
    commissionFixe: 150,
  };
  const post = await api('POST', '/api/solution-express', fiche);
  ok('POST créer fiche → 201', post.status === 201, `status=${post.status}`);
  ok('ID retourné',             !!post.data?._id);
  ok('entreprise sauvegardée',  post.data?.entreprise === fiche.entreprise);
  ok('status=new par défaut',   post.data?.status === 'new');

  createdFicheId = post.data?._id;

  // GET filtre par statut
  const filtered = await api('GET', '/api/solution-express?status=new');
  ok('GET filtre status=new → 200', filtered.status === 200);
  ok('Fiche créée dans les résultats', filtered.data?.some(f => f._id === createdFicheId));

  // PUT — changer statut contacted
  const upd1 = await api('PUT', `/api/solution-express/${createdFicheId}`, { status: 'contacted' });
  ok('PUT status→contacted → 200', upd1.status === 200);
  ok('Statut mis à jour',           upd1.data?.status === 'contacted');

  // PUT — statut invalide → 400
  const badStatus = await api('PUT', `/api/solution-express/${createdFicheId}`, { status: 'statut_inexistant' });
  ok('PUT statut invalide → 400', badStatus.status === 400);

  // PUT — changer statut proposal
  await api('PUT', `/api/solution-express/${createdFicheId}`, { status: 'proposal' });

  // PUT — changer statut installation_en_cours
  await api('PUT', `/api/solution-express/${createdFicheId}`, { status: 'installation_en_cours' });
}

async function testMotifAnnulation() {
  section('5. MOTIF D\'ANNULATION');

  if (!createdFicheId) { ok('Fiche test disponible', false, 'ID manquant'); return; }

  // PUT → annulée SANS motif
  const r1 = await api('PUT', `/api/solution-express/${createdFicheId}`, {
    status: 'installation_annulee',
    motifAnnulation: ''
  });
  ok('PUT installation_annulee → 200', r1.status === 200);
  ok('Statut = installation_annulee', r1.data?.status === 'installation_annulee');

  // PUT → avec motif
  const r2 = await api('PUT', `/api/solution-express/${createdFicheId}`, {
    motifAnnulation: 'Prix trop élevé'
  });
  ok('PUT motifAnnulation → 200', r2.status === 200);
  ok('Motif sauvegardé en DB', r2.data?.motifAnnulation === 'Prix trop élevé',
     `valeur="${r2.data?.motifAnnulation}"`);

  // GET → vérifier que le motif est bien retourné
  const list = await api('GET', '/api/solution-express');
  const found = list.data?.find(f => f._id === createdFicheId);
  ok('Motif lisible dans la liste GET', found?.motifAnnulation === 'Prix trop élevé',
     `valeur="${found?.motifAnnulation}"`);
}

async function testCommissions() {
  section('6. COMMISSIONS (lecture via solution-express)');

  const r = await api('GET', '/api/solution-express');
  ok('GET fiches pour commissions → 200', r.status === 200);

  const fiches = r.data || [];
  const annulees = fiches.filter(f => f.status === 'installation_annulee');
  const actives  = fiches.filter(f => f.status !== 'installation_annulee');

  ok('Distinction actives / annulées possible',
     typeof annulees.length === 'number' && typeof actives.length === 'number',
     `${actives.length} actives, ${annulees.length} annulées`);

  // Vérifier que les fiches annulées ont un champ motifAnnulation
  const annuleeSansChamp = annulees.filter(f => f.motifAnnulation === undefined);
  ok('Toutes les fiches annulées ont le champ motifAnnulation',
     annuleeSansChamp.length === 0,
     annuleeSansChamp.length > 0 ? `${annuleeSansChamp.length} fiches sans champ` : 'OK');
}

async function testTogglePaiement() {
  section('7. TOGGLE PAIEMENT COMMISSION');

  if (!createdFicheId) { ok('Fiche test disponible', false, 'ID manquant'); return; }

  // Marquer comme payée
  const r1 = await api('PUT', `/api/solution-express/${createdFicheId}`, {
    commissionPayee: true,
    datePaiementCommission: new Date().toISOString()
  });
  ok('PUT commissionPayee=true → 200', r1.status === 200);
  ok('commissionPayee sauvegardé',     r1.data?.commissionPayee === true);
  ok('datePaiementCommission sauvegardée', !!r1.data?.datePaiementCommission);

  // Démarquer
  const r2 = await api('PUT', `/api/solution-express/${createdFicheId}`, {
    commissionPayee: false,
    datePaiementCommission: null
  });
  ok('PUT commissionPayee=false → 200', r2.status === 200);
  ok('commissionPayee remis à false',  r2.data?.commissionPayee === false);
}

async function testDatabase() {
  section('8. DATABASE STATS');

  const r = await api('GET', '/api/database/stats');
  ok('GET /api/database/stats → 200', r.status === 200);
  ok('totalDocs présent',   typeof r.data?.totalDocs  === 'number');
  ok('storageMB présent',   typeof r.data?.storageMB  === 'number');
  ok('collections présent', typeof r.data?.collections === 'object');
  ok('storageMB ≥ 0',       r.data?.storageMB >= 0);
  ok('storagePercent 0-100',r.data?.storagePercent >= 0 && r.data?.storagePercent <= 100);
}

async function testNotes() {
  section('9. NOTES SUR UNE FICHE');

  if (!createdFicheId) { ok('Fiche test disponible', false, 'ID manquant'); return; }

  const r1 = await api('PUT', `/api/solution-express/${createdFicheId}`, {
    notes: ['Note de test QA', 'Deuxième note']
  });
  ok('PUT notes → 200', r1.status === 200);
  ok('Notes sauvegardées', Array.isArray(r1.data?.notes) && r1.data.notes.length === 2,
     `count=${r1.data?.notes?.length}`);
  ok('Contenu note correct', r1.data?.notes?.[0] === 'Note de test QA');
}

async function testCleanup() {
  section('10. NETTOYAGE (suppression fiche test)');

  if (!createdFicheId) { ok('Fiche test disponible', false, 'ID manquant'); return; }

  const r = await api('DELETE', `/api/solution-express/${createdFicheId}`);
  ok('DELETE fiche → 200', r.status === 200);

  // Vérifier que la fiche n'existe plus
  const list = await api('GET', '/api/solution-express');
  const found = list.data?.find(f => f._id === createdFicheId);
  ok('Fiche absente de la liste après suppression', !found);

  createdFicheId = null;
}

async function testSecurity() {
  section('11. SÉCURITÉ (accès sans token)');

  const savedToken = TOKEN;
  TOKEN = '';

  const r1 = await api('GET', '/api/solution-express');
  ok('GET fiches sans token → 401', r1.status === 401);

  const r2 = await api('GET', '/api/settings');
  ok('GET settings sans token → 401', r2.status === 401);

  const r3 = await api('GET', '/api/database/stats');
  ok('GET database/stats sans token → 401', r3.status === 401);

  TOKEN = savedToken;

  // Token invalide
  const oldToken = TOKEN;
  TOKEN = 'token.invalide.xxx';
  const r4 = await api('GET', '/api/solution-express');
  ok('GET avec token invalide → 401', r4.status === 401);
  TOKEN = oldToken;
}

// ══════════════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ══════════════════════════════════════════════════════════════════════

function printReport() {
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total  = results.length;
  const pct    = Math.round((passed / total) * 100);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RAPPORT FINAL`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Total   : ${total} tests`);
  console.log(`  ✅ OK    : ${passed}`);
  console.log(`  ❌ FAIL  : ${failed}`);
  console.log(`  Score   : ${pct}%`);

  if (failed > 0) {
    console.log(`\n  Tests échoués :`);
    results.filter(r => !r.pass).forEach(r => {
      console.log(`    ❌ ${r.label}${r.detail ? '  →  ' + r.detail : ''}`);
    });
  }

  console.log(`${'═'.repeat(60)}\n`);

  if (pct === 100) {
    console.log('  🎉 Tous les tests passent. Backend 100% fonctionnel.\n');
  } else if (pct >= 80) {
    console.log('  ⚠️  Quelques tests échoués. Voir la liste ci-dessus.\n');
  } else {
    console.log('  🚨 Trop de tests échoués. Vérifier que le serveur est lancé.\n');
  }
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  SecureFlow CRM — Test API complet');
  console.log(`  Serveur : ${BASE}`);
  console.log(`  Email   : ${EMAIL}`);
  console.log(`  Date    : ${new Date().toLocaleString('fr-CA')}`);
  console.log(`${'═'.repeat(60)}`);

  try {
    await testHealth();
    await testAuth();
    await testSettings();
    await testSolutionExpress();
    await testMotifAnnulation();
    await testCommissions();
    await testTogglePaiement();
    await testDatabase();
    await testNotes();
    await testCleanup();
    await testSecurity();
  } catch (err) {
    console.error('\n🚨 Erreur inattendue :', err.message);
    console.error('   Vérifiez que le serveur est lancé sur', BASE);
  }

  printReport();
}

main();
