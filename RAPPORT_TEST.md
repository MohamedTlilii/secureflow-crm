# RAPPORT DE TEST — SecureFlow CRM
**Date :** 2026-05-17  
**Testeur :** Mohamed Tlili  
**Version :** post-audit 2026-05-17

---

## PARTIE 1 — TESTS API AUTOMATIQUES (Backend + DB)

### Comment lancer le script

```bash
# 1. Démarrer le serveur (dans le dossier server/)
npm run dev

# 2. Dans un autre terminal, à la racine du projet
node test-api.js <ton-email> <ton-mot-de-passe>
# Exemple :
node test-api.js email@hotmail.ca MonMotDePasse
```


### Ce que le script teste automatiquement

| # | Section | Tests inclus |
|---|---------|-------------|
| 1 | Health Check | Serveur accessible, status=ok |
| 2 | Authentification | Login mauvais mdp → 401, Login correct → token, /me retourne user sans password |
| 3 | Settings | GET tous les champs, PUT objectifAnnuel par année, PUT motifsAnnulation, ajouter/retirer ville |
| 4 | Solution Express | GET liste, POST créer fiche, GET avec filtre, PUT changer statut, PUT statut invalide → 400 |
| 5 | Motif d'annulation | PUT installation_annulee + motif, motif persisté en DB, motif visible dans GET liste |
| 6 | Commissions | Distinction actives/annulées, toutes les fiches annulées ont le champ motifAnnulation |
| 7 | Toggle Paiement | PUT commissionPayee=true + date, PUT commissionPayee=false |
| 8 | Database Stats | storageMB, totalDocs, collections, storagePercent 0-100 |
| 9 | Notes | PUT notes sur une fiche, notes sauvegardées et lisibles |
| 10 | Nettoyage | DELETE fiche test, absente de la liste après suppression |
| 11 | Sécurité | GET sans token → 401, GET avec token invalide → 401 |

### Résultats du dernier run

```
Score    :  100%
Tests OK :  62
Tests KO :  0
Date run :  2026-05-17 04:04
```

🎉 Tous les tests passent. Backend 100% fonctionnel.

---

## PARTIE 2 — CHECKLIST MANUELLE (Interface utilisateur)

> Cocher chaque case après vérification dans le browser.  
> Lancer le serveur ET le client avant de commencer.

```bash
# Terminal 1 — serveur
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev

# Ouvrir : http://localhost:5173
```

---

### A. PAGE LOGIN

- [x] La page s'affiche correctement
- [ ] Login avec mauvais mot de passe → message d'erreur affiché
- [ ] Login correct → redirigé vers Dashboard
- [ ] Token sauvegardé (rafraîchir la page → toujours connecté)

---

### B. PAGE DASHBOARD

- [ ] Les 5 cartes stats s'affichent : **Total**, **Installés**, **Taux installation**, **En cours**, **Annulées**
- [ ] La carte "Annulées" est en rouge (#be123c)
- [ ] Le filtre **Année** en haut fonctionne (sélectionner 2025, 2026, etc.)
- [ ] L'année courante est sélectionnée par défaut
- [ ] La **barre de progression objectif** apparaît si un objectif est défini pour l'année sélectionnée
- [ ] Changer l'année → la barre change (ou disparaît si pas d'objectif)
- [ ] La section **Commissions** affiche les fiches de l'année sélectionnée
- [ ] Les fiches annulées apparaissent **en rouge** dans la liste commissions
- [ ] Le motif d'annulation est visible sous les badges de la fiche annulée
- [ ] Le badge "❌ Annulée" apparaît sur les fiches annulées

---

### C. PAGE PIPELINE (Kanban)

- [ ] Les 6 colonnes s'affichent : New, Contacté, Soumission, Installation en cours, Installé, Annulée
- [ ] Les fiches sont dans la bonne colonne selon leur statut en DB
- [ ] Drag & drop d'une fiche vers une autre colonne fonctionne
- [ ] Drag vers **"installation_annulee"** → le **modal de motif** s'ouvre (ne pas passer directement)
- [ ] Le modal affiche les motifs définis dans Paramètres
- [ ] Sélectionner un motif → fiche déplacée vers colonne Annulée avec le motif
- [ ] Fermer le modal sans choisir → fiche reste dans sa colonne d'origine
- [ ] Le motif est visible sur la carte dans la colonne Annulée

---

### D. PAGE SOLUTION EXPRESS

