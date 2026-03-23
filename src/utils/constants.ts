export const API_BASE = 'https://cpn-analytics.alwaysdata.net';

export const COLORS = {
  primary: '#071829',
  primaryDark: '#040f18',
  primaryMid: '#0c2540',
  primarySoft: '#112e50',
  primaryLight: '#1d6fa4',
  accent: '#00c9a7',
  accentDim: 'rgba(0,201,167,0.15)',
  accentGlow: 'rgba(0,201,167,0.35)',
  card: '#0d2035',
  cardHover: '#102540',
  cardBorder: '#1a3454',
  bg: '#060e18',
  surface: '#091a2c',
  surfaceHigh: '#0f2438',
  text: '#e8f0f8',
  textMid: '#a8c2d8',
  muted: '#6a8ba5',
  subtle: '#3d5f7a',
  border: '#1a3454',
  borderLight: '#243e5c',
  borderMid: '#1f3a56',
  success: '#00c9a7',
  successBg: 'rgba(0,201,167,0.12)',
  successBorder: 'rgba(0,201,167,0.3)',
  danger: '#ff6b6b',
  dangerBg: 'rgba(255,107,107,0.1)',
  dangerBorder: 'rgba(255,107,107,0.3)',
  warning: '#ffd166',
  warningBg: 'rgba(255,209,102,0.1)',
  warningBorder: 'rgba(255,209,102,0.3)',
  neutralBg: '#0d2035',
  live: '#ff6b6b',
  liveBg: 'rgba(255,107,107,0.15)',
  reunionHeader: '#071829',
  reunionMoment: '#ffd166',
  serieBg: 'rgba(29,111,164,0.2)',
  serieText: '#5ab4e8',
  finaleBg: 'rgba(255,209,102,0.15)',
  finaleText: '#ffd166',
  demiBg: 'rgba(163,94,234,0.15)',
  demiText: '#c084fc',
  rank1Bg: 'rgba(255,209,102,0.2)',
  rank1Text: '#ffd166',
  rank2Bg: 'rgba(168,194,216,0.2)',
  rank2Text: '#a8c2d8',
  rank3Bg: 'rgba(205,128,80,0.2)',
  rank3Text: '#cd8050',
  rankTopBg: 'rgba(0,201,167,0.15)',
  rankTopText: '#00c9a7',
  rankOtherBg: 'rgba(26,52,84,0.5)',
  rankOtherText: '#6a8ba5',
  NL:  { bg: 'rgba(29,111,164,0.25)',  text: '#5ab4e8', border: 'rgba(90,180,232,0.4)' },
  Dos: { bg: 'rgba(0,201,167,0.18)',   text: '#00c9a7', border: 'rgba(0,201,167,0.4)' },
  Bra: { bg: 'rgba(52,199,120,0.18)',  text: '#34c778', border: 'rgba(52,199,120,0.4)' },
  Pap: { bg: 'rgba(163,94,234,0.18)',  text: '#a35eea', border: 'rgba(163,94,234,0.4)' },
  '4N':{ bg: 'rgba(255,167,72,0.18)',  text: '#ffa748', border: 'rgba(255,167,72,0.4)' },
  def: { bg: 'rgba(26,52,84,0.5)',     text: '#6a8ba5', border: 'rgba(61,95,122,0.4)' },
};

export const GRADIENTS = {
  header:  ['#040f18', '#071829', '#0c2540'] as const,
  card:    ['#0d2035', '#091a2c'] as const,
  accent:  ['#00c9a7', '#1d9e8a'] as const,
  hero:    ['#071829', '#0c2540', '#071829'] as const,
  danger:  ['rgba(255,107,107,0.15)', 'rgba(255,107,107,0.05)'] as const,
  success: ['rgba(0,201,167,0.15)', 'rgba(0,201,167,0.05)'] as const,
};

export const PLOT_COLORS = [
  '#1d6fa4', '#00c9a7', '#ffd166', '#a35eea',
  '#ff6b6b', '#ffa748', '#5ab4e8', '#34c778',
];

export const NAGE_FILTERS = [
  { key: '' as const,    label: 'Toutes' },
  { key: 'NL' as const,  label: '🏊 NL' },
  { key: 'Dos' as const, label: '🌊 Dos' },
  { key: 'Bra' as const, label: '🐸 Bra.' },
  { key: 'Pap' as const, label: '🦋 Pap.' },
  { key: '4 N' as const, label: '🔄 4N' },
];

export const TYPE_FILTERS = [
  { key: '' as const,       label: 'Tous' },
  { key: 'Séries' as const, label: 'Séries' },
  { key: 'Finale' as const, label: 'Finale' },
];

export const STATUS_LABELS = {
  en_cours: 'En cours',
  a_venir:  'À venir',
  passee:   'Passées',
} as const;
