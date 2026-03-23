# CPN Compét Live 🏊

Application mobile Expo / React Native alignée sur les routes backend CPN.

## Ce qui est disponible

- onglet **Competition** branché sur :
  - `/api/compet_v2/list`
  - `/api/compet_v2/programme`
  - `/api/compet_v2/resultats`
- onglet **Athlète** branché sur :
  - `/api/athletes`
  - `/api/athlete?nom=...`
  - `/api/athlete_ranking?nom=...&idbas=25|50`
- affichage **Programme** groupé par **Réunion → Athlète**
- affichage **Résultats** groupé par **Athlète** avec distinction **Séries / Finale**
- fiche **Athlète** avec recherche, KPIs, saison, top performances et classements FFN
- filtres Réunion / Nage / Type / Recherche
- auto-refresh live basé sur `next_refresh_sec` renvoyé par l’API compétition

## Installation

```bash
npm install
npx expo start
```

## Configuration API

L’URL du backend est définie dans `src/utils/constants.ts` :

```ts
export const API_BASE = 'https://cpn-analytics.alwaysdata.net';
```

## Build

```bash
npm run android
npm run ios
npm run web
```

ou avec EAS :

```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```
