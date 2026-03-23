# CPN Live Mobile — Redesign v3

Application mobile React Native / Expo pour le suivi des compétitions et athlètes de CPN (Cergy Pontoise Natation).

## Installation

```bash
npm install
npx expo install react-native-webview
```

> `react-native-webview` est requis pour les graphiques Chart.js de la fiche athlète.
> Compatible Expo SDK 51 sans éjection.

## Lancer l'app

```bash
npx expo start
```

## Build production

```bash
eas build --platform android
eas build --platform ios
```

## Architecture

```
src/
  components/
    AthleteCharts.tsx     ← Graphiques Chart.js (evo, temps, fréquence)
    AthleteHub.tsx        ← Fiche athlète complète
    Atoms.tsx             ← Composants UI réutilisables
    BottomSheet.tsx       ← Modal filtre slide-from-bottom
    ChartWebView.tsx      ← Wrapper WebView + Chart.js
    EmptyState.tsx        ← État vide animé
    VuePodiums.tsx        ← Podium visuel animé
    VueProgramme.tsx      ← Programme avec accordéons
    VueResultats.tsx      ← Résultats par athlète
  hooks/
    useAthleteData.ts     ← Données athlète + classements FFN
    useCompetV2.ts        ← Compétitions + programme + résultats
    useTabAnimation.ts    ← Transition fade/slide entre onglets
  screens/
    HomeScreen.tsx        ← Écran principal
  utils/
    api.ts                ← fetchJson + buildApiUrl
    constants.ts          ← Couleurs, design tokens
    helpers.ts            ← Utilitaires (format, filtre, groupe)
    types.ts              ← Types TypeScript
```

## Données API utilisées

| Endpoint | Données |
|---|---|
| `/api/compet_v2/list` | Liste des compétitions |
| `/api/compet_v2/programme?competition_id=X` | Programme |
| `/api/compet_v2/resultats?competition_id=X` | Résultats |
| `/api/athletes` | Liste des athlètes |
| `/api/athlete?nom=X` | Fiche + `evo` + `evo_temps` + `freq` |
| `/api/athlete_ranking?nom=X&idbas=25` | Classements FFN |

## Graphiques (AthleteCharts)

Les 3 graphiques sont identiques à la version web et utilisent Chart.js 4.x via WebView :

1. **Évolution des points** — bar + line mixte (nb perfs + pts moyens + pts max)
2. **Suivi des temps** — line avec projection, sélecteur bassin 25m/50m, sélecteur épreuve, couleur par niveau compétition
3. **Fréquence d'activité** — bar simple, barre courante en accent teal
