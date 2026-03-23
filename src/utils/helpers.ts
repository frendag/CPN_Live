import { COLORS, PLOT_COLORS } from './constants';
import { AthleteGroup, CompetitionMeta, CompetitionStatus, NageFilter, ProgrammeRow, ResultRow, Reunion, TrendMeta, TypeFilter } from './types';

export function normalizeText(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CP';
}

// Dark-theme avatar palette (matches the new navy dark theme)
export function avatarColor(name: string): string {
  const palette = [
    '#1d6fa4', '#00c9a7', '#a35eea', '#ff6b6b',
    '#ffa748', '#34c778', '#5ab4e8', '#ffd166',
    '#0f766e', '#7c3aed', '#e05c5c', '#059669',
  ];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % palette.length;
  return palette[hash];
}

export function getNageKey(label: string): 'NL' | 'Dos' | 'Bra' | 'Pap' | '4N' | 'def' {
  if (label.includes('NL')) return 'NL';
  if (label.includes('Dos')) return 'Dos';
  if (label.includes('Bra')) return 'Bra';
  if (label.includes('Pap')) return 'Pap';
  if (label.includes('4 N')) return '4N';
  return 'def';
}

export function getNageColors(label: string) {
  return COLORS[getNageKey(label)];
}

export function isForfeit(value?: string | null): boolean {
  const v = String(value ?? '').trim().toUpperCase();
  return ['DNS', 'DNF', 'ABD', 'DSQ'].includes(v);
}

