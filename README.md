# CPN Compét Live 🏊

Application mobile Expo / React Native alignée sur les nouvelles routes compétition **v2** du backend CPN.

## Ce qui a été mis à jour

- passage de l’ancien endpoint `/api/compet` vers :
  - `/api/compet_v2/list`
  - `/api/compet_v2/programme`
  - `/api/compet_v2/resultats`
- sélection des compétitions directement depuis la liste configurée côté backend
- affichage **Programme** groupé par **Réunion → Athlète**
- affichage **Résultats** groupé par **Athlète** avec distinction **Séries / Finale**
- filtres Réunion / Nage / Type / Recherche
- auto-refresh live basé sur `next_refresh_sec` renvoyé par l’API

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

## Endpoints backend attendus

Le backend Flask doit exposer :

- `GET /api/compet_v2/list`
- `GET /api/compet_v2/programme?competition_id=<id>`
- `GET /api/compet_v2/resultats?competition_id=<id>`

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
