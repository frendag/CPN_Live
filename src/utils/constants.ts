// URL de base du backend CPN sur AlwaysData
// Remplace par l'URL exacte de ton app AlwaysData
export const API_BASE = 'https://cpnnatation.alwaysdata.net';

export const COLORS = {
  primary:    '#1e3a8a',
  primaryMid: '#1d4ed8',
  primaryLight:'#3b82f6',
  success:    '#16a34a',
  successLight:'#dcfce7',
  warning:    '#d97706',
  warningLight:'#fef9c3',
  danger:     '#dc2626',
  dangerLight:'#fee2e2',
  navy:       '#1e293b',
  muted:      '#64748b',
  subtle:     '#94a3b8',
  border:     '#e2e8f0',
  bg:         '#f0f4f8',
  card:       '#ffffff',
  // Nages
  NL:   { bg:'#dbeafe', text:'#1e40af', border:'#3b82f6' },
  Dos:  { bg:'#ccfbf1', text:'#065f46', border:'#14b8a6' },
  Bra:  { bg:'#dcfce7', text:'#14532d', border:'#22c55e' },
  Pap:  { bg:'#f3e8ff', text:'#581c87', border:'#a855f7' },
  '4N': { bg:'#fff7ed', text:'#7c2d12', border:'#f97316' },
  def:  { bg:'#f1f5f9', text:'#475569', border:'#94a3b8' },
};

export const AVATAR_PALETTE = [
  '#2563eb','#16a34a','#7c3aed','#dc2626',
  '#0891b2','#d97706','#0d9488','#9333ea',
];

export const MEDAL_CONFIG: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg:'#fbbf24', text:'#78350f', label:'🥇 1er' },
  2: { bg:'#e2e8f0', text:'#334155', label:'🥈 2e'  },
  3: { bg:'#fed7aa', text:'#9a3412', label:'🥉 3e'  },
};
