export const API_BASE = 'https://cpn-analytics.alwaysdata.net';

export const COLORS = {
  primary: '#0f2744',
  primarySoft: '#173a63',
  primaryLight: '#2563eb',
  card: '#ffffff',
  bg: '#eef3f8',
  border: '#dbe4ef',
  text: '#132236',
  muted: '#60758a',
  subtle: '#8ea0b4',
  success: '#1f8f4e',
  successBg: '#e7f8ee',
  danger: '#c83d3d',
  dangerBg: '#fdecec',
  warning: '#c98613',
  warningBg: '#fff4df',
  neutralBg: '#f5f7fb',
  live: '#e23d4d',
  liveBg: '#fde7eb',
  reunionHeader: '#102a46',
  reunionMoment: '#f59e0b',
  serieBg: '#ecf4ff',
  serieText: '#315a7a',
  finaleBg: '#fff3e0',
  finaleText: '#b25a00',
  demiBg: '#f3e5f5',
  demiText: '#7b1fa2',
  rank1Bg: '#fdd835',
  rank1Text: '#5d4037',
  rank2Bg: '#e0e0e0',
  rank2Text: '#37474f',
  rank3Bg: '#ffccbc',
  rank3Text: '#bf360c',
  rankTopBg: '#e8f5e9',
  rankTopText: '#2e7d32',
  rankOtherBg: '#f1f5f9',
  rankOtherText: '#607d8b',
  NL: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
  Dos: { bg: '#ccfbf1', text: '#0f766e', border: '#2dd4bf' },
  Bra: { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
  Pap: { bg: '#f3e8ff', text: '#6b21a8', border: '#c084fc' },
  '4N': { bg: '#fff7ed', text: '#9a3412', border: '#fb923c' },
  def: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

export const PLOT_COLORS = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#00838F', '#AD1457', '#37474F', '#F57F17'];

export const NAGE_FILTERS = [
  { key: '' as const, label: 'Toutes' },
  { key: 'NL' as const, label: '🏊 NL' },
  { key: 'Dos' as const, label: '🌊 Dos' },
  { key: 'Bra' as const, label: '🐸 Bra.' },
  { key: 'Pap' as const, label: '🦋 Pap.' },
  { key: '4 N' as const, label: '🔄 4 N' },
];

export const TYPE_FILTERS = [
  { key: '' as const, label: 'Tous' },
  { key: 'Séries' as const, label: 'Séries' },
  { key: 'Finale' as const, label: 'Finale' },
];

export const STATUS_LABELS = {
  en_cours: 'En cours',
  a_venir: 'À venir',
  passee: 'Passées',
} as const;
