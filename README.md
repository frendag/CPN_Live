# CPN Compét Live 🏊

Application mobile React Native (Expo) pour suivre les résultats en direct des compétitions de natation du club **Cergy Pontoise Natation**.

## Prérequis

- **Node.js** ≥ 18 — https://nodejs.org
- **Expo Go** sur ton téléphone — App Store / Google Play

---

## Installation

```bash
# 1. Installe les dépendances
npm install

# 2. Lance le serveur de développement
npx expo start
```

Un QR code s'affiche dans le terminal.

---

## Tester sur mobile (le plus simple)

1. Installe **Expo Go** sur ton iPhone ou Android
2. Lance `npx expo start`
3. **iPhone** : scanne le QR code avec l'appareil photo
4. **Android** : ouvre Expo Go → "Scan QR code"

L'app se charge directement, pas besoin de compiler.

---

## Tester sur navigateur web

```bash
npx expo start --web
```

Ouvre http://localhost:8081 dans Chrome.

---

## Configuration API

Dans `src/utils/constants.ts`, modifie l'URL de ton backend :

```ts
export const API_BASE = 'https://TON-DOMAINE.alwaysdata.net';
```

L'app appelle `/api/compet?competition=<ID>` sur ce domaine.

### CORS (obligatoire sur AlwaysData)

Dans ton `app.py` Flask, assure-toi d'avoir les headers CORS pour autoriser l'app mobile :

```python
@app.after_request
def add_cors(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response
```

---

## Build production

### Android (.apk / .aab)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### iOS (.ipa)
```bash
eas build --platform ios
```

### Web (PWA statique)
```bash
npx expo export --platform web
# → dossier dist/ à déployer sur ton hébergeur
```

---

## Structure du projet

```
cpn-compet-live/
├── app/
│   ├── _layout.tsx        # Expo Router layout racine
│   └── index.tsx          # Page principale
├── src/
│   ├── components/
│   │   ├── Atoms.tsx       # Avatar, MedalBadge, NagePill, TempsDisplay…
│   │   ├── VueAthletes.tsx # Vue par athlète
│   │   ├── VueEpreuves.tsx # Vue par épreuve (dépliable)
│   │   └── VuePodiums.tsx  # Vue podiums CPN
│   ├── hooks/
│   │   └── useCompet.ts    # Hook fetch + auto-refresh
│   ├── screens/
│   │   └── HomeScreen.tsx  # Écran principal
│   └── utils/
│       ├── constants.ts    # API_BASE, couleurs, palettes
│       ├── types.ts        # Types TypeScript
│       └── helpers.ts      # Fonctions utilitaires
├── app.json               # Config Expo (nom, icône, bundle ID…)
└── package.json
```

---

## Fonctionnalités

- **3 vues** : Par athlète · Par épreuve (dépliable) · Podiums CPN
- **Filtre** temps réel nom / épreuve
- **Auto-refresh** avec compte à rebours configurable
- **Badge LIVE** si résultats partiels
- **KPIs** : nb athlètes, perfs, podiums, en attente
- **Lien** direct vers liveffn.com
- Gestion DNS / DNF / ABD / DSQ
- Médailles 🥇🥈🥉 avec couleurs
- Avatars colorés par initiales
