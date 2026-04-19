export type AppSection = 'competition' | 'athlete';
export type CompetitionStatus = 'en_cours' | 'a_venir' | 'passee';
export type CompetitionTab = 'programme' | 'resultats' | 'passage';
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
  // Qualification
  niveau_atteint?: string | null;
  niveau_superieur?: string | null;
  next_sec?: number | null;
  next_temps?: string | null;
  next_delta_pct?: number | null;
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

export type PassageStatut = 'nage' | 'en_cours' | 'a_venir';

export interface PassageRow {
  athlete_nom: string;
  annee_naiss?: number | string | null;
  sexe?: string | null;
  epreuve_label: string;
  epreuve_norm?: string | null;
  type_serie?: string | null;
  heure_depart?: string | null;
  plot?: number | string | null;
  serie_num?: number | string | null;
  reunion_num: number;
  reunion_label?: string | null;
  reunion_moment?: string | null;
  temps_ref?: string | null;
  temps_result?: string | null;
  points?: string | null;
  rang_general?: string | null;
  rang_pos?: number | null;
  rang_total?: number | null;
  tendance?: string | null;
  niveau_atteint?: string | null;
  niveau_superieur?: string | null;
  next_temps?: string | null;
  next_delta_pct?: number | null;
  statut: PassageStatut;
}

export interface PassageResponse {
  competition: CompetitionMeta;
  passages: PassageRow[];
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

export interface AthleteKpis {
  total_perfs?: number;
  moy_pts?: number;
  max_pts?: number;
  annee_naissance?: number | null;
  date_naissance?: string;
  specialite?: string;
  best_temps?: string;
  nb_nages?: number;
  periode?: string;
  nb_nat?: number;
  nb_int?: number;
  sexe?: string;
  iuf?: string;
}

export interface AthleteEvolutionRow {
  Annee: number;
  moy: number;
  maxi: number;
  nb: number;
  delta?: number;
}

export interface AthleteSaisonRow {
  Epreuve: string;
  Bassin: string;
  Temps_N: string;
  Sec_N?: number;
  Temps_Conv_50?: string | null;
  Pts_N: number;
  Date_N?: string;
  Competition_N?: string;
  Lieu_N?: string;
  Temps_Nm1?: string | null;
  Sec_Nm1?: number | null;
  Prog_pct?: number | null;
  Prog_ann?: number | null;
  Niveau?: string;
  Next_niveau?: string;
  Pct_to_next?: number | null;
}

export interface AthleteTopRow {
  Epreuve: string;
  Bassin: string;
  Temps: string;
  Pts?: number | null;
  Date?: string;
  Competition?: string;
  Lieu?: string;
}

export interface AthleteBestRow {
  Epreuve: string;
  Bassin: string;
  Temps: string;
  Temps_2026?: string;
  Date_2026?: string;
  Pts?: number | null;
  Date?: string;
  Niveau?: string;
}

export interface AthleteWebconf {
  serie?: string | null;
  detail?: string;
  nages_qualif?: string[];
  perfs_nat_Nm1?: string[];
  annee_Nm1?: number;
  est_u13?: boolean;
}

export interface AthleteResponse {
  nom: string;
  kpis: AthleteKpis;
  evo?: AthleteEvolutionRow[];
  palmares?: Array<Record<string, unknown>>;
  evo_temps?: Record<string, unknown>;
  top5?: AthleteTopRow[];
  by_comp?: Record<string, number>;
  freq?: Array<Record<string, unknown>>;
  meilleurs?: AthleteBestRow[];
  annee_naissance?: number | null;
  sexe?: string;
  annee_qualif?: number;
  mp_saison?: AthleteSaisonRow[];
  annee_N?: number;
  annee_Nm1?: number;
  frac_saison?: number;
  epreuves_annee_N?: Array<Record<string, unknown>>;
  webconf_serie?: AthleteWebconf | null;
  error?: string;
}

export interface AthletesListResponse {
  athletes: string[];
  nb?: number;
  error?: string;
}

export interface AthleteRankingRow {
  epreuve: string;
  bassin: string;
  ffn_url?: string;
  temps?: string;
  pts?: number | string | null;
  rang_nat?: number | null;
  rang_reg?: number | null;
  rang_dept?: number | null;
}

export interface AthleteRankingResponse {
  nom: string;
  saison: string;
  bassin: string;
  idrch_id?: string | null;
  idcat?: string | null;
  rows: AthleteRankingRow[];
  error?: string;
}