export function toResultSec(value?: string | number | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const raw = String(value ?? '').trim();
  if (!raw) return NaN;
  const mm = raw.match(/^(\d+):(\d{2})[.,](\d{2})$/);
  if (mm) return parseInt(mm[1], 10) * 60 + parseInt(mm[2], 10) + parseInt(mm[3], 10) / 100;
  const ss = raw.match(/^(\d+)[.,](\d{2})$/);
  if (ss) return parseInt(ss[1], 10) + parseInt(ss[2], 10) / 100;
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function baseEventLabel(row: Pick<ProgrammeRow | ResultRow, 'epreuve_norm' | 'epreuve_label'>): string {
  return String(row.epreuve_norm || row.epreuve_label || '').replace(/\s+\d+\s+s[ée]rie.*$/i, '').trim();
}

export function typeOrder(typeSerie?: string | null): number {
  const low = normalizeText(typeSerie);
  if (low.includes('finale')) return 2;
  if (low.includes('serie') || low.includes('série')) return 0;
  return 1;
}

export function resultDisplayHour(row: ResultRow): string {
  const low = normalizeText(row.type_serie);
  return low.includes('finale') || low.includes('demi') ? '—' : String(row.heure_depart || '—');
}

export function formatReunionLabel(reunionLabel?: string | null): string {
  const raw = String(reunionLabel || '').trim();
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return raw || '—';
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatCompetitionDates(meta?: Partial<CompetitionMeta> | null): string {
  if (!meta?.date_debut) return '—';
  if (!meta.date_fin || meta.date_fin === meta.date_debut) return meta.date_debut;
  return `${meta.date_debut} → ${meta.date_fin}`;
}

export function isCompetitionLive(meta?: Partial<CompetitionMeta> | null): boolean {
  if (!meta?.date_debut || !meta?.date_fin) return false;
  const today = new Date();
  const todayIso = today.toLocaleDateString('fr-CA');
  const start = parseFrDate(meta.date_debut);
  const end = parseFrDate(meta.date_fin);
  if (!start || !end) return false;
  return start.toLocaleDateString('fr-CA') <= todayIso && todayIso <= end.toLocaleDateString('fr-CA');
}

export function parseFrDate(value?: string | null): Date | null {
  const raw = String(value || '').trim();
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export function getStatusTone(status: CompetitionStatus): { bg: string; text: string } {
  if (status === 'en_cours') return { bg: COLORS.liveBg, text: COLORS.live };
  if (status === 'a_venir') return { bg: COLORS.warningBg, text: COLORS.warning };
  return { bg: COLORS.neutralBg, text: COLORS.muted };
}

export function rankLabel(pos?: number | null, total?: number | null, fallback?: string | null): string {
  const n = pos ?? (fallback ? parseInt(String(fallback), 10) : NaN);
  if (!Number.isFinite(n)) return '—';
  const totalLabel = total ? `/${total}` : '';
  if (n === 1) return `1er${totalLabel}`;
  if (n === 2) return `2e${totalLabel}`;
  if (n === 3) return `3e${totalLabel}`;
  return `${n}e${totalLabel}`;
}

export function rankTone(pos?: number | null) {
  if (pos === 1) return { bg: COLORS.rank1Bg, text: COLORS.rank1Text };
  if (pos === 2) return { bg: COLORS.rank2Bg, text: COLORS.rank2Text };
  if (pos === 3) return { bg: COLORS.rank3Bg, text: COLORS.rank3Text };
  if (pos !== null && pos !== undefined && pos <= 8) return { bg: COLORS.rankTopBg, text: COLORS.rankTopText };
  return { bg: COLORS.rankOtherBg, text: COLORS.rankOtherText };
}

export function plotColor(plot: number | string | null | undefined): string {
  const n = parseInt(String(plot ?? '0'), 10);
  return PLOT_COLORS[(n - 1) % PLOT_COLORS.length] || PLOT_COLORS[0];
}

export function groupByAthlete<T extends { athlete_nom: string; annee_naiss?: number | string | null; sexe?: string | null }>(
  rows: T[],
): AthleteGroup<T>[] {
  const seen = new Map<string, AthleteGroup<T>>();
  for (const row of rows) {
    const key = `${row.athlete_nom}__${row.annee_naiss ?? ''}`;
    if (!seen.has(key)) {
      seen.set(key, { athlete_nom: row.athlete_nom, annee_naiss: row.annee_naiss, sexe: row.sexe, lignes: [] });
    }
    seen.get(key)!.lignes.push(row);
  }
  return Array.from(seen.values()).sort((a, b) => a.athlete_nom.localeCompare(b.athlete_nom, 'fr', { sensitivity: 'base' }));
}

export function sortProgrammeRows(rows: ProgrammeRow[]): ProgrammeRow[] {
  return [...rows].sort((a, b) => {
    const timeA = String(a.heure_depart || '99:99');
    const timeB = String(b.heure_depart || '99:99');
    if (timeA !== timeB) return timeA.localeCompare(timeB);
    return typeOrder(a.type_serie) - typeOrder(b.type_serie);
  });
}

export function sortResultRows(rows: ResultRow[]): ResultRow[] {
  return [...rows].sort((a, b) => {
    const labelA = baseEventLabel(a);
    const labelB = baseEventLabel(b);
    if (labelA !== labelB) return labelA.localeCompare(labelB, 'fr', { sensitivity: 'base' });
    return typeOrder(a.type_serie) - typeOrder(b.type_serie);
  });
}

export function buildSeriesReference(rows: ResultRow[]): Map<string, { sec: number; txt: string }> {
  const map = new Map<string, { sec: number; txt: string }>();
  for (const row of rows) {
    const low = normalizeText(row.type_serie);
    if (!low.includes('serie') && !low.includes('série')) continue;
    const label = baseEventLabel(row);
    if (map.has(label)) continue;
    const txt = String(row.temps_result || '').trim();
    const sec = Number.isFinite(Number(row.result_sec)) ? Number(row.result_sec) : toResultSec(txt);
    if (Number.isFinite(sec) && txt) map.set(label, { sec, txt });
  }
  return map;
}

export function getTrendMeta(row: ResultRow, seriesRefMap: Map<string, { sec: number; txt: string }>): TrendMeta {
  const rawResult = String(row.temps_result || '').trim();
  const rawType = normalizeText(row.type_serie);
  if (!rawResult) return { tone: 'none', label: '—' };
  if (isForfeit(rawResult)) return { tone: 'forfeit', label: 'Forfait' };

  const sec = Number.isFinite(Number(row.result_sec)) ? Number(row.result_sec) : toResultSec(rawResult);
  if (!Number.isFinite(sec)) return { tone: 'none', label: '—' };

  let refSec = NaN;
  let refTxt = '';
  let source: 'serie' | 'ref' | '' = '';

  if (rawType.includes('finale') || rawType.includes('demi')) {
    const sr = seriesRefMap.get(baseEventLabel(row));
    if (sr && Number.isFinite(sr.sec)) { refSec = sr.sec; refTxt = sr.txt; source = 'serie'; }
  } else {
    const parsed = Number.isFinite(Number(row.temps_ref_sec)) ? Number(row.temps_ref_sec) : toResultSec(row.temps_ref);
    if (Number.isFinite(parsed)) { refSec = parsed; refTxt = String(row.temps_ref || '').trim(); source = 'ref'; }
  }

  if (!Number.isFinite(refSec)) return { tone: 'none', label: '—' };
  const delta = +(sec - refSec).toFixed(2);
  const abs = Math.abs(delta).toFixed(2).replace('.', ',');
  const detail = source === 'serie' ? `vs série ${refTxt}` : `vs réf. ${refTxt}`;

  if (Math.abs(delta) < 0.005) return { tone: 'stable', label: 'Stable', detail };
  if (delta < 0) return { tone: 'better', label: `+${abs}s`, detail };
  return { tone: 'worse', label: `-${abs}s`, detail };
}

export function filterProgrammeReunions(
  reunions: Reunion<ProgrammeRow>[],
  reunionFilter: number | '',
  nageFilter: NageFilter,
  typeFilter: TypeFilter,
  searchFilter: string,
): Reunion<ProgrammeRow>[] {
  const q = normalizeText(searchFilter);
  return reunions
    .filter((reunion) => reunionFilter === '' || reunion.reunion_num === reunionFilter)
    .map((reunion) => ({
      ...reunion,
      lignes: reunion.lignes.filter((line) => {
        const okNage = !nageFilter || String(line.epreuve_norm || line.epreuve_label || '').includes(nageFilter);
        const okType = !typeFilter || String(line.type_serie || '').includes(typeFilter);
        const okSearch = !q || normalizeText(line.athlete_nom).includes(q);
        return okNage && okType && okSearch;
      }),
    }))
    .filter((reunion) => reunion.lignes.length > 0);
}

export function filterResultRows(
  reunions: Reunion<ResultRow>[],
  reunionFilter: number | '',
  nageFilter: NageFilter,
  typeFilter: TypeFilter,
  searchFilter: string,
): ResultRow[] {
  const q = normalizeText(searchFilter);
  return reunions
    .filter((reunion) => reunionFilter === '' || reunion.reunion_num === reunionFilter)
    .flatMap((reunion) => reunion.lignes.map((line) => ({ ...line, reunion_num: reunion.reunion_num })))
    .filter((line) => {
      const label = String(line.epreuve_norm || line.epreuve_label || '');
      const okNage = !nageFilter || label.includes(nageFilter);
      const okType = !typeFilter || String(line.type_serie || '').includes(typeFilter);
      const okSearch = !q || normalizeText(line.athlete_nom).includes(q);
      return okNage && okType && okSearch;
    });
}
