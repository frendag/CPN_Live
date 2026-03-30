import { useCallback, useEffect, useState } from 'react';
import { buildApiUrl } from '../utils/api';
import { TrainingAthlete } from '../utils/trainingTypes';

interface AthletesResponse {
  athletes?: Array<string | { id?: number; athlete_id?: number; nom?: string; name?: string; label?: string }>;
}

export function useTrainingAthletes() {
  const [athletes, setAthletes] = useState<TrainingAthlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAthletes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/athletes'), { headers: { Accept: 'application/json' } });
      const text = await response.text();
      const json = JSON.parse(text) as AthletesResponse;
      const rawAthletes = Array.isArray(json.athletes) ? json.athletes : [];
      const normalized = rawAthletes
        .map((entry, index) => {
          if (typeof entry === 'string') return { id: index + 1, label: entry };
          const id = Number(entry.id ?? entry.athlete_id ?? index + 1);
          const label = entry.label ?? entry.nom ?? entry.name ?? `Athlète ${index + 1}`;
          return { id, label };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }));
      setAthletes(normalized);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les athlètes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAthletes(); }, [loadAthletes]);

  return { athletes, loading, error, reload: loadAthletes };
}
