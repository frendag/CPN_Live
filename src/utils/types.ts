export type CompetitionStatus = 'en_cours' | 'a_venir' | 'passee';
export type CompetitionTab = 'programme' | 'resultats';
export type ReunionFilter = number | '';
export type NageFilter = '' | 'NL' | 'Dos' | 'Bra' | 'Pap' | '4 N';
export type TypeFilter = '' | 'Séries' | 'Finale';

export interface CompetitionSummary {
  id: number;
  cid: string;
  nom: string;
  lieu: string;
  date_debut: string | null;
  date_fin: string | null;
  bassin: string;
  refresh_min: number;
  filter_mode?: string;
  filter_value?: string;
  actif?: boolean;
  programme_scraped?: boolean;
  derniere_maj?: string | null;
  status: CompetitionStatus;
  label_sidebar?: string;
}

export interface CompetitionMeta {
  id: number;
  cid: string;
  nom: string;
  lieu: string;
  bassin: string;
  date_debut: string | null;
  date_fin: string | null;
  heure_debut?: string;
  heure_fin?: string;
  refresh_min: number;
  programme_scraped?: boolean;
  derniere_maj?: string | null;
  next_refresh_sec?: number | null;
}

export interface ProgrammeRow {
  reunion_num: number;
  reunion_label: string;
  reunion_moment: string;
  heure_depart: string;
  epreuve_label: string;
  epreuve_norm: string;
  type_serie: string;
  categorie?: string | null;
  sexe: string;
  athlete_nom: string;
  annee_naiss?: number | string | null;
  plot?: number | string | null;
  serie_num?: number | string | null;
  temps_ref?: string | null;
  temps_ref_sec?: number | null;
}

export interface ResultRow {
  date_epreuve?: string | null;
  reunion_num: number;
  reunion_label: string;
  reunion_moment: string;
  heure_depart?: string | null;
  epreuve_label: string;
  epreuve_norm?: string | null;
  type_serie: string;
  athlete_nom: string;
  annee_naiss?: number | string | null;
  sexe?: string | null;
  temps_result?: string | null;
  result_sec?: number | null;
  points?: string | null;
  rang_pos?: number | null;
  rang_total?: number | null;
  rang_general?: string | null;
  delta_sec?: number | null;
  tendance?: string | null;
  temps_ref?: string | null;
  temps_ref_sec?: number | null;
  plot?: number | string | null;
  serie_num?: number | string | null;
}

export interface Reunion<T> {
  reunion_num: number;
  reunion_label: string;
  reunion_moment: string;
  lignes: T[];
}

export interface ProgrammeResponse {
  competition: CompetitionMeta;
  reunions: Reunion<ProgrammeRow>[];
  error?: string;
}

export interface ResultatsResponse {
  competition: CompetitionMeta;
  reunions: Reunion<ResultRow>[];
  error?: string;
}

export interface CompetitionsListResponse {
  competitions: CompetitionSummary[];
  error?: string;
}

export interface AthleteGroup<T> {
  athlete_nom: string;
  annee_naiss?: number | string | null;
  sexe?: string | null;
  lignes: T[];
}

export interface TrendMeta {
  tone: 'better' | 'worse' | 'stable' | 'forfeit' | 'none';
  label: string;
  detail?: string;
}
