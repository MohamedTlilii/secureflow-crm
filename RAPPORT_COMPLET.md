# RAPPORT COMPLET — QC SecureFlow CRM
## Référence Technique Ultime · Architecture · Fonctions · Guide de Modification

> **Dernière mise à jour :** 2026-05-16
> **Auteur :** Mohamed Tlili
> **Stack :** React + Vite · Node.js/Express · MongoDB Atlas
> Ce document est la **référence absolue** du projet. Il explique chaque fichier, chaque fonction, chaque décision. Lisez-le avant toute modification.

---

## TABLE DES MATIÈRES

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Architecture globale & flux de données](#2-architecture-globale--flux-de-données)
3. [Variables d'environnement](#3-variables-denvironnement)
4. [Backend — fichier par fichier](#4-backend--fichier-par-fichier)
5. [Frontend — fichier par fichier](#5-frontend--fichier-par-fichier)
6. [Dictionnaire complet des fonctions](#6-dictionnaire-complet-des-fonctions)
7. [La règle absolue — les 6 statuts Pipeline](#7-la-règle-absolue--les-6-statuts-pipeline)
8. [Le système de commissions — logique complète](#8-le-système-de-commissions--logique-complète)
9. [L'indemnité carburant — logique complète](#9-lindemnité-carburant--logique-complète)
10. [Authentification — flux complet](#10-authentification--flux-complet)
11. [Design System — tokens & conventions](#11-design-system--tokens--conventions)
12. [Guide de modification — ajouter sans casser](#12-guide-de-modification--ajouter-sans-casser)
13. [Logique de durabilité & sécurité](#13-logique-de-durabilité--sécurité)
14. [Schéma MongoDB — toutes les collections](#14-schéma-mongodb--toutes-les-collections)
15. [Changelog — modifications 2026-05-13](#15-changelog--modifications-2026-05-13)

---

## 1. VUE D'ENSEMBLE DU SYSTÈME

**QC SecureFlow CRM** est une application de gestion commerciale pour un courtier en sécurité (alarmes, caméras, internet, mobile) au Québec. Elle est conçue pour **une seule personne** (Mohamed Tlili).

### Ce que fait chaque page

| Page | Route | Rôle |
|------|-------|------|
| Login | `/login` | Authentification JWT |
| Dashboard | `/` | Stats globales + commissions + pipeline analytics |
| Solution Express | `/solution-express` | CRUD fiches clients (base principale) |
| Pipeline | `/pipeline` | Vue Kanban des fiches par étape (drag & drop) |
| Commissions | `/commissions` | Suivi financier des commissions |
| Indemnité Carburant | `/essence` | Indemnité mensuelle 5 TND/jour |
| Base de données | `/database` | Tableau filtrable + stats MongoDB |

### Déploiement

| Composant | Service | URL |
|-----------|---------|-----|
| Frontend | Vercel (auto-deploy main) | `https://secureflow-crm.vercel.app` |
| Backend | Render (free tier) | `https://secureflow-crm.onrender.com` |
| Base de données | MongoDB Atlas (free 512 MB) | Cluster0 |

### Développement local

```bash
# Terminal 1 — Backend
cd server && node server.js          # → http://localhost:5000

# Terminal 2 — Frontend
cd client && npm run dev             # → http://localhost:5173
```

---

## 2. ARCHITECTURE GLOBALE & FLUX DE DONNÉES

### Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVIGATEUR (React)                       │
│                                                              │
│  ┌──────────┐    ┌──────────────────────────────────────┐   │
│  │AuthContext│    │           React Router               │   │
│  │(user,jwt) │    │  /  /pipeline /commissions           │   │
│  └────┬─────┘    │  /solution-express /essence /database │   │
│       │          └──────────────────────────────────────┘   │
│       │                          │                           │
│       │          ┌───────────────▼──────────────────────┐   │
│       │          │         api.js (Axios)                │   │
│       └─────────►│  baseURL = VITE_API_URL               │   │
│                  │  request interceptor → Bearer <token> │   │
│                  │  response interceptor → 401 → /login  │   │
│                  └───────────────┬──────────────────────┘   │
└──────────────────────────────────┼──────────────────────────┘
                                   │ HTTPS
┌──────────────────────────────────▼──────────────────────────┐
│                    SERVEUR (Express · Render)                 │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  helmet()   │  │  cors()      │  │  rateLimit()      │  │
│  │  Sécurité   │  │  Origines OK │  │  50/15min (auth)  │  │
│  │  HTTP       │  │              │  │  1000/15min (api) │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                              │
│  /api/auth             → routes/auth.js                     │
│  /api/solution-express → routes/Solutionexpress.js          │
│  /api/stats            → routes/stats.js                    │
│  /api/essence          → routes/essence.js                  │
│  /api/database         → routes/database.js                 │
│                                                              │
│  middleware/auth.js → vérifie JWT sur chaque route          │
└──────────────────────────────────┬──────────────────────────┘
                                   │ Mongoose ODM
┌──────────────────────────────────▼──────────────────────────┐
│                  MONGODB ATLAS (cluster0)                     │
│                                                              │
│  Collection: solutionexpress  → fiches clients              │
│  Collection: users            → comptes utilisateurs        │
│  Collection: essences         → indemnité carburant         │
└─────────────────────────────────────────────────────────────┘
```

### Flux d'une requête typique (exemple: charger le Dashboard)

```
1. Composant Dashboard monte
2. useEffect() → api.get('/api/stats?periode=tout')
                  api.get('/api/solution-express')
3. api.js interceptor REQUEST ajoute: Authorization: Bearer <sf_token>
4. Express reçoit → middleware auth.js vérifie JWT → next()
5. route stats.js exécute 10+ requêtes MongoDB en parallèle (Promise.all)
6. JSON retourné → useState() → composant re-rend avec données réelles
7. Si 401 → api.js interceptor RESPONSE → localStorage.removeItem → redirect /login
```

---

## 3. VARIABLES D'ENVIRONNEMENT

### Backend (`server/.env`)

| Variable | Valeur | Rôle |
|----------|--------|------|
| `MONGO_URI` | `mongodb+srv://...` | Connexion MongoDB Atlas |
| `JWT_SECRET` | chaîne secrète | Signature des tokens JWT |
| `PORT` | `5000` (défaut) | Port du serveur |
| `CLIENT_URL` | URL Vercel | CORS autorisé en production |

### Frontend (`client/.env`)

| Variable | Valeur | Rôle |
|----------|--------|------|
| `VITE_API_URL` | `https://secureflow-crm.onrender.com` | Base URL des appels API |

> **Règle :** Si `VITE_API_URL` n'est pas défini, `api.js` utilise `http://localhost:5000` comme fallback.

---

## 4. BACKEND — FICHIER PAR FICHIER

### `server/server.js` — Point d'entrée

**Rôle :** Configure et démarre le serveur Express. C'est le seul fichier qui monte tous les middlewares et toutes les routes.

**Ce qu'il fait ligne par ligne :**
- `helmet()` → Ajoute des en-têtes HTTP de sécurité (X-Content-Type-Options, X-Frame-Options, etc.)
- `cors()` → Autorise les requêtes depuis localhost:5173, localhost:5174, et Vercel
- `express.json()` → Parse le body JSON des requêtes POST/PUT
- `rateLimit` sur `/api/auth` → Max 50 requêtes par 15 minutes (protection brute force)
- `rateLimit` sur `/api/` → Max 1000 requêtes par 15 minutes (protection DDoS)
- `mongoose.connect()` → Connexion MongoDB via URI dans .env
- Montage des 5 routes

```javascript
// Ordre des middlewares — NE PAS CHANGER
1. helmet()                    // Sécurité headers
2. cors()                      // CORS avant tout le reste
3. express.json()              // Parse body
4. rateLimit (auth)            // Limiter /api/auth
5. rateLimit (global)          // Limiter tout /api/
6. Routes                      // Après tous les middlewares
```

---

### `server/middleware/auth.js` — Vérification JWT

**Rôle :** Middleware qui protège toutes les routes nécessitant une connexion. Il est passé en paramètre à chaque route (`router.get('/', auth, handler)`).

**Flux d'exécution :**
```
Requête entrante
    → Extrait token du header: "Authorization: Bearer <token>"
    → Si pas de token → 401 "Accès non autorisé"
    → jwt.verify(token, JWT_SECRET)
        → Si token invalide/expiré → 401 "Token invalide"
    → User.findById(decoded.id)
        → Si user supprimé entre-temps → 401 "Utilisateur introuvable"
    → req.user = user (disponible dans tous les handlers suivants)
    → next()
```

---

### `server/routes/auth.js` — Authentification

#### `POST /api/auth/register`
- **Entrée :** `{ name, email, password, role?, avatar? }`
- **Logique :** Vérifie si email existe → crée User → génère JWT 30j
- **Sortie :** `{ token, user }` (user sans password)

#### `POST /api/auth/login`
- **Entrée :** `{ email, password }`
- **Logique :** `User.findOne({ email })` → `user.comparePassword(password)` → génère JWT
- **Sortie :** `{ token, user }`
- **Sécurité :** Message d'erreur identique si email ou password faux.

#### `GET /api/auth/me` *(protégé)*
- **Entrée :** JWT dans header
- **Sortie :** objet user complet (sans password)

---

### `server/routes/Solutionexpress.js` — CRUD fiches clients

#### `GET /api/solution-express`
- **Entrée :** Query optionnels: `?status=&leadType=&ville=&region=`
- **Logique :** `SolutionExpress.find(query).sort({ createdAt: -1 })`
- **Sortie :** Tableau complet de toutes les fiches — **TOUS les champs retournés** (pas de `.select()`)
- **Usage :** Dashboard, Pipeline, Commissions, Database, SolutionExpress

#### `POST /api/solution-express`
- **Entrée :** Corps JSON avec les champs du modèle
- **Sortie :** La fiche créée avec son `_id` MongoDB

#### `PUT /api/solution-express/:id`
- **Entrée :** `:id` MongoDB + corps JSON
- **Sortie :** La fiche mise à jour
- **Usage multiple :** Statut (Pipeline), modification (SolutionExpress), toggle commission (Commissions)

#### `DELETE /api/solution-express/:id`
- **Sortie :** `{ message: 'Fiche supprimée' }` — suppression **définitive**, sans corbeille

---

### `server/routes/stats.js` — Statistiques Dashboard

**Route :** `GET /api/stats?periode=tout`

**10 requêtes MongoDB en parallèle via `Promise.all` :**
```javascript
Promise.all([
  SolutionExpress.countDocuments(),
  SolutionExpress.countDocuments({ status: 'new' }),
  SolutionExpress.countDocuments({ status: 'contacted' }),
  SolutionExpress.countDocuments({ status: 'proposal' }),
  SolutionExpress.countDocuments({ status: 'installation_en_cours' }),
  SolutionExpress.countDocuments({ status: 'installe' }),
  SolutionExpress.countDocuments({ status: 'installation_annulee' }),
  SolutionExpress.countDocuments({ urgencyScore: { $gte: 7 } }),
  SolutionExpress.countDocuments({ typeClient: 'b2b' }),
  SolutionExpress.countDocuments({ typeClient: 'b2c' }),
])
```

**Agrégations supplémentaires :**
- `$group` par ville → toutes les villes (plus de limite)
- `$unwind produits` + `$group` → tous les produits
- `$group qualificationSysteme` → toutes les qualifications (plus de limite)
- `$facet` sur fournisseurProposeAlarme/Internet/Mobile → top fournisseurs **proposés** (pas actuels)
- `$group leadType` → tous les types
- `.find().sort({ createdAt: -1 }).limit(6)` → 6 leads récents

**Commissions :**
```javascript
// CORRECT — utilise periodeComm (données filtrées par période) pour TOUS les calculs
const periodeComm = periode === 'tout' ? avecComm : avecComm.filter(...);
totalGagne = periodeComm.reduce(...)   // ← periodeComm, pas avecComm
totalPaye  = periodeComm.filter(...).reduce(...)
moyenne    = totalGagne / periodeComm.length
historique = periodeComm
```

> **Important :** Le Dashboard utilise DEUX sources :
> - `GET /api/stats?periode=tout` → commissions pré-calculées
> - `GET /api/solution-express` → filtrage par année côté frontend (tout le reste)

---

### `server/routes/essence.js` — Indemnité carburant

#### Helper `joursOuvres(annee, mois0)`
- **Entrée :** année (int), mois 0-based (0=Jan, 11=Déc)
- **Logique :** Itère chaque jour, compte Lun(1)→Ven(5) uniquement
- **Sortie :** Nombre entier de jours ouvrés

#### Helper `ensureYear(annee, tauxJour = 5)`
- **Rôle :** Garantit que tous les documents mois existent pour une année
- **Logique :** `bulkWrite` avec `upsert: true` + `$setOnInsert` → crée seulement si absent
- **Règle de `maxMois` :** `annee < now.getFullYear() ? 11 : now.getMonth()`
  - Année passée → 12 mois (0-11)
  - Année courante → jusqu'au mois actuel inclus (ex: Mai = index 4 → mois 0 à 4)

#### `GET /api/essence?annee=2026` → appelle `ensureYear()` + retourne docs triés
#### `GET /api/essence/annees` → tableau années disponibles
#### `GET /api/essence/stats?annee=2026` → `totalAttendu`, `totalRecu`, `totalManquant`, `pctRecu`
#### `PUT /api/essence/:id` → toggle `recu`, modifie `note`/`montantParJour`

**Logique spéciale Décembre :** Si décembre reçu ET tous les mois reçus → supprime l'année, crée année+1, retourne `{ nextAnnee }`.

---

### `server/routes/database.js` — Stats MongoDB

**Route :** `GET /api/database/stats`
- Compte documents dans `solutionexpress`, `users`, `essences`
- `dbStats` pour taille stockage en MB
- `storagePercent` sur 512 MB (limite free tier Atlas)

---

### `server/models/User.js`

- `pre('save')` : hash bcrypt cost 12 si password modifié
- `comparePassword(plain)` : `bcrypt.compare(plain, hash)`
- `toJSON()` : supprime `password` de tous les objets retournés

---

### `server/models/Solutionexpress.js` — Modèle fiche client

| Groupe | Champs clés |
|--------|-------------|
| Source | `sourceText`, `sourceUrl` |
| Entreprise | `entreprise`, `typeCommerce` (sans enum, via settings), `ancienneAdresse`, `typeClient` (`b2b`\|`b2c`) |
| Contact | `prenom`, `nom`, `telephone`, `email`, `sexe` |
| Localisation | `adresse`, `ville`, `region` |
| Lead | `leadType` (sans enum, via settings) |
| Système | `qualificationSysteme` (sans enum, via settings) |
| Produits | `produits[]` (sans enum — clés depuis settings.services) |
| Fournisseurs | `fournisseurs: Mixed` → `{ alarme: { actuel, propose }, internet: {...}, mobile: {...} }` |
| Équipements | `equipements: Mixed` → `{ alarme: ['panneau', ...], internet: [], ... }` |
| Pipeline | `status` (6 valeurs — **enum strict**), `urgencyScore` (0-10) |
| Contenu | `summary`, `notes[]` |
| Commission | `montantContrat`, `commissionFixe`, `commissionExtra`, `commissionPourcentage`, `commissionTotale`, `commissionPayee`, `dateVente`, `datePaiementCommission` |
| Meta | `createdBy` (ref User), `createdAt`, `updatedAt` |

---

## 5. FRONTEND — FICHIER PAR FICHIER

### `client/src/api.js` — Instance Axios globale

**Rôle :** Point d'accès unique pour TOUS les appels HTTP. Deux intercepteurs :

```javascript
// Intercepteur REQUEST — ajoute le token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur RESPONSE — gestion globale 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sf_token');
      window.location.href = '/login';   // Toutes les pages redirigent
    }
    return Promise.reject(err);
  }
);
```

> **RÈGLE ABSOLUE :** Toujours importer `api` depuis `'../api'`. Ne JAMAIS créer un `axios.create()` dans une page. Ne JAMAIS appeler `api.interceptors` dans une page.

---

### `client/src/context/AuthContext.jsx` — État global auth

**Fournit :** `user`, `loading`, `login`, `logout`

**Au démarrage :** lit `sf_token` → `GET /api/auth/me` → `setUser()` ou supprime token invalide

**`login(email, password)` :** POST → stocke token → `setUser()`

**`logout()` :** Supprime token → `setUser(null)` → redirect `/login`

---

### `client/src/App.jsx` — Routeur principal

**`ProtectedLayout` :** Vérifie `user` avant de rendre. Si `!user` → `<Navigate to="/login" />`.

```
/login             → Login
/                  → Dashboard
/commissions       → Commissions
/solution-express  → SolutionExpress
/pipeline          → Pipeline
/essence           → Essence
/database          → Database
*                  → Redirect vers /
```

---

### `client/src/components/Sidebar.jsx` — Navigation

- `< 768px` → Bottom navigation bar fixe (6 icônes)
- `≥ 768px` → Sidebar collapsible 70px ↔ 240px (onMouseEnter/Leave)
- Synchronise `--sidebar-w` CSS variable pour le `margin-left` du contenu

**NAV array :**
```javascript
{ to:'/',                 icon:LayoutDashboard, label:'Dashboard',           color:'#38bdf8' },
{ to:'/commissions',      icon:Wallet,          label:'Commissions',         color:'#10b981' },
{ to:'/solution-express', icon:Building2,       label:'Solution Express',    color:'#818cf8' },
{ to:'/pipeline',         icon:Kanban,          label:'Pipeline',            color:'#c084fc' },
{ to:'/essence',          icon:Fuel,            label:'Indemnité Carburant', color:'#fb923c' },
{ to:'/database',         icon:Database,        label:'Base de données',     color:'#f472b6' },
```

---

### `client/src/pages/Dashboard.jsx` — Tableau de bord

**Deux sources de données (useEffect + visibilitychange) :**
```javascript
api.get('/api/stats?periode=tout')    // → setStats()  [commissions]
api.get('/api/solution-express')      // → setSeFiches() [tout le reste]
```

**Filtre global `anneeGlobal` :** Recalcule TOUT côté frontend sur `seFiches` filtré. Évite des appels serveur.

**Champ B2B/B2C :** `fiches.filter(f => f.typeClient === 'b2b')` — champ `typeClient` (minuscules).

**4 stat cards (ordre fixe) :**
```
Total fiches   → totalSE   · sub: "${b2b} B2B · ${b2c} B2C"
Installés      → won       · sub: "Taux d'installation X%"
En cours       → seStatuts.installation_en_cours · sub: "X en cours"
Soumissions    → seStatuts.proposal · sub: "X fiches"
```

**3 ScoreRings :**
```
Installés   → color #22c55e  (vert)
En cours    → color #f97316  (orange)
Soumissions → color #a764f8  (violet)
```

**Top fournisseurs :** Utilise `fournisseurProposeAlarme/Internet/Mobile` (**proposés**, pas actuels).

**Pipeline bar chart :** Label `"En cours (N)"` avec nombre en blanc au-dessus de la barre (`label={{ position:'top', fill:'#ffffff' }}`).

**Limites d'affichage :** Aucune — `byQualif`, `byFourn`, `byCity` affichent tout sans `.slice()`.

**Composants internes :**
- `AnimatedNumber` : easing cubique `1 - (1-t)^3`
- `ScoreRing` : SVG anneau 90px animé
- `ProgressBar` : div horizontale

---

### `client/src/pages/Pipeline.jsx` — Kanban

**Comportement clic :** Cliquer sur une carte ne fait **rien** (modal supprimée intentionnellement).

**Drag & Drop :**
```
onDragStart → setDragging(id) + dataTransfer.setData
onDragOver  → setDragOver(stageKey)
onDragLeave → setDragOver(null)
onDrop      → updateStatus(item, targetStage)
onDragEnd   → reset dragging + dragOver
```

**`updateStatus(item, targetStage)` :**
1. Extrait `{ stage, source, displayName, ...cleanItem }` de l'item
2. `PUT /api/solution-express/:id` avec `{ ...cleanItem, status: newStatus }`
3. `fetchAll()` pour recharger

**`advance(item, e)` :** Avance au statut suivant dans STAGES. Désactivé sur `installe` et `installation_annulee`.

**4 stat cards header :**
```
Total fiches          → items.length · "${b2b} B2B · ${b2c} B2C"
Installés             → stage==='installe' · "Taux d'installation X%"
Installation en cours → stage==='installation_en_cours'
Soumissions           → stage==='proposal'
```
> **B2B/B2C :** `items.filter(i => i.typeClient === 'b2b')` — champ `typeClient` (minuscules).

**Card affiche :** displayName, prénom+nom (si différent), ville, produits (max 3), urgencyScore, commission (`💰 X $` si > 0).

**Imports actifs uniquement :** `ArrowRight, MapPin, Target` — les autres ont été supprimés.

**STAGES constants :**
```javascript
{ key:'new',                   label:'Nouveau',              color:'#3b6cf8' }
{ key:'contacted',             label:'Contacté',             color:'#f79009' }
{ key:'proposal',              label:'Soumission',           color:'#a764f8' }
{ key:'installation_en_cours', label:'Installation en cours',color:'#f97316' }
{ key:'installe',              label:'Installé',             color:'#22c55e' }
{ key:'installation_annulee',  label:'Installation annulée', color:'#be123c' }
```

---

### `client/src/pages/SolutionExpress.jsx` — CRUD fiches

**États principaux :**
- `fiches[]` : initialisé à `[]`, toujours un tableau (`Array.isArray` guard sur fetch)
- `form{}` : formulaire (EMPTY_FORM avec `ville:'Montréal'` par défaut)
- `selected` : fiche dans la modal de détail (lecture)
- `filters{}` : filtres actifs
- `fetchError` : booléen, affiche UI "Erreur de chargement + retry"

**`fetchFiches()` :**
```javascript
const data = Array.isArray(r.data) ? r.data : [];  // GUARD obligatoire
setFiches(data);
setFetchError(false);
return data;
```

**`EMPTY_FORM` :** `ville: 'Montréal'` (défaut), tous les autres champs à vide.

**VILLES :** 208 villes du Québec + Ottawa + Sherbrooke, triées alphabétiquement.

**Validation `handleSubmit` — 7 champs bloquants :**
```
prenom, nom, telephone, email, adresse, entreprise, dateVente
```
Les champs NON bloquants : ancienneAdresse, sourceUrl, commissionExtra, summary, sourceText.

**Filtres disponibles :** status, ville, typeClient (B2B/B2C), leadType, urgencyScore, annee.
**Filtres supprimés :** fournisseur alarme/internet/mobile, produit, qualification — trop granulaires pour le panel.

**Carte affiche `dateVente`** (pas `createdAt`).

**Commission dans carte détail :** Affiche montant + statut payée/attente. La date de paiement n'est **pas** affichée dans ce bloc.

**`togglePaiement(p)` :**
```javascript
const fresh = await fetchFiches();
if (fresh && selected?._id === p._id) {
  const freshFiche = fresh.find(x => x._id === p._id);
  if (freshFiche) setSelected(freshFiche);  // sync selected avec données fraîches
}
```

**Composants internes :** `DatePicker` (avec `safeVal = typeof value === 'string' ? value : ''`), `MiniScoreRing`, `FicheSection`, `InfoRow`, `ProduitBadge`, `AnimatedNumber`.

---

### `client/src/pages/Commissions.jsx` — Suivi financier

**Source :** `GET /api/solution-express` → filtre `commissionTotale > 0 || commissionFixe > 0`

**Filtres :** `annee` (dynamique selon données) + `filtre` (tout/payée/non payée)

**`togglePaiement(fiche)` :** `PUT` avec `{ commissionPayee: !fiche.commissionPayee, datePaiementCommission: ... }`

**Graphique :** `BarChart` Recharts par mois

**`CalendrierModerne` :** index `byDate{}` → `YYYY-MM-DD` → `{total, payee, attente, items[]}`

---

### `client/src/pages/Essence.jsx` — Indemnité carburant

**Fetch :** `GET /api/essence/annees` + `GET /api/essence?annee=X` + `GET /api/essence/stats?annee=X`

**`toggleRecu(doc)` :** PUT → si réponse contient `nextAnnee` → recharge années + change `annee` state

**Graphiques :** `vueMode='annee'` → BarChart | `vueMode='cumul'` → AreaChart

**Export CSV :** Blob + `a.click()`

---

### `client/src/pages/Database.jsx` — Tableau filtrable

**Source :** `GET /api/solution-express` + `GET /api/database/stats`

**Filtre :** par prenom, nom, email, telephone, entreprise (startsWith) + ville (exact)

**`handleDelete` :** `window.confirm()` → `DELETE /api/solution-express/:id`

---

### `client/src/index.css` — Design System global

**Variables CSS clés :**

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--bg-primary` | `#020810` | Fond de page |
| `--bg-secondary` | `#050d1f` | Inputs, selects |
| `--bg-card` | `#081224` | Cards, modals |
| `--accent` | `#3b82f6` | Bleu électrique |
| `--text-primary` | `#f0f4ff` | Texte principal |
| `--text-secondary` | `#8b9ab8` | *Non utilisé en inline styles — remplacé par `#ffffff`* |
| `--text-muted` | `#3d4f6b` | *Non utilisé en inline styles — remplacé par `#ffffff`* |
| `--sidebar-w` | `70px` | Largeur sidebar (mis à jour par JS) |

> **Convention texte :** Tous les textes dans les pages JSX utilisent `color:'#ffffff'` directement (pas `var(--text-muted)` ni `var(--text-secondary)`). Les classes CSS globales `.stat-label`, `.stat-value`, `.stat-sub` utilisent aussi `#ffffff`.

**Classes utilitaires :** `.btn`, `.btn-primary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`, `.input`, `.select`, `.badge`, `.card`, `.modal`, `.modal-overlay`, `.stat-card`, `.avatar`, `.empty-state`, `.skeleton`, `.glass`

---

## 6. DICTIONNAIRE COMPLET DES FONCTIONS

### Backend

| Fonction | Fichier | Entrée | Sortie |
|----------|---------|--------|--------|
| `joursOuvres(annee, mois0)` | `essence.js` | année int, mois 0-based | Nombre jours Lun-Ven |
| `ensureYear(annee, tauxJour)` | `essence.js` | année, taux (défaut 5) | void (bulkWrite upsert) |
| `signToken(id)` | `auth.js` | MongoDB ObjectId | JWT string 30j |

### Frontend — Composants internes

| Composant | Page(s) | Props | Rend |
|-----------|---------|-------|------|
| `AnimatedNumber` | Dashboard, Pipeline, Commissions, Essence | `value, decimals, suffix, color` | `<span>` comptage animé easing cubique |
| `ScoreRing` | Dashboard | `value, max, color, label, sublabel` | SVG anneau 90px |
| `MiniScoreRing` | SolutionExpress | `score, size` | SVG anneau 32px |
| `ProgressBar` | Dashboard | `value, max, color` | div barre horizontale |
| `CalendrierModerne` | Commissions | `commissions[], onSelectDate, selectedDate` | Calendrier mensuel interactif |
| `DatePicker` | SolutionExpress | `value, onChange, placeholder` | Input + dropdown calendrier custom |
| `FicheSection` | SolutionExpress | `title, children` | Bloc section avec titre uppercase |
| `InfoRow` | SolutionExpress | `icon, label, val` | Ligne ou `null` si val = 'inconnu'/'aucun'/vide |
| `ProduitBadge` | SolutionExpress | `code` | Badge coloré avec emoji |
| `NoteModal` | Essence | `mois, onSave, onClose` | Modal textarea pour note |

### Frontend — Hooks

| Hook | Fichier | Retourne |
|------|---------|----------|
| `useIsMobile()` | Tous (copié dans chaque page) | `boolean` (true si < 768px) |
| `useAuth()` | Via AuthContext | `{ user, loading, login, logout }` |

> `useIsMobile` est intentionnellement copié dans chaque page pour l'isolement — pas d'abstraction centralisée.

### Frontend — Fonctions de fetch (pattern commun)

```javascript
// Pattern fetchFiches (SolutionExpress) — référence
const fetchFiches = useCallback(async () => {
  try {
    const r = await api.get('/api/solution-express');
    const data = Array.isArray(r.data) ? r.data : [];  // GUARD
    setFiches(data);
    setFetchError(false);
    return data;                                         // RETOURNE pour usage dans togglePaiement
  } catch {
    toast.error('Erreur chargement');
    setFetchError(true);
  } finally {
    setLoading(false);
  }
}, []);
```

---

## 7. LA RÈGLE ABSOLUE — LES 6 STATUTS PIPELINE

```
new → contacted → proposal → installation_en_cours → installe
                                                   ↘ installation_annulee
```

| Statut | Label FR | Couleur | Terminal |
|--------|----------|---------|----------|
| `new` | Nouveau | `#3b6cf8` | Non |
| `contacted` | Contacté | `#f79009` | Non |
| `proposal` | Soumission | `#a764f8` | Non |
| `installation_en_cours` | Installation en cours | `#f97316` | Non |
| `installe` | Installé | `#22c55e` | **OUI** |
| `installation_annulee` | Installation annulée | `#be123c` | **OUI** |

**Statuts terminaux :** `installe` et `installation_annulee` n'ont PAS de bouton "Avancer" dans le Pipeline.

**INTERDIT :** Les anciens statuts `won`, `lost`, `ignored`, `interested` sont invalides. L'enum MongoDB les rejette.

---

## 8. LE SYSTÈME DE COMMISSIONS — LOGIQUE COMPLÈTE

### Champs dans la fiche

```javascript
commissionFixe         // Montant fixe (TND)
commissionExtra        // Bonus supplémentaire (TND)
commissionPourcentage  // % sur montantContrat (informatif, non utilisé dans calcul)
commissionTotale       // = commissionFixe + commissionExtra (calculé frontend)
commissionPayee        // Boolean
dateVente              // Date de la vente
datePaiementCommission // Date du paiement reçu
```

### Calcul de commissionTotale (frontend SolutionExpress)
```javascript
commissionTotale = (parseFloat(form.commissionFixe) || 0) + (parseFloat(form.commissionExtra) || 0)
```
Sauvegardé dans MongoDB via `PUT`.

### Flux de paiement
```
Cliquer "Marquer payée" dans Commissions.jsx
    → PUT /api/solution-express/:id
    → { commissionPayee: true, datePaiementCommission: new Date().toISOString() }
    → Rechargement
```

### Couleurs
- Vert `#12b76a` = payée
- Orange `#f79009` = en attente

### Affichage dans Pipeline
- Badge `💰 X $` affiché sur la carte si `commissionTotale > 0`

---

## 9. L'INDEMNITÉ CARBURANT — LOGIQUE COMPLÈTE

### Règles métier
- **Taux :** 5 TND par jour ouvré (Lun→Ven)
- **Début :** Janvier 2026
- **Calcul :** `joursOuvres(annee, mois) × 5 = montantAttendu`

### Flux Décembre → Nouvelle année
```
Décembre marqué reçu
    → Vérifier si TOUS les mois reçus
    → Si oui → deleteMany({ annee }) + ensureYear(annee + 1) → { nextAnnee }
    → Frontend: setAnnee(nextAnnee) + recharge
```

### Structure MongoDB
```
{ annee: 2026, mois: 0, joursOuvres: 21, montantParJour: 5, montantAttendu: 105, recu: false }
Index unique: (annee, mois)
```

---

## 10. AUTHENTIFICATION — FLUX COMPLET

### Login
```
form → login() → POST /api/auth/login → JWT 30j
→ localStorage.setItem('sf_token', token)
→ setUser(user) → navigate('/')
```

### Session persistante (rechargement)
```
App monte → localStorage.getItem('sf_token')
→ GET /api/auth/me → setUser(user) → loading=false
```

### Token expiré
```
Requête → Server → 401
→ api.js interceptor RESPONSE → localStorage.removeItem('sf_token')
→ window.location.href = '/login'   ← GLOBAL, toutes les pages
```

### Logout
```
Sidebar → logout() → localStorage.removeItem → setUser(null) → Navigate('/login')
```

---

## 11. DESIGN SYSTEM — TOKENS & CONVENTIONS

### Palette couleurs statuts

| Couleur | Code | Usage |
|---------|------|-------|
| Bleu | `#3b6cf8` | Nouveau, Total fiches |
| Vert | `#22c55e` | Installé, commissions payées |
| Orange foncé | `#f79009` | Contacté, commissions en attente |
| Violet | `#a764f8` | Soumission |
| Orange vif | `#f97316` | Installation en cours |
| Rose foncé | `#be123c` | Installation annulée |
| Vert clair | `#12b76a` | Commission badge, succès |

### Conventions de style

1. **Inline JSX styles** pour tout ce qui est dans les pages
2. **`color: '#ffffff'`** pour tous les textes — ne pas utiliser `var(--text-muted)` ni `var(--text-secondary)` dans les styles inline des pages
3. **`@keyframes` dans `<style>` tag** en bas du composant
4. **CSS classes** dans `index.css` pour les éléments globaux

### Responsive

- Breakpoint : **768px**
- `useIsMobile()` dans chaque page
- Mobile padding : `18px 14px 96px` (96px = bottom nav + safe area)

---

## 12. GUIDE DE MODIFICATION — AJOUTER SANS CASSER

### Ajouter une nouvelle page

```
1. Créer client/src/pages/NouvellePage.jsx
   - import api from '../api'
   - useIsMobile() hook copié
   - useEffect + api.get() + Array.isArray guard
   - color:'#ffffff' pour tous les textes
   - <style> tag en bas pour @keyframes

2. App.jsx :
   import NouvellePage from './pages/NouvellePage';
   <Route path="/nouvelle" element={<ProtectedLayout><NouvellePage/></ProtectedLayout>}/>

3. Sidebar.jsx — ajouter dans NAV :
   { to:'/nouvelle', icon:IconName, label:'Nouvelle Page', color:'#couleur' }
```

### Ajouter un champ à une fiche SolutionExpress

```
1. server/models/Solutionexpress.js → ajouter dans le schema
2. client/src/pages/SolutionExpress.jsx :
   - EMPTY_FORM : ajouter avec valeur défaut
   - Formulaire JSX : ajouter dans la section appropriée
   - Modal détail : ajouter si nécessaire
3. Pas de migration — MongoDB est schema-flexible
   (documents existants prennent la valeur défaut du schema)
```

### Ajouter un nouveau statut Pipeline

**ATTENTION — modification dans 4 fichiers :**
```
1. server/models/Solutionexpress.js → enum status[]
2. client/src/pages/Pipeline.jsx    → STAGES[]
3. client/src/pages/Dashboard.jsx  → STATUS_COLORS, STATUS_LABELS_FR, pipelineData
4. client/src/pages/SolutionExpress.jsx → STATUS_LABELS, STATUS_COLORS
   → Si terminal (pas de Avancer) → ajouter dans la condition Pipeline.jsx
```

### Modifier la durée du JWT

```
server/routes/auth.js → signToken : '30d' → '7d' ou '90d'
```

### Changer la couleur de tous les textes (design)

```
client/src/index.css → .stat-label, .stat-value, .stat-sub → color: X
Pour les textes inline dans les pages → chercher color:'#ffffff' et remplacer
```

### Modifier le taux carburant

```
Via l'interface Essence : bouton "Modifier taux" → PUT /api/essence/:id
OU dans Essence.js model : default: 5 → default: N (nouveaux documents seulement)
```

---

## 13. LOGIQUE DE DURABILITÉ & SÉCURITÉ

### Sécurité backend

| Mécanisme | Implémentation | Protège contre |
|-----------|---------------|----------------|
| Helmet | `helmet()` | XSS, clickjacking, MIME sniffing |
| CORS strict | Liste blanche d'origines | Requêtes cross-origin non autorisées |
| Rate limiting auth | 50/15min | Brute force login |
| Rate limiting global | 1000/15min | DDoS basique |
| JWT 30j | `jsonwebtoken` | Sessions volées |
| bcrypt cost 12 | Hash password | Rainbow tables |
| Enum MongoDB | Valeurs strictes | Données invalides rejetées en DB |
| Index unique Essence | `(annee, mois)` | Doublons impossibles |

### Sécurité frontend

| Mécanisme | Implémentation |
|-----------|---------------|
| Token localStorage | Jamais en cookie → pas de CSRF |
| Intercepteur 401 global | `api.js` response interceptor → redirect login automatique **sur toutes les pages** |
| `ProtectedLayout` | Bloque les routes sans token |
| `Array.isArray` guard | `fetchFiches()` et `fetchAll()` protègent contre réponses API inattendues |

### Gestion des erreurs — patterns

```javascript
// Backend (toutes les routes)
try { ... } catch (err) { res.status(500).json({ message: err.message }); }

// Frontend fetch
try {
  const data = Array.isArray(r.data) ? r.data : [];  // guard
  setState(data);
} catch { toast.error('Message') } finally { setLoading(false); }
```

### Performance

- `Promise.all()` dans stats.js → 10 requêtes MongoDB en parallèle
- `bulkWrite` dans `ensureYear()` → 1 opération pour 12 documents
- `useCallback` dans Pipeline/Commissions/Essence → stabilité des références
- Filtrage côté frontend Dashboard/SolutionExpress → pas d'allers-retours serveur sur les filtres
- `.select()` dans `recentProspects` → champs minimaux

### Durabilité

- **Pas de code mort** : tous les imports, fonctions et composants sont utilisés
- **Un seul Axios** (`api.js`) : cohérence totale
- **Enum MongoDB** : valeurs invalides rejetées
- **`periodeComm` uniforme** dans stats.js : totalGagne, totalPaye, moyenne, historique utilisent tous la même source filtrée

---

## 14. SCHÉMA MONGODB — TOUTES LES COLLECTIONS

### Collection `users`

```
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (bcrypt hash),
  role: "admin"|"agent",
  avatar: String,
  createdAt: Date
}
```

### Collection `solutionexpress`

```
{
  _id: ObjectId,
  sourceText: String, sourceUrl: String,
  entreprise: String,
  typeCommerce: String,       // pas d'enum — valeurs gérées par settings.typeCommerce
  ancienneAdresse: String, typeClient: "b2b"|"b2c",
  prenom: String, nom: String, telephone: String,
  email: String, sexe: "homme"|"femme"|"inconnu",
  adresse: String, ville: String, region: String,
  leadType: String,           // pas d'enum — valeurs gérées par settings.typeLead
  qualificationSysteme: String, // pas d'enum — valeurs gérées par settings.qualificationSysteme
  produits: [String],         // pas d'enum — valeurs gérées par settings.services[].key
  fournisseurs: Mixed,        // { alarme: { actuel: 'adt', propose: 'gardaworld' }, ... }
  equipements:  Mixed,        // { alarme: ['panneau', 'contact_porte'], ... }
  status: "new"|"contacted"|"proposal"|"installation_en_cours"|"installe"|"installation_annulee",
  urgencyScore: Number (0-10),
  summary: String, notes: [String],
  montantContrat: Number, commissionFixe: Number, commissionExtra: Number,
  commissionPourcentage: Number, commissionTotale: Number,
  commissionPayee: Boolean, dateVente: Date, datePaiementCommission: Date,
  createdBy: ObjectId (ref users),
  createdAt: Date, updatedAt: Date
}
```

> **Architecture dynamique :** `typeCommerce`, `leadType`, `qualificationSysteme` et les clés de `fournisseurs`/`produits` n'ont **pas d'enum MongoDB** — leurs valeurs valides sont stockées dans la collection `settings` et chargées dynamiquement par le frontend (`GET /api/settings`). Seul `status` et `typeClient` ont un enum strict en base.

### Collection `settings`

```
{
  _id: ObjectId,
  villes:               [{ key: String, label: String, region: String }],
  typeCommerce:         [{ key: String, label: String }],
  typeLead:             [{ key: String, label: String, color: String }],
  qualificationSysteme: [{ key: String, label: String }],
  services: [
    {
      key: String,          // "alarme", "internet", "mobile", ...
      label: String,        // "Alarme", "Internet", ...
      color: String,        // couleur du badge produit
      fournActuels: [{ key, label }],
      fournProposes: [{ key, label }],
      equipements: [{ key, label }]
    }
  ]
}
// Un seul document dans cette collection (findOne)
```

> **Fallback frontend :** Si `GET /api/settings` échoue, `SolutionExpress.jsx` utilise `DEFAULT_SERVICES` — un objet statique défini dans le fichier avec les mêmes FOURN_* maps compactés.

### Collection `essences`

```
{
  _id: ObjectId,
  annee: Number, mois: Number (0-11),
  joursOuvres: Number, montantParJour: Number (défaut 5),
  montantAttendu: Number, recu: Boolean,
  dateReception: Date, note: String,
  createdAt: Date, updatedAt: Date
}
// Index unique: { annee: 1, mois: 1 }
```

---

## 15. CHANGELOG — MODIFICATIONS 2026-05-13

### `client/src/api.js`
- **AJOUT** intercepteur response global 401 → `localStorage.removeItem + redirect /login`
  - Avant : seul Pipeline.jsx gérait le 401. Les autres pages restaient bloquées.
  - Maintenant : toutes les pages redirigent automatiquement à l'expiration du token.

### `server/routes/stats.js`
- **FIX** `totalGagne`, `totalPaye`, `moyenne`, `enAttente` utilisent maintenant `periodeComm` au lieu de `avecComm`
  - Avant : les totaux de commissions ignoraient le filtre de période → valeurs fausses sur périodes spécifiques.

### `client/src/pages/Dashboard.jsx`
- Stat cards réordonnées : Total fiches → Installés → Installation en cours → Soumissions
- ScoreRings : Installés (vert #22c55e), En cours (orange #f97316), Soumissions (violet #a764f8)
- Top fournisseurs → `fournisseurProposeX` (proposés, pas actuels) — titre "Top fournisseurs proposés"
- Pipeline bar chart : label `"En cours (N)"` + chiffres blancs au-dessus (`label={{ position:'top', fill:'#ffffff' }}`)
- Suppression des `.slice(0,6)` sur byQualif, byFourn et `.slice(0,8)` sur byCity
- Pluriel `fiche${totalSE > 1 ? 's' : ''}`
- Fallback date : `new Date(f.dateVente || f.createdAt || Date.now())`
- Tous les textes → `#ffffff`

### `client/src/pages/SolutionExpress.jsx`
- **FIX CRITIQUE** `setFiches(r.data)` → `setFiches(Array.isArray(r.data) ? r.data : [])`
- Carte affiche `dateVente` (pas `createdAt`)
- Commission détail : date de paiement supprimée de l'affichage
- Validation 7 champs : prenom, nom, telephone, email, adresse, entreprise, dateVente
- Filtres supprimés : fournisseur alarme/internet/mobile, produit, qualification
- VILLES : 208 villes Québec + Ottawa + Sherbrooke, défaut 'Montréal'
- `fetchError` state + UI retry
- `togglePaiement` : sync `selected` avec données fraîches après PUT
- `DatePicker` : `safeVal` guard contre valeurs non-string
- Tous les textes → `#ffffff`

### `client/src/pages/Pipeline.jsx`
- **SUPPRESSION** modal de détail (clic sur carte = aucune action)
- **FIX** B2B/B2C : `i.typeClient === 'b2b'` (était `i.leadType === 'B2B'`)
- Stat cards style Dashboard : Total fiches + B2B/B2C, Installés + taux, En cours, Soumissions
- Suppression "Kanban ·" du sous-titre
- Badge source → badge commission `💰 X $`
- Sous-ligne carte : prénom+nom (pas entreprise en double)
- Date header : `color:'#efefef'` + `textTransform:'capitalize'`
- Nettoyage code mort : imports `X, Phone, Mail, Building2, Calendar, Shield, TrendingUp, Zap` + `SOURCE_BADGE` + `stageInfo` + `srcBadge`
- Tous les textes → `#ffffff`

### `client/src/index.css`
- `.stat-label`, `.stat-value`, `.stat-sub` → `color: #ffffff`

---

---

## 16. CHANGELOG — MODIFICATIONS 2026-05-16

### Scan complet & nettoyage code mort — Ultra Focus

#### `client/src/pages/SolutionExpress.jsx`
- **SUPPRIMÉ** import `Video` (jamais utilisé)
- **SUPPRIMÉ** constantes mortes : `PRODUIT_LABELS`, `PRODUIT_COLORS`, `PRODUIT_ICONS`
- **SUPPRIMÉ** composant `ProduitBadge` défini mais jamais appelé dans le JSX
- **SUPPRIMÉ** fonction standalone `getFournLabel(field, val)` (doublon inutile — la version dynamique à l'intérieur du composant était utilisée)
- **SUPPRIMÉ** champs morts de `EMPTY_FORM` : `fournisseurAlarme`, `fournisseurInternet`, `fournisseurMobile`, `fournisseurProposeAlarme`, `fournisseurProposeInternet`, `fournisseurProposeMobile` (remplacés par `fournisseurs: {}`)
- **SUPPRIMÉ** champs morts de `EMPTY_FILTERS` : `fournisseurAlarme`, `fournisseurInternet`, `fournisseurMobile`
- **SUPPRIMÉ** logique de filtre morte (3 blocs `if (filters.fournisseurX && ...)`)
- **RESTAURÉ** `FOURN_*` maps comme constantes compactées sur une ligne avec commentaire — elles sont **requises** par `DEFAULT_SERVICES` (fallback statique si l'API settings est indisponible)

#### `client/src/pages/Dashboard.jsx`
- **SUPPRIMÉ** 3 variables calculées mais jamais affichées dans le JSX :
  - `urgent` = fiches avec urgencyScore ≥ 7
  - `enPipeline` = somme des statuts intermédiaires
  - `avgUrgence` = moyenne des scores d'urgence
- Conservé : `convRate` (utilisé dans les stat cards)

#### `client/src/pages/Commissions.jsx`
- **AJOUTÉ** `qualifLbl` useMemo (dynamique depuis `settings.qualificationSysteme`)
- **SUPPRIMÉ** `QUALIF_LBL` objet hardcodé dans l'IIFE du modal
- **Remplacé** par `{qualifLbl[f.qualificationSysteme] || f.qualificationSysteme}` dans la modal

#### Système de settings — architecture dynamique confirmée
- `typeCommerce`, `leadType`, `qualificationSysteme`, `produits`, `fournisseurs` → tous dynamiques depuis `GET /api/settings`
- Plus aucun label hardcodé dans les pages (hors DEFAULT_SERVICES qui est un fallback explicite)
- Pages 100% settings-driven : Dashboard, SolutionExpress, Pipeline, Commissions, Parametres

---

---

## 17. CHANGELOG — CORRECTIONS 2026-05-16 (Session audit complet)

> **22 problèmes corrigés** suite à un audit ligne par ligne de tous les fichiers.  
> Aucune fonctionnalité modifiée. Uniquement des corrections de bugs, risques et code mort.

---

### `client/src/pages/Dashboard.jsx` — 4 corrections

- **FIX** Parsing JSX cassé : suppression du `</div>` orphelin ligne 521 — la page ne compilait plus.
- **FIX** Filtre année : `new Date(f.dateVente||f.createdAt).getUTCFullYear()` → `||Date.now()` ajouté — les fiches sans date valide ne disparaissent plus du filtre.
- **NETTOYAGE** `useRef` supprimé de l'import (jamais utilisé dans le composant).
- **NETTOYAGE** Commentaire ligne 9 corrigé : `GET /api/stats` remplacé par `GET /api/solution-express + GET /api/settings` (l'endpoint `/api/stats` n'était pas monté).

---

### `client/src/pages/Pipeline.jsx` — 4 corrections

- **FIX** Refresh automatique : ajout d'un listener `visibilitychange` — Pipeline se rafraîchit dès que l'utilisateur revient sur l'onglet (avant : les changements de statut faits dans SolutionExpress n'étaient jamais visibles sans rechargement complet).
- **FIX** Filtre année : `||Date.now()` ajouté (même correction que Dashboard).
- **NETTOYAGE** `Promise.all([api.get(...)])` avec un seul élément simplifié en `await api.get(...)`.
- **NETTOYAGE** Variable `isSE` (toujours `true`) supprimée, condition simplifiée directement.

---

### `client/src/pages/Commissions.jsx` — 3 corrections

- **FIX** Graphique trompeur : quand filtre = "Toutes les années", les mois de 2024 et 2025 étaient additionnés dans la même barre "Jan". Corrigé : graphique **par année** si filtre = "tout", **par mois** si année précise sélectionnée.
- **FIX** `enAttente` pouvait être négatif (`-0.00 TND`) sur des valeurs décimales. Corrigé : `Math.max(0, totalGagne - totalPaye)`.
- **PERF** `annees` wrappé dans `useMemo([fiches])` — plus recalculé sur chaque render.

---

### `client/src/pages/SolutionExpress.jsx` — 8 corrections

- **FIX** Filtre année : `||Date.now()` ajouté dans `fichesByAnnee`.
- **FIX** Settings non rechargés au retour : ajout de `visibilitychange` sur le fetch settings — si l'utilisateur modifie Paramètres et revient, les dropdowns (ville, typeCommerce, services...) se rechargent automatiquement.
- **FIX** `addNote` et `deleteNote` envoyaient `{ ...p, notes }` (toute la fiche). Corrigé : envoi uniquement de `{ notes: updatedNotes }`.
- **FIX** `changeStatus` envoyait `{ ...p, status }` (toute la fiche). Corrigé : envoi uniquement de `{ status: newStatus }`.
- **FIX** `handleSubmit` : `fetchFiches()` sans `await` → `await fetchFiches()`.
- **FIX** `handleDelete` : `fetchFiches()` sans `await` → `await fetchFiches()`.
- **FIX** `addNote` : `fetchFiches()` sans `await` → `await fetchFiches()`.
- **FIX** `deleteNote` : `fetchFiches()` sans `await` → `await fetchFiches()`.
- **NETTOYAGE** `TYPE_COMMERCE_LABELS` (18 entrées avec de mauvaises clés) remplacé par `{}` — en cas d'échec de l'API settings, le dropdown est vide (honnête) au lieu d'afficher de faux labels.

---

### `client/src/pages/Database.jsx` — 1 correction

- **FIX** Filtre année : `||Date.now()` ajouté dans `fichesByAnnee`.

---

### `client/src/components/AnimatedNumber.jsx` — 1 correction

- **FIX** Fuite mémoire : le `requestAnimationFrame` continuait de tourner après le démontage du composant. Corrigé : ajout de `cancelAnimationFrame(rafId)` dans le cleanup du `useEffect`.

---

### `server/routes/Solutionexpress.js` — 1 correction

- **FIX** `findByIdAndUpdate` sans `runValidators: true` — les validations enum du schéma Mongoose étaient ignorées sur les mises à jour. Corrigé : `{ new: true, runValidators: true }`.

---

### `server/routes/settings.js` — 1 correction

- **SÉCURITÉ** Le `PUT /api/settings` acceptait n'importe quel champ dans le body. Corrigé : whitelist explicite — seuls les 5 champs légitimes sont acceptés (`villes`, `typeCommerce`, `typeLead`, `qualificationSysteme`, `services`).

---

### `server/routes/stats.js` — SUPPRIMÉ

- **SUPPRIMÉ** Fichier entier (132 lignes). Routes complètes jamais montées dans `server.js` (aucune ligne `app.use('/api/stats', ...)` n'existait). Aucun frontend n'appelait ces routes. Code mort total.

---

### État final après corrections

| Catégorie | État |
|---|---|
| Données réelles depuis DB | ✅ Toutes les pages |
| Propagation Paramètres vers dropdowns | ✅ Au retour sur l'onglet |
| Refresh automatique (visibilitychange) | ✅ Pipeline + SolutionExpress + Dashboard |
| Graphiques corrects (Commissions) | ✅ Par année / par mois selon filtre |
| Validation serveur sur PUT | ✅ runValidators actif |
| Sécurité settings PUT | ✅ Whitelist 5 champs |
| Race conditions fetch | ✅ Tous les fetchFiches() awaités |
| Code mort | ✅ Supprimé (stats.js + variables inutiles) |
| Fuite mémoire RAF | ✅ cancelAnimationFrame au démontage |
| Imports inutiles | ✅ Nettoyés (useRef Dashboard) |
| enAttente négatif | ✅ Math.max(0, ...) |
| Fiches disparaissant sur filtre année | ✅ Fallback Date.now() sur 4 fichiers |

---

*Ce rapport couvre l'intégralité du code source au 2026-05-16.*
*Toute modification majeure doit être reflétée ici.*
