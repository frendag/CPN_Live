# Mode opératoire — intégration frontend + backend Training

Ce document décrit **chaque fichier ajouté ou modifié** dans le package, ainsi que l'ordre conseillé pour brancher le module dans ton environnement.

## 1. Préparation

1. Décompresser le package.
2. Pour le mobile :
   - `npm install`
   - `npx expo start`
3. Pour le backend PHP :
   - déposer le dossier `backend_php` sur le serveur
   - renseigner les variables d'environnement MySQL/MariaDB
   - exécuter `sql/training_perf.sql`

---

## 2. Fichiers modifiés

### `app/_layout.tsx`
**Action : modifié**

**Rôle :**
- enveloppe toute l'application avec `AppThemeProvider`
- rend les préférences de thème disponibles partout dans l'app

**À faire :**
- aucune adaptation supplémentaire si tu gardes cette structure Expo Router

---

### `app/index.tsx`
**Action : modifié**

**Rôle :**
- remplace l'écran d'entrée précédent par le nouvel écran d'accueil sombre `LandingScreen`

**À faire :**
- aucune adaptation

---

### `src/screens/HomeScreen.tsx`
**Action : modifié**

**Rôle :**
- accepte maintenant la prop `initialSection`
- permet de réutiliser le même écran existant pour séparer les routes KPI et Compétition

**À faire :**
- aucune adaptation si tu conserves `competition` et `athlete` comme sections métier

---

## 3. Fichiers ajoutés côté frontend

### `app/kpi.tsx`
**Action : ajouté**

**Rôle :**
- expose une route dédiée KPI
- ouvre `HomeScreen` avec `initialSection="athlete"`

---

### `app/competition.tsx`
**Action : ajouté**

**Rôle :**
- expose une route dédiée Compétition
- ouvre `HomeScreen` avec `initialSection="competition"`

---

### `app/training.tsx`
**Action : ajouté**

**Rôle :**
- expose la route mobile Training
- branche directement `TrainingScreen`

---

### `src/screens/LandingScreen.tsx`
**Action : ajouté**

**Rôle :**
- nouvel écran d'accueil sombre
- affiche 3 gros boutons ronds high-tech : KPI, Compétition, Trainning
- affiche un rappel visuel CPN
- permet aussi de régler le thème utilisateur

**À faire :**
- ajuster les textes marketing si besoin
- remplacer éventuellement `Trainning` par `Training` si tu veux corriger l'orthographe dans l'UI

---

### `src/screens/TrainingScreen.tsx`
**Action : ajouté**

**Rôle :**
- implémente le module complet d'enregistrement d'entraînement
- applique le workflow imbriqué :
  - Bassin
  - Nage
  - Distance
  - Départ
  - Athlète
- intègre :
  - chronomètre sportif
  - splits intermédiaires
  - résumé de session
  - enregistrement API

**À faire :**
- vérifier la route backend finale en production
- tester les temps intermédiaires sur appareil réel

---

### `src/hooks/useTrainingAthletes.ts`
**Action : ajouté**

**Rôle :**
- charge la liste des athlètes depuis `/api/athletes`
- normalise plusieurs formats de réponse backend

**À faire :**
- si ton endpoint renvoie une autre structure, ajuster le mapping localement dans ce fichier

---

### `src/utils/theme.tsx`
**Action : ajouté**

**Rôle :**
- gère le thème clair/sombre/système
- gère la couleur d'accent
- persiste les préférences dans AsyncStorage

**À faire :**
- aucune adaptation obligatoire

---

### `src/utils/training.ts`
**Action : ajouté**

**Rôle :**
- centralise les règles métier Training :
  - distances par nage
  - calcul des splits attendus
  - formatage des temps
  - appel API `saveTrainingPerf`

**À faire :**
- si l'URL backend diffère, ajuster l'appel `buildApiUrl('/api/training_perf')`

---