- [ ] La liste des fiches s'affiche
- [ ] Les filtres (ville, statut, type) fonctionnent
- [ ] **Filtres lus depuis Paramètres** : les villes ajoutées dans Paramètres apparaissent ici
- [ ] Créer une nouvelle fiche → formulaire s'ouvre, tous les champs dropdowns chargés depuis Settings
- [ ] Sauvegarder → fiche apparaît dans la liste
- [ ] Cliquer sur une fiche → grande fiche (modal) s'ouvre
- [ ] Changer le statut d'une fiche vers "installation_annulee" → **modal motif s'ouvre**
- [ ] Sélectionner motif → statut et motif sauvegardés
- [ ] **Petite carte** : le motif d'annulation est visible sous les badges (✕ Prix trop élevé)
- [ ] **Grande fiche** : "✕ Motif d'annulation : Prix trop élevé" visible en haut
- [ ] Modifier une fiche → changements sauvegardés en DB
- [ ] Supprimer une fiche → disparaît de la liste

---

### E. PAGE COMMISSIONS

- [ ] La liste des fiches s'affiche
- [ ] Le filtre **Année** fonctionne (par défaut année courante)
- [ ] **"Toutes les années"** affiche toutes les fiches
- [ ] Les fiches annulées sont **en rouge** (fond rosé, badge ❌ Annulée)
- [ ] Le motif d'annulation est visible sous les badges des fiches annulées
- [ ] Les fiches annulées **n'ont pas** le bouton "Marquer payé" (juste "❌ Annulée")
- [ ] La **barre de progression objectif** apparaît si objectif défini pour l'année
- [ ] L'objectif est calculé **sans** les fiches annulées
- [ ] Le graphique bar chart s'affiche avec les données de l'année
- [ ] Toggle paiement (✓ / $) fonctionne et persiste après rafraîchissement

---

### F. PAGE PARAMÈTRES

- [ ] Toutes les sections s'affichent : Villes, Type commerce, Type lead, Qualification système, Services, Motifs d'annulation, Objectif annuel

**Villes**
- [ ] Ajouter une ville → apparaît dans la liste
- [ ] Supprimer une ville → disparaît de la liste
- [ ] Aller sur Solution Express → la ville ajoutée est dans le filtre ville
- [ ] Aller sur Solution Express → la ville apparaît dans le dropdown "Ville" du formulaire d'ajout

**Motifs d'annulation**
- [ ] Ajouter un motif → apparaît dans la liste
- [ ] Supprimer un motif → disparaît
- [ ] Aller sur Pipeline → le nouveau motif apparaît dans le modal d'annulation
- [ ] Aller sur Solution Express → le nouveau motif apparaît dans le modal d'annulation

**Objectif annuel**
- [ ] Ajouter objectif 2025 = 3000 → apparaît dans la liste
- [ ] Ajouter objectif 2026 = 5000 → apparaît dans la liste
- [ ] Aller sur Dashboard, sélectionner 2025 → barre objectif affiche 3000
- [ ] Aller sur Dashboard, sélectionner 2026 → barre objectif affiche 5000
- [ ] Aller sur Commissions, sélectionner 2025 → barre objectif affiche 3000
- [ ] Supprimer un objectif → disparaît de la liste et la barre disparaît sur les pages

---

### G. PAGE DATABASE

- [ ] Les statistiques de stockage s'affichent (MB utilisé)
- [ ] Le nombre de fiches Solution Express est correct
- [ ] Le nombre d'utilisateurs est correct
- [ ] La barre de progression stockage est cohérente

---

### H. PAGE ESSENCE

- [ ] La page s'affiche sans erreur
- [ ] Les données s'affichent correctement

---

## RÉSUMÉ CHECKLIST MANUELLE

| Page | Cases totales | Cases cochées | % |
|------|--------------|---------------|---|
| Login | 4 | | |
| Dashboard | 10 | | |
| Pipeline | 8 | | |
| Solution Express | 11 | | |
| Commissions | 10 | | |
| Paramètres | 17 | | |
| Database | 4 | | |
| Essence | 2 | | |
| **TOTAL** | **66** | | |

---

## RÉSUMÉ GLOBAL

| Partie | Score |
|--------|-------|
| Tests API automatiques | ___/100% |
| Checklist manuelle | ___/66 cases |
| **Statut général** | ✅ OK / ⚠️ Partiel / ❌ KO |

**Notes / bugs trouvés :**

```
(vide)
```

---

*Rapport généré le 2026-05-17 — SecureFlow CRM*
