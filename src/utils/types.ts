export interface CompetRow {
  athlete:        string;
  naissance:      string;
  epreuve:        string;
  type_serie:     string;
  // ── Programme ──────────────────────────────────
  temps_ref:      string;        // Meilleur temps perso historique ex: "01:02.45"
  serie:          string;        // Numéro de série ex: "3"
  plot:           string;        // Couloir ex: "4"
  heure_passage:  string;        // Heure prévue ex: "10h42"
  // ── Résultats ──────────────────────────────────
  temps_result:   string;
  classement_cpn: string;
  rang_general:   string;        // "5/42"
  points:         string;        // "612 pts"
  date:           string;
  // ── Progression ────────────────────────────────
  delta_sec:      number | null; // temps_result - temps_ref en secondes
  tendance:       'better' | 'worse' | 'stable' | '';
}

export interface CompetData {
  nom:         string;
  lieu:        string;
  dates:       string;
  bassin:      string;
  has_partial: boolean;
  rows:        CompetRow[]; // liste des lignes athlètes
  error?:      string;
}

export type ViewMode = 'programme' | 'athletes' | 'epreuves' | 'podiums';