### `src/utils/trainingTypes.ts`
**Action : ajouté**

**Rôle :**
- centralise les types TypeScript du module Training

---

## 4. Fichiers ajoutés côté SQL

### `sql/training_perf.sql`
**Action : ajouté**

**Rôle :**
- crée la table `training_perf`
- ajoute les index utiles pour les futures analyses

**À faire :**
- exécuter ce script sur ta base MySQL/MariaDB

---

## 5. Fichiers ajoutés côté backend PHP

### `backend_php/config/database.php`
**Action : ajouté**

**Rôle :**
- crée la connexion PDO MySQL/MariaDB

**À faire :**
- renseigner les variables d'environnement :
  - `CPN_DB_HOST`
  - `CPN_DB_PORT`
  - `CPN_DB_NAME`
  - `CPN_DB_USER`
  - `CPN_DB_PASS`
  - `CPN_DB_CHARSET`

---

### `backend_php/config/bootstrap.php`
**Action : ajouté**

**Rôle :**
- initialise les headers JSON / CORS
- fournit les helpers communs
- valide les méthodes HTTP
- lit le corps JSON

---

### `backend_php/api/training_perf.php`
**Action : ajouté**

**Rôle :**
- route backend `POST /api/training_perf`
- valide toutes les règles métier principales
- enregistre la performance dans `training_perf`

**À faire :**
- vérifier que l'ID athlète correspond bien à ta table réelle
- si la table de référence n'est pas `athletes`, adapter le bloc de contrôle d'existence

---

### `backend_php/api/athletes.php`
**Action : ajouté**

**Rôle :**
- propose un endpoint `GET /api/athletes` compatible avec l'écran Training
- tente plusieurs mappings SQL usuels (`athletes`, `nageurs`, etc.)

**À faire :**
- si ta base a un schéma précis connu, simplifier cette route pour pointer directement dessus

---

### `backend_php/api/.htaccess`
**Action : ajouté**

**Rôle :**
- permet l'appel sans extension : `/api/training_perf` au lieu de `/api/training_perf.php`

**À faire :**
- vérifier que `mod_rewrite` est bien actif sur l'hébergement

---

### `backend_php/README_BACKEND.md`
**Action : ajouté**

**Rôle :**
- documentation rapide de déploiement backend

---

## 6. Ordre conseillé d'installation

### Étape A — Base de données
1. Exécuter `sql/training_perf.sql`
2. Vérifier que la table est bien créée

### Étape B — Backend
1. Copier `backend_php/config/*`
2. Copier `backend_php/api/*`
3. Configurer les variables d'environnement
4. Tester `GET /api/athletes`
5. Tester `POST /api/training_perf`

### Étape C — Frontend
1. Remplacer le package mobile par celui livré
2. Lancer `npm install`
3. Lancer `npx expo start`
4. Tester les 3 routes depuis l'accueil
5. Tester l'enregistrement réel d'une perf

---

## 7. Tests minimaux à faire

### Accueil
- ouverture de l'écran sombre
- navigation KPI
- navigation Compétition
- navigation Trainning
- changement de thème conservé après redémarrage

### Training
- sélection imbriquée complète
- chrono start / split / stop / reset
- cohérence des splits en bassin 25 et 50
- enregistrement API OK
- contrôle de l'horodatage `YYYY-MM-DD HH:MM:SS`

### Backend
- insertion correcte dans `training_perf`
- stockage JSON des splits
- erreur 422 si combinaison nage/distance invalide

---

## 8. Point d'attention

Le backend fourni est **générique et prêt à adapter**. Comme je n'ai pas le code serveur existant dans le zip, la partie PHP a été construite pour être facilement fusionnée avec ton backend actuel, mais il faudra peut-être ajuster :
- le nom exact de la table athlètes
- le mapping du nom/prénom
- la stratégie de configuration serveur
- l'URL publique finale si elle diffère
