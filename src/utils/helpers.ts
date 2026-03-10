import { COLORS, AVATAR_PALETTE } from './constants';

export function parseRangGeneral(rg: string): { pos: number | null; total: number | null } {
  if (!rg || rg === '—') return { pos: null, total: null };
  const [p, t] = rg.split('/');
  return { pos: parseInt(p) || null, total: parseInt(t) || null };
}

export function ptsNum(pts: string): number {
  const m = (pts || '').match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[h];
}

export function getNageColors(ep: string) {
  if (ep.includes('NL'))   return COLORS.NL;
  if (ep.includes('Dos'))  return COLORS.Dos;
  if (ep.includes('Bra'))  return COLORS.Bra;
  if (ep.includes('Pap'))  return COLORS.Pap;
  if (ep.includes('4N') || ep.includes('4 N')) return COLORS['4N'];
  return COLORS.def;
}

export function isAbsence(temps: string): boolean {
  return ['DNS', 'DNF', 'ABD', 'DSQ'].includes(temps);
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
