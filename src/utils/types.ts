export interface CompetRow {
  athlete:        string;
  naissance:      string;
  epreuve:        string;
  type_serie:     string;
  temps_result:   string;
  classement_cpn: string;
  rang_general:   string; // "5/42"
  points:         string; // "612 pts"
  date:           string;
}

export interface CompetData {
  nom:         string;
  lieu:        string;
  dates:       string;
  bassin:      string;
  has_partial: boolean;
  rows:        CompetRow[];
  error?:      string;
}

export type ViewMode = 'athletes' | 'epreuves' | 'podiums';
